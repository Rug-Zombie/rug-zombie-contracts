var ZombieToken = artifacts.require("ZombieToken");
var UndeadBar = artifacts.require("UndeadBar");
var Percentages = artifacts.require("Percentages");
var DrFrankenstein = artifacts.require("DrFrankenstein");
var Router = artifacts.require("IUniswapV2Router02")
const devBurnAddress = "0x0662cfC47e366e60121c1F1D8DFcA0eF0F2F64a5"
const pancakeRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
const treasury = "0x111a8fC09D65f29BBb026884c3034275DC9DA497"
const foundersAddress = "0x666a26C410BdfDB4B5D51B971E209Dda4A96594e"
const lpStorage = "0x24F6F6277EaA3835e90bADD5f27c89583C553D90"
const wallet = "0xB8C1FFF8b915232067c1e7449870e397E43B143b"


module.exports = async function (deployer) {
    // const router = await Router.at(pancakeRouter)
    // const initialLiquidityBnbAmount = "10000000000000000"   // TODO Change to the amount EZ sends me
    // const zombie = ZombieToken.deployed()
    //
    // await router.addLiquidityETH(
    //     ZombieToken.address,
    //     "80000000000000000000000000",
    //     0,
    //     0,
    //     lpStorage,
    //     Math.floor(Date.now() / 1000) + 60
    // ).send({from: wallet, value: initialLiquidityBnbAmount});
    //

};
