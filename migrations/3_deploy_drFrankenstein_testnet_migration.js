var ZombieToken = artifacts.require("ZombieToken");
var UndeadBar = artifacts.require("UndeadBar");
var GraveStakingToken = artifacts.require("GraveStakingToken");
var Percentages = artifacts.require("Percentages");
var DrFrankenstein = artifacts.require("DrFrankenstein");
var ExampleRuggedToken = artifacts.require("RuggedToken");
var RevivedRugNft = artifacts.require("RevivedRugNft");
var PriceConsumerV3 = artifacts.require("PriceConsumerV3");
const burnAddress = "0x0000000000000000000000000000000000000000"
const devAddr = "0xdeDF1fA056E88EbBe589053882415Dc8801de650"
const pancakeRouter = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
const treasury = burnAddress       // wallet 2
module.exports = async function (deployer) {
    // await deployer.deploy(ZombieToken);
    // await deployer.deploy(UndeadBar, ZombieToken.address);
    // await deployer.deploy(RevivedRugNft, "Frank", "FRANK");
    // await deployer.deploy(Percentages);
    // await deployer.link(Percentages, PriceConsumerV3);
    // await deployer.deploy(PriceConsumerV3);
    // await deployer.link(Percentages, DrFrankenstein);
    // await deployer.deploy(
    //     DrFrankenstein,
    //     ZombieToken.address,
    //     UndeadBar.address,
    //     devAddr,
    //     treasury,
    //     pancakeRouter,
    //     RevivedRugNft.address,
    //     PriceConsumerV3.address,
    //     "10000000000000000000",
    //     0
    // );
};
