// Runs on bsc testnet local fork

const BigNumber = require("bignumber.js");

const DrFrankensteinZombieGrave = artifacts.require("DrFrankenstein")
const ZombieToken = artifacts.require("ZombieToken")
const UndeadBar = artifacts.require("UndeadBar")
const PancakeRouter = artifacts.require("IPancakeRouter02")
const RevivedRugNft = artifacts.require("RevivedRugNft")
const PriceConsumerV3 = artifacts.require("PriceConsumerV3")
const pancakeswapRouterAddress = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
const burnAddress = "0x0000000000000000000000000000000000000000"
const treasury = "0x8df5b3ece7c11749588ed2d102dbc77619c46776"
let drFrankenstein
let zombie
let undead
let zombieGraveNft
let pancakeRouter
let transactionCount = 0

const one = new BigNumber(10).pow(18)
const zero = new BigNumber(0)
const max = new BigNumber(2).pow(256).minus(1)

contract("DrFrankenstein", (accounts) => {
    before(async () => {
        drFrankenstein = await DrFrankensteinZombieGrave.deployed()
        zombie = await ZombieToken.deployed()
        undead = await UndeadBar.deployed()
        zombieGraveNft = await RevivedRugNft.deployed()
        priceConsumer = await PriceConsumerV3.deployed()
        pancakeRouter = await PancakeRouter.at(pancakeswapRouterAddress)
        const zombieAmount = one.times(10000)

        await zombie.mint(
            accounts[0],
            zombieAmount.times(2),
            {from: accounts[0], gas: 3000000}
        )

        await zombie.approve(
            pancakeRouter.address,
            max,
            {from: accounts[0], gas: 3000000}
        )

        await zombie.approve(
            drFrankenstein.address,
            max,
            {from: accounts[0], gas: 3000000}
        )

        await pancakeRouter.addLiquidityETH(
            zombie.address,
            zombieAmount,
            0,
            0,
            accounts[0],
            Date.now(),
            {from: accounts[0], gas: 3000000, value: one.div(10)}
        )

        await zombieGraveNft.setBaseURI('123', {from: accounts[0], gas: 3000000, nonce: await nonce()})

        // DrFrankenstein setup
        await undead.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        await zombie.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        await zombieGraveNft.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
    })

    // NOTE: Changes made in one test, carry onto the next.
    it('Should fail to unlock Zombie Grave when insufficient BNB is sent', async () => {
        try {
            await drFrankenstein.unlock(0, {
                from: accounts[0],
                gas: 3000000,
                value: 10000000000000000,
                nonce: await nonce()
            })
        } catch (e) {
            assert(e.message.includes('Grave: cannot unlock, insufficient bnb sent.'))
            return
        }
        assert(false)
    })

    // better to test at once instead of redeploying
    it('Should unlock Zombie Grave. Buyback then burn and treasure the bought back ZMBE when sending enough BNB', async () => {
        const bnbAmount = new BigNumber(40000000000000000)
        const expectedToTreasuryAmount = bnbAmount.times(0.5)                 // 2.5%

        const initialBurnAmount = await zombie.balanceOf(burnAddress)
        const initialTreasuryAmount = await web3.eth.getBalance(treasury)
        let userInfo = await drFrankenstein.userInfo(0, accounts[0])

        expect(userInfo.paidUnlockFee).to.be.false

        await drFrankenstein.unlock(0, {from: accounts[0], gas: 3000000, value: bnbAmount, nonce: await nonce()})

        const burnAmount = await zombie.balanceOf(burnAddress)
        const treasuryAmount = await web3.eth.getBalance(treasury)
        userInfo = await drFrankenstein.userInfo(0, accounts[0])


        assert(burnAmount > initialBurnAmount, "No ZMBE was sent to burn address")
        assert.equal(treasuryAmount.toString(), expectedToTreasuryAmount.plus(initialTreasuryAmount).toString(), "Incorrect amount of BNB was sent to treasury")
        assert(userInfo.paidUnlockFee, "Unlock fee was not paid")
    })

    it('Should fail when Zombie Grave has already been unlocked', async () => {
        try {
            await drFrankenstein.unlock(0, {
                from: accounts[0],
                gas: 3000000,
                value: 40000000000000000,
                nonce: await nonce()
            })
        } catch (e) {
            assert(e.message.includes('Grave: unlock fee is already paid.'))
            return
        }
        assert(false)
    })

    it('Should transfer correct amount of ZMBE to Zombie Grave and accurate userInfo data is set on #enterStaking', async () => {
        const initialGraveAmount = await zombie.balanceOf(drFrankenstein.address)
        const initialUserAmount = (await drFrankenstein.userInfo(0, accounts[0])).amount
        const initialWalletAmount = new BigNumber(await zombie.balanceOf(accounts[0]))
        const amount = one.times(100)

        await drFrankenstein.enterStaking(amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        const graveAmount = await zombie.balanceOf(drFrankenstein.address)
        const walletAmount = await zombie.balanceOf(accounts[0])
        const userInfo = await drFrankenstein.userInfo(0, accounts[0])
        const poolInfo = await drFrankenstein.poolInfo(0)
        const tokenWithdrawalDate = userInfo.tokenWithdrawalDate.toNumber()
        const expectedTokenWithdrawalDate = (Date.now() / 1000) + poolInfo.minimumStakingTime.toNumber()
        const nftRevivalDate = userInfo.nftRevivalDate.toNumber()
        const expectedNftRevivalDate = (Date.now() / 1000) + poolInfo.nftRevivalTime.toNumber()

        assert.equal(graveAmount.toString(), amount.plus(initialGraveAmount).toString())
        assert.equal(walletAmount.toString(), initialWalletAmount.minus(amount).toString(10))
        assert.equal(userInfo.amount.toString(), amount.plus(initialUserAmount).toString())
        assert(
            Math.abs(tokenWithdrawalDate - expectedTokenWithdrawalDate) < 5,
            `expected ${expectedTokenWithdrawalDate} but got ${tokenWithdrawalDate}`
        )
        assert(
            Math.abs(nftRevivalDate - expectedNftRevivalDate) < 5,
            `expected ${expectedNftRevivalDate} but got ${nftRevivalDate}`
        )
    })

    it('Should transfer accurate amount of ZMBE, reset tokenWithdrawalDate but not nftWithdrawalDate when increasing Zombie Grave stake.', async () => {
        const initialGraveAmount = await zombie.balanceOf(drFrankenstein.address)
        const initialUserAmount = (await drFrankenstein.userInfo(0, accounts[0])).amount
        const initialWalletAmount = new BigNumber(await zombie.balanceOf(accounts[0]))
        const initialNftRevivalDate = (await drFrankenstein.userInfo(0, accounts[0])).nftRevivalDate.toNumber()

        const amount = one.times(100)

        await drFrankenstein.enterStaking(amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        const graveAmount = await zombie.balanceOf(drFrankenstein.address)
        const walletAmount = await zombie.balanceOf(accounts[0])
        const userInfo = await drFrankenstein.userInfo(0, accounts[0])
        const poolInfo = await drFrankenstein.poolInfo(0)
        const tokenWithdrawalDate = userInfo.tokenWithdrawalDate.toNumber()
        const expectedTokenWithdrawalDate = (Date.now() / 1000) + poolInfo.minimumStakingTime.toNumber()
        const nftRevivalDate = userInfo.nftRevivalDate.toNumber()

        assert.equal(graveAmount.toString(), amount.plus(initialGraveAmount).toString(), 'DrFrankenstein zombie balance did not increase by expected amount')
        assert.equal(walletAmount.toString(), initialWalletAmount.minus(amount).plus(one.times(10)).toString(10), 'Wallet zombie balance did not decrease by expected amount') // We add 10 to mitigate claimed rewards over one block
        assert.equal(userInfo.amount.toString(), amount.plus(initialUserAmount).toString(), 'User grave amount did not increase by expected amount')
        assert(
            Math.abs(tokenWithdrawalDate - expectedTokenWithdrawalDate) < 4,
            `expected ${expectedTokenWithdrawalDate} but got ${tokenWithdrawalDate}`,
        )
        assert.equal(nftRevivalDate, initialNftRevivalDate, 'User grave nftRevivalTime had unexpected change')
    })

    it('Should redeem rewards and not reset times when staking 0 in Zombie Grave', async () => {
        const initialGraveAmount = await zombie.balanceOf(drFrankenstein.address)
        const initialUserAmount = (await drFrankenstein.userInfo(0, accounts[0])).amount
        const initialWalletAmount = new BigNumber(await zombie.balanceOf(accounts[0]))
        let userInfo = await drFrankenstein.userInfo(0, accounts[0])
        const initialNftRevivalDate = userInfo.nftRevivalDate.toNumber()
        const initialTokenWithdrawalDate = userInfo.tokenWithdrawalDate.toNumber()

        await drFrankenstein.enterStaking(0, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        const graveAmount = await zombie.balanceOf(drFrankenstein.address)
        const walletAmount = await zombie.balanceOf(accounts[0])
        userInfo = await drFrankenstein.userInfo(0, accounts[0])
        const tokenWithdrawalDate = userInfo.tokenWithdrawalDate.toNumber()
        const nftRevivalDate = userInfo.nftRevivalDate.toNumber()

        assert.equal(graveAmount.toString(), initialGraveAmount.toString(), 'DrFrankenstein zombie had unexpected change')
        assert.equal(walletAmount.toString(), initialWalletAmount.plus(one.times(10)).toString(10), 'Wallet zombie balance did not increase by expected amount') // We add 10 to mitigate claimed rewards over one block
        assert.equal(userInfo.amount.toString(), initialUserAmount.toString(), 'User grave amount had unexpected change')
        assert.equal(tokenWithdrawalDate, initialTokenWithdrawalDate, 'User grave tokenWithdrawalDate has unexpected change')
        assert.equal(nftRevivalDate, initialNftRevivalDate, 'User grave nftRevivalTime had unexpected change')
    })

    it('Should withdraw, burn and treasure 5% fee and reset token withdrawal date on #leaveStakingEarly', async () => {
        const amount = one.times(50)
        const projectFunds = amount.times(0.05)
        const expectedBurnAmount = projectFunds.times(0.5)                      // 2.5%
        const expectedToTreasuryAmount = projectFunds.minus(expectedBurnAmount)    // 2.5%
        const expectedWalletAmount = amount.minus(projectFunds)
        const initialBurnBalance = await zombie.balanceOf(burnAddress)
        const initialTreasuryBalance = await zombie.balanceOf(treasury)
        const initialWalletBalance = await zombie.balanceOf(accounts[0])
        let userInfo = await drFrankenstein.userInfo(0, accounts[0])
        const initialNftRevivalDate = userInfo.nftRevivalDate.toNumber()

        await drFrankenstein.leaveStakingEarly(amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        const burnBalance = await zombie.balanceOf(burnAddress)
        const treasuryBalance = await zombie.balanceOf(treasury)
        const walletBalance = await zombie.balanceOf(accounts[0])
        userInfo = await drFrankenstein.userInfo(0, accounts[0])
        const poolInfo = await drFrankenstein.poolInfo(0)
        const expectedTokenWithdrawalDate = (Date.now() / 1000) + poolInfo.minimumStakingTime.toNumber()
        const tokenWithdrawalDate = userInfo.tokenWithdrawalDate.toNumber()
        const nftRevivalDate = userInfo.nftRevivalDate.toNumber()

        assert.equal(burnBalance.toString(), expectedBurnAmount.plus(initialBurnBalance).toString(10), "Unexpected amount of ZMBE was sent to burn address")
        assert.equal(treasuryBalance.toString(), expectedToTreasuryAmount.plus(initialTreasuryBalance).toString(), "Incorrect amount of ZMBE was sent to treasury")
        assert.equal(walletBalance.toString(), expectedWalletAmount.plus(initialWalletBalance).plus(one.times(10)).toString(10), "Incorrect amount of ZMBE sent to wallet") // We add 10 to mitigate claimed rewards over one block
        assert(
            Math.abs(tokenWithdrawalDate - expectedTokenWithdrawalDate) < 4,
            `expected ${expectedTokenWithdrawalDate} but got ${tokenWithdrawalDate}`,
        )
        assert.equal(nftRevivalDate, initialNftRevivalDate, 'User grave nftRevivalTime had unexpected change')
    })

    it('Should fail when remaining amount after #leaveStakingEarly remaining amount is less than grave minimum stake', async () => {
        const amount = one.times(145)
        try {
            await drFrankenstein.leaveStakingEarly(amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        } catch (e) {
            assert(e.message.includes('withdraw: remaining balance must be 0 or >= the graves minimum stake'))
            return
        }
        assert(false)
    })

    it('Should withdraw successfully when withdrawing total user balance on #leaveStakingEarly', async () => {
        const amount = one.times(150)
        const expectedWalletAmount = amount.times(0.95)
        let userInfo = await drFrankenstein.userInfo(0, accounts[0])
        const initialNftRevivalDate = userInfo.nftRevivalDate.toNumber()
        const initialWalletBalance = await zombie.balanceOf(accounts[0])

        await drFrankenstein.leaveStakingEarly(amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        const walletBalance = await zombie.balanceOf(accounts[0])
        userInfo = await drFrankenstein.userInfo(0, accounts[0])
        const poolInfo = await drFrankenstein.poolInfo(0)
        const expectedTokenWithdrawalDate = (Date.now() / 1000) + poolInfo.minimumStakingTime.toNumber()
        const tokenWithdrawalDate = userInfo.tokenWithdrawalDate.toNumber()
        const nftRevivalDate = userInfo.nftRevivalDate.toNumber()
        const nftBalance = (await zombieGraveNft.balanceOf(accounts[0])).toNumber()

        assert(
            expectedWalletAmount.plus(initialWalletBalance).lt(walletBalance),
            "Incorrect amount of ZMBE sent to wallet"
        ) // We add 10 to mitigate claimed rewards over one block
        assert(
            Math.abs(tokenWithdrawalDate - expectedTokenWithdrawalDate) < 4,
            `expected ${expectedTokenWithdrawalDate} but got ${tokenWithdrawalDate}`,
        )
        assert.equal(nftRevivalDate, initialNftRevivalDate, 'User grave nftRevivalTime had unexpected change')
        assert.equal(nftBalance, 0)
    })

    it('Should fail calling #leaveStaking before time is up', async () => {
        const amount = one.times(200)
        await drFrankenstein.enterStaking(amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        //should pass
        await drFrankenstein.leaveStaking(0, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        try {
            await drFrankenstein.leaveStaking(amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        } catch (e) {
            assert(e.message.includes('Staking: Token is still locked, use #withdrawEarly / #leaveStakingEarly to withdraw funds before the end of your staking period.'))
        }
        try {
            await drFrankenstein.leaveStaking(one.times(150), {from: accounts[0], gas: 3000000, nonce: await nonce()})
        } catch (e) {
            assert(e.message.includes('Staking: Token is still locked, use #withdrawEarly / #leaveStakingEarly to withdraw funds before the end of your staking period.'))

            const time = 2592000 // 30 days ms

            advanceTime(time)

            const initialNftBalance = (await zombieGraveNft.balanceOf(accounts[0])).toNumber()

            await drFrankenstein.leaveStaking(one.times(150), {from: accounts[0], gas: 3000000, nonce: await nonce()})

            let nftBalance = (await zombieGraveNft.balanceOf(accounts[0])).toNumber()
            assert.equal(initialNftBalance + 1, nftBalance, 'User did not recieve nft after claiming rewards.')

            advanceTime(time / 2)

            nftBalance = (await zombieGraveNft.balanceOf(accounts[0])).toNumber()
            await drFrankenstein.leaveStaking(one.times(10), {from: accounts[0], gas: 3000000, nonce: await nonce()})
            assert.equal(initialNftBalance + 1, nftBalance, 'User recieved nft before time was up.')

            // advanceTime(time * 2)
            // const grave = await drFrankenstein.poolInfo(0)
            // const user = await drFrankenstein.userInfo(0, accounts[0])
            // nftBalance = (await zombieGraveNft.balanceOf(accounts[0])).toNumber()
            // await drFrankenstein.leaveStaking(one.times(10), {from: accounts[0], gas: 3000000, nonce: await nonce()})
            // assert.equal(nftBalance, initialNftBalance + 2, 'User did not receive nft after claiming rewards')
            //
            // return
        }
        assert(false)
    })
    // todo withdraws of nothing dont redeem any rewards

    async function nonce() {
        transactionCount += 1
        return await web3.eth.getTransactionCount(await accounts[0], 'pending') + (transactionCount - 1);
    }

    const advanceTime = (time) => {
        return new Promise((resolve, reject) => {
            web3.currentProvider.sendAsync({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [time],
                id: new Date().getTime()
            }, (err, result) => {
                if (err) { return reject(err); }
                return resolve(result);
            });
        });
    }
})
