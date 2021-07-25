pragma solidity ^0.8.4;

import "../interfaces/IRevivedRugNft.sol";
import "../token/BEP20/IBEP20.sol";

library SpawningPoolPayload {
    struct Payload {
        IBEP20 zombie;
        IBEP20 rewardToken;
        uint rewardPerBlock;
        uint startBlock;
        uint bonusEndBlock;
        address admin;
        address payable treasury;
        uint unlockFee;
        uint minimumStake;
        uint nftRevivalTime;
        uint minimumStakingTime;
        IRevivedRugNft nft;
    }
}
