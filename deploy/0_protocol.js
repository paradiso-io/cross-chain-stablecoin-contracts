const {
  chainNameById,
  chainIdByName,
  saveDeploymentData,
  getContractAbi,
  log,
  WETH
} = require("../js-helpers/deploy");
const _ = require('lodash');

module.exports = async (hre) => {
    const { ethers, upgrades, getNamedAccounts } = hre;
    const { deployer, feeToSetter } = await getNamedAccounts();
    const network = await hre.network;
    const deployData = {};

    const chainId = chainIdByName(network.name);

    log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    log('DTO Multichain Pegged Swap Protocol - Contract Deployment');
    log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

    log('  Using Network: ', chainNameById(chainId));
    log('  Using Accounts:');
    log('  - Deployer:          ', deployer);
    log('  - network id:          ', chainId);
    log(' ');

    log('  Deploying Cross Chain Stable Coin Pool...');
    const CrossChainStableCoinPool = await ethers.getContractFactory('CrossChainStableCoinPool');
    // const crossChain = await upgrades.deployProxy(CrossChainStableCoinPool, [["0xB9e821acF423C565d01f4B489053EcFF73d00f29", "0xa31905c0eF4df2e47Be3CA0810a8734Ce585d95B", "0x91B99b1b2Be717912bc25b179C99eC578d6f150F", "0xB9F7162977A9d9b757544A904bC1372ef3CeE3b3"]], { unsafeAllow: ['delegatecall'],unsafeAllowCustomTypes: true, kind: 'uups', gasLimit: 1000000 })
    const crossChain = await upgrades.deployProxy(CrossChainStableCoinPool, [["0xcdd3c40b95a670aC8dec8178B7AB960333f70618", "0xE3A44478278F6Ce3D0BB45BdFcF1eFca62B8856D", "0x3f9aA65d9Ffa728733843dd4895c9E888c674dd1", "0x22d0A378602EE893872Fac245c30D02EE561C30b"]], { unsafeAllow: ['delegatecall'],unsafeAllowCustomTypes: true, kind: 'uups', gasLimit: 1000000 })
    // const CrossChainStableCoinPoolInstance = await CrossChainStableCoinPool.deploy() // variable of constructor
    // const factory = await CrossChainStableCoinPoolInstance.deployed()
    log('  - CrossChainStableCoinPool:         ', crossChain.address);
    deployData['CrossChainStableCoinPool'] = {
      abi: getContractAbi('CrossChainStableCoinPool'),
      address: crossChain.address,
      deployTransaction: crossChain.deployTransaction,
    }

    // log('  Deploying Cross Chain Stable Coin Pool Router...');
    // const CrossChainStableCoinPoolRouter = await ethers.getContractFactory('CrossChainStableCoinPool');
    // const CrossChainStableCoinPoolRouterInstance = await CrossChainStableCoinPoolRouter.deploy(factory.address, WETH(chainId))
    // const router = await CrossChainStableCoinPoolRouterInstance.deployed()
    // log('  - CrossChainStableCoinPoolRouter:         ', router.address);
    // deployData['CrossChainStableCoinPoolRouter'] = {
    //   abi: getContractAbi('CrossChainStableCoinPoolRouter'),
    //   address: router.address,
    //   deployTransaction: router.deployTransaction,
    // }

    saveDeploymentData(chainId, deployData);
    log('\n  Contract Deployment Data saved to "deployments" directory.');

    log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['protocol']
