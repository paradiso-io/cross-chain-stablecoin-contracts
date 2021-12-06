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
    const CrossChainStableCoinPoolInstance = await CrossChainStableCoinPool.deploy() // variable of constructor
    const factory = await CrossChainStableCoinPoolInstance.deployed()
    log('  - CrossChainStableCoinPool:         ', factory.address);
    deployData['CrossChainStableCoinPool'] = {
      abi: getContractAbi('CrossChainStableCoinPool'),
      address: factory.address,
      deployTransaction: factory.deployTransaction,
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
