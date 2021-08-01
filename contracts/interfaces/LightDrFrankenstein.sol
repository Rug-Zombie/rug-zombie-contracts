// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../access/Ownable.sol";
import "./IGraveStakingToken.sol";
import "./IZombieToken.sol";
import "./IUndeadBar.sol";
import "./IPriceConsumerV3.sol";
import "./IUniswapV2Router02.sol";

// DrFrankenstein is too big to import into other contract
// This is the answer
contract LightDrFrankenstein is Ownable {
    // Info of each user.
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 tokenWithdrawalDate;
        uint256 rugDeposited;
        bool paidUnlockFee;
        uint256  nftRevivalDate;
    }

    // Info of each pool / grave.
    struct PoolInfo {
        // Traditional pool variables
        IGraveStakingToken lpToken;             // Address of LP token contract.
        uint256 allocPoint;                     // How many allocation points assigned to this pool. ZMBEs to distribute per block.
        uint256 lastRewardBlock;                // Last block number that ZMBEs distribution occurs.
        uint256 accZombiePerShare;              // Accumulated ZMBEs per share, times 1e12. See below.
        uint256 minimumStakingTime;             // Duration a user must stake before early withdrawal fee is lifted.
        // Grave variables
        bool isGrave;                           // True if pool is a grave (provides nft rewards).
        bool requiresRug;                       // True if grave require a rugged token deposit before unlocking.
        IGraveStakingToken ruggedToken;         // Address of the grave's rugged token (casted to IGraveStakingToken over IBEP20 to save space).
        address nft;                            // Address of reward nft.
        uint256 unlockFee;                      // Unlock fee (In BUSD, Chainlink Oracle is used to convert fee to current BNB value).
        uint256 minimumStake;                   // Minimum amount of lpTokens required to stake.
        uint256 nftRevivalTime;                 // Duration a user must stake before they can redeem their nft reward.
        uint256 unlocks;                        // Number of times a grave is unlocked
    }

    // The ZMBE TOKEN!
    IZombieToken public zombie;
    // The SYRUP TOKEN!
    IUndeadBar public undead;
    // Dev address.
    address public devaddr;
    // ZMBE tokens created per block.
    uint256 public zombiePerBlock;
    // Bonus multiplier for early zombie makers.
    uint256 public BONUS_MULTIPLIER = 1;
    // The migrator contract. It has a lot of power. Can only be set through governance (owner).
    // Uniswap routerV2
    IUniswapV2Router02 public pancakeswapRouter;
    // Info of each grave.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;
    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when CAKE mining starts.
    uint256 public startBlock;

    // Project addresses
    address payable treasury;   // Address of project treasury contract
    address public lpStorage; // Address locked LP is sent to (Allows us to migrate lp if Pancakeswap moves to v3 / we start an AMM)
    address public burnAddr = 0x000000000000000000000000000000000000dEaD; // Burn address

    // Chainlink BNB Price
    IPriceConsumerV3 public priceConsumer;

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        return (_to - _from) * BONUS_MULTIPLIER;
    }

    // View function to see pending ZMBEs on frontend.
    function pendingZombie(uint256 _pid, address _user) external view returns (uint256) {
        return 0;
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {}

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {}

    // Deposit LP tokens to MasterChef for ZMBE allocation.
    function deposit(uint256 _pid, uint256 _amount) public {}

    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _pid, uint256 _amount) public {}

    // Withdraw from Grave / Tomb before time is up, takes 5% fee
    function withdrawEarly(uint256 _pid, uint256 _amount) public {}

    // Stake ZMBE tokens to MasterChef
    function enterStaking(uint256 _amount) public {}

    // Withdraw ZMBE tokens from STAKING.
    function leaveStaking(uint256 _amount) public {}

    function leaveStakingEarly(uint256 _amount) public {}

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public {}

    // Deposits rug into grave before unlocking
    function depositRug(uint _pid, uint _amount) external {}

    // Unlocks grave, half of fee is sent to treasury, the rest is used to buyBackAndBurn,
    function unlock(uint _pid) external payable {}

    // return treasury address
    function getTreasury() public view returns(address) {
        return address(treasury);
    }

    // Allow dev to change the nft rewarded from a grave
    // should only be called on grave's
    function setGraveNft(uint _pid, address nft) public {}

    // Allow dev to change the unlock fee of a grave
    // should only be called on grave's
    function setUnlockFee(uint _pid, uint _unlockFee) public {
        poolInfo[_pid].unlockFee = _unlockFee;
    }

    // Warning only call before a grave has users staked in it
    // should only be called on grave's
    function setGraveMinimumStake(uint _pid, uint _minimumStake) public {
        poolInfo[_pid].minimumStake = _minimumStake;
    }

    // Allow dev to change price consumer oracle address
    function setPriceConsumer(IPriceConsumerV3 _priceConsumer) public {
        priceConsumer = _priceConsumer;
    }

    // Allow dev to set router, for when we start an AMM
    function setPancakeRouter(address _pancakeRouter) public {
        pancakeswapRouter = IUniswapV2Router02(_pancakeRouter);
    }

    // Returns grave unlock fee in bnb
    function unlockFeeInBnb(uint _gid) public view returns(uint) {
        return 0;
    }

    // Update dev address by the previous dev.
    function dev(address _devaddr) public {}
}
