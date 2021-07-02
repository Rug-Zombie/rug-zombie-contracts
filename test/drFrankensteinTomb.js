const BigNumber = require("bignumber.js");
const BN = web3.utils.BN

const DrFrankensteinZombieGrave = artifacts.require("DrFrankenstein")
const ZombieToken = artifacts.require("ZombieToken")
const UndeadBar = artifacts.require("UndeadBar")
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair")
const PancakeRouter = artifacts.require("IPancakeRouter02")
const PancakeFactory = artifacts.require("IPancakeFactory")
const WBNB = artifacts.require("WBNB")
const RevivedRugNft = artifacts.require("RevivedRugNft")
const pancakeswapFactoryAddress = "0x6725F303b657a9451d8BA641348b6761A6CC7a17"
const pancakeswapRouterAddress = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
const wbnbAddress = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
const burnAddress = "0x000000000000000000000000000000000000dEaD"
const lpStorage = "0x8df5b3ece7c11749588ed2d102dbc77619c46776"
const treasury = "0x8df5b3ece7c11749588ed2d102dbc77619c46776"
let drFrankenstein
let zombie
let undead
let traditionalGraveNft
let pancakeRouter
let pancakeFactory
let wbnb
let lpToken
let transactionCount = 0

const one = new BigNumber(10).pow(18)
const zero = new BigNumber(0)
const max = new BigNumber(2).pow(256).minus(1)

contract("DrFrankenstein", (accounts) => {
    before(async () => {
        drFrankenstein = await DrFrankensteinZombieGrave.deployed()
        zombie = await ZombieToken.deployed()
        undead = await UndeadBar.deployed()
        traditionalGraveNft = await RevivedRugNft.deployed()
        pancakeRouter = await PancakeRouter.at(pancakeswapRouterAddress)
        pancakeFactory = await PancakeFactory.at(pancakeswapFactoryAddress)
        wbnb = await WBNB.at(wbnbAddress)
        const zombieAmount = one.times(10000)

        await zombie.mint(
            accounts[0],
            zombieAmount.times(2),
            {from: accounts[0], gas: 3000000}
        )

        await zombie.approve(
            pancakeRouter.address,
            max,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )

        await zombie.approve(
            drFrankenstein.address,
            max,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )

        await pancakeRouter.addLiquidityETH(
            zombie.address,
            zombieAmount,
            0,
            0,
            accounts[0],
            Date.now(),
            {from: accounts[0], gas: 3000000, value: one.div(10), nonce: await nonce()}
        )

        const lpTokenAddress = await pancakeFactory.getPair(wbnb.address, zombie.address)
        lpToken = await IUniswapV2Pair.at(lpTokenAddress)

        await lpToken.approve(
            drFrankenstein.address,
            max,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )

        // DrFrankenstein setup
        await undead.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        await zombie.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
    })

    it('Should create a new tomb when calling #addPool', async () => {
        assert(lpToken.address !== burnAddress)

        await drFrankenstein.addPool(
            0,                              // allocPoint - set to 0 bc rewards are annoying when testing balances
            lpToken.address,                // lpToken (ZMBE/WBNB)
            259200,                         // minimumStakingTime
            true,                           // withUpdate
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )
        assert.equal((await drFrankenstein.poolLength()).toNumber(), 2, '1 Grave was not added')
    })

    it('Should fail to unlock tomb', async () => {
        try {
            await drFrankenstein.unlock(1, {
                from: accounts[0],
                gas: 3000000,
                value: 40000000000000000,
                nonce: await nonce()
            })
        } catch (e) {
            assert(e.message.includes('Tomb: tombs do not require unlocking.'))
            return
        }
        assert(false)
    })


    it('Should deposit lp tokens on #deposit', async () => {
        const initialWalletBalance = await lpToken.balanceOf(accounts[0])
        const amount = initialWalletBalance / 2
        const initialGraveBalance = new BigNumber((await lpToken.balanceOf(drFrankenstein.address)))
        const initialGraveUserBalance = new BigNumber((await drFrankenstein.userInfo(1, accounts[0])).amount)

        // ensure zombie vars dont change
        const initialWalletZombieBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const initialGraveZombieBalance = new BigNumber(await zombie.balanceOf(drFrankenstein.address))


        await drFrankenstein.deposit(1, amount.toString(), {from: accounts[0], gas: 3000000, nonce: await nonce()})

        const walletBalance = new BigNumber(await lpToken.balanceOf(accounts[0]))
        const graveBalance = new BigNumber(await lpToken.balanceOf(drFrankenstein.address))
        const graveUserBalance = new BigNumber((await drFrankenstein.userInfo(1, accounts[0])).amount)
        const user = await drFrankenstein.userInfo(1, accounts[0])
        const pool = await drFrankenstein.poolInfo(1)
        const tokenWithdrawalDate = user.tokenWithdrawalDate.toNumber()
        const expectedTokenWithdrawalDate = (Date.now() / 1000) + pool.minimumStakingTime.toNumber()
        const walletZombieBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const graveZombieBalance = new BigNumber(await zombie.balanceOf(drFrankenstein.address))

        assert.equal(walletBalance.toNumber(), (initialWalletBalance - amount).toString().replace(/^0+/, ''), 'Unexpected wallet lp balance')
        assert.equal(graveBalance.toNumber(), (initialGraveBalance + amount).toString().replace(/^0+/, ''), 'Unexpected grave lp balance')
        assert.equal(graveUserBalance.toNumber(), (initialGraveUserBalance + amount).toString().replace(/^0+/, ''), 'Unexpected grave user balance')
        assert(
            Math.abs(tokenWithdrawalDate - expectedTokenWithdrawalDate) < 4,
            `expected ${expectedTokenWithdrawalDate} but got ${tokenWithdrawalDate}`
        )
        assert.equal(initialWalletZombieBalance.toString(), walletZombieBalance.toString())
        assert.equal(initialGraveZombieBalance.toString(), graveZombieBalance.toString())
    })

    it('Should add zombie and reset tokenWithdrawalDate on increasing deposit', async () => {
        const initialWalletBalance = new BigNumber(await lpToken.balanceOf(accounts[0]))
        const paramsAmount = await lpToken.balanceOf(accounts[0])
        const amount = initialWalletBalance
        const initialGraveBalance = new BigNumber((await lpToken.balanceOf(drFrankenstein.address)))
        const initialGraveUserBalance = new BigNumber((await drFrankenstein.userInfo(1, accounts[0])).amount)

        // ensure zombie vars dont change
        const initialWalletZombieBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const initialGraveZombieBalance = new BigNumber(await zombie.balanceOf(drFrankenstein.address))

        await drFrankenstein.deposit(1, paramsAmount.toString(), {from: accounts[0], gas: 3000000, nonce: await nonce()})

        const walletBalance = new BigNumber(await lpToken.balanceOf(accounts[0]))
        const graveBalance = new BigNumber(await lpToken.balanceOf(drFrankenstein.address))
        const graveUserBalance = new BigNumber((await drFrankenstein.userInfo(1, accounts[0])).amount)
        const user = await drFrankenstein.userInfo(1, accounts[0])
        const pool = await drFrankenstein.poolInfo(1)
        const tokenWithdrawalDate = user.tokenWithdrawalDate.toNumber()
        const expectedTokenWithdrawalDate = (Date.now() / 1000) + pool.minimumStakingTime.toNumber()
        const walletZombieBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const graveZombieBalance = new BigNumber(await zombie.balanceOf(drFrankenstein.address))

        assert.equal(walletBalance.toNumber(), initialWalletBalance.minus(amount).toString(), 'Unexpected wallet lp balance')
        assert.equal(graveBalance.toNumber(), initialGraveBalance.plus(amount).toString(), 'Unexpected grave lp balance')
        assert.equal(graveUserBalance.toNumber(), initialGraveUserBalance.plus(amount).toString(), 'Unexpected grave user balance')
        assert(
            Math.abs(tokenWithdrawalDate - expectedTokenWithdrawalDate) < 4,
            `expected ${expectedTokenWithdrawalDate} but got ${tokenWithdrawalDate}`
        )
        assert.equal(initialWalletZombieBalance.toString(), walletZombieBalance.toString())
        assert.equal(initialGraveZombieBalance.toString(), graveZombieBalance.toString())
    })

    it('Should not affect withdrawal dates and only claim pending rewards when amount of 0 is deposited', async () => {
        const initialWalletBalance = new BigNumber(await lpToken.balanceOf(accounts[0]))
        const initialGraveBalance = new BigNumber((await lpToken.balanceOf(drFrankenstein.address)))
        const initialGraveUserBalance = new BigNumber((await drFrankenstein.userInfo(1, accounts[0])).amount)
        let user = await drFrankenstein.userInfo(1, accounts[0])
        const initialTokenWithdrawalDate = user.tokenWithdrawalDate.toNumber()

        // ensure zombie vars dont change
        const initialWalletZombieBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const initialGraveZombieBalance = new BigNumber(await zombie.balanceOf(drFrankenstein.address))

        await drFrankenstein.deposit(1, 0, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        const walletBalance = new BigNumber(await lpToken.balanceOf(accounts[0]))
        const graveBalance = new BigNumber(await lpToken.balanceOf(drFrankenstein.address))
        const graveUserBalance = new BigNumber((await drFrankenstein.userInfo(1, accounts[0])).amount)
        user = await drFrankenstein.userInfo(1, accounts[0])
        const tokenWithdrawalDate = user.tokenWithdrawalDate.toNumber()
        const walletZombieBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const graveZombieBalance = new BigNumber(await zombie.balanceOf(drFrankenstein.address))

        assert.equal(walletBalance.toString(), initialWalletBalance.toString(), 'Unexpected wallet lp balance')
        assert.equal(graveBalance.toString(), initialGraveBalance.toString(), 'Unexpected grave lp balance')
        assert.equal(graveUserBalance.toString(), initialGraveUserBalance.toString(), 'Unexpected grave user balance')
        assert.equal(tokenWithdrawalDate, initialTokenWithdrawalDate)
        assert.equal(initialWalletZombieBalance.toString(), walletZombieBalance.toString())
        assert.equal(initialGraveZombieBalance.toString(), graveZombieBalance.toString())
    })


    it('Should withdraw, unpair 5% fee, burn zmbe, treasure other token fee and reset token withdrawal date on #withdrawEarly for zmbe pair tomb', async () => {
        const amount = (await drFrankenstein.userInfo(1, accounts[0])).amount.div(new BN('20')) // 5%
        const earlyWithdrawalFee = amount.div(new BN('20'))
        const amountReturned = amount.sub(earlyWithdrawalFee)
        const initialWalletBalance = await lpToken.balanceOf(accounts[0])
        const initialGraveBalance = await lpToken.balanceOf(drFrankenstein.address)
        const initialGraveUserBalance = (await drFrankenstein.userInfo(1, accounts[0])).amount
        const initialBurnBalance = await zombie.balanceOf(burnAddress)
        const initialTreasuryBalance = await  wbnb.balanceOf(treasury)

        assert(amount.toString() !== "0")

        // ensure zombie vars dont change
        const initialWalletZombieBalance = await zombie.balanceOf(accounts[0])
        const initialGraveZombieBalance = await zombie.balanceOf(drFrankenstein.address)

        await drFrankenstein.withdrawEarly(1, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        const walletBalance = await lpToken.balanceOf(accounts[0])
        const graveBalance =await lpToken.balanceOf(drFrankenstein.address)
        const graveUserBalance = (await drFrankenstein.userInfo(1, accounts[0])).amount
        const user = await drFrankenstein.userInfo(1, accounts[0])
        const pool = await drFrankenstein.poolInfo(1)
        const tokenWithdrawalDate = user.tokenWithdrawalDate.toNumber()
        const expectedTokenWithdrawalDate = (Date.now() / 1000) + pool.minimumStakingTime.toNumber()
        const burnBalance = await zombie.balanceOf(burnAddress)
        const treasuryBalance = await wbnb.balanceOf(treasury)

        const walletZombieBalance = await zombie.balanceOf(accounts[0])
        const graveZombieBalance = await zombie.balanceOf(drFrankenstein.address)

        assert.equal(walletBalance.toString(), initialWalletBalance.add(amountReturned).toString(), 'Unexpected wallet lp balance')
        assert.equal(graveBalance.toString(), initialGraveBalance.sub(amount).toString(), 'Unexpected grave lp balance')
        assert.equal(graveUserBalance.toString(), initialGraveUserBalance.sub(amount).toString(), 'Unexpected grave user balance')
        assert.equal(initialWalletZombieBalance.toString(), walletZombieBalance.toString())
        assert.equal(initialGraveZombieBalance.toString(), graveZombieBalance.toString())

        assert(burnBalance > initialBurnBalance, 'burn address balance did not increase')
        assert(treasuryBalance > initialTreasuryBalance, 'Treasury balance did not increase')
        assert(
            Math.abs(tokenWithdrawalDate - expectedTokenWithdrawalDate) < 4,
            `expected ${expectedTokenWithdrawalDate} but got ${tokenWithdrawalDate}`
        )
    })

    it('Should withdraw, unpair 5% fee, burn zmbe, treasure other token fee, lock 8% liquidity(whale tax) and reset token withdrawal date on #withdrawEarly for amount > 5%', async () => {
        const amount = (await drFrankenstein.userInfo(1, accounts[0])).amount.div(new BN('10')) // 10% of my balance
        const earlyWithdrawalFee = amount.div(new BN('20'))
        const whaleTax = amount.mul(new BN('8')).div(new BN('100'))
        const amountReturned = (amount.sub(earlyWithdrawalFee)).sub(whaleTax)
        const initialWalletBalance = await lpToken.balanceOf(accounts[0])
        const initialGraveBalance = await lpToken.balanceOf(drFrankenstein.address)
        const initialGraveUserBalance = (await drFrankenstein.userInfo(1, accounts[0])).amount
        const initialBurnBalance = await zombie.balanceOf(burnAddress)
        const initialLockedLiquidityBalance = await  lpToken.balanceOf(lpStorage)
        const initialTreasuryBalance = await  wbnb.balanceOf(treasury)

        assert(amount.toString() !== "0")

        // ensure zombie vars dont change
        const initialWalletZombieBalance = await zombie.balanceOf(accounts[0])
        const initialGraveZombieBalance = await zombie.balanceOf(drFrankenstein.address)

        await drFrankenstein.withdrawEarly(1, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        const walletBalance = await lpToken.balanceOf(accounts[0])
        const graveBalance =await lpToken.balanceOf(drFrankenstein.address)
        const graveUserBalance = (await drFrankenstein.userInfo(1, accounts[0])).amount
        const user = await drFrankenstein.userInfo(1, accounts[0])
        const pool = await drFrankenstein.poolInfo(1)
        const tokenWithdrawalDate = user.tokenWithdrawalDate.toNumber()
        const expectedTokenWithdrawalDate = (Date.now() / 1000) + pool.minimumStakingTime.toNumber()
        const burnBalance = await zombie.balanceOf(burnAddress)
        const lockedLiquidityBalance = await lpToken.balanceOf(lpStorage)
        const treasuryBalance = await wbnb.balanceOf(treasury)

        const walletZombieBalance = await zombie.balanceOf(accounts[0])
        const graveZombieBalance = await zombie.balanceOf(drFrankenstein.address)

        assert.equal(walletBalance.toString(), initialWalletBalance.add(amountReturned).toString(), 'Unexpected wallet lp balance')
        assert.equal(graveBalance.toString(), initialGraveBalance.sub(amount).toString(), 'Unexpected grave lp balance')
        assert.equal(graveUserBalance.toString(), initialGraveUserBalance.sub(amount).toString(), 'Unexpected grave user balance')
        assert.equal(initialWalletZombieBalance.toString(), walletZombieBalance.toString())
        assert.equal(initialGraveZombieBalance.toString(), graveZombieBalance.toString())
        assert.equal(lockedLiquidityBalance.toString(), initialLockedLiquidityBalance.add(whaleTax).toString())
        assert(burnBalance > initialBurnBalance, 'burn address balance did not increase')
        assert(treasuryBalance > initialTreasuryBalance, 'Treasury balance did not increase')
        assert(
            Math.abs(tokenWithdrawalDate - expectedTokenWithdrawalDate) < 4,
            `expected ${expectedTokenWithdrawalDate} but got ${tokenWithdrawalDate}`
        )
    })

    it('Should fail withdrawing more than users balance on #withdrawEarly', async () => {
        const amount = (await drFrankenstein.userInfo(1, accounts[0])).amount
        assert(amount.toString() !== "0")
        try {
            await drFrankenstein.withdrawEarly(1, amount.add(new BN('1')), {from: accounts[0], gas: 3000000, nonce: await nonce()})
        } catch (e) {
            assert(e.message.includes('withdraw: not good'))
            await drFrankenstein.withdrawEarly(1, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})
            return
        }
        assert(false)
    })

    it('Should fail calling #withdraw before time is up', async () => {
        const time = 2592000 // 30 days ms
        const amount = (await lpToken.balanceOf(accounts[0]))
        const whaleTax = amount.mul(new BN('8')).div(new BN('100'))
        await drFrankenstein.deposit(1, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        //should pass
        await drFrankenstein.withdraw(1, 0, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        try {
            await drFrankenstein.withdraw(1, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        } catch (e) {
            assert(e.message.includes('Staking: Token is still locked, use #withdrawEarly / #leaveStakingEarly to withdraw funds before the end of your staking period.'))
        }
        try {
            await drFrankenstein.withdraw(1, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        } catch (e) {
            assert(e.message.includes('Staking: Token is still locked, use #withdrawEarly / #leaveStakingEarly to withdraw funds before the end of your staking period.'))
            advanceTime(time)
            await drFrankenstein.withdraw(1, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})
            const walletBalance = (await lpToken.balanceOf(accounts[0]))
            const nftBalance = (await traditionalGraveNft.balanceOf(accounts[0]))

            assert.equal(walletBalance.toString(), amount.sub(whaleTax).toString())
            assert.equal(nftBalance.toString(), "0")
            return
        }
        assert(false)
    })

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