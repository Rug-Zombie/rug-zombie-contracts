# RugZombie Core

## Core contracts:
- DrDrankenstein(Masterchef) Contract: [0x590Ea7699A4E9EaD728F975efC573f6E34a5dC7B](https://bscscan.com/address/0x590Ea7699A4E9EaD728F975efC573f6E34a5dC7B)


- SafeOwner: [0xf6cDE95D790AC15377A0a525139B5e9D8cc6894e](https://bscscan.com/address/0xf6cDE95D790AC15377A0a525139B5e9D8cc6894e) 
  
  This contract is the owner of the DrFrankenstein but holds more responsibility than your traditional MasterChef contract. The contract manages the graves and tombs as well as the treasury and burning mechanisms that are specified below. 
 

- GoodZombie: To be deployed

  This contract is the owner of the SafeOwner contract and enhances DrFrankenstein security, by restricting the amount of power the owner wallet has.


- Timelock: [0xDb9Cd921AaA2f7785425e6682F7c7b68c6c82049](https://bscscan.com/address/0xDb9Cd921AaA2f7785425e6682F7c7b68c6c82049)

## Test Contracts
Each test file must be run independently using:
- `truffle test test/drFrankensteinZombieGrave.js --network develop`
- `truffle test test/drFrankensteinTraditionGrave.js --network develop`
- `truffle test test/drFrankensteinTomb.js --network develop`
- `truffle test test/goodZombie.js --network develop`

These tests are made for a local for of the bsc testnet and the network must be restarted between each test using the following:
- `ganache-cli -f https://data-seed-prebsc-1-s1.binance.org:8545/`
- Make sure your testnet wallet has enough BNB to run the tests before forking. You can fund your testnet wallet [here](https://testnet.binance.org/faucet-smart).