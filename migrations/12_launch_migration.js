var ZombieToken = artifacts.require("ZombieToken");
var UndeadBar = artifacts.require("UndeadBar");
var Percentages = artifacts.require("Percentages");
var DrFrankenstein = artifacts.require("DrFrankenstein");

const devBurnAddress = "0x0662cfC47e366e60121c1F1D8DFcA0eF0F2F64a5"
const pancakeRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
const treasury = "0x111a8fC09D65f29BBb026884c3034275DC9DA497"
const foundersAddress = "0x666a26C410BdfDB4B5D51B971E209Dda4A96594e"
const lpStorage = "0x24F6F6277EaA3835e90bADD5f27c89583C553D90"
const bnbPriceConsumer = "0xA31cE87Eb587666CDAe6b35d62A85514A49248b7"

// whitelist addresses
const burnAddress = "0x000000000000000000000000000000000000dEaD"

module.exports = async function (deployer) {
    // await deployer.deploy(ZombieToken)
    // const zombie = await ZombieToken.deployed()
    // await zombie.mint("80000000000000000000000000")
    // await zombie.mint(treasury, "10000000000000000000000000")
    // await zombie.mint(foundersAddress, "10000000000000000000000000")
    // // const zombie = await ZombieToken.at("0x85537ef782bab72e65704aa59e5C71131561D422")
    // await deployer.deploy(UndeadBar, ZombieToken.address);
    // const undead = await UndeadBar.deployed();
    // // const undead = await UndeadBar.at("0x547BE44e4e2261179943C890CE7919D1b44D02E7")
    //
    // await deployer.deploy(Percentages);
    // await deployer.link(Percentages, DrFrankenstein);
    //
    // await deployer.deploy(
    //     DrFrankenstein,
    //     ZombieToken.address,
    //     UndeadBar.address,
    //     devBurnAddress,
    //     treasury,
    //     lpStorage,
    //     pancakeRouter,
    //     "0x0000000000000000000000000000000000000000",
    //     bnbPriceConsumer,
    //     "10000000000000000000",
    //     0
    // );
    // // Whitelist addresses
    // await zombie.whitelistAddress(pancakeRouter)
    // await zombie.whitelistAddress(burnAddress)
    // await zombie.whitelistAddress(treasury)
    // await zombie.whitelistAddress(foundersAddress)
    // await zombie.whitelistAddress(devBurnAddress)
    // await zombie.whitelistAddress(DrFrankenstein.address)
    //
    // // TransferOwnership
    // await undead.transferOwnership(DrFrankenstein.address)
    //
    // // Must pair and whitelist lp before transferring zombie ownership
    // // await zombie.transferOwnership(DrFrankenstein.address)
}
