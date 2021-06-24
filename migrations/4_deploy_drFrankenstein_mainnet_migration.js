var ZombieToken = artifacts.require("ZombieToken");
var UndeadBar = artifacts.require("UndeadBar");
var GraveStakingToken = artifacts.require("GraveStakingToken");
var Percentages = artifacts.require("Percentages");
var DrFrankenstein = artifacts.require("DrFrankensteinTest");
var ExampleRuggedToken = artifacts.require("RuggedToken");
var RevivedRugNft = artifacts.require("RevivedRugNft");
var PriceConsumerV3 = artifacts.require("PriceConsumerV3");
const devAddr = "0x0662cfC47e366e60121c1F1D8DFcA0eF0F2F64a5"
const pancakeRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
const treasury = "0x111a8fC09D65f29BBb026884c3034275DC9DA497"
const bnbPriceConsumer = "0xF43e8D9800F174E631c1b04d441dF41937FCDB8a"

module.exports = async function (deployer) {
    await deployer.deploy(ZombieToken);
    await deployer.deploy(UndeadBar, ZombieToken.address);
    await deployer.deploy(RevivedRugNft, "Frank Test", "FRANKTEST");
    await deployer.deploy(Percentages);
    await deployer.link(Percentages, PriceConsumerV3);
    await deployer.deploy(PriceConsumerV3);
    await deployer.link(Percentages, DrFrankenstein);
    await deployer.deploy(
        DrFrankenstein,
        ZombieToken.address,
        UndeadBar.address,
        devAddr,
        treasury,
        pancakeRouter,
        RevivedRugNft.address,
        bnbPriceConsumer,
        "10000000000000000000",
        0
    );
};
