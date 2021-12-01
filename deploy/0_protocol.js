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

    log('  Deploying DTO Pegged Swap Factory...');
    const DTOPeggedSwapFactory = await ethers.getContractFactory('DTOPeggedSwapFactory');
    const DTOPeggedSwapFactoryInstance = await DTOPeggedSwapFactory.deploy(feeToSetter)
    const factory = await DTOPeggedSwapFactoryInstance.deployed()
    log('  - DTOPeggedSwapFactory:         ', factory.address);
    deployData['DTOPeggedSwapFactory'] = {
      abi: getContractAbi('DTOPeggedSwapFactory'),
      address: factory.address,
      deployTransaction: factory.deployTransaction,
    }

    log('  Deploying DTO Pegged Swap Router...');
    const DTOPeggedSwapRouter = await ethers.getContractFactory('DTOPeggedSwapRouter');
    const DTOPeggedSwapRouterInstance = await DTOPeggedSwapRouter.deploy(factory.address, WETH(chainId))
    const router = await DTOPeggedSwapRouterInstance.deployed()
    log('  - DTOPeggedSwapRouter:         ', router.address);
    deployData['DTOPeggedSwapRouter'] = {
      abi: getContractAbi('DTOPeggedSwapRouter'),
      address: router.address,
      deployTransaction: router.deployTransaction,
    }

    saveDeploymentData(chainId, deployData);
    log('\n  Contract Deployment Data saved to "deployments" directory.');

    log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['protocol']
