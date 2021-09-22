# RugZombie Core

## Core contracts:
### DrFrankenstein
DrDrankenstein is a fork of Pancakeswap's Masterchef contract, and we'd like to be transparent about our changes. 
- Grave system added: A Grave is new type of pool that requires ZMBE as the staking token and rewards users with NFT's and a zombie yield over time.
  

- Unlock fees: Users must unlock graves before staking in them, 50% of unlock fees buyback and burn the ZMBE token and 50% is sent to the treasury.


- Withdraw fees: All pools contain a cooldown period between withdrawals (generally 3 days). Withdrawing your funds before this peroid is up will take a 5% fee. 50% of early withdraw fees buyback and burn the ZMBE token and 50% is sent to the treasury. 


- Whale tax: Pools not including graves apply a whale tax on user withdrawal. If a user is withdrawing over 5% of an LP tokens total supply, they will be taxed 8% on their withdrawal. 100% of whale tax is sent to the teams LP storage multisig wallet to increase total liquidity.


Deployed contract: [0x590Ea7699A4E9EaD728F975efC573f6E34a5dC7B](https://bscscan.com/address/0x590Ea7699A4E9EaD728F975efC573f6E34a5dC7B)

### SafeOwner 
This contract is the owner of the DrFrankenstein contract, but restricts the functions the contract owner can call.
- Patched migrator code: The migrator code is removed, the contract owner can no longer call these functions on the DrFrankenstein contract.

Deployed contract: [0xf6cDE95D790AC15377A0a525139B5e9D8cc6894e](https://bscscan.com/address/0xf6cDE95D790AC15377A0a525139B5e9D8cc6894e)


### GoodZombie 
This contract is the owner of the SafeOwner contract and enhances DrFrankenstein security, by restricting the amount of power the owner wallet has when calling functions.

GoodZombie: [0xAe689a88bEe2E25E098Dd38970582c096fAbbB08](https://bscscan.com/address/0xAe689a88bEe2E25E098Dd38970582c096fAbbB08)


### Timelock
Timelock contract imposes a 6hr minimum delay before the DrFrankenstein owner can call functions on the contract.

Deployed contract: [0xDb9Cd921AaA2f7785425e6682F7c7b68c6c82049](https://bscscan.com/address/0xDb9Cd921AaA2f7785425e6682F7c7b68c6c82049)

## Test Contracts
Each test file must be run independently using:
- `truffle test test/drFrankensteinZombieGrave.js --network develop`
- `truffle test test/drFrankensteinTraditionGrave.js --network develop`
- `truffle test test/drFrankensteinTomb.js --network develop`
- `truffle test test/goodZombie.js --network develop`

These tests are made for a local for of the bsc testnet and the network must be restarted between each test using the following:
- `ganache-cli -f https://data-seed-prebsc-1-s1.binance.org:8545/`
- Make sure your testnet wallet has enough BNB to run the tests before forking. You can fund your testnet wallet [here](https://testnet.binance.org/faucet-smart).