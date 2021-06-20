// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import '../token/ERC721/ERC721.sol';
import '../access/Ownable.sol';
import '../utils/Counters.sol';


interface IRevivedRugNft {
    function reviveRug(address _to) external returns(uint);
}
