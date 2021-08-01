// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./access/Ownable.sol";
import "./interfaces/IGraveStakingToken.sol";
import "./interfaces/IPriceConsumerV3.sol";

interface DrFrankenstein {
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
}

// The SafeOwner is the new DrFrankenstein owner. It can never set the migrator of the underlying DrFrankenstein, making it a safer contract for a safer world!
contract SafeOwner is Ownable {
    DrFrankenstein public drFrankenstein;

    constructor(DrFrankenstein _drFrankenstein) {
        drFrankenstein = _drFrankenstein;
    }

    function updateMultiplier(uint256 multiplierNumber) public onlyOwner {
        drFrankenstein.updateMultiplier(multiplierNumber);
    }

    function addPool(uint _allocPoint, IGraveStakingToken _lpToken, uint _minimumStakingTime, bool _withUpdate) public onlyOwner {
        drFrankenstein.addPool(_allocPoint, _lpToken, _minimumStakingTime, _withUpdate);
    }

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
        drFrankenstein.addGrave(_allocPoint, _lpToken, _minimumStakingTime, _ruggedToken, _nft, _minimumStake, _unlockFee, _nftRevivalTime, _withUpdate);
    }

    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        drFrankenstein.set(_pid, _allocPoint, _withUpdate);
    }

    function setGraveNft(uint _pid, address _nft) public onlyOwner {
        drFrankenstein.setGraveNft(_pid, _nft);
    }

    function setUnlockFee(uint _pid, uint _unlockFee) public onlyOwner {
        drFrankenstein.setUnlockFee(_pid, _unlockFee);
    }

    function setGraveMinimumStake(uint _pid, uint _minimumStake) public onlyOwner {
        drFrankenstein.setGraveMinimumStake(_pid, _minimumStake);
    }

    function setPriceConsumer(IPriceConsumerV3 _priceConsumer) public onlyOwner {
        drFrankenstein.setPriceConsumer(_priceConsumer);
    }

    function setPancakeRouter(address _pancakeRouter) public onlyOwner {
        drFrankenstein.setPancakeRouter(_pancakeRouter);
    }
}
