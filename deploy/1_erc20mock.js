const {
    chainNameById,
    chainIdByName,
    saveDeploymentData,
    getContractAbi,
    getTxGasCost,
    log
  } = require("../js-helpers/deploy");
  
  const _ = require('lodash');
  
  module.exports = async (hre) => {
      const { ethers, upgrades, getNamedAccounts } = hre;
      const { deployer, protocolOwner, trustedForwarder } = await getNamedAccounts();
      const network = await hre.network;
      const deployData = {};
  
      const chainId = chainIdByName(network.name);
      const alchemyTimeout = chainId === 31337 ? 0 : (chainId === 1 ? 5 : 3);
  
      log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
      log('DTO Multichain Bridge Protocol - Mock Token Contract Deployment');
      log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
  
      log('  Using Network: ', chainNameById(chainId));
      log('  Using Accounts:');
      log('  - Deployer:          ', deployer);
      log('  - network id:          ', chainId);
      log('  - Owner:             ', protocolOwner);
      log('  - Trusted Forwarder: ', trustedForwarder);
      log(' ');
  
      log('  Deploying Mock ERC20... named dtoUSD');
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
      
      deployData['ERC20Mock'] = {
        abi: getContractAbi('ERC20Mock'),
        address: mock.address,
        deployTransaction: mock.deployTransaction,
      }
  
      saveDeploymentData(chainId, deployData);
      log('\n  Contract Deployment Data saved to "deployments" directory.');
  
      log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');


  };
  
  module.exports.tags = ['mockerc20']
  