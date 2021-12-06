pragma solidity >=0.5.16;

import './interfaces/ICrossChainStableCoinLP.sol';
import './CrossChainStableCoinLP.sol';
import './libraries/Math.sol';
import './libraries/UQ112x112.sol';
import './interfaces/IERC20.sol';
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

contract CrossChainStableCoinPool is CrossChainStableCoinLP {
    using SafeMath for uint;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    event AddLiquidity(address indexed sender, uint amount0);
    event Burn(address indexed sender, uint amount0, uint amount1, uint amount2, address indexed to);
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount2In,
        uint amount0Out,
        uint amount1Out,
        uint amount2Out,
        address indexed to
    );
    event Sync(uint reserve0, uint reserve1, uint reserve2);

    // uint public constant override MINIMUM_LIQUIDITY = 10**3;
    bytes4 private constant SELECTOR = bytes4(keccak256(bytes('transfer(address,uint256)')));
    uint totalPoolValue = totalSupply;
    uint public swapFee = 20;   // 0.2% = 20/10000
    uint public constant PERCENTAGE = 10000;

    address public token0;
    address public token1;
    address public token2;

    uint8 public decimals0;
    uint8 public decimals1;
    uint8 public decimals2;

    // Because decimals may be different from one to the other, so we need convert all to 18 decimals token. 
    uint[3] convertedAmountsIn;
    uint[3] convertedAmountsOut;

    uint private unlocked = 1;
    modifier lock() {
        require(unlocked == 1, 'CrossChainStableCoinPool: LOCKED');
        unlocked = 0;
        _;
        unlocked = 1;
    }


    function _safeTransfer(address token, address to, uint value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(SELECTOR, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'CrossChainStableCoinPool: TRANSFER_FAILED');
    }

    // called once by the factory at time of deployment
    function initialize(address _token0, address _token1, address _token2) external initializer {
        __DTOUpgradeableBase_initialize();
        token0 = _token0;
        token1 = _token1;
        token2 = _token2;
        decimals0 = IERC20(token0).decimals();
        decimals1 = IERC20(token1).decimals();
        decimals2 = IERC20(token2).decimals();
    }

    function convertTo18Decimals(address _token , uint amount) public returns(uint) {
        return(amount.mul((10**(18 - IERC20(_token).decimals()))));
    }

    function addLiquidity(address _to, uint[3] memory amountsIn) external returns(bool) {

        uint totalReceivedLP = 0;

        // Calculate the input amount to 18 decimals token 
        convertedAmountsIn[0]= convertTo18Decimals(token0, amountsIn[0]);
        convertedAmountsIn[1]= convertTo18Decimals(token1, amountsIn[1]);
        convertedAmountsIn[2]= convertTo18Decimals(token2, amountsIn[2]);
        
        IERC20Upgradeable(token0).safeTransferFrom(msg.sender, address(this), amountsIn[0]);
        IERC20Upgradeable(token1).safeTransferFrom(msg.sender, address(this), amountsIn[1]);
        IERC20Upgradeable(token2).safeTransferFrom(msg.sender, address(this), amountsIn[2]);

        // calculate total amount input
        uint totalAddIn = 0;
        for(uint i = 0; i < amountsIn.length; i++) {
            totalAddIn += convertedAmountsIn[i];
        }

        //calculate the total received LP that provider can received
        totalReceivedLP = totalAddIn.mul(totalSupply).div(totalPoolValue);

        // send LP token to provider
        _mint(_to, totalReceivedLP);

        emit AddLiquidity(msg.sender, totalReceivedLP);

    }

    // this low-level function should be called from a contract which performs important safety checks
    function swap(uint[3] memory amountsIn, uint[3] memory amountsOut, address to) external lock {

        // make sure we have enough amount in the pool for withdrawing
        require(amountsOut[0] <= IERC20(token0).balanceOf(address(this)), "insufficient amount out 0");
        require(amountsOut[1] <= IERC20(token1).balanceOf(address(this)), "insufficient amount out 1");
        require(amountsOut[2] <= IERC20(token2).balanceOf(address(this)), "insufficient amount out 2");
        
        // Convert the input amount to 18 decimals token 
        convertedAmountsIn[0]= amountsIn[0].mul(10**(18-decimals0));
        convertedAmountsIn[1]= amountsIn[1].mul(10**(18-decimals1));
        convertedAmountsIn[2]= amountsIn[2].mul(10**(18-decimals2));

        // calculate total amount input
        uint totalIn = 0;
        for(uint i = 0; i < amountsIn.length; i++) {
            totalIn += convertedAmountsIn[i];
        }

        // Convert the out amount to 18 decimals token 
        convertedAmountsOut[0]= convertTo18Decimals(token0, amountsOut[0]);
        convertedAmountsOut[1]= convertTo18Decimals(token1, amountsOut[1]);
        convertedAmountsOut[2]= convertTo18Decimals(token2, amountsOut[2]);

        // calculate total amount output
        uint totalOut = 0;
        for(uint i = 0; i < amountsOut.length; i++) {
            totalOut += convertedAmountsOut[i];
        }

        // Make sure that Output is smaller than Input minus the swapfee
        require(totalOut <= totalIn - totalIn * swapFee / PERCENTAGE, "insufficient amount in");


        IERC20Upgradeable(token0).safeTransferFrom(msg.sender, address(this), amountsIn[0]);
        IERC20Upgradeable(token1).safeTransferFrom(msg.sender, address(this), amountsIn[1]);
        IERC20Upgradeable(token2).safeTransferFrom(msg.sender, address(this), amountsIn[2]);

        //transfer token to recipient
        // confirm with Cam
        IERC20Upgradeable(token0).safeTransferFrom(address(this), to, amountsOut[0]);
        IERC20Upgradeable(token1).safeTransferFrom(address(this), to, amountsOut[1]);
        IERC20Upgradeable(token2).safeTransferFrom(address(this), to, amountsOut[2]);

        // add swapfee to totalPoolValue
        totalPoolValue = totalPoolValue + totalIn * swapFee / PERCENTAGE;
        
        emit Swap(msg.sender, amountsIn[0], amountsIn[1], amountsIn[2], amountsOut[0], amountsOut[1], amountsOut[2], to);
    }


    function withdrawLiquidity(address _to, uint totalWithdraw, uint[3] memory amountsOut) external returns(bool) {

        uint totalMinusLP = 0;

        // Calculate the withdraw amount to 18 decimals token 
        convertedAmountsOut[0]= convertTo18Decimals(token0, amountsOut[0]);
        convertedAmountsOut[1]= convertTo18Decimals(token1, amountsOut[1]);
        convertedAmountsOut[2]= convertTo18Decimals(token2, amountsOut[2]);

        // calculate total amount output
        uint totalOut = 0;
        for(uint i = 0; i < amountsOut.length; i++) {
            totalOut += convertedAmountsIn[i];
        }
        
        //calculate the total minus LP that withdrawer have to pay
        totalMinusLP = uint(totalOut.mul(totalSupply).div(totalPoolValue));

        // Make sure total withdraw is bigger than to sum of 3 token value the customer want to withdraw
        require(totalWithdraw >= totalMinusLP);
        // send token to Withdrawer
        IERC20Upgradeable(token0).safeTransfer(_to, amountsOut[0]);
        IERC20Upgradeable(token1).safeTransfer(_to, amountsOut[1]);
        IERC20Upgradeable(token2).safeTransfer(_to, amountsOut[2]);

        // burn LP after withdrawing
        _burn(msg.sender, totalWithdraw);

    }

}