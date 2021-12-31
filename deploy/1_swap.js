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
      const Swap = await ethers.getContractFactory('Swap');
      // const CrossChainStableCoinPoolInstance = await CrossChainStableCoinPool.deploy() // variable of constructor
      // const factory = await CrossChainStableCoinPoolInstance.deployed()
    //   const swap = await upgrades.deployProxy(Swap, ["0x87b417202529dF1D72a5b35180ECfd6e3EDB1f63", "0xBE5f820673BBbd5B76D32555706c086B60d5c527"], { unsafeAllow: ['delegatecall'],unsafeAllowCustomTypes: true, kind: 'uups', gasLimit: 1000000 })  
      const swap = await upgrades.deployProxy(Swap, ["0x7584A6201C47e623eA5C533A93dD77F4E8FB93ec", "0x4DfbF31e2CB3068f76c79908890E9a7691659428"], { unsafeAllow: ['delegatecall'],unsafeAllowCustomTypes: true, kind: 'uups', gasLimit: 1000000 })   
      log('  - Swap:         ', swap.address);
      deployData['Swap'] = {
        abi: getContractAbi('Swap'),
        address: swap.address,
        deployTransaction: swap.deployTransaction,
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
  
  module.exports.tags = ['swap']