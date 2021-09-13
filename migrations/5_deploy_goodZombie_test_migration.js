var ZombieToken = artifacts.require("ZombieToken");
var UndeadBar = artifacts.require("UndeadBar");
var Percentages = artifacts.require("Percentages");
var DrFrankenstein = artifacts.require("DrFrankenstein");
var RugZombieNft = artifacts.require("RugZombieNft");
var RevivedRugNft = artifacts.require("RevivedRugNft");
var SafeOwner = artifacts.require("SafeOwner");
var GoodZombie = artifacts.require("GoodZombie");
var ExampleRuggedToken = artifacts.require("RuggedToken");
var PriceConsumerV3 = artifacts.require("PriceConsumerV3");
const GraveStakingToken = artifacts.require("GraveStakingToken")
const devAddr = "0x0662cfC47e366e60121c1F1D8DFcA0eF0F2F64a5"
const pancakeRouter = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
const treasury = "0x111a8fC09D65f29BBb026884c3034275DC9DA497"
const teamMultisig = "0xB8C1FFF8b915232067c1e7449870e397E43B143b"
const lpStorage = "0x24F6F6277EaA3835e90bADD5f27c89583C553D90"
const zeroAddress = "0x0000000000000000000000000000000000000000"

module.exports = async function (deployer) {
    await deployer.deploy(ZombieToken);
    await deployer.deploy(UndeadBar, ZombieToken.address);

    await deployer.deploy(RugZombieNft, "Grave 0 NFT", "GRAVE0");
    await deployer.deploy(RevivedRugNft, "Unsupported Nft Contract", "UNSUPPORTED");
    await deployer.deploy(GraveStakingToken, "Grave 1 - RugZombie Grave Staking Token", "G1-RZGST");
    await deployer.deploy(ExampleRuggedToken, "Example Rug", "ERUG");

    await deployer.deploy(Percentages);
    await deployer.link(Percentages, PriceConsumerV3);
    await deployer.deploy(PriceConsumerV3);

    await deployer.deploy(Percentages);
    await deployer.link(Percentages, DrFrankenstein);

    await deployer.deploy(
        DrFrankenstein,
        ZombieToken.address,
        UndeadBar.address,
        devAddr,
        treasury,
        lpStorage,
        pancakeRouter,
        zeroAddress,
        PriceConsumerV3.address,
        "10000000000000000000",
        0
    );

    await deployer.deploy(SafeOwner, DrFrankenstein.address);
    await deployer.deploy(GoodZombie, SafeOwner.address, teamMultisig);
};
