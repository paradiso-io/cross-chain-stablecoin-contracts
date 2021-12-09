// const { ethers } = require("hardhat");
// const utils = ethers.utils
// const [BigNumber, getAddress, keccak256, defaultAbiCoder, toUtf8Bytes, solidityPack] =
//   [ethers.BigNumber, utils.getAddress, utils.keccak256, utils.defaultAbiCoder, utils.toUtf8Bytes, utils.solidityPack]

// const { ecsign } = require('ethereumjs-util')

// const { expect, assert } = require('chai')
// const parseEther = utils.parseEther
// const formatEther = utils.formatEther
// const MaxUint256 = ethers.constants.MaxUint256
// let tokenList = ["btc", "eth"]  //test
// let description = tokenList.join("-")

// function readContractAddresses(chainId) {
//   const dtoTokenAddress = require(`../deployments/${chainId}/DTOToken.json`).address
//   const multiPricefeedOracle = require(`../deployments/${chainId}/MultiPriceFeedOracle${description}.json`).address
//   return [dtoTokenAddress, multiPricefeedOracle]
// }

// describe("Multi Price Feed Oracle {}", async () => {

//   it("submit read", async () => {
//     let signers = await ethers.getSigners();
//     const owner = signers[0]
//     signers = signers.slice(0, 10)
//     const signerAddresses = signers.map(e => e.address)
//     //test private keys corresponding to signers
//     const privateKeys = [
//       '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
//       '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
//       '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
//       '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
//       '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
//       '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
//       '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
//       '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
//       '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97',
//       '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6'
//     ]
//     const chainId = await owner.getChainId()

    // const [tokenAddress, multiPriceFeedAddress] = readContractAddresses(chainId);
    // const ERC20Mock = await ethers.getContractFactory('ERC20Mock')
    // const MultiPriceFeedOracle = await ethers.getContractFactory('MultiPriceFeedOracle')

//     const DTOToken = await ERC20Mock.attach(tokenAddress)
//     const MultiPriceFeed = await MultiPriceFeedOracle.attach(multiPriceFeedAddress)

//     //sending payments prepaid to price feed
//     await DTOToken.transfer(MultiPriceFeed.address, parseEther('1000'))
//     //await PriceFeed.addFunds(parseEther('1000'))
//     await MultiPriceFeed.changeOracles(
//       [],
//       signerAddresses,
//       signerAddresses,
//       2,
//       2)

//     const prices = [BigNumber.from(10).pow(8).mul(30000), BigNumber.from(10).pow(8).mul(2000)]

//     let currentRound = await MultiPriceFeed.latestRound()
//     let reportRound = BigNumber.from(currentRound).add(1)
//     let description = await MultiPriceFeed.description()

//     const getSignMessage = function (reportRound, MultiPriceFeed, prices, deadline, tokenList, description) {
//       return keccak256(
//         solidityPack(
//           ['string', 'bytes32'],
//           [
//             '\x19Ethereum Signed Message:\n32',
//             keccak256(
//               defaultAbiCoder.encode(
//                 ['uint32', 'address', 'int256[]', 'uint256', "string[]", "string"],
//                 [reportRound, MultiPriceFeed.address, prices, deadline, tokenList, description]
//               )
//             )
//           ]
//         )
//       )
//     }

//     let messageToSign = getSignMessage(reportRound, MultiPriceFeed, prices, MaxUint256, tokenList, description) 
//     let messageHashBytes = Buffer.from(messageToSign.slice(2), 'hex')
//     let percentX10SubmitterRewards = await MultiPriceFeed.percentX10SubmitterRewards()

//     let rs = []
//     let ss = []
//     let vs = []
//     for (var i = 0; i < 6; i++) {
//       const { v, r, s } = ecsign(messageHashBytes, Buffer.from(privateKeys[i].slice(2), 'hex'))
//       rs.push(r)
//       ss.push(s)
//       vs.push(v)
//     }

//     await expect(MultiPriceFeed.submit(reportRound, prices, MaxUint256, rs, ss, vs)).to.be.revertedWith("PriceFeedOracle::submit Number of submissions under threshold")

//     messageToSign = getSignMessage(reportRound, MultiPriceFeed, prices, MaxUint256, tokenList, description) 
//     messageHashBytes = Buffer.from(messageToSign.slice(2), 'hex')
//     rs = []
//     ss = []
//     vs = []
//     for (var i = 0; i < signerAddresses.length; i++) {
//       const { v, r, s } = ecsign(messageHashBytes, Buffer.from(privateKeys[i].slice(2), 'hex'))
//       rs.push(r)
//       ss.push(s)
//       vs.push(v)
//     }
//     let balsBefore = []
//     for (var i = 0; i < signerAddresses.length; i++) {
//       balsBefore.push(await DTOToken.balanceOf(signerAddresses[i]))
//     }
//     let tx = await MultiPriceFeed.submit(reportRound, prices, MaxUint256, rs, ss, vs)
//     let reciept = await ethers.provider.getTransactionReceipt(tx.hash)
//     console.log('gas used', reciept.gasUsed.toString())
//     await expect(MultiPriceFeed.submit(reportRound, prices, MaxUint256, rs, ss, vs)).to.be.revertedWith("PriceFeedOracle::submit Invalid RoundId")    
//     for (var i = 0; i < signerAddresses.length; i++) {
//       let withdrawablePayment = await MultiPriceFeed.withdrawablePayment(signerAddresses[i])
//       expect(withdrawablePayment).to.eq(parseEther('1').mul(1000 - percentX10SubmitterRewards).div(1000))
//       await MultiPriceFeed.connect(signers[i]).withdrawPayment(signerAddresses[i], signerAddresses[i], withdrawablePayment)
//       let bal = await DTOToken.balanceOf(signerAddresses[i])
//       expect(bal).to.eq(balsBefore[i].add(withdrawablePayment))
//     }

//     //assert round data
//     let tk = await MultiPriceFeed.getTokenList()
//     expect(tk).to.deep.eq(tokenList)

//     let roundInfo = await MultiPriceFeed.getRoundInfo(1)
//     expect(roundInfo.answers).to.deep.eq(prices)

//     reportRound = reportRound.add(1)
//     prices[0] = prices[0] + 1
//     prices[1] = prices[1] + 1
//     messageToSign = getSignMessage(reportRound, MultiPriceFeed, prices, MaxUint256, tokenList, description) 
//     messageHashBytes = Buffer.from(messageToSign.slice(2), 'hex')
//     rs = []
//     ss = []
//     vs = []
//     for (var i = 0; i < signerAddresses.length; i++) {
//       const { v, r, s } = ecsign(messageHashBytes, Buffer.from(privateKeys[i].slice(2), 'hex'))
//       rs.push(r)
//       ss.push(s)
//       vs.push(v)
//     }

//     balsBefore = []
//     for (var i = 0; i < signerAddresses.length; i++) {
//       balsBefore.push(await DTOToken.balanceOf(signerAddresses[i]))
//     }
//     await MultiPriceFeed.submit(reportRound, prices, MaxUint256, rs, ss, vs)
//     await expect(MultiPriceFeed.submit(reportRound, prices, MaxUint256, rs, ss, vs)).to.be.revertedWith("PriceFeedOracle::submit Invalid RoundId")    
//     for (var i = 0; i < signerAddresses.length; i++) {
//       let withdrawablePayment = await MultiPriceFeed.withdrawablePayment(signerAddresses[i])
//       expect(withdrawablePayment).to.eq(parseEther('1').mul(1000 - percentX10SubmitterRewards).div(1000))
//       await MultiPriceFeed.connect(signers[i]).withdrawPayment(signerAddresses[i], signerAddresses[i], withdrawablePayment)
//       let bal = await DTOToken.balanceOf(signerAddresses[i])
//       expect(bal).to.eq(balsBefore[i].add(withdrawablePayment))
//     }
//   })
// });