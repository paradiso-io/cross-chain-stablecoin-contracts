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
    // const crossChain = await upgrades.deployProxy(CrossChainStableCoinPool, [["0x7327De0069D0F6Bfe147AadFD82Ffe9B002B0BF7", "0x43A0526651Db60232014367596c076140337889B", "0x545d7f2a1478149d6A485A117b2A74E5535650dB", "0x2959BF46eA1eaeF6c28228749aAfDB696C0C4215"]], { unsafeAllow: ['delegatecall'],unsafeAllowCustomTypes: true, kind: 'uups', gasLimit: 1000000 })
    const crossChain = await upgrades.deployProxy(CrossChainStableCoinPool, [["0x9a4C0e05a2107C5632DBe0AbdB0E9dac03226fD7", "0xc99CfCb559F73515358341f22dD72bF05559c696", "0x8941CAF5E98F83A8234d7ebe38Bc88e5B296890B"]], { unsafeAllow: ['delegatecall'],unsafeAllowCustomTypes: true, kind: 'uups', gasLimit: 1000000 })
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
