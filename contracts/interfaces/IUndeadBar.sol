pragma solidity ^0.8.4;

// UndeadBar interface.
interface IUndeadBar {
    function mint(address _to, uint256 _amount) external;
    function burn(address _from ,uint256 _amount) external;
    function safeZombieTransfer(address _to, uint256 _amount) external;
    function delegates(address delegator) external view returns (address);
    function delegate(address delegatee) external;
    function delegateBySig(address delegatee, uint nonce, uint expiry, uint8 v, bytes32 r, bytes32 s) external;
    function getCurrentVotes(address account) external view returns (uint256);
    function getPriorVotes(address account, uint blockNumber) external view returns (uint256);
    function safe32(uint n, string memory errorMessage) external pure returns (uint32);
}