// Runs on bsc testnet local fork

const BigNumber = require("bignumber.js");
const Mausoleum = artifacts.require("Mausoleum")
const ZombieToken = artifacts.require("ZombieToken")
const PancakeRouter = artifacts.require("IUniswapV2Router02")
const PancakeFactory = artifacts.require("IPancakeFactory")
const RevivedRugNft = artifacts.require("RevivedRugNft")
const PriceConsumerV3 = artifacts.require("PriceConsumerV3")
const IBEP20 = artifacts.require("IBEP20")
const pancakeswapRouterAddress = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
const pancakeswapFactoryAddress = "0x6725F303b657a9451d8BA641348b6761A6CC7a17"
const wbnbAddress = "0xae13d989dac2f0debff460ac112a837c89baa7cd"
const burnAddress = "0x000000000000000000000000000000000000dEaD"
const treasury = "0x111a8fC09D65f29BBb026884c3034275DC9DA497"
let mausoleum
let zombie
let priceConsumer
let prizeNft
let pancakeRouter
let pancakeFactory
let bidToken
let wbnb
let transactionCount = 0

const one = new BigNumber(10).pow(18)
const zero = new BigNumber(0)
const max = new BigNumber(2).pow(256).minus(1)

contract("Mausoleum", (accounts) => {
    before(async () => {
        mausoleum = await Mausoleum.deployed()
        zombie = await ZombieToken.deployed()
        prizeNft = await RevivedRugNft.deployed()
        priceConsumer = await PriceConsumerV3.deployed()
        pancakeRouter = await PancakeRouter.at(pancakeswapRouterAddress)
        pancakeFactory = await PancakeFactory.at(pancakeswapFactoryAddress)
        wbnb = await IBEP20.at(wbnbAddress)

        const zombieAmount = one.times(100000000)

        await zombie.liftLaunchWhaleDetection()
        await zombie.mint(
            accounts[0],
            zombieAmount,
            {from: accounts[0], gas: 3000000}
        )

        await zombie.approve(
            pancakeRouter.address,
            max,
            {from: accounts[0], gas: 3000000}
        )

        await pancakeRouter.addLiquidityETH(
            zombie.address,
            one.times(100000),
            0,
            0,
            accounts[0],
            Date.now(),
            {from: accounts[0], gas: 3000000, value: one.div(10), nonce: await nonce()}
        )

        bidToken = await IBEP20.at(await pancakeFactory.getPair(wbnb.address, zombie.address))
        await bidToken.approve(mausoleum.address, max, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        await prizeNft.setTokenURI('123', {from: accounts[0], gas: 3000000, nonce: await nonce()})
        await prizeNft.transferOwnership(mausoleum.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
    })

    it('Should create a new auction when calling #addAuction', async () => {
        await mausoleum.addAuction(
            one,
            Math.floor(Date.now() / 1000) + 259200,
            bidToken.address,                         // bidtoken
            prizeNft.address,                 // prize
            one.times(5),              // unlockFee
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )
        assert.equal((await mausoleum.auctionLength()).toNumber(), 1, '1 Auction was not added')
        assert.equal((await mausoleum.bidsLength(0)).toNumber(), 1, '1 Auction bid was not added')
    })

    // NOTE: Changes made in one test, carry onto the next.
    it('Should fail to unlock Auction when insufficient BNB is sent', async () => {
        try {
            await mausoleum.unlock(0, {
                from: accounts[0],
                gas: 3000000,
                value: 10000000000000000,
                nonce: await nonce()
            })
        } catch (e) {
            assert(e.message.includes('Auction: cannot unlock, insufficient bnb sent.'))
            return
        }
        assert(false)
    })

    // better to test at once instead of redeploying
    it('Should unlock Auction. Buyback then burn and treasure the bought back ZMBE when sending enough BNB', async () => {
        const bnbAmount = new BigNumber(40000000000000000)
        const expectedToTreasuryAmount = bnbAmount.times(0.5)                 // 2.5%

        const initialBurnAmount = await zombie.balanceOf(burnAddress)
        const initialTreasuryAmount = await web3.eth.getBalance(treasury)
        let userInfo = await mausoleum.userInfo(0, accounts[0])

        expect(userInfo.paidUnlockFee).to.be.false

        await mausoleum.unlock(0, {from: accounts[0], gas: 3000000, value: bnbAmount, nonce: await nonce()})

        const burnAmount = await zombie.balanceOf(burnAddress)
        const treasuryAmount = await web3.eth.getBalance(treasury)
        userInfo = await mausoleum.userInfo(0, accounts[0])

        assert(burnAmount > initialBurnAmount, "No ZMBE was sent to burn address")
        assert.equal(treasuryAmount.toString(), expectedToTreasuryAmount.plus(initialTreasuryAmount).toString(), "Incorrect amount of BNB was sent to treasury")
        assert(userInfo.paidUnlockFee, "Unlock fee was not paid")
    })

    it('Should fail when Auction has already been unlocked', async () => {
        try {
            await mausoleum.unlock(0, {
                from: accounts[0],
                gas: 3000000,
                value: 40000000000000000,
                nonce: await nonce()
            })
        } catch (e) {
            assert(e.message.includes('Auction: unlock fee is already paid.'))
            return
        }
        assert(false)
    })

    it('Should not be able to bid <= than starting bid', async () => {
        try {
            await mausoleum.increaseBid(0, one, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        } catch (e) {
            assert(e.message.includes('Auction: Bid must be > last bid.'))
            return
        }
        assert(false)
    })

    it('Should bid specified amount and set highest bidder on increaseBid', async () => {
        const amount = one.times(2)
        const initialBalance = new BigNumber(await bidToken.balanceOf(accounts[0]))
        const initialMausoleumBalance = new BigNumber(await bidToken.balanceOf(mausoleum.address))

        await mausoleum.increaseBid(0, amount, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        const balance = await bidToken.balanceOf(accounts[0])
        const mausoleumBalance = await bidToken.balanceOf(mausoleum.address)

        assert.equal(balance.toString(), initialBalance.minus(amount).toString(), 'Incorrect wallet balance')
        assert.equal(mausoleumBalance.toString(), initialMausoleumBalance.plus(amount).toString(), 'Incorrect mausoleum balance')
    })

    async function nonce() {
        transactionCount += 1
        return await web3.eth.getTransactionCount(await accounts[0], 'pending') + (transactionCount - 1);
    }

    // const advanceTime = (time) => {
    //     return new Promise((resolve, reject) => {
    //         web3.currentProvider.sendAsync({
    //             jsonrpc: "2.0",
    //             method: "evm_increaseTime",
    //             params: [time],
    //             id: new Date().getTime()
    //         }, (err, result) => {
    //             if (err) { return reject(err); }
    //             return resolve(result);
    //         });
    //     });
    // }
})
