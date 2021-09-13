// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./access/Ownable.sol";
import "./interfaces/IGraveStakingToken.sol";
import "./interfaces/IPriceConsumerV3.sol";

/**
 * @title GoodZombie
 * @author Nams
 * Improves security of DrFrankenstein's functions
 */

interface IDrFrankenstein {
    struct PoolInfo {
        IGraveStakingToken lpToken;
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accZombiePerShare;
        uint256 minimumStakingTime;
        bool isGrave;
        bool requiresRug;
        IGraveStakingToken ruggedToken;
        address nft;
        uint256 unlockFee;
        uint256 minimumStake;
        uint256 nftRevivalTime;
        uint256 unlocks;
    }

    function massUpdatePools() external;
    function poolLength() external returns(uint256);
    function poolInfo(uint256) external returns(PoolInfo memory);
}

interface IRugZombieNft {
    function implementsReviveRug() external pure returns(bool);
}

interface ISafeOwner {
    function updateMultiplier(uint256 multiplierNumber) external;

    function addPool(uint _allocPoint, IGraveStakingToken _lpToken, uint _minimumStakingTime, bool _withUpdate) external;

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
    ) external;

    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) external;

    function setGraveNft(uint _pid, address _nft) external;

    function setUnlockFee(uint _pid, uint _unlockFee) external;

    function setGraveMinimumStake(uint _pid, uint _minimumStake) external;

    function setPriceConsumer(IPriceConsumerV3 _priceConsumer) external;

    function setPancakeRouter(address _pancakeRouter) external;

    function drFrankenstein() external returns(address);

}

contract GoodZombie is Ownable {
    ISafeOwner public safeOwner;
    IDrFrankenstein public drFrankenstein;
    address public teamMultiSig;
    uint256 maxMultiplier;
    uint256 minUnlockFee;
    mapping (address => bool) public routerWhitelist;
    mapping (address => bool) public priceConsumerWhitelist;
    // mapping that stores pool lpTokens. This way we can check which LPs are in use without iterating all pools.
    mapping (address => bool) public poolLpExists;

    // all GoodZombie functions indirectly call the respective funtion on DrFrankenstein through the SafeOwner contract
    constructor(ISafeOwner _safeOwner, address _teamMultisig) {
        safeOwner = _safeOwner;
        teamMultiSig = _teamMultisig;
        maxMultiplier = 5;
        minUnlockFee = 10000;
        drFrankenstein = IDrFrankenstein(safeOwner.drFrankenstein());

            // backfill poolLpExists with lpTokens from existing graves
            for(uint256 x = 0; x < drFrankenstein.poolLength(); x++) {
                poolLpExists[address(drFrankenstein.poolInfo(x).lpToken)] = true;
            }
    }

    // updateMultiplier limits the max multiplierNumber that can be set on DrFrankenstein and calls #massUpdatePools
    function updateMultiplier(uint256 multiplierNumber) public onlyOwner {
        require(multiplierNumber <= maxMultiplier, "updateMultiplier: multiplier cannot be set greater than maxMultiplier");
        safeOwner.updateMultiplier(multiplierNumber);
        drFrankenstein.massUpdatePools();
    }

    // addPool prevents the creation of pools containing duplicate lpTokens
    function addPool(uint _allocPoint, IGraveStakingToken _lpToken, uint _minimumStakingTime, bool _withUpdate) public onlyOwner {
        require(poolLpExists[address(_lpToken)] == false, 'addPool: lpToken is used in an existing pool.');
        safeOwner.addPool(_allocPoint, _lpToken, _minimumStakingTime, _withUpdate);
        poolLpExists[address(_lpToken)] = true;
    }

    // addPool prevents the creation of pools containing duplicate lpTokens
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
        require(poolLpExists[address(_lpToken)] == false, 'addPool: lpToken is used in an existing pool.');
        require(IRugZombieNft(_nft).implementsReviveRug() == true, 'addGrave: nft does not have reviveRug function');
        safeOwner.addGrave(_allocPoint, _lpToken, _minimumStakingTime, _ruggedToken, _nft, _minimumStake, _unlockFee, _nftRevivalTime, _withUpdate);
        poolLpExists[address(_lpToken)] = true;
    }

    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        safeOwner.set(_pid, _allocPoint, _withUpdate);
    }

    function setGraveNft(uint _pid, address _nft) public onlyOwner {
        require(IRugZombieNft(_nft).implementsReviveRug());
        safeOwner.setGraveNft(_pid, _nft);
    }

    function setUnlockFee(uint _pid, uint _unlockFee) public onlyOwner {
        require(_unlockFee > minUnlockFee, 'setUnlockFee: new unlockFee must be >= minUnlockFee');
        safeOwner.setUnlockFee(_pid, _unlockFee);
    }

    function setGraveMinimumStake(uint _pid, uint _minimumStake) public onlyOwner {
        safeOwner.setGraveMinimumStake(_pid, _minimumStake);
    }

    // setPriceConsumer requires a new priceConsumer is whitelisted before being set
    function setPriceConsumer(IPriceConsumerV3 _priceConsumer) public onlyOwner {
        require(priceConsumerWhitelist[address(_priceConsumer)] == true, 'setPriceConsumer: new priceConsumer must be whitelisted');
        safeOwner.setPriceConsumer(_priceConsumer);
    }

    // setPancakeRouter requires a new router is whitelisted before being set
    function setPancakeRouter(address _pancakeRouter) public onlyOwner {
        require(routerWhitelist[_pancakeRouter] == true, 'setPancakeRouter: new router must be whitelisted');
        safeOwner.setPancakeRouter(_pancakeRouter);
    }

    /**
     * whitelistRouter enables / disables a dex router from being usable in #setPancakeRouter
     * this can only be called by the teamMultiSig address so under the event the contract owner is compromised
     * the router can only be set to a safe router whitelisted by the RugZombie team.
     */
    function whitelistRouter(address _router, bool _isWhitelisted) public {
        require(address(msg.sender) == teamMultiSig, 'whitelistRouter: must be teamMultiSig');
        routerWhitelist[_router] = _isWhitelisted;
    }

    /**
     * whitelistPriceConsumer enables / disables a bnb price consumer contract from being usable in #setPriceConsumer
     * this can only be called by the teamMultiSig address so under the event the contract owner is compromised
     * the priceConsumer can only be set to a safe contract whitelisted by the RugZombie team.
     */
    function whitelistPriceConsumer(address _priceConsumer, bool _isWhitelisted) public {
        require(address(msg.sender) == teamMultiSig, 'whitelistPriceConsumer: must be teamMultiSig');
        priceConsumerWhitelist[_priceConsumer] = _isWhitelisted;
    }

    function setTeamMultisig(address _newTeamMultisig) public {
        require(address(msg.sender) == teamMultiSig, 'setTeamMultisig: must be teamMultiSig');
        teamMultiSig = _newTeamMultisig;
    }
}
