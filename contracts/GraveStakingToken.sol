// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./token/BEP20/BEP20.sol";

 contract GraveStakingToken is BEP20 {
     event BurnEvent(address, uint);

     constructor(string memory _name, string memory _symbol) BEP20(_name, _symbol) {}

     function burn(uint256 amount) public onlyOwner {
        emit BurnEvent(msg.sender, amount);
        super._burn(msg.sender, amount);
    }
}
