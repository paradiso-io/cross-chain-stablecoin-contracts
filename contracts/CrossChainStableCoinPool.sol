pragma solidity >=0.5.16;

import "./interfaces/ICrossChainStableCoinLP.sol";
import "./CrossChainStableCoinLP.sol";
import "./libraries/Math.sol";
import "./libraries/UQ112x112.sol";
import "./interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

contract CrossChainStableCoinPool is CrossChainStableCoinLP {
    using SafeMath for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    

    event AddLiquidity(address indexed sender, uint256 amount0);
    event Burn(
        address indexed sender,
        uint256 amount0,
        uint256 amount1,
        uint256 amount2,
        address indexed to
    );
    event Swap(
        address indexed sender,
        uint256[] amountIn,
        uint256[] amountOut,
        address indexed to
    );
    event Sync(uint256 reserve0, uint256 reserve1, uint256 reserve2);

    // uint public constant override MINIMUM_LIQUIDITY = 10**3;
    bytes4 private constant SELECTOR =
        bytes4(keccak256(bytes("transfer(address,uint256)")));
    uint256 totalPoolValue;
    uint256 public swapFee; /// 0.2% = 20/10000
    uint256 public buyBackTreasury;
    uint256 public totalFee;
    uint256 public constant PERCENTAGE = 10000;

    // address public token0;
    // address public token1;
    // address public token2;
    address[] public stableCoinList;
    uint8[] public decimals0;

    // uint8 public decimals0;
    // uint8 public decimals1;
    // uint8 public decimals2;
    bool isEnableBuyBackTreasury;
     

    // Because decimals may be different from one to the other, so we need convert all to 18 decimals token.
    
    uint256[3] convertedAmountsOut;

    uint256 private unlocked;
    modifier lock() {
        require(unlocked == 1, "CrossChainStableCoinPool: LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    function _safeTransfer(
        address token,
        address to,
        uint256 value
    ) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(SELECTOR, to, value)
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "CrossChainStableCoinPool: TRANSFER_FAILED"
        );
    }
    
    // called once by the factory at time of deployment
    function __CrossChainStableCoinPool_initialize(
        //uint256 length,
        address[] memory stableCoin
    ) public initializer {
        __DTOUpgradeableBase_initialize();
        __CrossChainStableCoinLP_initialize();
        totalFee = 30;
        isEnableBuyBackTreasury = false;
        unlocked = 1;
// list of stableCoin
        //stableCoin = new address[](length);
        stableCoinList = new address[](stableCoin.length);
        for (uint256 i = 0; i < stableCoinList.length; i++) {
            stableCoinList[i] = stableCoin[i];
        }

        //Decimals of stableCoin
        decimals0  = new uint8[](stableCoin.length);
        for (uint256 i = 0; i < stableCoinList.length; i++) {
            decimals0[i] = IERC20(stableCoinList[i]).decimals();
        }
    }

    function setBuyBackTreasury(bool _isEnableBuyBackTreasury)
        public onlyOwner
        returns (bool)
    {
        if (_isEnableBuyBackTreasury != isEnableBuyBackTreasury) {
            isEnableBuyBackTreasury = _isEnableBuyBackTreasury;
        }
        else {
            return false;
        }
        return true;
    }    

    // function calculateTotalFee() public view returns(uint _totalFee) {
    //     if (isEnableBuyBackTreasury == true) {
    //         _totalFee = swapFee + buyBackTreasury;
    //     } else {
    //         _totalFee = swapFee;
    //     }
    // }
    function calculateFee() public  {
        if (isEnableBuyBackTreasury == true) {
             swapFee = 20;
             buyBackTreasury = 10;
             require(totalFee == swapFee + buyBackTreasury);
        } else {
            swapFee = totalFee;
        }
    }

    function convertTo18Decimals(address _token, uint256 amount)
        public
        view
        returns (uint256)
    {
        return (amount.mul((10**(18 - IERC20(_token).decimals()))));
    }

    function calculatePoolValue() public returns (uint256) {

        for (uint256 i = 0; i < stableCoinList.length; i++) {
            totalPoolValue += IERC20(stableCoinList[i]).balanceOf(address(this)).mul
                (10**(18 - IERC20(stableCoinList[i]).decimals()));
        }
        return totalPoolValue;
    }    
    
    function _calculatePoolValue() public view returns (uint _totalPoolValue) {
        _totalPoolValue = totalPoolValue;
        return _totalPoolValue;
    }
// ADDLIQUIDITY FUNCTION
    function addLiquidity(address _from, uint256[] memory amountsIn)
        public
        returns (uint256)
    {
        require(amountsIn.length == stableCoinList.length, "input not enough StableCoin list");
        uint256 totalReceivedLP = 0;
        uint256[] memory convertedAmountsIn = new uint256[](stableCoinList.length);
        // Calculate the input amount to 18 decimals token

        for (uint256 i = 0; i < stableCoinList.length; i++) {
            convertedAmountsIn[i] = convertTo18Decimals(stableCoinList[i], amountsIn[i]);
        }
        // calculate total amount input
        uint256 totalAddIn = 0;
        for (uint256 i = 0; i < amountsIn.length; i++) {
            totalAddIn += convertedAmountsIn[i];
        }

        calculatePoolValue();
        _calculatePoolValue();
        //calculate the total received LP that provider can received
        if (totalSupply == 0) {
            totalReceivedLP = totalAddIn;
        } else {
            totalReceivedLP = totalAddIn.mul(totalSupply).div(totalPoolValue);
        }
        

        for (uint256 i = 0; i < amountsIn.length; i++) {
            IERC20Upgradeable(stableCoinList[i]).safeTransferFrom(
            msg.sender,
            address(this),
            amountsIn[i]
        );
        }
        // send LP token to provider
        _mint(_from, totalReceivedLP);
        emit AddLiquidity(msg.sender, totalReceivedLP);
        return totalReceivedLP;
    }


// SWAP FUNCTION
    // this low-level function should be called from a contract which performs important safety checks
    function swap(
        uint256[] memory amountsIn,
        uint256[] memory amountsOut,
        address to
    ) public lock {
        // make sure we have enough amount in the pool for withdrawing
        
        for (uint256 i = 0; i < stableCoinList.length; i++) {
            require(
            amountsOut[i] <= IERC20(stableCoinList[i]).balanceOf(address(this)),
            "insufficient amount out"
        );
        }
        require(
            amountsIn.length == stableCoinList.length,
            "Wrong stablecoin list amount in "
        );
        require(
            amountsOut.length == stableCoinList.length,
            "Wrong stablecoin list amount Out "
        );
        uint256[] memory convertedAmountsIn = new uint256[](stableCoinList.length);
        uint256[] memory convertedAmountsOut = new uint256[](stableCoinList.length);
        // Convert the input amount to 18 decimals token
        for (uint256 i = 0; i < stableCoinList.length; i++) {
           // convertedAmountsIn[i] = amountsIn[i].mul(10**(18 - decimals0[i]));
           convertedAmountsIn[i] = convertTo18Decimals(stableCoinList[i], amountsIn[i]);
        }

        // calculate total amount input
        uint256 totalIn = 0;
        for (uint256 i = 0; i < amountsIn.length; i++) {
            totalIn += convertedAmountsIn[i];
        }
        // Convert the out amount to 18 decimals token
        for (uint256 i = 0; i < stableCoinList.length; i++) {
            convertedAmountsOut[i] = convertTo18Decimals(stableCoinList[i], amountsOut[i]);
        }

        // calculate total amount output
        uint256 totalOut = 0;
        for (uint256 i = 0; i < amountsOut.length; i++) {
            totalOut += convertedAmountsOut[i];
        }

        // Make sure that Output is smaller than Input minus the swapfee
        calculateFee();
        require(
            totalOut <= totalIn - (totalIn * totalFee) / PERCENTAGE,
            "insufficient amount in"
        );

        // for (uint256 i = 0; i < stableCoinList.length; i++) {
        //     IERC20Upgradeable(stableCoinList[i]).safeTransferFrom(
        //     msg.sender,
        //     address(this),
        //     amountsIn[i]
        // );
        // }

        //transfer token to recipient

        for (uint256 i = 0; i < stableCoinList.length; i++) {
            IERC20Upgradeable(stableCoinList[i]).safeTransfer(
            to,
            amountsOut[i]
        );
        }
        // add swapfee to totalPoolValue
        // totalPoolValue = totalPoolValue + (totalIn * swapFee) / PERCENTAGE;

        emit Swap(
            msg.sender,
            amountsIn,
            amountsOut,
            to
        );
    }
// WITHDRAW LIQUIDITY FUNCTION
    function withdrawLiquidity(
        address _to,
       // uint256 totalWithdraw,
        uint256[] memory amountsOut
    ) external returns (bool) {
        // require(
        //     totalWithdraw >= totalIn - (totalIn * totalFee) / PERCENTAGE,
        //     "insufficient amount in"
        // );
        require(
            amountsOut.length == stableCoinList.length,
            "Wrong stablecoin list amount Out "
        );
        uint256 totalMinusLP ;
        uint256[] memory convertedAmountsOut = new uint256[](stableCoinList.length);

        // Calculate the withdraw amount to 18 decimals token
        for (uint256 i = 0; i < stableCoinList.length; i++) {
           convertedAmountsOut[i] = convertTo18Decimals(stableCoinList[i], amountsOut[i]);
        }

        // calculate total amount output
        uint256 totalOut = 0;
        for (uint256 i = 0; i < amountsOut.length; i++) {
            totalOut += convertedAmountsOut[i];
        }

        calculatePoolValue();
        _calculatePoolValue();
        //calculate the total minus LP that withdrawer have to pay
        totalMinusLP = totalOut.mul(totalSupply).div(totalPoolValue);

        // Make sure total withdraw is bigger than to sum of 3 token value the customer want to withdraw
        // require(totalWithdraw >= totalMinusLP);
        // send token to Withdrawer
        for (uint256 i = 0; i < stableCoinList.length; i++) {
           IERC20Upgradeable(stableCoinList[i]).safeTransfer(_to, amountsOut[i]);
        }
        // burn LP after withdrawing
        _burn(msg.sender, totalMinusLP);
    }
}
