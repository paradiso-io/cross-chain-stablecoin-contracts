const {
    chainNameById,
    chainIdByName,
    saveDeploymentData,
    getContractAbi,
    getTxGasCost,
    log
  } = require("../js-helpers/deploy");
  
  const _ = require('lodash');
  const IERC20ABI = require('../abi/ERC20Mock.json')
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
  
      log('  Deploying Mock ERC20...');
    //   const ERC20Mock = await ethers.getContractFactory('ERC20Mock');
    //   const ERC20MockInstance = await ERC20Mock.deploy("USDC", "USDC", "deployer", '1000000000000000000000000000')
    //   const mock = await ERC20MockInstance.deployed()
    mock = await ethers.getContractAt(IERC20ABI, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512")
    await mock.mint("0xA31C96271dC8beD62e23658Cc7E5FF165C248FC6")
    mock2 = await ethers.getContractAt(IERC20ABI, "0xE7FAB7f691189625aaA946a164fAC186b7fbB62F")
    await mock2.mint("0xA31C96271dC8beD62e23658Cc7E5FF165C248FC6")
    mock3 = await ethers.getContractAt(IERC20ABI, "0xBB20ec704a8aF96ED1bFb76F69cDFeba2c8d93E7")
    await mock3.mint("0xA31C96271dC8beD62e23658Cc7E5FF165C248FC6")
      log('  - ERC20Mock:         ', mock.address);
      deployData['ERC20Mock'] = {
        abi: getContractAbi('ERC20Mock'),
        address: mock.address,
        deployTransaction: mock.deployTransaction,
      }
  
      saveDeploymentData(chainId, deployData);
      log('\n  Contract Deployment Data saved to "deployments" directory.');
  
      log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
  };
  
  module.exports.tags = ['minterc20']
  