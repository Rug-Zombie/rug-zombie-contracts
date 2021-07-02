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
const bnbPriceConsumer = "0xA31cE87Eb587666CDAe6b35d62A85514A49248b7"

module.exports = async function (deployer) {
    // // await deployer.deploy(ZombieToken);
    // const zombie = await ZombieToken.at("0x85537ef782bab72e65704aa59e5C71131561D422")
    //
    // // await deployer.deploy(UndeadBar, ZombieToken.address);
    // const undead = await UndeadBar.at("0x547BE44e4e2261179943C890CE7919D1b44D02E7")
    //
    // // await deployer.deploy(RevivedRugNft, "Frank Test", "FRANKTEST");
    // const nft = await RevivedRugNft.at("0xaC0bb5dAC15FE79b5b590E6A108462F2e30139c7")
    //
    // await deployer.deploy(Percentages);
    //
    // // await deployer.deploy(PriceConsumerV3);
    // const bnbPriceConsumer = await PriceConsumerV3.at("0xA31cE87Eb587666CDAe6b35d62A85514A49248b7")
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
    //     pancakeRouter,
    //     nft.address,
    //     bnbPriceConsumer.address,
    //     "10000000000000000000",
    //     0
    // );
};
