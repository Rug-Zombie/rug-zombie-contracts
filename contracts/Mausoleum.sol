import "./access/Ownable.sol";
import "./token/BEP20/IBEP20.sol";
import "./interfaces/IRevivedRugNft.sol";
import "./interfaces/IPancakePair.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IPriceConsumerV3.sol";
import "./libraries/Percentages.sol";

contract Mausoleum is Ownable {
    using Percentages for uint256;

    // Info of each user.
    struct UserInfo {
        uint256 bid;                 // How many LP tokens the user has provided.
        bool paidUnlockFee;          // true if user paid the unlock fee.
        uint256 lastBidDate;         // Date user must wait until before harvesting their nft.
    }

    // Info of each bid
    struct BidInfo {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    // Info of each auction
    struct AuctionInfo {
        IPancakePair bidToken;
        IRevivedRugNft prize;
        uint256 endDate;
        uint256 unlockFee;
        uint256 unlocks;
        bool finalized;
    }

    AuctionInfo[] public auctionInfo;
    mapping(uint256 => BidInfo[]) public bidInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    IUniswapV2Router02 public pancakeswapRouter;
    address public burnAddr = 0x000000000000000000000000000000000000dEaD;
    IBEP20 public zombie;
    address payable public treasury;
    address public lpStorage;

    // Chainlink BNB Price
    IPriceConsumerV3 public priceConsumer;

    event IncreaseBid(address indexed bidder, uint256 indexed aid, uint256 bid, uint256 indexed timestamp);
    event FinalizeAuction(uint256 indexed aid, uint256 lastBid, address lastBidder, uint256 indexed timestamp);

    modifier auctionExists(uint _aid) {
        require(_aid <= auctionInfo.length - 1, 'Auction: That auction does not exist.');
        _;
    }

    modifier auctionRunning(uint _aid) {
        require(block.timestamp < auctionInfo[_aid].endDate, 'Auction: Action can only be performed on running auctions.');
        _;
    }

    modifier auctionEnded(uint _aid) {
        require(block.timestamp >= auctionInfo[_aid].endDate, 'Auction: Action can only be performed on ended auctions.');
        _;
    }

    // Ensures auction is unlocked before a user accesses it.
    modifier isUnlocked(uint _aid) {
        require(userInfo[_aid][msg.sender].paidUnlockFee == true, 'Locked: User has not unlocked auction.');
        _;
    }

    constructor(IBEP20 _zombie, address payable _treasury, address _lpStorage, IUniswapV2Router02 _pancakeRouter, IPriceConsumerV3 _priceConsumer) {
        zombie = _zombie;
        treasury = _treasury;
        lpStorage = _lpStorage;
        pancakeswapRouter = _pancakeRouter;
        priceConsumer = _priceConsumer;
    }

    // Unlocks auction, half of fee is sent to treasury, the rest is used to buyBackAndBurn,
    function unlock(uint _aid) auctionRunning(_aid) external payable {
        require(userInfo[_aid][msg.sender].paidUnlockFee == false, 'Auction: unlock fee is already paid.');
        uint _unlockFeeInBnb = unlockFeeInBnb(_aid);
        require(msg.value >= _unlockFeeInBnb, 'Auction: cannot unlock, insufficient bnb sent.');
        uint _projectFunds = msg.value;
        uint _toTreasury = _projectFunds.calcPortionFromBasisPoints(5000);
        uint _buyBack = _projectFunds - _toTreasury;

        treasury.transfer(_toTreasury);     // half of unlock fee goes to treasury
        buyBackAndBurn(_buyBack);           // the rest is used to buy back and burn zombie token

        auctionInfo[_aid].unlocks += 1;
        userInfo[_aid][msg.sender].paidUnlockFee = true;
    }

    // Creates a new auction
    function addAuction(uint256 _startingBid, uint256 _endDate, IPancakePair _bidToken, IRevivedRugNft _prize, uint256 _unlockFee) public onlyOwner {
        require(address(_bidToken.token0()) == address(zombie) || address(_bidToken.token1()) == address(zombie), "Auction: bid token must be zombie pair.");
        require(_prize.owner() == address(this), 'Auction: masoleum must be owner of auction prize.');

        auctionInfo.push(AuctionInfo({
        unlockFee: _unlockFee,
        bidToken: _bidToken,
        prize: _prize,
        endDate: _endDate,
        unlocks: 0,
        finalized: false
        }));
        bidInfo[auctionInfo.length - 1].push(BidInfo({
        bidder: msg.sender,
        amount: _startingBid,
        timestamp: block.timestamp
        }));
    }

    function increaseBid(uint _aid, uint _amount) external auctionExists(_aid) auctionRunning(_aid) isUnlocked(_aid) {
        uint _totalBid = userInfo[_aid][msg.sender].bid + _amount;
        require(_totalBid > lastBid(_aid).amount, 'Auction: Bid must be > last bid.');
        require(auctionInfo[_aid].bidToken.allowance(msg.sender, address(this)) > _totalBid, 'Auction: allowance issue');
        require(auctionInfo[_aid].bidToken.transferFrom(msg.sender, address(this), _amount), 'Auction: transferFrom failed.');
        userInfo[_aid][msg.sender].bid = _totalBid;
        bidInfo[_aid].push(BidInfo({
        bidder: msg.sender,
        amount: _totalBid,
        timestamp: block.timestamp
        }));
        emit IncreaseBid(msg.sender, _aid, _totalBid, block.timestamp);
    }

    function withdrawBid(uint _aid) external auctionExists(_aid) {
        uint _bid = userInfo[_aid][msg.sender].bid;
        require(lastBid(_aid).bidder != address(msg.sender), 'Auction: Last bidder cannot withdraw their bid, call #claimPrize to redeem auction reward.');
        require(_bid > 0, 'Auction: No remaining funds to withdraw.');

        auctionInfo[_aid].bidToken.transfer(msg.sender, _bid);
        userInfo[_aid][msg.sender].bid = 0;
    }

    function finalizeAuction(uint _aid) external auctionExists(_aid) auctionEnded(_aid) {
        AuctionInfo storage auction = auctionInfo[_aid];
        require(auction.finalized == false, 'Auction: already finalized.');
        BidInfo memory finalBid = lastBid(_aid);
        uint256 remaining = finalBid.amount;

        if(bidsLength(_aid) > 1) {
            // 25% of bid lp is stored away
            uint256 toLpStorage = remaining / 4;
            require(auction.bidToken.transfer(lpStorage, toLpStorage), 'Auction: transfer failed');
            remaining -= toLpStorage;

            // unpair remaining 75%, burn zombie and treasure other token
            IBEP20 _token0 = IBEP20(auction.bidToken.token0());
            IBEP20 _token1 = IBEP20(auction.bidToken.token1());

            uint256 _initialToken0Balance = _token0.balanceOf(address(this));
            uint256 _initialToken1Balance = _token1.balanceOf(address(this));

            // allow pancake router
            auction.bidToken.approve(address(pancakeswapRouter), remaining);

            // unpair lp
            pancakeswapRouter.removeLiquidity(
                address(_token0),
                address(_token1),
                remaining,
                0,
                0,
                address(this),
                block.timestamp
            );

            uint256 _token0Amount = _token0.balanceOf(address(this)) - _initialToken0Balance;
            uint256 _token1Amount = _token1.balanceOf(address(this)) - _initialToken1Balance;

            if(address(_token0) == address(zombie)) {             // if _token0 is ZMBE
                _token0.transfer(burnAddr, _token0Amount);        // burn the unpaired token0
                _token1.transfer(treasury, _token1Amount);          // send the unpaired token1 to treasury
            } else {                                            // else if _token1 is ZMBE
                _token1.transfer(burnAddr, _token1Amount);        // burn the unpaired token1
                _token0.transfer(treasury, _token0Amount);          // send the unpaired token0 to treasury
            }
        }

        auction.prize.reviveRug(msg.sender);
        userInfo[_aid][finalBid.bidder].bid = 0;
        auction.finalized = true;
        emit FinalizeAuction(_aid, finalBid.amount, finalBid.bidder, block.timestamp);
    }

    function auctionLength() public view returns(uint256) {
        return auctionInfo.length;
    }

    function bidsLength(uint256 _aid) public view returns(uint256) {
        return bidInfo[_aid].length;
    }

    function lastBid(uint _aid) public view returns(BidInfo memory) {
        return bidInfo[_aid][bidsLength(_aid) - 1];
    }

    // Returns auction unlock fee in bnb
    function unlockFeeInBnb(uint _aid) public view returns(uint) {
        return priceConsumer.usdToBnb(auctionInfo[_aid].unlockFee);
    }

    // Maintenance functions
    function setUnlockFee(uint _aid, uint _unlockFee) public auctionExists(_aid) onlyOwner {
        auctionInfo[_aid].unlockFee = _unlockFee;
    }

    function setEndDate(uint _aid, uint _endDate) public auctionExists(_aid) onlyOwner {
        auctionInfo[_aid].endDate = _endDate;
    }

    function setPrize(uint _aid, IRevivedRugNft _prize) public auctionExists(_aid) onlyOwner {
        auctionInfo[_aid].prize = _prize;
    }

    // Helpers

    // Buys and burns zombie
    function buyBackAndBurn(uint bnbAmount) private {
        uint256 _initialZombieBalance = zombie.balanceOf(address(this));
        swapZombieForBnb(bnbAmount);
        uint256 _zombieBoughtBack = zombie.balanceOf(address(this)) - _initialZombieBalance;
        zombie.transfer(burnAddr, _zombieBoughtBack); // Send bought zombie to burn address
    }

    // Buys Zombie with BNB
    function swapZombieForBnb(uint256 bnbAmount) private {
        address[] memory path = new address[](2);
        path[0] = pancakeswapRouter.WETH();
        path[1] = address(zombie);

        // make the swap
        pancakeswapRouter.swapExactETHForTokens{value: bnbAmount} (
            0,
            path,
            address(this),
            block.timestamp
        );
    }
}
