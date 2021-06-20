// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./token/BEP20/BEP20.sol";

 contract GraveStakingToken is BEP20("Rug Zombie Grave Staking Token", "RZ-STAKING") {
     event BurnEvent(address, uint);
     function burn(uint256 amount) public onlyOwner {
        emit BurnEvent(msg.sender, amount);
        super._burn(msg.sender, amount);
    }
}
