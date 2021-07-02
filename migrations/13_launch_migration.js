var DrFrankenstein = artifacts.require("DrFrankenstein");
var RevivedRugNft = artifacts.require("RevivedRugNft");
var GraveStakingToken = artifacts.require("GraveStakingToken");
module.exports = async function (deployer) {
    // Launch Grave Staking Tokens

    // Vikingswap Rare
    await deployer.deploy(
        GraveStakingToken,
        "Vikingswap Rare - Rug Zombie Grave Staking Token",
        "VIKING-RARE-RZ-STAKING"
    );
    const vikingswapRare = await GraveStakingToken.deployed();
    vikingswapRare.transferOwnership(DrFrankenstein.address);

    // MonsterSlayer Rare
    await deployer.deploy(
        GraveStakingToken,
        "ZombieSlayer - Rug Zombie Grave Staking Token",
        "MSC-RARE-RZ-STAKING"
    );
    const monsterSlayerRare = await GraveStakingToken.deployed();
    monsterSlayerRare.transferOwnership(DrFrankenstein.address);

    // Defi100 Rare
    await deployer.deploy(
        GraveStakingToken,
        "Defi100 Rare - Rug Zombie Grave Staking Token",
        "D100-RARE-RZ-STAKING"
    );
    const defi100Rare = await GraveStakingToken.deployed();
    defi100Rare.transferOwnership(DrFrankenstein.address);

    // Fairmoon Rare
    await deployer.deploy(
        GraveStakingToken,
        "Fairmoon Rare - Rug Zombie Grave Staking Token",
        "FAIRMOON-RARE-RZ-STAKING"
    );
    const raremoon = await GraveStakingToken.deployed();
    raremoon.transferOwnership(DrFrankenstein.address);

    // Fairmoon Uncommon
    await deployer.deploy(
        GraveStakingToken,
        "Fairmoon Uncommon - Rug Zombie Grave Staking Token",
        "FAIRMOON-UNCOMMON-RZ-STAKING"
    );
    const fairmoonUncommon = await GraveStakingToken.deployed();
    fairmoonUncommon.transferOwnership(DrFrankenstein.address);

    // Fairmoon Common
    await deployer.deploy(
        GraveStakingToken,
        "Fairmoon Common - Rug Zombie Grave Staking Token",
        "FAIRMOON-COMMON-RZ-STAKING"
    );
    const fairmoonCommon = await GraveStakingToken.deployed();
    fairmoonCommon.transferOwnership(DrFrankenstein.address);

    // yApe Common
    await deployer.deploy(
        GraveStakingToken,
        "yApe Common - Rug Zombie Grave Staking Token",
        "yApe-RZ-STAKING"
    );
    const yapeCommon = await GraveStakingToken.deployed();
    yapeCommon.transferOwnership(DrFrankenstein.address);

    // Zombie Farm Finance Common
    await deployer.deploy(
        GraveStakingToken,
        "Dragon Farm Finance Common - Rug Zombie Grave Staking Token",
        "DRAGON-COMMON-RZ-STAKING"
    );
    const dragonFarmFinanceCommon = await GraveStakingToken.deployed();
    dragonFarmFinanceCommon.transferOwnership(DrFrankenstein.address);

    // yPanda Common
    await deployer.deploy(
        GraveStakingToken,
        "yPanda Common - Rug Zombie Grave Staking Token",
        "yPanda-RZ-STAKING"
    );
    const yPandaCommon = await GraveStakingToken.deployed();
    yPandaCommon.transferOwnership(DrFrankenstein.address);

    // Launch NFT's
    await deployer. deploy(RevivedRugNft, "Frank", "FRANK");
    const frankNft = await RevivedRugNft.deployed();
    await frankNft.setTokenURI("ipfs://QmNpM7EaRvpXGgxKPPg5coUDEg2sLiY4PHc1L917zMCntg");
    await frankNft.transferOwnership(DrFrankenstein.address);

    await deployer. deploy(RevivedRugNft, "Viking Brains", "BRAINS");
    const vikingBrainsNft = await RevivedRugNft.deployed();
    await vikingBrainsNft.setTokenURI("ipfs://QmVomcyqUwZqSgC1UfoAhGxtygBnPviuwnTyThgGVQdbTq");
    await vikingBrainsNft.transferOwnership(DrFrankenstein.address);

    await deployer. deploy(RevivedRugNft, "ZombieSlayer", "ZSC");
    const zombieSlayerNft = await RevivedRugNft.deployed();
    await zombieSlayerNft.setTokenURI("ipfs://QmR2UsrqbXMq4hYpJc2v8HQnVcwfPn4jap9BH6p3iES63d");
    await zombieSlayerNft.transferOwnership(DrFrankenstein.address);

    await deployer. deploy(RevivedRugNft, "Zombie100", "Z100");
    const zombie100Nft = await RevivedRugNft.deployed();
    await zombie100Nft.setTokenURI("ipfs://QmXyNLemP4aQYJfRDxYrtWk1FPUbtkD5wDQMBwY6UqrYzZ");
    await zombie100Nft.transferOwnership(DrFrankenstein.address);

    await deployer. deploy(RevivedRugNft, "Raremoon", "RAREMOON");
    const raremoonNft = await RevivedRugNft.deployed();
    await raremoonNft.setTokenURI("ipfs://Qmb2WQUEm9tHUJF56iC3kxgD9WvsgPRPcrETjMGWHo1eyX");
    await raremoonNft.transferOwnership(DrFrankenstein.address);

    await deployer. deploy(RevivedRugNft, "Fairmoon Common", "FAIRMOON-COMMON");
    const fairmoonCommonNft = await RevivedRugNft.deployed();
    await fairmoonCommonNft.setTokenURI("ipfs://QmeKLTu8zeba7JZpy6k9FasV7YUcYEw6eB7UYSGBD4GbTG");
    await fairmoonCommonNft.transferOwnership(DrFrankenstein.address);

    await deployer. deploy(RevivedRugNft, "Fairmoon Uncommon", "FAIRMOON-UNCOMMON");
    const fairmoonUncommonNft = await RevivedRugNft.deployed();
    await fairmoonUncommonNft.setTokenURI("ipfs://QmUpDUgdmS7mSuwnyXYDd6N3jDXMcHTMjnpnHEfKZBbjWG");
    await fairmoonUncommonNft.transferOwnership(DrFrankenstein.address);

    await deployer. deploy(RevivedRugNft, "yApe Common", "yAPE-COMMON");
    const yapeCommonNft = await RevivedRugNft.deployed();
    await yapeCommonNft.setTokenURI("ipfs://QmXr7krDLBnZkL2qGyrZLkpCyBBTbFa8qZzdfsq3gAE78V");
    await yapeCommonNft.transferOwnership(DrFrankenstein.address);

    await deployer. deploy(RevivedRugNft, "Zombie Farm Finance Common", "ZMBEFARM-COMMON");
    const zombieFarmFinanceCommonNft = await RevivedRugNft.deployed();
    await zombieFarmFinanceCommonNft.setTokenURI("ipfs://QmaSueEotUNELhQotaeYEMwTcBefevKqwQNFYZz7VS8qpP");
    await zombieFarmFinanceCommonNft.transferOwnership(DrFrankenstein.address);

    await deployer. deploy(RevivedRugNft, "yPanda Common", "yPANDA-COMMON");
    const yPandaCommonNft = await RevivedRugNft.deployed();
    await yPandaCommonNft.setTokenURI("ipfs://QmUnxRU1ZcF4EFYNuJmsTVE7VahWBx3e7TCgZYTZR4Ytrj");
    await yPandaCommonNft.transferOwnership(DrFrankenstein.address);

    // Add Graves

    const drFrankenstein = await DrFrankenstein.deployed()

    await drFrankenstein.setGraveNft(0, frankNft.address);

    // Vikingswap Rare
    await drFrankenstein.addGrave(
        800,                                            // _allocPoints
        vikingswapRare.address,                         // _lpToken
        1800,                                           // _minimumStakingTime
        "0x896eDE222D3f7f3414e136a2791BDB08AAa25Ce0",   // _ruggedToken
        vikingBrainsNft.address,                        // _nft
        "5000000000000000000000",                       // _minimumStake
        "5000000000000000000",                          // _unlockFee
        3600,                                           // _nftRevivalTime
        false                                           // _withUpdate
    )
    // MonsterSlayer Rare
    await drFrankenstein.addGrave(
        800,                                            // _allocPoints
        monsterSlayerRare.address,                           // _lpToken
        1800,                                           // _minimumStakingTime
        "0x8C784C49097Dcc637b93232e15810D53871992BF",   // _ruggedToken
        zombieSlayerNft.address,                        // _nft
        "5000000000000000000000",                       // _minimumStake
        "5000000000000000000",                          // _unlockFee
        3000,                                           // _nftRevivalTime
        false                                           // _withUpdate
    )
    // Defi100 Rare
    await drFrankenstein.addGrave(
        800,                                            // _allocPoints
        defi100Rare.address,                            // _lpToken
        1800,                                           // _minimumStakingTime
        "0x9d8aac497a4b8fe697dd63101d793f0c6a6eebb6",   // _ruggedToken
        zombie100Nft.address,                           // _nft
        "5000000000000000000000",                       // _minimumStake
        "5000000000000000000",                          // _unlockFee
        3000,                                           // _nftRevivalTime
        false                                           // _withUpdate
    )
    // Fairmoon Rare
    await drFrankenstein.addGrave(
        800,                                            // _allocPoints
        raremoon.address,                               // _lpToken
        1800,                                           // _minimumStakingTime
        "0xfe75cD11E283813eC44B4592476109Ba3706cef6",   // _ruggedToken
        raremoonNft.address,                            // _nft
        "5000000000000000000000",                       // _minimumStake
        "5000000000000000000",                          // _unlockFee
        3000,                                           // _nftRevivalTime
        false                                           // _withUpdate
    )
    // Fairmoon Uncommon
    await drFrankenstein.addGrave(
        400,                                            // _allocPoints
        fairmoonUncommon.address,                       // _lpToken
        900,                                            // _minimumStakingTime
        "0xfe75cD11E283813eC44B4592476109Ba3706cef6",   // _ruggedToken
        fairmoonUncommonNft.address,                    // _nft
        "2500000000000000000000",                       // _minimumStake
        "5000000000000000000",                          // _unlockFee
        1800,                                           // _nftRevivalTime
        false                                           // _withUpdate
    )
    // Fairmoon Common
    await drFrankenstein.addGrave(
        200,                                            // _allocPoints
        fairmoonCommon.address,                         // _lpToken
        600,                                            // _minimumStakingTime
        "0xfe75cD11E283813eC44B4592476109Ba3706cef6",   // _ruggedToken
        fairmoonCommonNft.address,                      // _nft
        "1000000000000000000000",                       // _minimumStake
        "5000000000000000000",                          // _unlockFee
        1200,                                           // _nftRevivalTime
        false                                           // _withUpdate
    )
    // yApe Common
    await drFrankenstein.addGrave(
        200,                                            // _allocPoints
        yapeCommon.address,                             // _lpToken
        600,                                            // _minimumStakingTime
        "0x64b783a80d0c05bed0e2f1a638465a7ba3f4a6fb",   // _ruggedToken
        fairmoonCommonNft.address,                      // _nft
        "1000000000000000000000",                       // _minimumStake
        "5000000000000000000",                          // _unlockFee
        1200,                                           // _nftRevivalTime
        false                                           // _withUpdate
    )
    // Dragon Farm Finance Common
    await drFrankenstein.addGrave(
        200,                                            // _allocPoints
        dragonFarmFinanceCommon.address,                // _lpToken
        600,                                            // _minimumStakingTime
        "0x251a3184857488dc90fa9c9a52fd2d8df473d92c",   // _ruggedToken
        zombieFarmFinanceCommonNft.address,             // _nft
        "1000000000000000000000",                       // _minimumStake
        "5000000000000000000",                          // _unlockFee
        1200,                                           // _nftRevivalTime
        true                                            // _withUpdate
    )
    // yPanda Common
    await drFrankenstein.addGrave(
        200,                                            // _allocPoints
        fairmoonCommon.address,                         // _lpToken
        600,                                            // _minimumStakingTime
        "0x9806aec346064183b5cE441313231DFf89811f7A",   // _ruggedToken
        fairmoonCommonNft.address,                      // _nft
        "1000000000000000000000",                       // _minimumStake
        "5000000000000000000",                          // _unlockFee
        1200,                                           // _nftRevivalTime
        false                                           // _withUpdate
    )
};
