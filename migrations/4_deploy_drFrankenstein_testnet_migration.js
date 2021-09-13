var ZombieToken = artifacts.require("ZombieToken");
var UndeadBar = artifacts.require("UndeadBar");
var GraveStakingToken = artifacts.require("GraveStakingToken");
var Percentages = artifacts.require("Percentages");
var DrFrankenstein = artifacts.require("DrFrankenstein");
var Router = artifacts.require("IUniswapV2Router02")
var RevivedRugNft = artifacts.require("RevivedRugNft");
var NftAirdropper = artifacts.require("NftAirdropper");
var ZombieAuthenticator = artifacts.require("ZombieAuthenticator");
var GraveNftToken = artifacts.require("GraveNftToken");
var NftOwnership = artifacts.require("NftOwnership");
var ZombieOnChainPriceFeed = artifacts.require("ZombieOnChainPrice");
const devAddr = "0x0662cfC47e366e60121c1F1D8DFcA0eF0F2F64a5"
const pancakeRouter = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
const treasury = "0x111a8fC09D65f29BBb026884c3034275DC9DA497"
const lpStorage = "0x24F6F6277EaA3835e90bADD5f27c89583C553D90"
const wallet = "0xB8C1FFF8b915232067c1e7449870e397E43B143b"
module.exports = async function (deployer) {
    // await deployer.deploy(ZombieToken);
    // const zombie = await ZombieToken.deployed()
    // await zombie.mint("10000000000000000000000000")
    // await zombie.approve(pancakeRouter, "10000000000000000000000000")

    // const router = await Router.at(pancakeRouter)
    // await router.addLiquidityETH(
    //     ZombieToken.address,
    //     "80000000000000000000000000",
    //     0,
    //     0,
    //     wallet,
    //     Math.floor(Date.now() / 1000) + 60,
    //     {from: wallet, value: "500000000000000000"}
    // )

    // await deployer.deploy(UndeadBar, "0x91f52315A70c6b61aD58cd454fE1173AC376044D");
    // const undead = await UndeadBar.deployed()
    //
    // await deployer.deploy(RevivedRugNft, "Frank Test", "FRANKTEST");
    // const nft = await RevivedRugNft.deployed()
    //
    // await deployer.deploy(Percentages);
    // await deployer.link(Percentages, PriceConsumerV3);
    // await deployer.deploy(PriceConsumerV3);
    // const bnbPriceConsumer = await PriceConsumerV3.deployed()
    //
    // await deployer.deploy(Percentages);
    // await deployer.link(Percentages, DrFrankenstein);
    //
    // await deployer.deploy(
    //     DrFrankenstein,
    //     zombie.address,
    //     undead.address,
    //     devAddr,
    //     treasury,
    //     lpStorage,
    //     pancakeRouter,
    //     nft.address,
    //     bnbPriceConsumer.address,
    //     "10000000000000000000",
    //     0
    // );
    //
    // await deployer.deploy(ExampleRuggedToken, "Example rug", "EXRUG")
    //
    // const nft = await RevivedRugNft.at("0x771e40822eF012512b36EA09ce057A6c3f024825")
    // await deployer.deploy(GraveStakingToken, "GST 1", "GST1")
    // const drFrankenstein = await DrFrankenstein.deployed()
    // await drFrankenstein.addGrave(
    //     100,
    //     GraveStakingToken.address,
    //     10000,
    //     ExampleRuggedToken.address,
    //     nft.address,
    //     0,
    //     "5000000000000000000",
    //     100000,
    //     true
    // )
};
