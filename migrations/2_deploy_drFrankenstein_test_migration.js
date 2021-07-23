var ZombieToken = artifacts.require("ZombieToken");
var UndeadBar = artifacts.require("UndeadBar");
var GraveStakingToken = artifacts.require("GraveStakingToken");
var Percentages = artifacts.require("Percentages");
var DrFrankensteinTest = artifacts.require("DrFrankensteinTest");
var WBNB = artifacts.require("WBNB");
var ExampleRuggedToken = artifacts.require("RuggedToken");
var RevivedRugNft = artifacts.require("RevivedRugNft");
var PriceConsumerV3 = artifacts.require("PriceConsumerV3");

const devAddr = "0xcb4fee9368f683c1bb9e0eb1c6dab987064f515b"        // wallet 1
const treasury = "0x8df5b3ece7c11749588ed2d102dbc77619c46776"       // wallet 2
const lpStorage = "0x8df5b3ece7c11749588ed2d102dbc77619c46776"       // wallet 2
module.exports = async function (deployer) {
    // await deployer.deploy(ZombieToken);
    // await deployer.deploy(UndeadBar, ZombieToken.address);
    // await deployer.deploy(RevivedRugNft, "Zombie For Zombie Nft", "ZMBEFORZMBE");
    // await deployer.deploy(ExampleRuggedToken)
    // await deployer.deploy(GraveStakingToken, "Test RugZombie Grave Staking Token", "TEST-RZ-STAKING")
    // await deployer.deploy(Percentages);
    // await deployer.link(Percentages, PriceConsumerV3);
    // await deployer.deploy(PriceConsumerV3);
    // await deployer.link(Percentages, DrFrankensteinTest);
    // await deployer.deploy(
    //     DrFrankensteinTest,
    //     ZombieToken.address,
    //     UndeadBar.address,
    //     devAddr,
    //     treasury,
    //     lpStorage,
    //     "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
    //     RevivedRugNft.address,
    //     PriceConsumerV3.address,
    //     0,
    //     0
    // );
};
