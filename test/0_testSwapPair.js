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

        await tusdt.mint(user2.address);

        console.log("USER2 tUSDT balance: ", (await tusdt.balanceOf(user2.address)).toString() )

        let tBUSD = await ethers.getContractFactory("ERC20Mock")
        let tBUSDInstance = await tBUSD.deploy("tBUSD", "ttBUSD", user1.address, ethers.utils.parseEther('2000')) // 2000 * 10^18 
        tbusd = await tBUSDInstance.deployed()
        console.log("Your tBUSD address: " + tbusd.address);
        console.log("tBUSD balance : " + (await tbusd.balanceOf(user1.address)).toString());
        await tbusd.mint(user2.address);

        console.log("USER2 tBUSD balance: ", (await tbusd.balanceOf(user2.address)).toString() )



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



        let CrossChainStableCoinPool = await ethers.getContractFactory("PairFactory")
        let CrossChainStableCoinPoolInstance = await CrossChainStableCoinPool.deploy(owner.address);  // 50000 * 10^17
        crosschainstablecoinpool = await CrossChainStableCoinPoolInstance.deployed()
        console.log("Your Factory address: " + crosschainstablecoinpool.address);
        console.log("Owner Address : ", owner.address.toString());

        // const CrossChainStableCoinPool = await ethers.getContractFactory("PairFactory");
        // crosschainstablecoinpool = await upgrades.deployProxy(CrossChainStableCoinPool, owner.address , { unsafeAllow: ['delegatecall'], kind: 'uups' }) //unsafeAllowCustomTypes: true,

        // balanceOfLP = (await crosschainstablecoinpool.balanceOf(crosschainstablecoinpool.address)).toString();

    })

    it("Create Pair", async function () {

        console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        console.log('                Create pair              ');
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
        await expect(crosschainstablecoinpool.connect(user1).createPair(tdai.address, dusdc.address)).to.be.revertedWith("not owner")

        await crosschainstablecoinpool.connect(owner).createPair(tusdt.address, dusdc.address)

        console.log("get pair tusdt & dusdc : ", await crosschainstablecoinpool.connect(user1).getPairFromToken(tusdt.address, dusdc.address));

        await expect(crosschainstablecoinpool.connect(owner).createPair(tusdt.address, dusdc.address)).to.be.revertedWith("DTO: PAIR_EXISTS")

        await crosschainstablecoinpool.connect(owner).createPair(tdai.address, tbusd.address)

        console.log("get pair tdai & tbusd : ", await crosschainstablecoinpool.connect(user1).getPairFromToken(tdai.address, tbusd.address));

        console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        console.log('                Add liquidity              ');
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

        let pairAddress = await crosschainstablecoinpool.connect(user1).getPairFromToken(tdai.address, tbusd.address);
        let pairContract = await ethers.getContractAt("SwapPair", pairAddress)
        await tdai.connect(user1).approve(pairContract.address, ethers.utils.parseEther('200'))
        await tbusd.connect(user1).approve(pairContract.address, ethers.utils.parseEther('200'))
        await pairContract.connect(user1).addLiquidity(user1.address, tdai.address, tbusd.address, ethers.utils.parseEther('200'), ethers.utils.parseEther('200'))

        // lp received
        console.log("balanced lp: ", (await pairContract.connect(user1.address).viewUserLP(user1.address)).toString())
        console.log("balance tdai: ", (await tdai.balanceOf(user1.address)).toString())
        console.log("balance tbusd: ", (await tbusd.balanceOf(user1.address)).toString())

        // pool value
        console.log("pool value: ", (await pairContract.connect(user1.address).viewPoolValue()).toString())


        console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        console.log('                SWAP liquidity               ');
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
        
        await tbusd.connect(user2).approve(pairContract.address, ethers.utils.parseEther('188'))
        await pairContract.connect(user2).swapInPair(tbusd.address, tdai.address, ethers.utils.parseEther('188'), user2.address);
        console.log("pool value: ", (await pairContract.connect(user1.address).viewPoolValue()).toString())



        console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        console.log('                Withdraw liquidity               ');
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
        await expect(pairContract.connect(user2).withdrawLiquidity(user1.address, tdai.address, tbusd.address, ethers.utils.parseEther('80'))).to.be.revertedWith("insufficient LP token")
        await pairContract.connect(user1).withdrawLiquidity(user1.address, tdai.address, tbusd.address, ethers.utils.parseEther('10'))

        // lp received
        console.log("balanced lp: ", (await pairContract.connect(user1.address).viewUserLP(user1.address)).toString())
        console.log("balance tdai: ", (await tdai.balanceOf(user1.address)).toString())
        console.log("balance tbusd: ", (await tbusd.balanceOf(user1.address)).toString())

        // pool value
        console.log("pool value: ", (await pairContract.connect(user1.address).viewPoolValue()).toString())




    })

})