const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const BigNumber = ethers.BigNumber



describe('Cross chain test', async function () {
  const [owner, , user1, user2, user3, user4, user5, user6, user7, user8, user9, user10, user11, user12, user13] = await ethers.getSigners()
  provider = ethers.provider;
  let balanceOfLP, crosschainstablecoinlp, crosschainstablecoinpool, chaindholding, tusdt, tbusd, tdai, poolValue;

  beforeEach(async () => {
    let tUSDT = await ethers.getContractFactory("ERC20MockDecimals")
    let tUSDTInstance = await tUSDT.deploy("tUSDT", "ttUSDT", user1.address, ethers.utils.parseEther('2000'), 17) // 20000*10^17
    tusdt = await tUSDTInstance.deployed()
    console.log("Your tUSDT address: " + tusdt.address);
    console.log("tUSDT balance : " + (await tusdt.balanceOf(user1.address)).toString());

    let tBUSD = await ethers.getContractFactory("ERC20MockDecimals")
    let tBUSDInstance = await tBUSD.deploy("tBUSD", "ttBUSD", user1.address, ethers.utils.parseEther('200'), 16) // 20000*10^ 16
    tbusd = await tBUSDInstance.deployed()
    console.log("Your tBUSD address: " + tbusd.address);
    console.log("tBUSD balance : " + (await tbusd.balanceOf(user1.address)).toString());

    let tDAI = await ethers.getContractFactory("ERC20MockDecimals")
    let tDAIInstance = await tDAI.deploy("tDAI", "ttDAI", user1.address, ethers.utils.parseEther('20'), 15)  // 20000*10^15
    tdai = await tDAIInstance.deployed()
    console.log("Your tDAI address: " + tdai.address);
    console.log("tDAI balance : " + (await tdai.balanceOf(user1.address)).toString());

    const CrossChainStableCoinPool = await ethers.getContractFactory("CrossChainStableCoinPool");
    crosschainstablecoinpool = await upgrades.deployProxy(CrossChainStableCoinPool, [tusdt.address, tbusd.address, tdai.address], { unsafeAllow: ['delegatecall'], kind: 'uups' }) //unsafeAllowCustomTypes: true,

    balanceOfLP = (await crosschainstablecoinpool.balanceOf(crosschainstablecoinpool.address)).toString();

  })

  it("AddLiquidity Test", async function () {

    //await crosschainstablecoinpool.add(user1.address,100000);
     poolValue = await crosschainstablecoinpool.calculatePoolValue();
    
    console.log("pool  balance: " + balanceOfLP);
    console.log("Owner address: " + owner.address);
    console.log("user1 address: " + user1.address);

    console.log("Add Liquidity Test: " + balanceOfLP);

    await tusdt.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('1000'))
    await tbusd.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('100'))
    await tdai.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('10'))
    
    
    await crosschainstablecoinpool.connect(user1).addLiquidity(user1.address, [ethers.utils.parseEther('500'), ethers.utils.parseEther('60'), ethers.utils.parseEther('4')])
    console.log("tUSDT balance in 18 decimals : " + (await tusdt.balanceOf(user1.address)).toString());
    console.log("tBUSD balance in 18 decimals : " + (await tbusd.balanceOf(user1.address)).toString());
    console.log("tDAI balance in 18 decimals : " + (await tdai.balanceOf(user1.address)).toString());
    console.log("Total received LP user1 in 18 decimals : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());
    console.log("LP balance user1 in 18 decimals : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());


    await crosschainstablecoinpool.connect(user1).addLiquidity(user1.address, [ethers.utils.parseEther('30'), ethers.utils.parseEther('2'), ethers.utils.parseEther('0')])
    console.log("tUSDT balance : " + (await tusdt.balanceOf(user1.address)).toString());
    console.log("Total received LP user1 in 18 decimals : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());
    console.log("LP balance user1 in 18 decimals : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());
    console.log (poolValue.toString());
  })

  it("SWAP Test", async function () {

    await tusdt.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('1000'))
    await tbusd.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('100'))
    await tdai.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('10'))

    await crosschainstablecoinpool.connect(user1).addLiquidity(user1.address, [ethers.utils.parseEther('500'), ethers.utils.parseEther('50'), ethers.utils.parseEther('6')])
    console.log("tUSDT balance : " + (await tusdt.balanceOf(user1.address)).toString());
    console.log("Total received LP user1 : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());
    console.log("LP balance user1 : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());

    
    console.log("pool  balance: " + balanceOfLP);
    console.log("Owner address: " + owner.address);
    console.log("user1 address: " + user1.address);

    console.log("====== SWAP Test =======: " + balanceOfLP);

    console.log("tUSDT balance : " + (await tusdt.balanceOf(user1.address)).toString());
    console.log("tBUSD balance : " + (await tbusd.balanceOf(user1.address)).toString());
    console.log("tDAI balance : " + (await tdai.balanceOf(user1.address)).toString());

    await crosschainstablecoinpool.connect(user1).swap([ethers.utils.parseEther('0'), ethers.utils.parseEther('10'), ethers.utils.parseEther('2')], [ethers.utils.parseEther('250'), ethers.utils.parseEther('0'), ethers.utils.parseEther('0')], user1.address)
    

    console.log("====== After Swap =======");
    console.log("tUSDT balance : " + (await tusdt.balanceOf(user1.address)).toString());
    console.log("tBUSD balance : " + (await tbusd.balanceOf(user1.address)).toString());
    console.log("tDAI balance : " + (await tdai.balanceOf(user1.address)).toString());

    console.log("========================== ");
    console.log("Total received LP user1 : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());
    console.log("LP balance user1 : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());

  })


  it("WITHDRAW Test", async function () {

    await tusdt.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('1000'))
    await tbusd.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('100'))
    await tdai.connect(user1).approve(crosschainstablecoinpool.address, ethers.utils.parseEther('10'))

    await crosschainstablecoinpool.connect(user1).addLiquidity(user1.address, [ethers.utils.parseEther('500'), ethers.utils.parseEther('50'), ethers.utils.parseEther('5')])
    console.log("tUSDT balance : " + (await tusdt.balanceOf(user1.address)).toString());
    console.log("Total received LP user1 : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());
    console.log("LP balance user1 : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());


    await crosschainstablecoinpool.connect(user1).swap([ethers.utils.parseEther('50'), ethers.utils.parseEther('0'), ethers.utils.parseEther('2')], [ethers.utils.parseEther('0'), ethers.utils.parseEther('24'), ethers.utils.parseEther('0')], user1.address)
    

    console.log("====== After Swap =======");
    console.log("tUSDT balance : " + (await tusdt.balanceOf(user1.address)).toString());
    console.log("tBUSD balance : " + (await tbusd.balanceOf(user1.address)).toString());
    console.log("tDAI balance : " + (await tdai.balanceOf(user1.address)).toString());

    console.log("========================== ");
    console.log("Total received LP user1 : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());
    console.log("LP balance user1 : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());

    await crosschainstablecoinpool.connect(user1).withdrawLiquidity(user1.address, [ethers.utils.parseEther('100'), ethers.utils.parseEther('10'), ethers.utils.parseEther('1')])
    console.log("====== withdraw test =======");
    console.log("tUSDT balance : " + (await tusdt.balanceOf(user1.address)).toString());
    console.log("Total received LP user1 : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());
    console.log("LP balance user1 : " + (await crosschainstablecoinpool.balanceOf(user1.address)).toString());

  })

  

})
