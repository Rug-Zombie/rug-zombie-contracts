// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./access/Ownable.sol";
import "./token/BEP20/IBEP20.sol";
import "./SpawningPool.sol";
import "./interfaces/IRevivedRugNft.sol";
import "./interfaces/IPriceConsumerV3.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./libraries/SpawningPoolPayload.sol";

contract SpawningPoolFactory is Ownable {
    event NewSpawningPoolContract(address indexed smartChef);

    IBEP20 zombie;
    address payable treasury;
    address admin;
    IPriceConsumerV3 priceConsumer;
    IUniswapV2Router02 pancakeswapRouter;
    address[] public pools;

    constructor(IBEP20 _zombie, address payable _treasury, IPriceConsumerV3 _priceConsumer, IUniswapV2Router02 _pancakeswapRouter, address _admin) {
        zombie =_zombie;
        treasury = _treasury;
        priceConsumer = _priceConsumer;
        pancakeswapRouter = _pancakeswapRouter;
        admin = _admin;
    }

    function deployPool(
        IBEP20 _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _bonusEndBlock,
        uint256 _unlockFee,
        uint256 _minimumStake,
        uint256 _nftRevivalTime,
        uint256 _minimumStakingTime,
        IRevivedRugNft _nft
    ) external onlyOwner {
        require(zombie.totalSupply() >= 0);
        require(_rewardToken.totalSupply() >= 0);
        require(zombie != _rewardToken, "Tokens must be be different");

        bytes memory bytecode = type(SpawningPool).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(zombie, _rewardToken, _startBlock, _nft));
        address smartChefAddress;

        assembly {
            smartChefAddress := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        pools.push(smartChefAddress);

        SpawningPoolPayload.Payload memory _payload = SpawningPoolPayload.Payload({
        zombie: zombie,
        rewardToken: _rewardToken,
        rewardPerBlock: _rewardPerBlock,
        startBlock: _startBlock,
        bonusEndBlock: _bonusEndBlock,
        admin: admin,
        treasury: treasury,
        priceConsumer: priceConsumer,
        unlockFee: _unlockFee,
        minimumStake: _minimumStake,
        nftRevivalTime: _nftRevivalTime,
        minimumStakingTime: _minimumStakingTime,
        nft: _nft,
        pancakeswapRouter: pancakeswapRouter
        });

        SpawningPool(smartChefAddress).initialize(
            _payload
        );

        emit NewSpawningPoolContract(smartChefAddress);
    }

    function poolsLength() public view returns(uint) {
        return pools.length;
    }
}
