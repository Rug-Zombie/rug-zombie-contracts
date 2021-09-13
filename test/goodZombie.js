const BigNumber = require("bignumber.js");

const DrFrankenstein = artifacts.require("DrFrankenstein")
const SafeOwner = artifacts.require("SafeOwner")
const GoodZombie = artifacts.require("GoodZombie")
const ZombieToken = artifacts.require("ZombieToken")
const UndeadBar = artifacts.require("UndeadBar")
const GraveStakingToken = artifacts.require("GraveStakingToken")
const PancakeRouter = artifacts.require("IPancakeRouter02")
const PancakeFactory = artifacts.require("IPancakeFactory")
const RugZombieNft = artifacts.require("RugZombieNft")
const RevivedRugNft = artifacts.require("RevivedRugNft")
const ExampleRuggedToken = artifacts.require("RuggedToken")
const PriceConsumerV3 = artifacts.require("PriceConsumerV3")
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair")
const WBNB = artifacts.require("WBNB")

const pancakeswapRouterAddress = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
const pancakeswapFactoryAddress = "0x6725F303b657a9451d8BA641348b6761A6CC7a17"
const wbnbAddress = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
const burnAddress = "0x000000000000000000000000000000000000dEaD"
const zeroAddress = "0x0000000000000000000000000000000000000000"
const examplePriceConsumer = "0x0000000000000000000000000000000123456789"
const exampleRouter = "0x0000000000000000000000000000000987654321"
const treasury = "0x8df5b3ece7c11749588ed2d102dbc77619c46776"

let drFrankenstein
let zombie
let undead
let safeOwner
let goodZombie
let ruggedToken
let graveStakingToken
let graveNft
let unsupportedNft
let pancakeRouter
let pancakeFactory
let priceConsumer
let lpToken
let wbnb
let transactionCount = 0

const one = new BigNumber(10).pow(18)
const zero = new BigNumber(0)
const max = new BigNumber(2).pow(256).minus(1)

contract("GoodZombie", (accounts) => {
    before(async () => {
        drFrankenstein = await DrFrankenstein.deployed()
        safeOwner = await SafeOwner.deployed()
        goodZombie = await GoodZombie.deployed()
        zombie = await ZombieToken.deployed()
        undead = await UndeadBar.deployed()
        graveStakingToken = await GraveStakingToken.deployed()
        ruggedToken = await ExampleRuggedToken.deployed()
        graveNft = await RugZombieNft.deployed()
        unsupportedNft = await RevivedRugNft.deployed()
        priceConsumer = await PriceConsumerV3.deployed()
        pancakeRouter = await PancakeRouter.at(pancakeswapRouterAddress)
        pancakeFactory = await PancakeFactory.at(pancakeswapFactoryAddress)
        wbnb = await WBNB.at(wbnbAddress)

        const zombieAmount = one.times(10000)

        // Zombie Token setup
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

        const lpTokenAddress = await pancakeFactory.getPair(wbnb.address, zombie.address)
        lpToken = await IUniswapV2Pair.at(lpTokenAddress)

        // NFT setup
        await graveNft.setTokenURI('123', {from: accounts[0], gas: 3000000, nonce: await nonce()})
        await unsupportedNft.setTokenURI('123', {from: accounts[0], gas: 3000000, nonce: await nonce()})

        // DrFrankenstein setup
        await undead.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        await zombie.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        await graveNft.transferOwnership(drFrankenstein.address, {
            from: accounts[0],
            gas: 3000000,
            nonce: await nonce()
        })
        await unsupportedNft.transferOwnership(drFrankenstein.address, {
            from: accounts[0],
            gas: 3000000,
            nonce: await nonce()
        })
        await graveStakingToken.transferOwnership(drFrankenstein.address, {
            from: accounts[0],
            gas: 3000000,
            nonce: await nonce()
        })

        await drFrankenstein.liftLaunchWhaleDetection({from: accounts[0], gas: 3000000, nonce: await nonce()})
        await drFrankenstein.transferOwnership(safeOwner.address, {
            from: accounts[0],
            gas: 3000000,
            nonce: await nonce()
        })
        await safeOwner.transferOwnership(goodZombie.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
    })

    it('Should create a new grave when calling #addGrave', async () => {
        await goodZombie.addGrave(
            0,                              // allocPoint - set to 0 bc rewards are annoying when testing balances
            graveStakingToken.address,      // lpToken
            259200,                         // minimumStakingTime
            ruggedToken.address,            // ruggedToken
            graveNft.address,               // nft
            one.times(100),                 // minimumStake
            one.times(10),                  // unlockFee
            2592000,                        // nftRevivalTime
            true,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )
        const poolInfo = await drFrankenstein.poolInfo(1)
        assert.equal((await drFrankenstein.poolLength()).toNumber(), 2, '1 Grave was not added')
        assert.equal(poolInfo.allocPoint, 0, 'Incorrect allocpoint')
        assert.equal(poolInfo.lpToken, graveStakingToken.address, 'incorrect lpToken')
        assert.equal(poolInfo.ruggedToken, ruggedToken.address, 'incorrect ruggedToken')
        assert.equal(poolInfo.nft, graveNft.address, 'incorrect nft')
        assert.equal(poolInfo.minimumStake.toString(), one.times(100).toString(), 'incorrect minimumStake')
        assert.equal(poolInfo.unlockFee.toString(), one.times(10).toString(), 'incorrect unlockFee')
        assert.equal(poolInfo.nftRevivalTime, 2592000, 'incorrect nftRevivalTime')
        assert.equal(poolInfo.minimumStakingTime, 259200, 'incorrect minimumStakingTime')
        assert.equal(poolInfo.isGrave, true, 'incorrect isGrave')
    })

    it("Should update a grave's NFT on #setGraveNft", async () => {
        assert.equal((await drFrankenstein.poolInfo(0)).nft, zeroAddress, 'Grave has incorrect nft')
        await goodZombie.setGraveNft(0, graveNft.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        assert.equal((await drFrankenstein.poolInfo(0)).nft, graveNft.address, 'Grave has incorrect nft')
    })

    it("Should fail to update a grave's NFT with invalid nft contract on #setGraveNft", async () => {
        assert.equal((await drFrankenstein.poolInfo(0)).nft, graveNft.address, 'Grave has incorrect nft')
        try {
            await goodZombie.setGraveNft(0, unsupportedNft.address, {
                from: accounts[0],
                gas: 3000000,
                nonce: await nonce()
            })
        } catch (e) {
            assert.equal((await drFrankenstein.poolInfo(0)).nft, graveNft.address, 'Grave has incorrect nft')
            return
        }
        assert(false)
    })

    it('Should create a new tomb when calling #addPool', async () => {
        assert(lpToken.address !== zeroAddress)

        await goodZombie.addPool(
            0,                              // allocPoint - set to 0 bc rewards are annoying when testing balances
            lpToken.address,                // lpToken (ZMBE/WBNB)
            259200,                         // minimumStakingTime
            true,                           // withUpdate
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )
        const poolInfo = await drFrankenstein.poolInfo(2)

        assert.equal((await drFrankenstein.poolLength()).toNumber(), 3, '1 Tomb was not added')
        assert.equal(poolInfo.allocPoint, 0, 'Incorrect allocpoint')
        assert.equal(poolInfo.lpToken, lpToken.address, 'incorrect lpToken')
        assert.equal(poolInfo.ruggedToken, zeroAddress, 'incorrect ruggedToken')
        assert.equal(poolInfo.nft, zeroAddress, 'incorrect nft')
        assert.equal(poolInfo.minimumStake.toString(), '0', 'incorrect minimumStake')
        assert.equal(poolInfo.unlockFee.toString(), '0', 'incorrect unlockFee')
        assert.equal(poolInfo.nftRevivalTime, 0, 'incorrect nftRevivalTime')
        assert.equal(poolInfo.minimumStakingTime, 259200, 'incorrect minimumStakingTime')
        assert.equal(poolInfo.isGrave, false, 'incorrect isGrave')
    })

    it('Should fail to create a new tomb when lpToken is reused calling #addPool', async () => {
        assert(lpToken.address !== zeroAddress)
        try {
            await goodZombie.addPool(
                0,                              // allocPoint - set to 0 bc rewards are annoying when testing balances
                lpToken.address,                // lpToken (ZMBE/WBNB)
                259200,                         // minimumStakingTime
                true,                           // withUpdate
                {from: accounts[0], gas: 3000000, nonce: await nonce()}
            )
        } catch (e) {
            assert(e.message.includes('addPool: lpToken is used in an existing pool.'))
            return
        }
        assert(false)
    })

    it('Should change the multiplier on #updateMultiplier', async () => {
        assert.equal(await drFrankenstein.BONUS_MULTIPLIER(), 1, 'incorrect bonus multiplier')

        await goodZombie.updateMultiplier(
            5,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )

        assert.equal(await drFrankenstein.BONUS_MULTIPLIER(), 5, 'incorrect bonus multiplier')
    })

    it('Should fail to update invalid multiplier on #updateMultiplier', async () => {
        assert.equal(await drFrankenstein.BONUS_MULTIPLIER(), 5, 'incorrect bonus multiplier')

        try {
            await goodZombie.updateMultiplier(
                6,
                {from: accounts[0], gas: 3000000, nonce: await nonce()}
            )
        } catch (e) {
            assert(e.message.includes('updateMultiplier: multiplier cannot be set greater than maxMultiplier'))
            assert.equal(await drFrankenstein.BONUS_MULTIPLIER(), 5, 'incorrect bonus multiplier')
            return
        }
        assert(false)
    })

    it('Should set pool allocPoint on #set', async () => {
        assert.equal((await drFrankenstein.poolInfo(1)).allocPoint, 0, 'incorrect grave allocPoint')

        await goodZombie.set(
            1,
            150,
            true,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )

        assert.equal((await drFrankenstein.poolInfo(1)).allocPoint, 150, 'incorrect grave allocPoint')
    })

    it('Should update grave unlock fee on #setUnlockFee', async () => {
        assert.equal((await drFrankenstein.poolInfo(1)).unlockFee.toString(), one.times(10).toString(), 'incorrect grave unlockFee')
        await goodZombie.setUnlockFee(
            1,
            one.times(5),
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )

        assert.equal((await drFrankenstein.poolInfo(1)).unlockFee.toString(), one.times(5).toString(), 'incorrect grave unlockFee')
    })

    it('Should fail to update grave unlock fee on below minimum on #setUnlockFee', async () => {
        assert.equal((await drFrankenstein.poolInfo(1)).unlockFee.toString(), one.times(5).toString(), 'incorrect grave unlockFee')

        try {
            await goodZombie.setUnlockFee(
                1,
                9999,
                {from: accounts[0], gas: 3000000, nonce: await nonce()}
            )
        } catch (e) {
            assert(e.message.includes('setUnlockFee: new unlockFee must be >= minUnlockFee'))
            assert.equal((await drFrankenstein.poolInfo(1)).unlockFee.toString(), one.times(5).toString(), 'incorrect grave unlockFee')
            return
        }
        assert(false)
    })

    it('Should update grave minimumStake on #setGraveMinimumStake', async () => {
        assert.equal((await drFrankenstein.poolInfo(1)).minimumStake.toString(), one.times(100).toString(), 'incorrect grave unlockFee')
        await goodZombie.setGraveMinimumStake(
            1,
            one.times(50),
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )

        assert.equal((await drFrankenstein.poolInfo(1)).minimumStake.toString(), one.times(50).toString(), 'incorrect grave unlockFee')
    })

    it('Should fail to update non-whitelisted priceConsumer on #setPriceConsumer', async () => {
        assert.equal(await drFrankenstein.priceConsumer(), priceConsumer.address, 'incorrect priceConsumer')
        try {
            await goodZombie.setPriceConsumer(
                examplePriceConsumer,
                {from: accounts[0], gas: 3000000, nonce: await nonce()}
            )
        } catch (e) {
            assert(e.message.includes('setPriceConsumer: new priceConsumer must be whitelisted'))
            assert.equal(await drFrankenstein.priceConsumer(), priceConsumer.address, 'incorrect priceConsumer')
            return
        }
        assert(false)
    })

    it('Should whitelist a new priceConsumer on #whitelistPriceConsumer', async () => {
        expect(await goodZombie.priceConsumerWhitelist(examplePriceConsumer)).to.be.false

        await goodZombie.whitelistPriceConsumer(
            examplePriceConsumer,
            true,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )
        assert(await goodZombie.priceConsumerWhitelist(examplePriceConsumer))
    })

    it('Should update whitelisted priceConsumer on #setPriceConsumer', async () => {
        assert.equal(await drFrankenstein.priceConsumer(), priceConsumer.address, 'incorrect priceConsumer')
        await goodZombie.setPriceConsumer(
            examplePriceConsumer,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )
        assert.equal(await drFrankenstein.priceConsumer(), examplePriceConsumer, 'incorrect priceConsumer')
    })

    it('Should fail to update non-whitelisted pancakeRouter on #setPancakeRouter', async () => {
        assert.equal(await drFrankenstein.pancakeswapRouter(), pancakeRouter.address, 'incorrect pancakeswapRouter')
        try {
            await goodZombie.setPancakeRouter(
                exampleRouter,
                {from: accounts[0], gas: 3000000, nonce: await nonce()}
            )
        } catch (e) {
            assert(e.message.includes('setPancakeRouter: new router must be whitelisted'))
            assert.equal(await drFrankenstein.pancakeswapRouter(), pancakeRouter.address, 'incorrect pancakeswapRouter')
            return
        }
        assert(false)
    })

    it('Should whitelist a new router on #whitelistRouter', async () => {
        expect(await goodZombie.routerWhitelist(exampleRouter)).to.be.false

        await goodZombie.whitelistRouter(
            exampleRouter,
            true,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )
        assert(await goodZombie.routerWhitelist(exampleRouter))
    })

    it('Should update whitelisted router on #setPancakeRouter', async () => {
        assert.equal(await drFrankenstein.pancakeswapRouter(), pancakeRouter.address, 'incorrect priceConsumer')
        await goodZombie.setPancakeRouter(
            exampleRouter,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )
        assert.equal(await drFrankenstein.pancakeswapRouter(), exampleRouter, 'incorrect priceConsumer')
    })

    async function nonce() {
        transactionCount += 1
        return await web3.eth.getTransactionCount(await accounts[0], 'pending') + (transactionCount - 1);
    }
})