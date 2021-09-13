pragma solidity ^0.8.4;

import './token/ERC721/ERC721.sol';
import './access/Ownable.sol';
import './utils/Counters.sol';

contract RugZombieNft is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    using Strings for uint256;

    bool public implementsReviveRug = true;

    // Optional mapping for token URIs
    mapping (uint256 => string) private _tokenURIs;

    // Token URI
    string public baseURI;

    event MintNft(address to, uint date, address nft, uint tokenId, string tokenURI); // Used to generate NFT data on external decentralized storage service

    constructor(string memory _name, string memory _symbol)
    ERC721(_name, _symbol)
    {}

    function setTokenURI(string memory _newTokenURI) public onlyOwner {
        require(bytes(baseURI).length == 0, 'TokenURI is already set.');
        baseURI = _newTokenURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return baseURI;
    }

    function totalSupply() public view returns(uint256) {
        return _tokenIds.current();
    }

    // Base URI must be set before grave mints nft
    function reviveRug(address _to) public onlyOwner() returns(uint) {
        require(bytes(baseURI).length > 0, 'TokenURI is not set.');
        _tokenIds.increment();
        uint newItemId = _tokenIds.current();

        _mint(_to, newItemId);
        emit MintNft(tx.origin, block.timestamp, address(this), newItemId, tokenURI(newItemId));
        return newItemId;
    }
}
