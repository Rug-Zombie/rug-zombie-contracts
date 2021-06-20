# RugZombie Core

## DrFrankenstein Contract:
Deployed Contract: https://bscscan.com/address/0xF07fc10C5C0161188F204CB6189A1D4BFD26B4CF

This contract is the owner of the Zombie token but holds more resposibility than your traditional MasterChef contract. The contract contains manages the graves and tombs as well as the treasury and burning mechanisms that are specified below. 

### Users:
The following info is stored for each user:
- `uint256 amount`
  - Amount of token's a user deposited into the grave / tomb
- `uint256 rewardDebt`
  - Amount of ZMBE rewards the grave / tomb owes a user
- `uint256 tokenWithdrawalDate`
  - Date a user's early withdrawal fee is lifted (unix time)
- `uint256 rugDeposited`
  - Amount of rugged token a user deposited into the grave
- `bool paidUnlockFee`
  - Is true when user has unlocked a grave
- `uint256 nftRevivalDate`
  - Date a user can claim their nft reward (uinx time)

### Graves:
Graves allow users to claim NFT rewards after staking their ZMBE token for a specified period of time. They also provide a yield so users can earn rewards in ZMBE as well.

#### `unlock(uint256 _pid)`:

Uses received BNB to unlock and gain access to a grave. Half of this fee is sent to the treasury, half is used to buy back and burn the ZMBE.
- The [PriceConsumer](https://bscscan.com/address/0xf43e8d9800f174e631c1b04d441df41937fcdb8a#code) contract uses a Chainlink oracle to keep the unlock fee fixed to a price in USD.

#### `depositRug(uint256 _pid, uint256 _amount)`:

User deposits rugged token into grave, this is required before unlocking for most graves. Any amount above 0 is adequate and proves you had the rug before staking to earn it's NFT.

#### `deposit(uint256 _pid, uint256 _amount)`:

User deposits ZMBE token in grave. The amount deposited must be greater than or equal to the grave's minimum required stake.
- A user's `tokenWithdrawalDate` and `nftRevivalDate` are both set on a users first deposit in a grave.
- Using this method to increase one's amount staked will not affect the user's `nftRevivalDate`, but will reset their `tokenWithdrawalDate`.
- Deposit will claim any pending ZMBE rewards.

#### `withdrawEarly(uint256 _pid, uint256 _amount)`:

Withdraws user's ZMBE from the grave before their `tokenWithdrawalDate` has passed.
- Of the 5% fee is taken half is burned and half is sent to the treasury.
- Claiming amount greater than 0 will reset your rewards 
- earlyWithdraw will claim any pending ZMBE rewards.

#### `withdraw(uint256 _pid, uint256 _amount)`:
Withdraws user's ZMBE fromt the grave after their `tokenWithdrawalDate`

## Test Contracts
Each test file must be run independently using:
- `truffle test test/drFrankensteinZombieGrave.js --network develop`
- `truffle test test/drFrankensteinTraditionGrave.js --network develop`
- `truffle test test/drFrankensteinTomb.js --network develop`

These tests are made for a local for of the bsc testnet and the network must be restarted between each test using the following:
- `ganache-cli -f https://data-seed-prebsc-1-s1.binance.org:8545/`
- Make sure your testnet wallet has enough BNB to run the tests before forking. You can fund your testnet wallet [here](https://testnet.binance.org/faucet-smart).