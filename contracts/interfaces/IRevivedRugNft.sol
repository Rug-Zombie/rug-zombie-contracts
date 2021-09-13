// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import '../token/ERC721/ERC721.sol';
import '../access/Ownable.sol';
import '../utils/Counters.sol';


interface IRevivedRugNft {
    function reviveRug(address _to) external returns(uint);
    function owner() external returns(address);
    function ownerOf(uint _id) external returns(address);
    function transferFrom(address _from, address _to, uint _id) external;
    function renounceOwnership() external;
    function baseURI() external returns(string memory);
}
