var Percentages = artifacts.require("Percentages");
var RevivedRugNft = artifacts.require("RevivedRugNft");
var Mausoleum = artifacts.require("Mausoleum");
const pancakeRouter = "0x10ed43c718714eb63d5aa57b78b54704e256024e"
const treasury = "0x111a8fC09D65f29BBb026884c3034275DC9DA497"
const lpStorage = "0x24F6F6277EaA3835e90bADD5f27c89583C553D90"
const zombie = "0x50ba8BF9E34f0F83F96a340387d1d3888BA4B3b5"
const zmbeBnbLpToken = "0x4dbaf6479f0afa9f03c2a7d611151fa5b53ecdc8"
const priceConsumer = "0xabaad8dba90acf6ecd558e1f4c7055f8942283b1"


module.exports = async function (deployer) {
    await deployer.deploy(RevivedRugNft, "Patient Zero Alpha", "PATIENT-ZERO");
    const prize = await RevivedRugNft.deployed()

    // const prize = await RevivedRugNft.at("0x113Ab3Ca0D9242F525170E8D78da887E7499040a")
    await deployer.deploy(Percentages);
    await deployer.link(Percentages, Mausoleum);

    await deployer.deploy(
        Mausoleum,
        zombie,
        treasury,
        lpStorage,
        pancakeRouter,
        priceConsumer
    );

    const mausoleum = await Mausoleum.deployed() // await Mausoleum.at("0x1E05b159db5F56cfEcf7b0fCAB5fba7E9A8b46Bb")
    await prize.setTokenURI("ipfs://Qmaa5JvkA24nZ1fgyNf6tsKJAaLU1WXAVN1uqi7nyshN65")
    await prize.transferOwnership(mausoleum.address)

    await mausoleum.addAuction(
        "10000000000000000000",
        1627531199,
        zmbeBnbLpToken,
        prize.address,
        "5000000000000000000"
    )
};
