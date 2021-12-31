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
   // const CrossChainStableCoinPool = await ethers.getContractFactory('CrossChainStableCoinPool');



   const ERC20Mock = await ethers.getContractFactory('ERC20Mock');
   const ERC20MockInstance = await ERC20Mock.deploy("dtoUSD", "dtoUSD", deployer, '1000000000000000000000000000')
   const mock = await ERC20MockInstance.deployed()
   log('  - ERC20Mock1:         ', mock.address);
   const ERC20MockInstance1 = await ERC20Mock.deploy("tUSDT", "ttUSDT", deployer, '1000000000000000000000000000')
   const mock1 = await ERC20MockInstance1.deployed()
   log('  - ERC20Mock2:         ', mock1.address);
   const ERC20MockInstance2 = await ERC20Mock.deploy("tBUSD", "ttBUSD", deployer, '1000000000000000000000000000')
   const mock2 = await ERC20MockInstance2.deployed()
   log('  - ERC20Mock3:         ', mock2.address);



    const CrossChainStableCoinPool = await ethers.getContractFactory("CrossChainStableCoinPool");
    crosschainstablecoinpool = await upgrades.deployProxy(CrossChainStableCoinPool, [[mock.address, mock1.address, mock2.address]], { unsafeAllow: ['delegatecall'], kind: 'uups' }) //unsafeAllowCustomTypes: true,
    log('  - CrossChainStableCoinPool:         ', crosschainstablecoinpool.address);
    deployData['CrossChainStableCoinPool'] = {
      abi: getContractAbi('CrossChainStableCoinPool'),
      address: crosschainstablecoinpool.address,
      deployTransaction: crosschainstablecoinpool.deployTransaction,
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
