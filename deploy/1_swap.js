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
 
      // const swap = await upgrades.deployProxy(Swap, ["0x814523595f6D9219c3dEB14271fef51B5FC5fcce", "0x338De1C169e0794027acCD8682003AC4a126c37e"], { unsafeAllow: ['delegatecall'],unsafeAllowCustomTypes: true, kind: 'uups', gasLimit: 1000000 })   
    const swap = await upgrades.deployProxy(Swap, ["0x40e2Ea2B4a9924e0eb1d1042963B8B61DaE25787", "0x131E9C5aF75Fc9f6c24D9619F9244EbABA684ef1"], { unsafeAllow: ['delegatecall'],unsafeAllowCustomTypes: true, kind: 'uups', gasLimit: 1000000 }) 
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