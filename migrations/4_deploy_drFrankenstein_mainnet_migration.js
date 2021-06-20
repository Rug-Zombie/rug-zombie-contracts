var ZombieToken = artifacts.require("ZombieToken");
var UndeadBar = artifacts.require("UndeadBar");
var GraveStakingToken = artifacts.require("GraveStakingToken");
var Percentages = artifacts.require("Percentages");
var DrFrankenstein = artifacts.require("DrFrankenstein");
var ExampleRuggedToken = artifacts.require("RuggedToken");
var RevivedRugNft = artifacts.require("RevivedRugNft");
var PriceConsumerV3 = artifacts.require("PriceConsumerV3");
const burnAddress = "0x0000000000000000000000000000000000000000"
const devAddr = "0x23a022ee5237925bC693c7A8C75958d905Cc456e"
const pancakeRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
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
    //     "0xF43e8D9800F174E631c1b04d441dF41937FCDB8a",
    //     "10000000000000000000",
    //     0
    // );
};
