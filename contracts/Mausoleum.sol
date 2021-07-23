import "./access/Ownable.sol";
import "./token/BEP20/IBEP20.sol";
import "./interfaces/IRevivedRugNft.sol";
import "./interfaces/IPancakePair.sol";
import "./interfaces/IUniswapV2Router02.sol";

contract Mausoleum is Ownable {
    // Info of each user.
    struct UserInfo {
        uint256 bid;                 // How many LP tokens the user has provided.
        bool paidUnlockFee;                 // true if user paid the unlock fee.
        uint256  lastBidDate;            // Date user must wait until before harvesting their nft.
    }

    // Info of each auction
    struct AuctionInfo {
        IPancakePair bidToken;
        IRevivedRugNft prize;
        uint256 lastBid;
        address lastBidder;
        uint256 endDate;
        uint256 unlockFee;
        uint256 unlocks;
        bool finalized;
    }

    AuctionInfo[] public auctionInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    IUniswapV2Router02 public pancakeswapRouter;
    address public burnAddress = 0x000000000000000000000000000000000000dEaD;
    address public zombie;
    address public treasury;
    address public lpStorage;

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

    constructor(address _zombie, address _treasury, address _lpStorage, IUniswapV2Router02 _pancakeRouter) {
        zombie = _zombie;
        treasury = _treasury;
        lpStorage = _lpStorage;
        pancakeswapRouter = _pancakeRouter;
    }

    // Creates a new auction
    function createAuction(uint256 _startingBid, uint256 _endDate, IPancakePair _bidToken, IRevivedRugNft _prize, uint256 _unlockFee) external onlyOwner {
        require(address(_bidToken.token0()) == zombie || address(_bidToken.token1()) == zombie, "Auction: bid token must be zombie pair.");
        auctionInfo.push(AuctionInfo({
        lastBid: _startingBid,
        lastBidder: msg.sender,
        unlockFee: _unlockFee,
        bidToken: _bidToken,
        prize: _prize,
        endDate: _endDate,
        unlocks: 0,
        finalized: false
        }));
    }

    function increaseBid(uint _aid, uint _amount) external auctionExists(_aid) auctionRunning(_aid) {
        uint _totalBid = userInfo[_aid][msg.sender].bid + _amount;
        require(_totalBid > auctionInfo[_aid].lastBid, 'Auction: Bid must be > last bid.');

        require(auctionInfo[_aid].bidToken.transferFrom(msg.sender, address(this), _amount), 'Auction: transferFrom failed.');
        userInfo[_aid][msg.sender].bid = _totalBid;
        auctionInfo[_aid].lastBidder = msg.sender;
        auctionInfo[_aid].lastBid = _totalBid;
        emit IncreaseBid(msg.sender, _aid, _totalBid, block.timestamp);
    }

    function withdrawBid(uint _aid) external auctionExists(_aid) {
        uint _bid = userInfo[_aid][msg.sender].bid;
        require(address(auctionInfo[_aid].lastBidder) != address(msg.sender), 'Auction: Last bidder cannot withdraw their bid, call #claimPrize to redeem auction reward.');
        require(_bid > 0, 'Auction: No remaining funds to withdraw.');

        auctionInfo[_aid].bidToken.transfer(msg.sender, _bid);
        userInfo[_aid][msg.sender].bid = 0;
    }

    function finalizeAuction(uint _aid) external auctionExists(_aid) auctionEnded(_aid) {
        AuctionInfo storage auction = auctionInfo[_aid];
        require(auction.finalized == false, 'Auction: already finalized.');
        uint256 remaining = auctionInfo[_aid].lastBid;

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
            _token0.transfer(burnAddress, _token0Amount);        // burn the unpaired token0
            _token1.transfer(treasury, _token1Amount);          // send the unpaired token1 to treasury
        } else {                                            // else if _token1 is ZMBE
            _token1.transfer(burnAddress, _token1Amount);        // burn the unpaired token1
            _token0.transfer(treasury, _token0Amount);          // send the unpaired token0 to treasury
        }

        auction.prize.reviveRug(msg.sender);
        userInfo[_aid][auction.lastBidder].bid = 0;
        auction.finalized = true;
        emit FinalizeAuction(_aid, auction.lastBid, auction.lastBidder, block.timestamp);
    }

    function auctionLength() public view returns(uint256) {
        return auctionInfo.length;
    }
}
