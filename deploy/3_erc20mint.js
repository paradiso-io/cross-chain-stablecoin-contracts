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

  if (chainId == 31337) return;

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
  mock = await ethers.getContractAt(IERC20ABI, "0x29Bb50C806fEb7f5fbE29884b7513De7CA4803F6")
  await mock.mint("0x0A6B75C3Fe3f1AfD487fcbD90EE8bec8098FA48a")
  mock2 = await ethers.getContractAt(IERC20ABI, "0x8B98b1de6be7f2EBa490a63ED00782460B51B3A3")
  await mock2.mint("0x0A6B75C3Fe3f1AfD487fcbD90EE8bec8098FA48a")
  mock3 = await ethers.getContractAt(IERC20ABI, "0x94e875e62750cB52aa6a6E14eB73Aefd8A2F5f3C")
  await mock3.mint("0x0A6B75C3Fe3f1AfD487fcbD90EE8bec8098FA48a")
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
