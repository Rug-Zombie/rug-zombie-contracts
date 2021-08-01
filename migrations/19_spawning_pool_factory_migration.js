var ZombieToken = artifacts.require("ZombieToken");
var RuggedToken = artifacts.require("RuggedToken");
var SpawningPoolPayload = artifacts.require("SpawningPoolPayload");
var Percentages = artifacts.require("Percentages");
var SpawningPoolFactory = artifacts.require("SpawningPoolFactory");
var RevivedRugNft = artifacts.require("RevivedRugNft");
var PriceConsumerV3 = artifacts.require("PriceConsumerV3");
const pancakeRouter = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
const lpStorage = "0x24F6F6277EaA3835e90bADD5f27c89583C553D90"
const treasury = "0x111a8fC09D65f29BBb026884c3034275DC9DA497"
const admin = "0xB8C1FFF8b915232067c1e7449870e397E43B143b"
module.exports = async function (deployer) {
    // await deployer.deploy(ZombieToken);
    // await deployer.deploy(RevivedRugNft, "Reward Nft", "REWARD-NFT");
    // await deployer.deploy(RuggedToken);
    //
    // await deployer.deploy(SpawningPoolPayload);
    // await deployer.deploy(Percentages);
    // await deployer.link(Percentages, PriceConsumerV3);
    // await deployer.deploy(PriceConsumerV3);
    //
    // await deployer.link(SpawningPoolPayload, SpawningPoolFactory);
    // await deployer.link(Percentages, SpawningPoolFactory);
    // await deployer.deploy(
    //     SpawningPoolFactory,
    //     ZombieToken.address,
    //     treasury,
    //     PriceConsumerV3.address,
    //     pancakeRouter,
    //     admin
    // );
};
