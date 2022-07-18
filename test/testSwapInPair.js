const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const BigNumber = ethers.BigNumber



describe('Cross chain test', async function () {
  const [owner, , user1, user2, user3, user4, user5, user6, user7, user8, user9, user10, user11, user12, user13] = await ethers.getSigners()
  provider = ethers.provider;
  let balanceOfLP, crosschainstablecoinlp, crosschainstablecoinpool, chaindholding, tusdt, tbusd, tdai, dusdc, poolValue;

  beforeEach(async () => {
    let tUSDT = await ethers.getContractFactory("ERC20Mock")
    let tUSDTInstance = await tUSDT.deploy("tUSDT", "ttUSDT", user1.address, ethers.utils.parseEther('2000')) // 2000 * 10^18
    tusdt = await tUSDTInstance.deployed()
    console.log("Your tUSDT address: " + tusdt.address);
    console.log("tUSDT balance : " + (await tusdt.balanceOf(user1.address)).toString());

    let tBUSD = await ethers.getContractFactory("ERC20Mock")
    let tBUSDInstance = await tBUSD.deploy("tBUSD", "ttBUSD", user1.address, ethers.utils.parseEther('2000')) // 2000 * 10^18 
    tbusd = await tBUSDInstance.deployed()
    console.log("Your tBUSD address: " + tbusd.address);
    console.log("tBUSD balance : " + (await tbusd.balanceOf(user1.address)).toString());

    let tDAI = await ethers.getContractFactory("ERC20Mock")
    let tDAIInstance = await tDAI.deploy("tDAI", "ttDAI", user1.address, ethers.utils.parseEther('2000'))  // 2000 * 10^18
    tdai = await tDAIInstance.deployed()
    console.log("Your tDAI address: " + tdai.address);
    console.log("tDAI balance : " + (await tdai.balanceOf(user1.address)).toString());


    let dUSDC = await ethers.getContractFactory("ERC20MockDecimals")
    let dUSDCInstance = await dUSDC.deploy("dUSDC", "dUSDC", user1.address, ethers.utils.parseEther('4000'), 16)  // 400000 * 10^16
    dusdc = await dUSDCInstance.deployed()
    console.log("Your dUSDC address: " + dusdc.address);
    console.log("dUSDC balance : " + (await dusdc.balanceOf(user1.address)).toString());



    let dNAI = await ethers.getContractFactory("ERC20MockDecimals")
    let dNAIInstance = await dNAI.deploy("dNAI", "dNAI", user1.address, ethers.utils.parseEther('5000'), 17)  // 50000 * 10^17
    dnai = await dNAIInstance.deployed()
    console.log("Your dNAI address: " + dnai.address);
    console.log("dNAI balance : " + (await dnai.balanceOf(user1.address)).toString());



    const CrossChainStableCoinPool = await ethers.getContractFactory("StableCoinPair");
    crosschainstablecoinpool = await upgrades.deployProxy(CrossChainStableCoinPool, [[tusdt.address, tbusd.address, tdai.address]], { unsafeAllow: ['delegatecall'], kind: 'uups' }) //unsafeAllowCustomTypes: true,

    balanceOfLP = (await crosschainstablecoinpool.balanceOf(crosschainstablecoinpool.address)).toString();

  })

  it("AddLiquidity and SwapInPair Test", async function () {

    console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log('                START ADD LIQUIDITY              ');
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

    //await crosschainstablecoinpool.add(user1.address,100000);
    poolValue = await crosschainstablecoinpool.calculatePoolValue();

    console.log("pool  balance: " + balanceOfLP);
    console.log("Owner address: " + owner.address);
    console.log("user1 address: " + user1.address);

    console.log("Add Liquidity Test: " + balanceOfLP);

    await tusdt.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('1000'))
    await tbusd.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('1000'))
    await tdai.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('1000'))

    await crosschainstablecoinpool.connect(user1).addLiquidity(user1.address, [ethers.utils.parseEther('500'), ethers.utils.parseEther('600'), ethers.utils.parseEther('400')])
    console.log("tUSDT balance in 18 decimals : " + (await tusdt.balanceOf(user1.address)).toString());
    console.log("tBUSD balance in 18 decimals : " + (await tbusd.balanceOf(user1.address)).toString());
    console.log("tDAI balance in 18 decimals : " + (await tdai.balanceOf(user1.address)).toString());
    console.log("Total received LP user1 in 18 decimals : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());
    console.log("LP balance user1 in 18 decimals : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());

    await crosschainstablecoinpool.connect(user1).addLiquidity(user1.address, [ethers.utils.parseEther('30'), ethers.utils.parseEther('2'), ethers.utils.parseEther('0')])
    console.log("tUSDT balance : " + (await tusdt.balanceOf(user1.address)).toString());
    console.log("Total received LP user1 in 18 decimals : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());
    console.log("LP balance user1 in 18 decimals : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());
    poolValue = await crosschainstablecoinpool.viewPoolValue();
    console.log("==> POOL VALUES: ", poolValue.toString());


    console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log('                Create Pair             ');
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

    //await crosschainstablecoinpool.add(user1.address,100000);

    console.log("pool  balance: " + balanceOfLP);
    console.log("Owner address: " + owner.address);
    console.log("user1 address: " + user1.address);

    console.log("Add Liquidity Test: " + balanceOfLP);

    await tusdt.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('1000'))
    await tbusd.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('1000'))
    await tdai.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('1000'))

    // Add new stable coin 
    await crosschainstablecoinpool.addStableCoinList(dusdc.address);
    await expect(crosschainstablecoinpool.addStableCoinList(dusdc.address)).to.be.revertedWith("StableCoin exist")

    let length = await crosschainstablecoinpool.allPairsLength();

    console.log("allPairsLength : ", length.toString())

    // Add new pair

    let getpair = await crosschainstablecoinpool.getPair(tdai.address, dusdc.address)
    console.log("getPair : ", getpair.toString())


    await expect(crosschainstablecoinpool.connect(owner).createPair(tdai.address, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')).to.be.revertedWith("Token not in stable coin list")

    await crosschainstablecoinpool.connect(owner).createPair(tdai.address, dusdc.address)


    getpair = await crosschainstablecoinpool.getPair(tdai.address, dusdc.address)
    console.log("getPair : ", getpair.toString())

    length = await crosschainstablecoinpool.allPairsLength();

    console.log("allPairsLength : ", length.toString())


    await expect(crosschainstablecoinpool.connect(owner).createPair(tdai.address, dusdc.address)).to.be.revertedWith("ERROR: PAIR_EXISTS")

    await expect(crosschainstablecoinpool.connect(owner).createPair(tdai.address, '0x0000000000000000000000000000000000000000')).to.be.revertedWith("Token should be not : ZERO_ADDRESS")


    console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log('                SWAP TEST             ');
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

    // User1 addliquidity for dUSDC
    await dusdc.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('1000'))
    await crosschainstablecoinpool.connect(user1).addLiquidity(user1.address, [ethers.utils.parseEther('500'), ethers.utils.parseEther('600'), ethers.utils.parseEther('400'), ethers.utils.parseEther('200')])



    // Balance before swap

    console.log("tDAI balance before swap : " + (await tdai.balanceOf(user1.address)).toString());
    console.log("dUSDC balance before swap : " + (await dusdc.balanceOf(user1.address)).toString());
    console.log("==> POOL VALUES before swap: " + (await crosschainstablecoinpool.viewPoolValue()).toString());

    // User1 swap tDAI to dUSDC


    await expect(crosschainstablecoinpool.connect(user1).swapInPair(tdai.address, dusdc.address, 2, ethers.utils.parseEther('100'), user1.address)).to.be.revertedWith("wrong pair")
    await crosschainstablecoinpool.connect(user1).swapInPair(tdai.address, dusdc.address, 1, ethers.utils.parseEther('100'), user1.address)


    console.log("tDAI balance after swap : " + (await tdai.balanceOf(user1.address)).toString());
    console.log("dUSDC balance after swap : " + (await dusdc.balanceOf(user1.address)).toString());

    // Pool value = total stable coin value + total swap fee

    console.log("==> POOL VALUES afeter swap: " + (await crosschainstablecoinpool.viewPoolValue()).toString());


  })


  it("WITHDRAW Test", async function () {

    await tusdt.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('10000'))
    await tbusd.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('10000'))
    await tdai.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('10000'))

    await crosschainstablecoinpool.connect(user1).addLiquidity(user1.address, [ethers.utils.parseEther('100'), ethers.utils.parseEther('200'), ethers.utils.parseEther('300')])
    console.log("tUSDT balance : " + (await tusdt.balanceOf(user1.address)).toString());
    console.log("tBUSD balance : " + (await tbusd.balanceOf(user1.address)).toString());
    console.log("tDAI balance  : " + (await tdai.balanceOf(user1.address)).toString());
    console.log("Total received LP user1 : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());
    console.log("LP balance user1 : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());

    await crosschainstablecoinpool.connect(user1).withdrawLiquidity(user1.address, 40, [ethers.utils.parseEther('10'), ethers.utils.parseEther('10'), ethers.utils.parseEther('15')])
    console.log("====== withdraw test =======");
    console.log("tUSDT balance : " + (await tusdt.balanceOf(user1.address)).toString());
    console.log("tBUSD balance : " + (await tbusd.balanceOf(user1.address)).toString());
    console.log("tDAI balance  : " + (await tdai.balanceOf(user1.address)).toString());
    console.log("Total received LP user1 : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());
    console.log("LP balance user1 : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());
  })



})
