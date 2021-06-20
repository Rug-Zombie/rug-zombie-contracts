pragma solidity ^0.8.4;

import './token/ERC721/ERC721.sol';
import './access/Ownable.sol';
import './utils/Counters.sol';


contract RevivedRugNft is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    using Strings for uint256;

    // Optional mapping for token URIs
    mapping (uint256 => string) private _tokenURIs;

    // Base URI
    uint public baseURIBatchSize = 1000;
    string[] public baseURIs;

    event MintNft(address to, uint date, address nft, uint tokenId, string tokenURI); // Used to generate NFT data on external decentralized storage service

    constructor(string memory _name, string memory _symbol)
    ERC721(_name, _symbol)
    {}

    function setBaseURI(string calldata baseURI_) external onlyOwner() {
        _baseURIextended = baseURI_;
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        require(_exists(tokenId), "ERC721Metadata: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIextended;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        // If there is a baseURI but no tokenURI, concatenate the tokenID to the baseURI.
        return string(abi.encodePacked(base, tokenId.toString()));
    }

    // Base URI must be set before grave mints nft
    function reviveRug(address _to) public onlyOwner() returns(uint) {
        require(bytes(_baseURIextended).length > 0, 'BaseURI is not set.');
        _tokenIds.increment();
        uint newItemId = _tokenIds.current();

        _mint(_to, newItemId);
        emit MintNft(tx.origin, block.timestamp, address(this), newItemId, tokenURI(newItemId));
        return newItemId;
    }

    function totalSupply() public view returns(uint) {
        return _tokenIds.current();
    }
}
