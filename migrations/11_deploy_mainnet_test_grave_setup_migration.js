var GraveStakingToken = artifacts.require("GraveStakingToken");
var DrFrankenstein = artifacts.require("DrFrankensteinTest")
module.exports = async function (deployer) {
    // const drFrankenstein = await DrFrankenstein.at("0x0fA9ad48EFBFAC66152A4a9D55c2cB0400932E25")
    //
    // // VikingBrains
    // await drFrankenstein.addGrave(
    //     800,                                            // _allocPoints
    //     "0x7ab6ac598a5E7DEec2AD3A0eEfB19804c7820aaB",   // _lpToken
    //     1800,                                           // _minimumStakingTime
    //     "0x896eDE222D3f7f3414e136a2791BDB08AAa25Ce0",   // _ruggedToken
    //     "0x78F146F4740162B920F67B18465F3d91583B50De",   // _nft
    //     "5000000000000000000000",                       // _minimumStake
    //     "5000000000000000000",                          // _unlockFee
    //     3600,                                           // _nftRevivalTime
    //     false                                           // _withUpdate
    // )
    // // ZombieSlayer
    // await drFrankenstein.addGrave(
    //     800,                                            // _allocPoints
    //     "0xDD61B4211b7089ae4cae03DdC2db259ee045cDf4",   // _lpToken
    //     1800,                                           // _minimumStakingTime
    //     "0x8C784C49097Dcc637b93232e15810D53871992BF",   // _ruggedToken
    //     "0x2DdD8c93383dC830775A77D0De22Bc775aDa0974",   // _nft
    //     "5000000000000000000000",                       // _minimumStake
    //     "5000000000000000000",                          // _unlockFee
    //     3000,                                           // _nftRevivalTime
    //     false                                           // _withUpdate
    // )
    // // Raremoon
    // await drFrankenstein.addGrave(
    //     800,                                            // _allocPoints
    //     "0x66b7C610fE414D4381b36C25c11500d1bAE51346",   // _lpToken
    //     1800,                                           // _minimumStakingTime
    //     "0xfe75cD11E283813eC44B4592476109Ba3706cef6",   // _ruggedToken
    //     "0x3dde1aADFAb53eA604e3202bd0DA0d467798283f",   // _nft
    //     "5000000000000000000000",                       // _minimumStake
    //     "5000000000000000000",                          // _unlockFee
    //     3000,                                           // _nftRevivalTime
    //     false                                           // _withUpdate
    // )
    // // Fairmoon uncommon
    // await drFrankenstein.addGrave(
    //     400,                                            // _allocPoints
    //     "0xB92889b4449Fd1e7cE85083524E07cD49Ecc5B0e",   // _lpToken
    //     900,                                           // _minimumStakingTime
    //     "0xfe75cD11E283813eC44B4592476109Ba3706cef6",   // _ruggedToken
    //     "0xE7D8B6716678AfeAC364852772A4De355C5fa525",   // _nft
    //     "2500000000000000000000",                       // _minimumStake
    //     "5000000000000000000",                          // _unlockFee
    //     1800,                                           // _nftRevivalTime
    //     false                                           // _withUpdate
    // )
    // // Fairmoon common
    // await drFrankenstein.addGrave(
    //     200,                                            // _allocPoints
    //     "0xe2C54d44164a76eD1af7060126C56CcC923571De",   // _lpToken
    //     600,                                           // _minimumStakingTime
    //     "0xfe75cD11E283813eC44B4592476109Ba3706cef6",   // _ruggedToken
    //     "0xDaed6dc6fED571441437F532188Cd3A21Bbf0A06",   // _nft
    //     "1000000000000000000000",                       // _minimumStake
    //     "5000000000000000000",                          // _unlockFee
    //     1200,                                           // _nftRevivalTime
    //     false                                           // _withUpdate
    // )
    // // yApe common
    // await drFrankenstein.addGrave(
    //     200,                                            // _allocPoints
    //     "0xcBbe4514d2b2818Cf12d848a9B902b893FeB6C29",   // _lpToken
    //     600,                                           // _minimumStakingTime
    //     "0x64b783a80d0c05bed0e2f1a638465a7ba3f4a6fb",   // _ruggedToken
    //     "0x4Cd8692aeEAac9186693227668DEa53822AEBEE9",   // _nft
    //     "1000000000000000000000",                       // _minimumStake
    //     "5000000000000000000",                          // _unlockFee
    //     1200,                                           // _nftRevivalTime
    //     false                                           // _withUpdate
    // )
    // // yPanda common
    // await drFrankenstein.addGrave(
    //     200,                                            // _allocPoints
    //     "0x53756E37f34D3b8E898905F609Af0b2aDE010B2A",   // _lpToken
    //     600,                                           // _minimumStakingTime
    //     "0x9806aec346064183b5cE441313231DFf89811f7A",   // _ruggedToken
    //     "0x6cb2893De0e1425ff3aA62f1CBECC0Ac930004cF",   // _nft
    //     "1000000000000000000000",                       // _minimumStake
    //     "5000000000000000000",                          // _unlockFee
    //     1200,                                           // _nftRevivalTime
    //     false                                           // _withUpdate
    // )
    // // Zombie Farm Finance common
    // await drFrankenstein.addGrave(
    //     200,                                            // _allocPoints
    //     "0x03467CB3eE7B5b7746559540E79b82357e4c4246",   // _lpToken
    //     600,                                           // _minimumStakingTime
    //     "0x251a3184857488dc90fa9c9a52fd2d8df473d92c",   // _ruggedToken
    //     "0x2c339B347eBEd20d3C106BcEFF49682a2Cb7BF69",   // _nft
    //     "1000000000000000000000",                       // _minimumStake
    //     "5000000000000000000",                          // _unlockFee
    //     1200,                                           // _nftRevivalTime
    //     true                                           // _withUpdate
    // )
};
