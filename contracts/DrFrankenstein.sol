// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./access/Ownable.sol";
import "./interfaces/IZombieToken.sol";
import "./interfaces/IUndeadBar.sol";
import "./interfaces/IGraveStakingToken.sol";
import "./interfaces/IRevivedRugNft.sol";
import "./interfaces/IPriceConsumerV3.sol";
import "./libraries/Percentages.sol";

interface IMigratorChef {
    // Perform LP token migration from legacy PancakeSwap to CakeSwap.
    // Take the current LP token address and return the new LP token address.
    // Migrator should have full access to the caller's LP token.
    // Return the new LP token address.
    //
    // XXX Migrator must have allowance access to PancakeSwap LP tokens.
    // CakeSwap must mint EXACTLY the same amount of CakeSwap LP tokens or
    // else something bad will happen. Traditional PancakeSwap does not
    // do that so be careful!
    function migrate(IGraveStakingToken token) external returns (IGraveStakingToken);
}

// DrFrankenstein is the master of the Zombie token, tombs & the graves. He can make Zombie & he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract DrFrankenstein is Ownable {
    using Percentages for uint256;

    // Info of each user.
    struct UserInfo {
        uint256 amount;                 // How many LP tokens the user has provided.
        uint256 rewardDebt;             // Reward debt. See explanation below.
        uint256 tokenWithdrawalDate;    // Date user must wait until before early withdrawal fees are lifted.
        //
        // We do some fancy math here. Basically, any point in time, the amount of ZMBEs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accZombiePerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accZombiePerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.

        // User grave info
        uint256 rugDeposited;               // How many rugged tokens the user deposited.
        bool paidUnlockFee;                 // true if user paid the unlock fee.
        uint256  nftRevivalDate;            // Date user must wait until before harvesting their nft.
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
    IMigratorChef public migrator;
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

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event WithdrawEarly(address indexed user, uint256 indexed pid, uint256 amountWithdrawn, uint256 amountLocked);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event ReviveRug(address indexed to, uint date, address nft, uint indexed id);

    constructor(
        IZombieToken _zombie,
        IUndeadBar _undead,
        address _devaddr,
        address payable _treasury,
        address _lpStorage,
        address _pancakeRouter,
        address _firstNft,
        address _priceConsumer,
        uint256 _zombiePerBlock,
        uint256 _startBlock
    ) {
        zombie = _zombie;
        undead = _undead;
        devaddr = _devaddr;
        treasury = _treasury;
        lpStorage = _lpStorage;
        zombiePerBlock = _zombiePerBlock;
        startBlock = _startBlock;

        // staking pool
        poolInfo.push(PoolInfo({
            lpToken: IGraveStakingToken(address(_zombie)),
            allocPoint: 100,
            lastRewardBlock: startBlock,
            accZombiePerShare: 0,
            minimumStakingTime: 3 days,
            requiresRug: false,
            isGrave: true,
            ruggedToken: IGraveStakingToken(address(0)),
            minimumStake: 5000 * (10 ** 18),
            nft: _firstNft,
            unlockFee: 5 * (10 ** 18),
            nftRevivalTime: 30 days,
            unlocks: 0
        }));

        totalAllocPoint = 100;
        pancakeswapRouter = IUniswapV2Router02(_pancakeRouter);
        priceConsumer = IPriceConsumerV3(_priceConsumer);
    }

    // Ensures a pool / grave is unlocked before a user accesses it.
    modifier isUnlocked(uint _gid) {
        UserInfo memory _user = userInfo[_gid][msg.sender];
        PoolInfo memory _pool = poolInfo[_gid];
        require(_user.rugDeposited > 0 || _pool.requiresRug == false, 'Locked: User has not deposited the required Rugged Token.');
        require(_user.paidUnlockFee == true || _pool.isGrave == false , 'Locked: User has not unlocked pool / grave.');
        _;
    }

    // Ensures a rugged token has been deposited before unlocking accessing grave / pool.
    modifier hasDepositedRug(uint _pid) {
        require(userInfo[_pid][msg.sender].rugDeposited > 0 || poolInfo[_pid].requiresRug == false, 'Grave: User has not deposited the required Rugged Token.');
        _;
    }

    // Ensures user's withdrawal date has passed before withdrawing.
    modifier canWithdraw(uint _pid, uint _amount) {
        uint _withdrawalDate = userInfo[_pid][msg.sender].tokenWithdrawalDate;
        require((block.timestamp >= _withdrawalDate && _withdrawalDate > 0) || _amount == 0, 'Staking: Token is still locked, use #withdrawEarly / #leaveStakingEarly to withdraw funds before the end of your staking period.');
        _;
    }

    // Ensures a pool / grave exists
    modifier poolExists(uint _pid) {
        require(_pid <= poolInfo.length - 1, 'Pool: That pool does not exist.');
        _;
    }

    function updateMultiplier(uint256 multiplierNumber) public onlyOwner {
        BONUS_MULTIPLIER = multiplierNumber;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function addPool(
        uint _allocPoint,
        IGraveStakingToken _lpToken,
        uint _minimumStakingTime,
        bool _withUpdate
    ) public onlyOwner {
        require(address(_lpToken) != address(zombie), 'addGrave: zombie cannot be used as grave lptoken.');
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint + _allocPoint;
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accZombiePerShare: 0,
            minimumStakingTime: _minimumStakingTime,
            // Null grave variables
            isGrave: false,
            requiresRug: false,
            ruggedToken: IGraveStakingToken(address(0)),
            nft: address(0),
            minimumStake: 0,
            unlockFee: 0,
            nftRevivalTime: 0,
            unlocks: 0
        }));
    }

    // Add a new grave. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    // LP token will be minted & staked in replace of users zombie token, to simulate zombie staking on graves, without messing up rewards.
    function addGrave(
        uint256 _allocPoint,
        IGraveStakingToken _lpToken,
        uint256 _minimumStakingTime,
        IGraveStakingToken _ruggedToken,
        address _nft,
        uint256 _minimumStake,
        uint256 _unlockFee,
        uint256 _nftRevivalTime,
        bool _withUpdate
    ) public onlyOwner {
        require(address(_lpToken) != address(zombie), 'addGrave: zombie cannot be used as grave lptoken.');
        require(_lpToken.getOwner() == address(this), 'addGrave: DrFrankenstein must be lptoken owner.');
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint + _allocPoint;
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accZombiePerShare: 0,
            minimumStakingTime: _minimumStakingTime,
            // Grave variables
            isGrave: true,
            requiresRug: true,
            ruggedToken: _ruggedToken,
            nft: _nft,
            minimumStake: _minimumStake,
            unlockFee: _unlockFee,
            nftRevivalTime: _nftRevivalTime,
            unlocks: 0
        }));
    }

    // Update the given pool's ZMBE allocation point. Can only be called by the owner.
    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 prevAllocPoint = poolInfo[_pid].allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        if (prevAllocPoint != _allocPoint) {
            totalAllocPoint = (totalAllocPoint - prevAllocPoint) + _allocPoint;
        }
    }

    // Set the migrator contract. Can only be called by the owner.
    function setMigrator(IMigratorChef _migrator) public onlyOwner {
        migrator = _migrator;
    }

    // Migrate lp token to another lp contract. Can be called by anyone. We trust that migrator contract is good.
    function migrate(uint256 _pid) public {
        require(address(migrator) != address(0), "migrate: no migrator");
        PoolInfo storage pool = poolInfo[_pid];
        IGraveStakingToken lpToken = pool.lpToken;
        uint256 bal = lpToken.balanceOf(address(this));
        require(bal == 0 || (lpToken.allowance(address(this), address(migrator)) == 0), 'Migrate: approve from non-zero to non-zero allowance');
        lpToken.approve(address(migrator), bal);
        IGraveStakingToken newLpToken = migrator.migrate(lpToken);
        require(bal == newLpToken.balanceOf(address(this)), "migrate: bad");
        pool.lpToken = newLpToken;
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        return (_to - _from) * BONUS_MULTIPLIER;
    }

    // View function to see pending ZMBEs on frontend.
    function pendingZombie(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accZombiePerShare = pool.accZombiePerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 zombieReward = (multiplier * zombiePerBlock * pool.allocPoint) / totalAllocPoint;
            accZombiePerShare = accZombiePerShare + (zombieReward * 1e12) / lpSupply;
        }
        return ((user.amount * accZombiePerShare) / 1e12) - user.rewardDebt;
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 zombieReward = (multiplier * zombiePerBlock * pool.allocPoint) / totalAllocPoint;
        zombie.mint(devaddr, zombieReward / 10);
        zombie.mint(address(undead), zombieReward);
        pool.accZombiePerShare = pool.accZombiePerShare + (zombieReward * 1e12) / lpSupply;
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to MasterChef for ZMBE allocation.
    function deposit(uint256 _pid, uint256 _amount) public isUnlocked(_pid) {
        require (_pid != 0, 'deposit ZMBE by staking');
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount + _amount >= pool.minimumStake, 'Grave: amount staked must be >= grave minimum stake.');

        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = ((user.amount * pool.accZombiePerShare) / 1e12) - user.rewardDebt;
            if(pending > 0) {
                safeZombieTransfer(msg.sender, pending);
            }
        }
        if (_amount > 0) {
            user.tokenWithdrawalDate = block.timestamp + pool.minimumStakingTime;
            if (user.amount < pool.minimumStake) {
                user.nftRevivalDate = block.timestamp + pool.nftRevivalTime;
            }
            if (pool.isGrave == true) {
                pool.lpToken.mint(_amount);
                require(zombie.transferFrom(address(msg.sender), address(this), _amount));
                user.amount = user.amount + _amount;
            } else {
                require(pool.lpToken.transferFrom(address(msg.sender), address(this), _amount));
                user.amount = user.amount + _amount;
            }
        }
        user.rewardDebt = (user.amount * pool.accZombiePerShare) / 1e12;
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _pid, uint256 _amount) public canWithdraw(_pid, _amount) {
        require (_pid != 0, 'withdraw ZMBE by unstaking');
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        require(
            (user.amount - _amount >= pool.minimumStake) || (user.amount - _amount) == 0,
            'Grave: when withdrawing from graves the remaining balance must be 0 or >= grave minimum stake.'
        );
        uint256 _whaleWithdrawalFee = 0;

        uint amountBasisPointsOfTotalSupply = pool.lpToken.totalSupply().calcBasisPoints(_amount);
        if(amountBasisPointsOfTotalSupply > 500 && pool.isGrave == false) { // tax 8% of on tokens if whale removes > 5% lp supply.
            _whaleWithdrawalFee = _amount.calcPortionFromBasisPoints(800);
            require(pool.lpToken.transfer(lpStorage, _whaleWithdrawalFee)); // Pool: whale tax is added to locked liquidity (burn address)
        }

        uint256 _remainingAmount = _amount;
        _remainingAmount -= _whaleWithdrawalFee;


        updatePool(_pid);
        uint256 pending = ((user.amount * pool.accZombiePerShare) / 1e12) - user.rewardDebt;
        if(pending > 0) {
            safeZombieTransfer(msg.sender, pending);
        }

        // mint nft
        if(pool.isGrave == true && user.amount >= pool.minimumStake && block.timestamp >= user.nftRevivalDate) {
            IRevivedRugNft _nft = IRevivedRugNft(pool.nft);
            uint256 id = _nft.reviveRug(msg.sender);
            user.nftRevivalDate = block.timestamp + pool.nftRevivalTime;
            emit ReviveRug(msg.sender, block.timestamp, pool.nft, id);
        }

        if(_amount > 0) {
            if(pool.isGrave == true) {
                user.amount = user.amount - _amount;
                require(zombie.transfer(msg.sender, _remainingAmount));
                pool.lpToken.burn(_amount);
            } else {
                user.amount = user.amount - _amount;
                require(pool.lpToken.transfer(address(msg.sender), _remainingAmount));
            }
            user.tokenWithdrawalDate = block.timestamp + pool.minimumStakingTime;
        }
        user.rewardDebt = (user.amount * pool.accZombiePerShare) / 1e12;
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Withdraw from Grave / Tomb before time is up, takes 5% fee
    function withdrawEarly(uint256 _pid, uint256 _amount) public {
        require (_pid != 0, 'withdraw ZMBE by unstaking');
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        require(
            (user.amount - _amount >= pool.minimumStake) || (user.amount - _amount) == 0,
            'Grave: when withdrawing from graves the remaining balance must be 0 or >= grave minimum stake.'
        );
        uint256 _earlyWithdrawalFee = _amount.calcPortionFromBasisPoints(500);
        uint256 _burn = _earlyWithdrawalFee.calcPortionFromBasisPoints(5000);   // Half of zombie is burned
        uint256 _toTreasury = _earlyWithdrawalFee - _burn;                      // The rest is sent to the treasury
        uint256 _whaleWithdrawalFee = 0;

        uint amountBasisPointsOfTotalSupply = pool.lpToken.totalSupply().calcBasisPoints(_amount);
        if(amountBasisPointsOfTotalSupply > 500 && pool.isGrave == false) { // tax 8% of on tokens if whale removes > 5% lp supply.
            _whaleWithdrawalFee = _amount.calcPortionFromBasisPoints(800);
            require(pool.lpToken.transfer(lpStorage, _whaleWithdrawalFee)); // Pool: whale tax is added to locked liquidity (burn address)
        }

        uint256 _remainingAmount = _amount;
        _remainingAmount -= _earlyWithdrawalFee;
        _remainingAmount -= _whaleWithdrawalFee;

        updatePool(_pid);
        uint256 pending = ((user.amount * pool.accZombiePerShare) / 1e12) - user.rewardDebt;
        if(pending > 0) {
            safeZombieTransfer(msg.sender, pending);
        }
        if(_amount > 0) {
            if(pool.isGrave == true) {
                user.amount = user.amount - _amount;
                require(zombie.transfer(burnAddr, _burn));
                require(zombie.transfer(treasury, _toTreasury));
                require(zombie.transfer(msg.sender, _remainingAmount));
                pool.lpToken.burn(_amount);
            } else {
                user.amount = user.amount - _amount;
                unpairBurnAndTreasureLP(address(pool.lpToken), _earlyWithdrawalFee);    // unpair lps, burn zombie tokens & send any other tokens to the treasury
                require(pool.lpToken.transfer(address(msg.sender), _remainingAmount));       // return the rest of lps to the user
            }
            user.tokenWithdrawalDate = block.timestamp + pool.minimumStakingTime;
        }
        user.rewardDebt = (user.amount * pool.accZombiePerShare) / 1e12;
        emit WithdrawEarly(msg.sender, _pid, _remainingAmount, _earlyWithdrawalFee);
    }

    // Stake ZMBE tokens to MasterChef
    function enterStaking(uint256 _amount) public isUnlocked(0) {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        require(user.amount + _amount >= pool.minimumStake, 'Grave: amount staked must be >= grave minimum stake.');

        updatePool(0);
        if (user.amount > 0) {
            uint256 pending = ((user.amount * pool.accZombiePerShare) / 1e12) - user.rewardDebt;
            if(pending > 0) {
                safeZombieTransfer(msg.sender, pending);
            }
        }
        if(_amount > 0) {
            if (user.amount < pool.minimumStake) {
                user.nftRevivalDate = block.timestamp + pool.nftRevivalTime;
            }
            require(pool.lpToken.transferFrom(address(msg.sender), address(this), _amount));
            user.amount = user.amount + _amount;
            user.tokenWithdrawalDate = block.timestamp + pool.minimumStakingTime;
        }

        user.rewardDebt = (user.amount * pool.accZombiePerShare) / 1e12;

        undead.mint(msg.sender, _amount);
        emit Deposit(msg.sender, 0, _amount);
    }

    // Withdraw ZMBE tokens from STAKING.
    function leaveStaking(uint256 _amount) public canWithdraw(0, _amount) {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        require(
            (user.amount - _amount >= pool.minimumStake) || (user.amount - _amount) == 0,
            'Grave: when withdrawing from graves the remaining balance must be 0 or >= grave minimum stake.'
        );

        updatePool(0);
        uint256 pending = ((user.amount * pool.accZombiePerShare) / 1e12) - user.rewardDebt;
        if(pending > 0) {
            safeZombieTransfer(msg.sender, pending);
        }

        // mint nft
        if(pool.isGrave == true && user.amount >= pool.minimumStake && block.timestamp >= user.nftRevivalDate) {
            uint id = IRevivedRugNft(pool.nft).reviveRug(msg.sender);
            user.nftRevivalDate = block.timestamp + pool.nftRevivalTime;
            emit ReviveRug(msg.sender, block.timestamp,  pool.nft, id);
        }

        if(_amount > 0) { // is only true for users who have waited the minimumStakingTime due to modifier
            require(pool.lpToken.transfer(address(msg.sender), _amount));
            user.amount = user.amount - _amount;
            user.tokenWithdrawalDate = block.timestamp + pool.minimumStakingTime;
            if(pool.isGrave == true) {
                user.nftRevivalDate = block.timestamp + pool.nftRevivalTime;
            }
        }

        user.rewardDebt = (user.amount * pool.accZombiePerShare) / 1e12;

        undead.burn(msg.sender, _amount);
        emit Withdraw(msg.sender, 0, _amount);
    }

    function leaveStakingEarly(uint256 _amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        require(
            user.amount - _amount >= pool.minimumStake || (user.amount - _amount) == 0,
            'withdraw: remaining balance must be 0 or >= the graves minimum stake'
        );

        updatePool(0);
        uint256 pending = ((user.amount * pool.accZombiePerShare) / 1e12) - user.rewardDebt;
        uint256 _earlyWithdrawalFee = _amount.calcPortionFromBasisPoints(500);  // 5% fee to fund project
        uint256 _burn = _earlyWithdrawalFee.calcPortionFromBasisPoints(5000);   // Half of zombie is burned
        uint256 _toTreasury = _earlyWithdrawalFee - _burn;                      // The rest is sent to the treasury
        uint256 _remainingAmount = _amount - _earlyWithdrawalFee;

        if(pending > 0) {
            safeZombieTransfer(msg.sender, pending);
        }

        if(_amount > 0) {
            user.amount = user.amount - _amount;
            user.tokenWithdrawalDate = block.timestamp + pool.minimumStakingTime;
            require(pool.lpToken.transfer(burnAddr, _burn));
            require(pool.lpToken.transfer(treasury, _toTreasury));
            require(pool.lpToken.transfer(address(msg.sender), _remainingAmount));
        }

        user.rewardDebt = (user.amount * pool.accZombiePerShare) / 1e12;
        undead.burn(msg.sender, _amount);
        emit WithdrawEarly(msg.sender, 0, _remainingAmount, _earlyWithdrawalFee);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 _amount = user.amount;
        uint256 _remaining = _amount;

        // The following fees must still be taken here to prevent #emergencyWithdraw
        // from being used as a method to avoid fees.

        // Send early withdrawal fees to treasury
        if(block.timestamp < user.tokenWithdrawalDate) {
            uint256 _earlyWithdrawalFee = _amount / 20; // 5% of amount
            if(pool.isGrave == true) {
                zombie.transfer(treasury, _earlyWithdrawalFee);
            } else {
                pool.lpToken.transfer(treasury, _earlyWithdrawalFee);
            }
            _remaining -= _earlyWithdrawalFee;
        }

        // Send whale withdrawal fee to treasury
        uint amountBasisPointsOfTotalSupply = pool.lpToken.totalSupply().calcBasisPoints(_amount);
        if(amountBasisPointsOfTotalSupply > 500 && pool.isGrave == false) { // tax 8% of on tokens if whale removes > 5% lp supply.
            uint _whaleWithdrawalFee = _amount.calcPortionFromBasisPoints(800);
            pool.lpToken.transfer(lpStorage, _whaleWithdrawalFee); // whale tax is added to lockedLiquidity
            _remaining -= _whaleWithdrawalFee;
        }

        if(pool.isGrave == true && _pid != 0) {
            pool.lpToken.burn(_amount);
        }

        if(pool.isGrave == true) {
            require(zombie.transfer(address(msg.sender), _remaining));
        } else {
            require(pool.lpToken.transfer(address(msg.sender), _remaining));
        }

        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.tokenWithdrawalDate = block.timestamp + pool.minimumStakingTime;
        user.nftRevivalDate = block.timestamp + pool.nftRevivalTime;
        user.amount = 0;
        user.rewardDebt = 0;
    }

    // Safe zombie transfer function, just in case if rounding error causes pool to not have enough ZMBEs.
    function safeZombieTransfer(address _to, uint256 _amount) internal {
        undead.safeZombieTransfer(_to, _amount);
    }

    // Deposits rug into grave before unlocking
    function depositRug(uint _pid, uint _amount) external poolExists(_pid) {
        require(poolInfo[_pid].isGrave == true, 'Tomb: only graves accept rugged tokens.');
        require(poolInfo[_pid].ruggedToken.transferFrom(msg.sender, treasury, _amount));
        userInfo[_pid][msg.sender].rugDeposited += _amount;
    }

    // Unlocks grave, half of fee is sent to treasury, the rest is used to buyBackAndBurn,
    function unlock(uint _pid) external payable hasDepositedRug(_pid) {
        require(poolInfo[_pid].isGrave == true, 'Tomb: tombs do not require unlocking.');
        require(userInfo[_pid][msg.sender].paidUnlockFee == false, 'Grave: unlock fee is already paid.');
        uint _unlockFeeInBnb = unlockFeeInBnb(_pid);
        require(msg.value >= _unlockFeeInBnb, 'Grave: cannot unlock, insufficient bnb sent.');
        uint _projectFunds = msg.value;
        uint _toTreasury = _projectFunds.calcPortionFromBasisPoints(5000);
        uint _buyBack = _projectFunds - _toTreasury;

        treasury.transfer(_toTreasury);     // half of unlock fee goes to treasury
        buyBackAndBurn(_buyBack);           // the rest is used to buy back and burn zombie token

        poolInfo[_pid].unlocks += 1;
        userInfo[_pid][msg.sender].paidUnlockFee = true;
    }

    // return treasury address
    function getTreasury() public view returns(address) {
        return address(treasury);
    }

    // Allow dev to lift 2% wallet balance limit on the zombie token after launch
    function liftLaunchWhaleDetection() public onlyOwner {
        zombie.liftLaunchWhaleDetection();
    }

    // Allow dev to change the nft rewarded from a grave
    // should only be called on grave's
    function setGraveNft(uint _pid, address nft) public onlyOwner {
        poolInfo[_pid].nft = nft;
    }

    // Allow dev to change the unlock fee of a grave
    // should only be called on grave's
    function setUnlockFee(uint _pid, uint _unlockFee) public onlyOwner {
        poolInfo[_pid].unlockFee = _unlockFee;
    }

    // Warning only call before a grave has users staked in it
    // should only be called on grave's
    function setGraveMinimumStake(uint _pid, uint _minimumStake) public onlyOwner {
        poolInfo[_pid].minimumStake = _minimumStake;
    }

    // Allow dev to change price consumer oracle address
    function setPriceConsumer(IPriceConsumerV3 _priceConsumer) public onlyOwner {
        priceConsumer = _priceConsumer;
    }

    // Allow dev to set router, for when we start an AMM
    function setPancakeRouter(address _pancakeRouter) public onlyOwner {
        pancakeswapRouter = IUniswapV2Router02(_pancakeRouter);
    }

    // Helpers
    function unpairBurnAndTreasureLP(address lpAddress, uint _amount) private {
        // unpair
        IUniswapV2Pair lp = IUniswapV2Pair(lpAddress);
        IGraveStakingToken _token0 = IGraveStakingToken(lp.token0());
        IGraveStakingToken _token1 = IGraveStakingToken(lp.token1());

        uint256 _initialToken0Balance = _token0.balanceOf(address(this));
        uint256 _initialToken1Balance = _token1.balanceOf(address(this));

        // allow pancake router
        lp.approve(address(pancakeswapRouter), _amount);

        // unpair lp
        pancakeswapRouter.removeLiquidity(
            address(_token0),
            address(_token1),
            _amount,
            0,
            0,
            address(this),
            block.timestamp
        );

        uint256 _token0Amount = _token0.balanceOf(address(this)) - _initialToken0Balance;
        uint256 _token1Amount = _token1.balanceOf(address(this)) - _initialToken1Balance;

        // burn zombie token if included in pair
        if(address(_token0) == address(zombie) || address(_token1) == address(zombie)) {
            if(address(_token0) == address(zombie)) {             // if _token0 is ZMBE
                _token0.transfer(burnAddr, _token0Amount);        // burn the unpaired token0
                _token1.transfer(treasury, _token1Amount);          // send the unpaired token1 to treasury
            } else {                                            // else if _token1 is ZMBE
                _token1.transfer(burnAddr, _token1Amount);        // burn the unpaired token1
                _token0.transfer(treasury, _token0Amount);          // send the unpaired token0 to treasury
            }
        } else { // send both tokens to treasury if pair doesnt contain ZMBE token
            _token0.transfer(treasury, _token0Amount);
            _token1.transfer(treasury, _token1Amount);
        }
    }

    // Buys Zombie with BNB
    function swapZombieForBnb(uint256 bnbAmount) private {
        address[] memory path = new address[](2);
        path[0] = pancakeswapRouter.WETH();
        path[1] = address(zombie);

        IGraveStakingToken WBNB = IGraveStakingToken(pancakeswapRouter.WETH());
        WBNB.approve(address(pancakeswapRouter), bnbAmount);

        // make the swap
        pancakeswapRouter.swapExactETHForTokens{value: bnbAmount} (
            0,
            path,
            address(this),
            block.timestamp
        );
    }

    // Buys and burns zombie
    function buyBackAndBurn(uint bnbAmount) private {
        uint256 _initialZombieBalance = zombie.balanceOf(address(this));
        swapZombieForBnb(bnbAmount);
        uint256 _zombieBoughtBack = zombie.balanceOf(address(this)) - _initialZombieBalance;
        zombie.transfer(burnAddr, _zombieBoughtBack); // Send bought zombie to burn address
    }

    // Returns grave unlock fee in bnb
    function unlockFeeInBnb(uint _gid) public view returns(uint) {
        return priceConsumer.usdToBnb(poolInfo[_gid].unlockFee);
    }

    // Update dev address by the previous dev.
    function dev(address _devaddr) public {
        require(msg.sender == devaddr, "dev: wut?");
        devaddr = _devaddr;
    }
}
