pragma solidity ^0.8.4;

import "./libraries/Percentages.sol";
import "./interfaces/AggregatorV3Interface.sol";

contract PriceConsumerV3 {
    using Percentages for uint;
    AggregatorV3Interface internal priceFeed;

    /**
     * Network: Binance Smart Chain
     * Aggregator: BNB/USD
     * Address: 0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE
     */
    constructor() public {
//        priceFeed = AggregatorV3Interface(0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE);
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice() public view returns (uint) {
//        (
//        uint80 roundID,
//        int price,
//        uint startedAt,
//        uint timeStamp,
//        uint80 answeredInRound
//        ) = priceFeed.latestRoundData();
//        return uint(price) * 10 ** 10;
        return 300 * 10 ** 18;
    }


    // Returns unlock fee in BNB
    function usdToBnb(uint _amountInUsd) public view returns (uint) {
        if(_amountInUsd == 0) {
            return 0;
        }

        uint _basisPoints = getLatestPrice().calcBasisPoints(_amountInUsd);
        uint _amountInBnb = _basisPoints * (10 ** 14);

        return _amountInBnb;
    }
}
