var ZombieToken = artifacts.require("ZombieToken");
var Percentages = artifacts.require("Percentages");
var Mausoleum = artifacts.require("Mausoleum");
var RevivedRugNft = artifacts.require("RevivedRugNft");
var PriceConsumerV3 = artifacts.require("PriceConsumerV3");
const pancakeRouter = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
const lpStorage = "0x24F6F6277EaA3835e90bADD5f27c89583C553D90"
const treasury = "0x111a8fC09D65f29BBb026884c3034275DC9DA497"
module.exports = async function (deployer) {
    // await deployer.deploy(ZombieToken);
    // await deployer.deploy(RevivedRugNft, "Mausoleum Prize", "PRIZE");
    // await deployer.deploy(Percentages);
    // await deployer.link(Percentages, PriceConsumerV3);
    // await deployer.deploy(PriceConsumerV3);
    // await deployer.link(Percentages, Mausoleum);
    //
    // await deployer.deploy(
    //     Mausoleum,
    //     ZombieToken.address,
    //     treasury,
    //     lpStorage,
    //     pancakeRouter,
    //     PriceConsumerV3.address
    // );
};
