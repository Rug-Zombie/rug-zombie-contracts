// Runs on bsc testnet local fork

const BigNumber = require("bignumber.js");

const DrFrankenstein = artifacts.require("DrFrankensteinTest")
const SafeOwner = artifacts.require("SafeOwner")
const ZombieToken = artifacts.require("ZombieToken")
const UndeadBar = artifacts.require("UndeadBar")
const ExampleRuggedToken = artifacts.require("RuggedToken")
const GraveStakingToken = artifacts.require("GraveStakingToken")
const PancakeRouter = artifacts.require("IPancakeRouter02")
const PancakeFactory = artifacts.require("IPancakeFactory")
const RevivedRugNft = artifacts.require("RevivedRugNft")
const PriceConsumerV3 = artifacts.require("PriceConsumerV3")
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair")
const WBNB = artifacts.require("WBNB")

const pancakeswapRouterAddress = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
const pancakeswapFactoryAddress = "0x6725F303b657a9451d8BA641348b6761A6CC7a17"
const wbnbAddress = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
const burnAddress = "0x000000000000000000000000000000000000dEaD"
const zeroAddress = "0x0000000000000000000000000000000000000000"
const treasury = "0x8df5b3ece7c11749588ed2d102dbc77619c46776"

let drFrankenstein
let safeOwner
let zombie
let undead
let ruggedToken
let lpToken
let graveNft
let priceConsumer
let pancakeRouter
let pancakeFactory
let graveStakingToken
let wbnb
let transactionCount = 0

const one = new BigNumber(10).pow(18)
const zero = new BigNumber(0)
const max = new BigNumber(2).pow(256).minus(1)

contract("SafeOwner", (accounts) => {
    before(async () => {
        drFrankenstein = await DrFrankenstein.deployed()
        safeOwner = await SafeOwner.deployed()
        zombie = await ZombieToken.deployed()
        undead = await UndeadBar.deployed()
        graveStakingToken = await GraveStakingToken.deployed()
        ruggedToken = await ExampleRuggedToken.deployed()
        graveNft = await RevivedRugNft.deployed()
        priceConsumer = await PriceConsumerV3.deployed()
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

    await graveNft.setTokenURI('123', {from: accounts[0], gas: 3000000, nonce: await nonce()})

        // DrFrankenstein setup
        await undead.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        await zombie.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        await graveNft.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
        await graveStakingToken.transferOwnership(drFrankenstein.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})

        await drFrankenstein.liftLaunchWhaleDetection({from: accounts[0], gas: 3000000, nonce: await nonce()})
        await drFrankenstein.transferOwnership(safeOwner.address, {from: accounts[0], gas: 3000000, nonce: await nonce()})
    })

    it('Should create a new grave when calling #addGrave', async () => {
        await safeOwner.addGrave(
            0,                              // allocPoint - set to 0 bc rewards are annoying when testing balances
            graveStakingToken.address,      // lpToken
            259200,                         // minimumStakingTime
            ruggedToken.address,            // ruggedToken
            graveNft.address,    // nft
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

    it('Should create a new tomb when calling #addPool', async () => {
        assert(lpToken.address !== burnAddress)

        await safeOwner.addPool(
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

    it('Should create a updateMultiplier on #updateMultiplier', async () => {
        assert.equal(await drFrankenstein.BONUS_MULTIPLIER(), 1, 'incorrect bonus multiplier')

        await safeOwner.updateMultiplier(
            5,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )

        assert.equal(await drFrankenstein.BONUS_MULTIPLIER(), 5, 'incorrect bonus multiplier')
    })

    it('Should create a set pool data on #set', async () => {
        assert.equal((await drFrankenstein.poolInfo(1)).allocPoint, 0, 'incorrect grave allocPoint')

        await safeOwner.set(
            1,
            150,
            true,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )

        assert.equal((await drFrankenstein.poolInfo(1)).allocPoint, 150, 'incorrect grave allocPoint')
    })

    it('Should update grave unlock fee on #setUnlockFee', async () => {
        assert.equal((await drFrankenstein.poolInfo(1)).unlockFee.toString(), one.times(10).toString(), 'incorrect grave unlockFee')
        await safeOwner.setUnlockFee(
            1,
            one.times(5),
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )

        assert.equal((await drFrankenstein.poolInfo(1)).unlockFee.toString(), one.times(5).toString(), 'incorrect grave unlockFee')
    })

    it('Should update grave minimumStake on #setGraveMinimumStake', async () => {
        assert.equal((await drFrankenstein.poolInfo(1)).minimumStake.toString(), one.times(100).toString(), 'incorrect grave unlockFee')
        await safeOwner.setGraveMinimumStake(
            1,
            one.times(50),
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )

        assert.equal((await drFrankenstein.poolInfo(1)).minimumStake.toString(), one.times(50).toString(), 'incorrect grave unlockFee')
    })

    it('Should update priceConsumer on #setPriceConsumer', async () => {
        assert.equal(await drFrankenstein.priceConsumer(), priceConsumer.address, 'incorrect priceConsumer')
        await safeOwner.setPriceConsumer(
            burnAddress,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )

        assert.equal(await drFrankenstein.priceConsumer(), burnAddress, 'incorrect priceConsumer')
    })

    it('Should update pancakeRouter on #setPancakeRouter', async () => {
        assert.equal(await drFrankenstein.pancakeswapRouter(), pancakeRouter.address, 'incorrect pancakeswapRouter')
        await safeOwner.setPancakeRouter(
            burnAddress,
            {from: accounts[0], gas: 3000000, nonce: await nonce()}
        )

        assert.equal(await drFrankenstein.pancakeswapRouter(), burnAddress, 'incorrect pancakeswapRouter')
    })

    async function nonce() {
        transactionCount += 1
        return await web3.eth.getTransactionCount(await accounts[0], 'pending') + (transactionCount - 1);
    }
})
