// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./token/BEP20/IBEP20.sol";
import "./token/BEP20/SafeBEP20.sol";
import "./access/Ownable.sol";
import "./interfaces/IRevivedRugNft.sol";
import "./libraries/Percentages.sol";
import "./utils/ReentrancyGuard.sol";
import "./libraries/SpawningPoolPayload.sol";
import "./interfaces/IPriceConsumerV3.sol";
import "./interfaces/IUniswapV2Router02.sol";

contract SpawningPool is Ownable, ReentrancyGuard {
    using SafeBEP20 for IBEP20;
    using Percentages for uint256;

    // The address of the smart chef factory
    address public SMART_CHEF_FACTORY;

    // Whether it is initialized
    bool public isInitialized;

    // Accrued token per share
    uint256 public accTokenPerShare;

    // The block number when CAKE mining ends.
    uint256 public bonusEndBlock;

    // The block number when CAKE mining starts.
    uint256 public startBlock;

    // The block number of the last pool update
    uint256 public lastRewardBlock;

    // CAKE tokens created per block.
    uint256 public rewardPerBlock;

    // The precision factor
    uint256 public PRECISION_FACTOR;

    // The reward token
    IBEP20 public rewardToken;

    // The staked token
    IBEP20 public stakedToken;

    // Address of reward nft.
    IRevivedRugNft nft;

    // Unlock fee (In BUSD, Chainlink Oracle is used to convert fee to current BNB value).
    uint256 public unlockFee;

    // Minimum amount of lpTokens required to stake.
    uint256 public minimumStake;

    // Duration a user must stake before they can redeem their nft reward.
    uint256 public nftRevivalTime;

    // Duration a user must stake before withdrawal fees are lifted.
    uint256 public minimumStakingTime;

    // Number of unlocks
    uint256 public unlocks;

    // treasury address
    address payable treasury;

    // burn address
    address public burnAddr = 0x000000000000000000000000000000000000dEaD;

    // Chainlink BNB Price
    IPriceConsumerV3 public priceConsumer;

    // Pancakeswap router
    IUniswapV2Router02 public pancakeswapRouter;

    // Info of each user that stakes tokens (stakedToken)
    mapping(address => UserInfo) public userInfo;

    struct UserInfo {
        uint256 amount;                     // How many staked tokens the user has provided
        uint256 rewardDebt;                 // Reward debt
        uint256 tokenWithdrawalDate;        // Date user must wait until before early withdrawal fees are lifted.
        bool paidUnlockFee;                 // true if user paid the unlock fee.
        uint256  nftRevivalDate;            // Date user must wait until before harvesting their nft.
    }

    event AdminTokenRecovery(address tokenRecovered, uint256 amount);
    event Deposit(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event NewStartAndEndBlocks(uint256 startBlock, uint256 endBlock);
    event NewRewardPerBlock(uint256 rewardPerBlock);
    event RewardsStop(uint256 blockNumber);
    event Withdraw(address indexed user, uint256 amount);
    event WithdrawEarly(address indexed user, uint256 amountWithdrawn, uint256 amountLocked);
    event MintNft(address indexed to, uint date, address nft, uint indexed id);

    constructor() {
        SMART_CHEF_FACTORY = msg.sender;
    }

    /*
     * @notice Initialize the contract
     * @param _stakedToken: staked token address
     * @param _rewardToken: reward token address
     * @param _rewardPerBlock: reward per block (in rewardToken)
     * @param _startBlock: start block
     * @param _bonusEndBlock: end block
     * @param _admin: admin address with ownership
     */
    function initialize(
        SpawningPoolPayload.Payload memory _payload
    ) external {
        require(!isInitialized, "Already initialized");
        require(msg.sender == SMART_CHEF_FACTORY, "Not factory");

        // // Make this contract initialized
        isInitialized = true;

        stakedToken = _payload.zombie;
        rewardToken = _payload.rewardToken;
        rewardPerBlock = _payload.rewardPerBlock;
        startBlock = _payload.startBlock;
        bonusEndBlock = _payload.bonusEndBlock;
        unlockFee = _payload.unlockFee;
        minimumStake = _payload.minimumStake;
        nftRevivalTime = _payload.nftRevivalTime;
        minimumStakingTime = _payload.minimumStakingTime;
        nft = _payload.nft;
        treasury = _payload.treasury;
        priceConsumer = _payload.priceConsumer;
        pancakeswapRouter = _payload.pancakeswapRouter;
        unlocks = 0;

        uint256 decimalsRewardToken = uint256(rewardToken.decimals());
        require(decimalsRewardToken < 30, "Must be inferior to 30");

        PRECISION_FACTOR = uint256(10**(uint256(30) - decimalsRewardToken));

        // Set the lastRewardBlock as the startBlock
        lastRewardBlock = startBlock;

        // Transfer ownership to the admin address who becomes owner of the contract
        transferOwnership(_payload.admin);
    }

    // Ensures the pool is unlocked before a user accesses it.
    modifier isUnlocked {
        UserInfo memory _user = userInfo[msg.sender];
        require(_user.paidUnlockFee == true, 'Locked: User has not unlocked pool.');
        _;
    }

    // Ensures user's withdrawal date has passed before withdrawing.
    modifier canWithdraw(uint _amount) {
        uint _withdrawalDate = userInfo[msg.sender].tokenWithdrawalDate;
        require((block.timestamp >= _withdrawalDate && _withdrawalDate > 0) || _amount == 0, 'Staking: Token is still locked, use #withdrawEarly to withdraw funds before the end of your staking period.');
        _;
    }

    // Unlocks grave, half of fee is sent to treasury, the rest is used to buyBackAndBurn,
    function unlock() external payable {
        require(userInfo[msg.sender].paidUnlockFee == false, 'unlock fee is already paid.');
        require(msg.value >= unlockFeeInBnb(), 'cannot unlock, insufficient bnb sent.');
        uint _projectFunds = msg.value;
        uint _toTreasury = _projectFunds.calcPortionFromBasisPoints(5000);
        uint _buyBack = _projectFunds - _toTreasury;

        treasury.transfer(_toTreasury);     // half of unlock fee goes to treasury
        buyBackAndBurn(_buyBack);           // the rest is used to buy back and burn zombie token

        unlocks += 1;
        userInfo[msg.sender].paidUnlockFee = true;
    }

    /*
     * @notice Deposit staked tokens and collect reward tokens (if any)
     * @param _amount: amount to withdraw (in rewardToken)
     */
    function deposit(uint256 _amount) external nonReentrant isUnlocked {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount + _amount >= minimumStake, 'Amount staked must be >= grave minimum stake.');

        _updatePool();

        if (user.amount > 0) {
            uint256 pending = ((user.amount * accTokenPerShare) / PRECISION_FACTOR) - user.rewardDebt;
            if (pending > 0) {
                rewardToken.safeTransfer(address(msg.sender), pending);
            }
        }

        if (_amount > 0) {
            user.tokenWithdrawalDate = block.timestamp + minimumStakingTime;
            if (user.amount < minimumStake) {
                user.nftRevivalDate = block.timestamp + nftRevivalTime;
            }
            user.amount = user.amount + _amount;
            stakedToken.safeTransferFrom(address(msg.sender), address(this), _amount);
        }

        user.rewardDebt = (user.amount * accTokenPerShare) / PRECISION_FACTOR;

        emit Deposit(msg.sender, _amount);
    }

    /*
     * @notice Withdraw staked tokens and collect reward tokens
     * @param _amount: amount to withdraw (in rewardToken)
     */
    function withdraw(uint256 _amount) external nonReentrant canWithdraw(_amount) {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "Amount to withdraw too high");
        require(
            (user.amount - _amount >= minimumStake) || (user.amount - _amount) == 0,
            'When withdrawing from spawning pools the remaining balance must be 0 or >= the minimum stake.'
        );
        _updatePool();

        uint256 pending = ((user.amount * accTokenPerShare) / PRECISION_FACTOR) - user.rewardDebt;

        // mint nft
        if(user.amount >= minimumStake && block.timestamp >= user.nftRevivalDate) {
            uint256 id = nft.reviveRug(msg.sender);
            user.nftRevivalDate = block.timestamp + nftRevivalTime;
            emit MintNft(msg.sender, block.timestamp, address(nft), id);
        }

        if (_amount > 0) {
            user.amount = user.amount - _amount;
            stakedToken.safeTransfer(address(msg.sender), _amount);
            user.tokenWithdrawalDate = block.timestamp + minimumStakingTime;
        }

        if (pending > 0) {
            rewardToken.safeTransfer(address(msg.sender), pending);
        }

        user.rewardDebt = (user.amount * accTokenPerShare) / PRECISION_FACTOR;

        emit Withdraw(msg.sender, _amount);
    }

    function withdrawEarly(uint256 _amount) external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "Amount to withdraw too high");
        require(
            (user.amount - _amount >= minimumStake) || (user.amount - _amount) == 0,
            'When withdrawing from spawning pools the remaining balance must be 0 or >= the minimum stake.'
        );
        uint256 _earlyWithdrawalFee = _amount.calcPortionFromBasisPoints(500);
        uint256 _burn = _earlyWithdrawalFee.calcPortionFromBasisPoints(5000);   // Half of zombie is burned
        uint256 _toTreasury = _earlyWithdrawalFee - _burn;                      // The rest is sent to the treasury

        uint256 _remainingAmount = _amount;
        _remainingAmount -= _earlyWithdrawalFee;

        _updatePool();

        uint256 pending = ((user.amount * accTokenPerShare) / PRECISION_FACTOR) - user.rewardDebt;

        if (_amount > 0) {
            user.amount = user.amount - _amount;
            stakedToken.safeTransfer(burnAddr, _burn);
            stakedToken.safeTransfer(treasury, _toTreasury);
            stakedToken.safeTransfer(address(msg.sender), _remainingAmount);
            user.tokenWithdrawalDate = block.timestamp + minimumStakingTime;
        }

        if (pending > 0) {
            rewardToken.safeTransfer(address(msg.sender), pending);
        }

        user.rewardDebt = (user.amount * accTokenPerShare) / PRECISION_FACTOR;

        emit WithdrawEarly(msg.sender, _remainingAmount, _earlyWithdrawalFee);
    }

    /*
     * @notice Withdraw staked tokens without caring about rewards
     * @dev Needs to be for emergency.
     */
    function emergencyWithdraw() external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        uint256 _remaining = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;

        if(block.timestamp < user.tokenWithdrawalDate) {
            uint256 _earlyWithdrawalFee = _remaining / 20; // 5% of amount
            _remaining -= _earlyWithdrawalFee;
            stakedToken.safeTransfer(treasury, _earlyWithdrawalFee);
        }

        if (_remaining > 0) {
            stakedToken.safeTransfer(address(msg.sender), _remaining);
        }

        emit EmergencyWithdraw(msg.sender, user.amount);
    }

    /*
     * @notice Stop rewards
     * @dev Only callable by owner. Needs to be for emergency.
     */
    function emergencyRewardWithdraw(uint256 _amount) external onlyOwner {
        rewardToken.safeTransfer(address(msg.sender), _amount);
    }

    /**
     * @notice It allows the admin to recover wrong tokens sent to the contract
     * @param _tokenAddress: the address of the token to withdraw
     * @param _tokenAmount: the number of tokens to withdraw
     * @dev This function is only callable by admin.
     */
    function recoverWrongTokens(address _tokenAddress, uint256 _tokenAmount) external onlyOwner {
        require(_tokenAddress != address(stakedToken), "Cannot be staked token");
        require(_tokenAddress != address(rewardToken), "Cannot be reward token");

        IBEP20(_tokenAddress).safeTransfer(address(msg.sender), _tokenAmount);

        emit AdminTokenRecovery(_tokenAddress, _tokenAmount);
    }

    /*
     * @notice Stop rewards
     * @dev Only callable by owner
     */
    function stopReward() external onlyOwner {
        bonusEndBlock = block.number;
    }

    /*
     * @notice Update reward per block
     * @dev Only callable by owner.
     * @param _rewardPerBlock: the reward per block
     */
    function updateRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner {
        require(block.number < startBlock, "Pool has started");
        rewardPerBlock = _rewardPerBlock;
        emit NewRewardPerBlock(_rewardPerBlock);
    }

    // Allow dev to change the nft rewarded
    function setPoolNft(IRevivedRugNft _nft) public onlyOwner {
        nft = _nft;
    }

    /**
     * @notice It allows the admin to update start and end blocks
     * @dev This function is only callable by owner.
     * @param _startBlock: the new start block
     * @param _bonusEndBlock: the new end block
     */
    function updateStartAndEndBlocks(uint256 _startBlock, uint256 _bonusEndBlock) external onlyOwner {
        require(block.number < startBlock, "Pool has started");
        require(_startBlock < _bonusEndBlock, "New startBlock must be lower than new endBlock");
        require(block.number < _startBlock, "New startBlock must be higher than current block");

        startBlock = _startBlock;
        bonusEndBlock = _bonusEndBlock;

        // Set the lastRewardBlock as the startBlock
        lastRewardBlock = startBlock;

        emit NewStartAndEndBlocks(_startBlock, _bonusEndBlock);
    }

    /*
     * @notice View function to see pending reward on frontend.
     * @param _user: user address
     * @return Pending reward for a given user
     */
    function pendingReward(address _user) external view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        uint256 stakedTokenSupply = stakedToken.balanceOf(address(this));
        if (block.number > lastRewardBlock && stakedTokenSupply != 0) {
            uint256 multiplier = _getMultiplier(lastRewardBlock, block.number);
            uint256 cakeReward = multiplier * rewardPerBlock;
            uint256 adjustedTokenPerShare =
            accTokenPerShare + ((cakeReward * PRECISION_FACTOR) / stakedTokenSupply);
            return ((user.amount * adjustedTokenPerShare) / PRECISION_FACTOR) - user.rewardDebt;
        } else {
            return ((user.amount * accTokenPerShare) / PRECISION_FACTOR) - user.rewardDebt;
        }
    }

    // return treasury address
    function getTreasury() public view returns(address) {
        return address(treasury);
    }

    /*
     * @notice Update reward variables of the given pool to be up-to-date.
     */
    function _updatePool() internal {
        if (block.number <= lastRewardBlock) {
            return;
        }

        uint256 stakedTokenSupply = stakedToken.balanceOf(address(this));

        if (stakedTokenSupply == 0) {
            lastRewardBlock = block.number;
            return;
        }

        uint256 multiplier = _getMultiplier(lastRewardBlock, block.number);
        uint256 cakeReward = multiplier * rewardPerBlock;
        accTokenPerShare = accTokenPerShare + ((cakeReward * PRECISION_FACTOR) / stakedTokenSupply);
        lastRewardBlock = block.number;
    }

    // Buys and burns zombie
    function buyBackAndBurn(uint bnbAmount) private {
        uint256 _initialZombieBalance = stakedToken.balanceOf(address(this));
        swapZombieForBnb(bnbAmount);
        uint256 _zombieBoughtBack = stakedToken.balanceOf(address(this)) - _initialZombieBalance;
        stakedToken.transfer(burnAddr, _zombieBoughtBack); // Send bought zombie to burn address
    }

    // Returns grave unlock fee in bnb
    function unlockFeeInBnb() public view returns(uint) {
        return priceConsumer.usdToBnb(unlockFee);
    }

    // Buys Zombie with BNB
    function swapZombieForBnb(uint256 bnbAmount) private {
        address[] memory path = new address[](2);
        path[0] = pancakeswapRouter.WETH();
        path[1] = address(stakedToken);

        // make the swap
        pancakeswapRouter.swapExactETHForTokens{value: bnbAmount} (
            0,
            path,
            address(this),
            block.timestamp
        );
    }

    /*
     * @notice Return reward multiplier over the given _from to _to block.
     * @param _from: block to start
     * @param _to: block to finish
     */
    function _getMultiplier(uint256 _from, uint256 _to) internal view returns (uint256) {
        if (_to <= bonusEndBlock) {
            return _to - _from;
        } else if (_from >= bonusEndBlock) {
            return 0;
        } else {
            return bonusEndBlock - _from;
        }
    }
}