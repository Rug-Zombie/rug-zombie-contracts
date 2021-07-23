const BigNumber = require("bignumber.js");

const DrFrankensteinZombieGrave = artifacts.require("DrFrankensteinTest")
const ZombieToken = artifacts.require("ZombieToken")
const UndeadBar = artifacts.require("UndeadBar")
const GraveStakingToken = artifacts.require("GraveStakingToken")
const PancakeRouter = artifacts.require("IPancakeRouter02")
const RevivedRugNft = artifacts.require("RevivedRugNft")
const ExampleRuggedToken = artifacts.require("RuggedToken")
const pancakeswapRouterAddress = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
const burnAddress = "0x000000000000000000000000000000000000dEaD"
const treasury = "0x8df5b3ece7c11749588ed2d102dbc77619c46776"
let drFrankenstein
let zombie
let undead
let ruggedToken
let graveStakingToken
let traditionalGraveNft
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
        ruggedToken = await ExampleRuggedToken.deployed()
        graveStakingToken = await GraveStakingToken.deployed()
        traditionalGraveNft = await RevivedRugNft.deployed()
        pancakeRouter = await PancakeRouter.at(pancakeswapRouterAddress)
        const zombieAmount = one.times(10000)

        await zombie.mint(
            accounts[0],
            zombieAmount.times(2),
            {from: accounts[0], gas: 3000000}
        )

        await ruggedToken.mint(
            accounts[0],
            zombieAmount,
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

        await ruggedToken.approve(
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

        traditionalGraveNft.setTokenURI('123', {from: accounts[0], gas: 3000000, nonce: await nonce()})

        // DrFrankenstein setup
        await undead.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        await zombie.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        await traditionalGraveNft.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        await graveStakingToken.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        await drFrankenstein.liftLaunchWhaleDetection({from: accounts[0], gas: 3000000, nonce: await nonce()})
    })

    it('Should create a new grave when calling #addGrave', async () => {
        await drFrankenstein.addGrave(
            0,                              // allocPoint - set to 0 bc rewards are annoying when testing balances
            graveStakingToken.address,      // lpToken
            259200,                         // minimumStakingTime
            ruggedToken.address,            // ruggedToken
            traditionalGraveNft.address,    // nft
            one.times(100),              // minimumStake
            one.times(10),               // unlockFee
            2592000,                        // nftRevivalTime
            true,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )
        assert.equal((await drFrankenstein.poolLength()).toNumber(), 2, '1 Grave was not added')
    })

    it('Should fail to unlock Traditional Grave when ruggedToken was not sent', async () => {
        try {
            await drFrankenstein.unlock(1, {
                from: accounts[0],
                gas: 3000000,
                value: 40000000000000000,
                nonce: await nonce()
            })
        } catch (e) {
            assert(e.message.includes('Grave: User has not deposited the required Rugged Token'))
            return
        }
        assert(false)
    })

    it('Should send rugged token on #depositRug', async () => {
        const amount = one.times(50)
        const initialWalletBalance = new BigNumber(await ruggedToken.balanceOf(accounts[0]))
        const initialTreasuryBalance = new BigNumber(await ruggedToken.balanceOf(treasury))

        await drFrankenstein.depositRug(1, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        const walletBalance = new BigNumber(await ruggedToken.balanceOf(accounts[0]))
        const treasuryBalance = new BigNumber(await ruggedToken.balanceOf(treasury))
        assert(treasuryBalance.toString() !== "0", 'treasury balance should be > 0.')

        assert.equal(walletBalance.toString(10), initialWalletBalance.minus(amount).toString(10), 'Unexpected rugged token balance in wallet.')
        assert.equal(treasuryBalance.toString(10), initialTreasuryBalance.plus(amount).toString(10), 'Unexpected rugged token balance in grave.')
    })

    it('Should fail to unlock Traditional Grave when insufficient BNB is sent', async () => {
        try {
            await drFrankenstein.unlock(1, {
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

    it('Should fail to deposit when grave is locked', async () => {
        try {
            await drFrankenstein.deposit(1, one.times(100), {from: accounts[0], gas: 3000000, nonce: await nonce()})
        } catch (e) {
            assert(e.message.includes('Locked: User has not unlocked pool / grave.'))
            return
        }
        assert(false)
    })


    it('Should unlock Traditional Grave. Buyback then burn and treasure the bought back ZMBE when sending enough BNB', async () => {
        const bnbAmount = new BigNumber(50000000000000000)
        const expectedToTreasuryAmount = bnbAmount.times(0.5)                 // 2.5%
        const initialBurnAmount = await zombie.balanceOf(burnAddress)
        const initialTreasuryAmount = await web3.eth.getBalance(treasury)
        let userInfo = await drFrankenstein.userInfo(1, accounts[0])

        expect(userInfo.paidUnlockFee).to.be.false

        await drFrankenstein.unlock(1, {from: accounts[0], gas: 3000000, value: bnbAmount, nonce: await nonce()})

        const burnAmount = await zombie.balanceOf(burnAddress)
        const treasuryAmount = await web3.eth.getBalance(treasury)
        const user = await drFrankenstein.userInfo(1, accounts[0])

        assert(burnAmount > initialBurnAmount, "No ZMBE was sent to burn address")
        assert.equal(treasuryAmount.toString(), expectedToTreasuryAmount.plus(initialTreasuryAmount).toString(), "Incorrect amount of BNB was sent to treasury")
        assert(user.paidUnlockFee, "Unlock fee was not paid")
    })

    it('Should fail when Traditional Grave has already been unlocked', async () => {
        try {
            await drFrankenstein.unlock(1, {
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

    it('Should fail to deposit less than minimum amount', async () => {
        try {
            await drFrankenstein.deposit(1, one.times(50), {from: accounts[0], gas: 3000000, nonce: await nonce()})
        } catch (e) {
            assert(e.message.includes('Grave: amount staked must be >= grave minimum stake.'))
            return
        }
        assert(false)
    })

    it('Should deposit zombie and mint lptokens on #deposit', async () => {
        const amount = one.times(100)
        const initialWalletBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const initialGraveBalance = new BigNumber(await zombie.balanceOf(drFrankenstein.address))
        const initialLpTokenBalance = new BigNumber(await graveStakingToken.balanceOf(drFrankenstein.address))
        const initialGraveUserBalance = new BigNumber((await drFrankenstein.userInfo(1, accounts[0])).amount)

        await drFrankenstein.deposit(1, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        const walletBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const graveBalance = new BigNumber(await zombie.balanceOf(drFrankenstein.address))
        const lpTokenBalance = new BigNumber(await graveStakingToken.balanceOf(drFrankenstein.address))
        const graveUserBalance = new BigNumber((await drFrankenstein.userInfo(1, accounts[0])).amount)
        const user = await drFrankenstein.userInfo(1, accounts[0])
        const pool = await drFrankenstein.poolInfo(1)
        const tokenWithdrawalDate = user.tokenWithdrawalDate.toNumber()
        const nftRevivalDate = user.nftRevivalDate.toNumber()
        const expectedTokenWithdrawalDate = (Date.now() / 1000) + pool.minimumStakingTime.toNumber()
        const expectedNftRevivalDate = (Date.now() / 1000) + pool.nftRevivalTime.toNumber()

        assert.equal(walletBalance.toString(10), initialWalletBalance.minus(amount).toString(10), 'Unexpected wallet zombie balance')
        assert.equal(graveBalance.toString(10), initialGraveBalance.plus(amount).toString(10), 'Unexpected grave zombie balance')
        assert.equal(lpTokenBalance.toString(10), initialLpTokenBalance.plus(amount).toString(10), 'Unexpected grave lp balance')
        assert.equal(graveUserBalance.toString(10), initialGraveUserBalance.plus(amount).toString(10), 'Unexpected grave user balance')
        assert(
            Math.abs(tokenWithdrawalDate - expectedTokenWithdrawalDate) < 6,
            `expected ${expectedTokenWithdrawalDate} but got ${tokenWithdrawalDate}`
        )
        assert(
            Math.abs(nftRevivalDate - expectedNftRevivalDate) < 6,
            `expected ${expectedNftRevivalDate} but got ${nftRevivalDate}`
        )
    })

    it('Should add zombie and only reset tokenWithdrawalDate on increasing deposit', async () => {
        const amount = one.times(100)
        const initialWalletBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const initialGraveBalance = new BigNumber(await zombie.balanceOf(drFrankenstein.address))
        const initialLpTokenBalance = new BigNumber(await graveStakingToken.balanceOf(drFrankenstein.address))
        const initialGraveUserBalance = new BigNumber((await drFrankenstein.userInfo(1, accounts[0])).amount)
        const initialNftRevivalDate = (await drFrankenstein.userInfo(1, accounts[0])).nftRevivalDate.toNumber()

        await drFrankenstein.deposit(1, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        const walletBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const graveBalance = new BigNumber(await zombie.balanceOf(drFrankenstein.address))
        const lpTokenBalance = new BigNumber(await graveStakingToken.balanceOf(drFrankenstein.address))
        const graveUserBalance = new BigNumber((await drFrankenstein.userInfo(1, accounts[0])).amount)
        const user = await drFrankenstein.userInfo(1, accounts[0])
        const pool = await drFrankenstein.poolInfo(1)
        const tokenWithdrawalDate = user.tokenWithdrawalDate.toNumber()
        const nftRevivalDate = user.nftRevivalDate.toNumber()
        const expectedTokenWithdrawalDate = (Date.now() / 1000) + pool.minimumStakingTime.toNumber()

        assert.equal(walletBalance.toString(10), initialWalletBalance.minus(amount).toString(10), 'Unexpected wallet zombie balance')
        assert.equal(graveBalance.toString(10), initialGraveBalance.plus(amount).toString(10), 'Unexpected grave zombie balance')
        assert.equal(lpTokenBalance.toString(10), initialLpTokenBalance.plus(amount).toString(10), 'Unexpected grave lp balance')
        assert.equal(graveUserBalance.toString(10), initialGraveUserBalance.plus(amount).toString(10), 'Unexpected grave user balance')
        assert(
            Math.abs(tokenWithdrawalDate - expectedTokenWithdrawalDate) < 5,
            `expected ${expectedTokenWithdrawalDate} but got ${tokenWithdrawalDate}`
        )
        assert.equal(initialNftRevivalDate, nftRevivalDate, 'Unexpected change in nft revival date')
    })

    it('Should not affect withdrawal dates and only claim pending rewards when amount of 0 is deposited', async () => {
        const initialWalletBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const initialGraveBalance = new BigNumber(await zombie.balanceOf(drFrankenstein.address))
        const initialLpTokenBalance = new BigNumber(await graveStakingToken.balanceOf(drFrankenstein.address))
        const initialGraveUserBalance = new BigNumber((await drFrankenstein.userInfo(1, accounts[0])).amount)
        const initialTokenWithdrawalDate = (await drFrankenstein.userInfo(1, accounts[0])).tokenWithdrawalDate.toNumber()
        const initialNftRevivalDate = (await drFrankenstein.userInfo(1, accounts[0])).nftRevivalDate.toNumber()

        await drFrankenstein.deposit(1, 0, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        const walletBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const graveBalance = new BigNumber(await zombie.balanceOf(drFrankenstein.address))
        const lpTokenBalance = new BigNumber(await graveStakingToken.balanceOf(drFrankenstein.address))
        const graveUserBalance = new BigNumber((await drFrankenstein.userInfo(1, accounts[0])).amount)
        const user = await drFrankenstein.userInfo(1, accounts[0])
        const pool = await drFrankenstein.poolInfo(1)
        const tokenWithdrawalDate = user.tokenWithdrawalDate.toNumber()
        const nftRevivalDate = user.nftRevivalDate.toNumber()

        assert.equal(walletBalance.toString(10), initialWalletBalance.toString(10), 'Unexpected wallet zombie balance')
        assert.equal(graveBalance.toString(10), initialGraveBalance.toString(10), 'Unexpected grave zombie balance')
        assert.equal(lpTokenBalance.toString(10), initialLpTokenBalance.toString(10), 'Unexpected grave lp balance')
        assert.equal(graveUserBalance.toString(10), initialGraveUserBalance.toString(10), 'Unexpected grave user balance')
        assert.equal(initialTokenWithdrawalDate, tokenWithdrawalDate, 'Unexpected change in token withdrawal date')
        assert.equal(initialNftRevivalDate, nftRevivalDate, 'Unexpected change in nft revival date')
    })

    it('Should fail if balance after is less than minimum amount on #withdrawEarly', async () => {
        try {
            await drFrankenstein.withdrawEarly(1, one.times(150), {
                from: accounts[0],
                gas: 3000000,
                nonce: await nonce()
            })
        } catch (e) {
            assert(e.message.includes('Grave: when withdrawing from graves the remaining balance must be 0 or >= grave minimum stake.'))
            return
        }
        assert(false)
    })

    it('Should withdraw, burn and treasure 5% fee and reset token withdrawal date on #withdrawEarly', async () => {
        const amount = one.times(100)
        const projectFunds = amount.times(0.05)
        const expectedBurnAmount = projectFunds.times(0.5)                      // 2.5%
        const expectedToTreasuryAmount = projectFunds.minus(expectedBurnAmount)    // 2.5%
        const expectedWalletAmount = amount.minus(projectFunds)
        const initialBurnBalance = new BigNumber(await zombie.balanceOf(burnAddress))
        const initialTreasuryBalance = new BigNumber(await zombie.balanceOf(treasury))
        const initialWalletBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const initialLpTokenBalance = new BigNumber(await graveStakingToken.balanceOf(drFrankenstein.address))

        let user = await drFrankenstein.userInfo(1, accounts[0])
        const initialNftRevivalDate = user.nftRevivalDate.toNumber()

        await drFrankenstein.withdrawEarly(1, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        const burnBalance = new BigNumber(await zombie.balanceOf(burnAddress))
        const treasuryBalance = new BigNumber(await zombie.balanceOf(treasury))
        const walletBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        user = await drFrankenstein.userInfo(1, accounts[0])
        const pool = await drFrankenstein.poolInfo(1)
        const expectedTokenWithdrawalDate = (Date.now() / 1000) + pool.minimumStakingTime.toNumber()
        const tokenWithdrawalDate = user.tokenWithdrawalDate.toNumber()
        const nftRevivalDate = user.nftRevivalDate.toNumber()
        const lpTokenBalance = new BigNumber(await graveStakingToken.balanceOf(drFrankenstein.address))

        assert.equal(burnBalance.minus(initialBurnBalance).toString(10), expectedBurnAmount.toString(10), "Unexpected amount of ZMBE was sent to burn address")
        assert.equal(treasuryBalance.toString(10), expectedToTreasuryAmount.plus(initialTreasuryBalance).toString(), "Incorrect amount of ZMBE was sent to treasury")
        assert.equal(walletBalance.toString(10), expectedWalletAmount.plus(initialWalletBalance).toString(10), "Incorrect amount of ZMBE sent to wallet") // We add 10 to mitigate claimed rewards over one block
        assert.equal(lpTokenBalance.toString(10), initialLpTokenBalance.minus(amount).toString(10), "Incorrect amount of ZMBE sent to wallet") // We add 10 to mitigate claimed rewards over one block
        assert(
            Math.abs(tokenWithdrawalDate - expectedTokenWithdrawalDate) < 4,
            `expected ${expectedTokenWithdrawalDate} but got ${tokenWithdrawalDate}`,
        )
        assert.equal(nftRevivalDate, initialNftRevivalDate, 'User grave nftRevivalTime had unexpected change')
    })

    it('Should withdraw successfully when withdrawing total user balance on #withdrawEarly', async () => {
        const amount = one.times(100)
        const projectFunds = amount.times(0.05)
        const expectedBurnAmount = projectFunds.times(0.5)                      // 2.5%
        const expectedToTreasuryAmount = projectFunds.minus(expectedBurnAmount)    // 2.5%
        const expectedWalletAmount = amount.minus(projectFunds)
        const initialBurnBalance = new BigNumber(await zombie.balanceOf(burnAddress))
        const initialTreasuryBalance = new BigNumber(await zombie.balanceOf(treasury))
        const initialWalletBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const initialLpTokenBalance = new BigNumber(await graveStakingToken.balanceOf(drFrankenstein.address))

        let user = await drFrankenstein.userInfo(1, accounts[0])
        const initialNftRevivalDate = user.nftRevivalDate.toNumber()

        await drFrankenstein.withdrawEarly(1, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        const burnBalance = new BigNumber(await zombie.balanceOf(burnAddress))
        const treasuryBalance = new BigNumber(await zombie.balanceOf(treasury))
        const walletBalance = new BigNumber(await zombie.balanceOf(accounts[0]))
        const pool = await drFrankenstein.poolInfo(1)
        const expectedTokenWithdrawalDate = (Date.now() / 1000) + pool.minimumStakingTime.toNumber()
        const tokenWithdrawalDate = user.tokenWithdrawalDate.toNumber()
        const lpTokenBalance = new BigNumber(await graveStakingToken.balanceOf(drFrankenstein.address))
        user = await drFrankenstein.userInfo(1, accounts[0])
        const nftRevivalDate = user.nftRevivalDate.toNumber()
        const graveUserAmount = new BigNumber(user.amount)

        assert.equal(burnBalance.minus(initialBurnBalance).toString(10), expectedBurnAmount.toString(10), "Unexpected amount of ZMBE was sent to burn address")
        assert.equal(treasuryBalance.toString(10), expectedToTreasuryAmount.plus(initialTreasuryBalance).toString(), "Incorrect amount of ZMBE was sent to treasury")
        assert.equal(walletBalance.toString(10), expectedWalletAmount.plus(initialWalletBalance).toString(10), "Incorrect amount of ZMBE sent to wallet") // We add 10 to mitigate claimed rewards over one block
        assert.equal(lpTokenBalance.toString(10), initialLpTokenBalance.minus(amount).toString(10), "Incorrect amount of ZMBE sent to wallet") // We add 10 to mitigate claimed rewards over one block
        assert.equal(graveUserAmount.toString(10), "0", "Incorrect amount of ZMBE sent to wallet") // We add 10 to mitigate claimed rewards over one block
        assert(
            Math.abs(tokenWithdrawalDate - expectedTokenWithdrawalDate) < 4,
            `expected ${expectedTokenWithdrawalDate} but got ${tokenWithdrawalDate}`,
        )
        assert.equal(nftRevivalDate, initialNftRevivalDate, 'User grave nftRevivalTime had unexpected change')
    })

    it('Should fail calling #withdraw before time is up and mint nft when nft time is up', async () => {
        const amount = one.times(200)
        await drFrankenstein.deposit(1, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        //should pass
        await drFrankenstein.withdraw(1, 0, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        try {
            await drFrankenstein.withdraw(1, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        } catch (e) {
            assert(e.message.includes('Staking: Token is still locked, use #withdrawEarly / #leaveStakingEarly to withdraw funds before the end of your staking period.'))
        }
        try {
            await drFrankenstein.withdraw(1, one.times(50), {from: accounts[0], gas: 3000000, nonce: await nonce()})
        } catch (e) {
            assert(e.message.includes('Staking: Token is still locked, use #withdrawEarly / #leaveStakingEarly to withdraw funds before the end of your staking period.'))

            let initialNftBalance = (await traditionalGraveNft.balanceOf(accounts[0])).toNumber()
            await drFrankenstein.withdrawEarly(1, one.times(20), {from: accounts[0], gas: 3000000, nonce: await nonce()})
            let nftBalance = (await traditionalGraveNft.balanceOf(accounts[0])).toNumber()
            assert.equal(nftBalance, initialNftBalance, 'User recieved after no time passed.')

            const time = 2592000 // 30 days in secon
            await advanceTime(time)
            initialNftBalance = (await traditionalGraveNft.balanceOf(accounts[0])).toNumber()
            await drFrankenstein.withdraw(1, one.times(20), {from: accounts[0], gas: 3000000, nonce: await nonce()})

            nftBalance = (await traditionalGraveNft.balanceOf(accounts[0])).toNumber()
            assert.equal(nftBalance, initialNftBalance + 1, 'User did not recieve nft after claiming rewards.')

            await advanceTime(time / 2)
            nftBalance = (await traditionalGraveNft.balanceOf(accounts[0])).toNumber()
            await drFrankenstein.withdraw(1, one.times(10), {from: accounts[0], gas: 3000000, nonce: await nonce()})
            assert.equal(nftBalance, initialNftBalance + 1, 'User recieved nft before time was up.')

            return
        }
        assert(false)
    })

    async function nonce() {
        transactionCount += 1
        return await web3.eth.getTransactionCount(await accounts[0], 'pending') + (transactionCount - 1);
    }

    const advanceTime = function(duration) {
        const id = Date.now()

        return new Promise((resolve, reject) => {
            web3.currentProvider.sendAsync({
                jsonrpc: '2.0',
                method: 'evm_increaseTime',
                params: [duration],
                id: id,
            }, err1 => {
                if (err1) return reject(err1)

                web3.currentProvider.sendAsync({
                    jsonrpc: '2.0',
                    method: 'evm_mine',
                    id: id+1,
                }, (err2, res) => {
                    return err2 ? reject(err2) : resolve(res)
                })
            })
        })
    }
})