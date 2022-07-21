pragma solidity >=0.8.0;

import "./interfaces/ICrossChainStableCoinLP.sol";
import "./CrossChainStableCoinLP.sol";
import "./interfaces/ISwapPair.sol";
import "./libraries/Math.sol";
import "./libraries/UQ112x112.sol";
import "./interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "hardhat/console.sol";

contract SwapPair is ISwapPair, CrossChainStableCoinLP {
    using SafeMath for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    event AddLiquidity(
        address indexed sender,
        uint256 amountIn0,
        uint256 amountIn1
    );
    event Burn(
        address indexed sender,
        uint256 amount0,
        uint256 amount1,
        address indexed to
    );
    event WithdrawLiquidity(
        address indexed sender,
        address token0,
        address token1,
        uint256 withdrawLP
    );
    event SwapInPair(
        address indexed sender,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address indexed to
    );
    event Sync(uint256 reserve0, uint256 reserve1, uint256 reserve2);

    // uint public constant override MINIMUM_LIQUIDITY = 10**3;
    bytes4 private constant SELECTOR =
        bytes4(keccak256(bytes("transfer(address,uint256)")));

    address public factory;
    address public token0;
    address public token1;

    uint256 totalPoolValue;
    uint256 public lpFee; /// 0.2% = 20/10000
    uint256 public governanceFee;
    uint256 public totalFee;
    uint256 public constant PERCENTAGE = 10000;

    uint8[] public decimals0;

    bool isGovernanceFee;

    // Because decimals may be different from one to the other, so we need convert all to 18 decimals token.

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
    function initialize(address _token0, address _token1) external override {
        // require(msg.sender == factory, "DTO : FORBIDDEN"); // sufficient check
        token0 = _token0;
        token1 = _token1;
        //__DTOUpgradeableBase_initialize();
         __CrossChainStableCoinLP_initialize();
        totalFee = 20;
        governanceFee = 0;
        lpFee = 20;
        isGovernanceFee = false; // no governance Fee at the beginning
        unlocked = 1;
        totalPoolValue = 0;
    }

    function setIsGovernanceFee(bool _isGovernanceFee)
        public
        onlyOwner
        returns (bool)
    {
        require(isGovernanceFee != _isGovernanceFee, "change for nothing");
        isGovernanceFee = _isGovernanceFee;
        if (isGovernanceFee == true) {
            lpFee = totalFee - governanceFee;
        } else {
            require(isGovernanceFee == false);
            lpFee = totalFee;
        }
        return true;
    }

    function setTotalFee(uint256 _totalFee) public onlyOwner returns (bool) {
        require(_totalFee <= 30, "Total fee must be lower than 0.3 %");

        // set totalFee
        totalFee = _totalFee;

        // calculate lpFee
        if (isGovernanceFee == true) {
            lpFee = totalFee - governanceFee;
        } else {
            require(isGovernanceFee == false);
            lpFee = totalFee;
        }
        return true;
    }

    function setGovernanceFee(uint256 _governanceFee)
        public
        onlyOwner
        returns (bool)
    {
        require(
            _governanceFee <= 10,
            "Governance fee must be lower than 0.1 %"
        );
        governanceFee = _governanceFee;

        // calculate lpFee
        if (isGovernanceFee == true) {
            lpFee = totalFee - governanceFee;
        } else {
            require(isGovernanceFee == false);
            lpFee = totalFee;
        }
        return true;
    }

    function convertTo18Decimals(address _token, uint256 amount)
        public
        view
        returns (uint256)
    {
        return (amount.mul((10**(18 - IERC20(_token).decimals()))));
    }

    function convertFrom18Decimals(address _token, uint256 amount)
        public
        view
        returns (uint256)
    {
        return (amount.div((10**(18 - IERC20(_token).decimals()))));
    }

    function viewPoolValue() public view returns (uint256 _totalPoolValue) {
        _totalPoolValue = totalPoolValue;
        return _totalPoolValue;
    }

    function viewUserLP(address _from) public view returns (uint256) {
        return balanceOf[msg.sender];
    }

    // ADDLIQUIDITY FUNCTION

    function addLiquidity(
        address _from,
        address _tokenA,
        address _tokenB,
        uint256 _amountInA,
        uint256 _amountInB
    ) external returns (uint256) {
        require(
            (_amountInA > 0) && (_amountInB > 0),
            "amountIn should be larger than 0"
        );
        (address tokenA, address tokenB) = _tokenA < _tokenB
            ? (_tokenA, _tokenB)
            : (_tokenB, _tokenA);
        require(tokenA == token0, "invalid pair");
        require(tokenB == token1, "invalid pair");

        uint256 totalReceivedLP = 0;
        uint256 convertedAmount0 = convertTo18Decimals(_tokenA, _amountInA);
        uint256 convertedAmount1 = convertTo18Decimals(_tokenB, _amountInB);

        // calculate total amount input
        uint256 totalAddIn = convertedAmount0 + convertedAmount1;

        //calculate the total received LP that provider can received
        uint256 _totalSupply = totalSupply;
        if (_totalSupply == 0) {
            totalReceivedLP = Math.min(convertedAmount0, convertedAmount1);
        } else {
            totalReceivedLP = Math.min(
                convertedAmount0.mul(_totalSupply).div(totalPoolValue),
                convertedAmount1.mul(totalSupply).div(_totalSupply)
            );
        }

        // Transfer token to contract to add liquidity
        // Only transfer the minimum token0 and token1 to contract

        IERC20Upgradeable(_tokenA).approve(address(this), _amountInA);
        IERC20Upgradeable(_tokenA).safeTransferFrom(
            msg.sender,
            address(this),
            _amountInA
        );

        IERC20Upgradeable(_tokenB).approve(address(this), _amountInB);
        IERC20Upgradeable(_tokenB).safeTransferFrom(
            msg.sender,
            address(this),
            _amountInB
        );

        // send LP token to provider
        _mint(_from, totalReceivedLP);

        // Add totalAddIn to PoolValue
        totalPoolValue = totalPoolValue + totalAddIn;

        emit AddLiquidity(msg.sender, _amountInA, _amountInB);
        return totalReceivedLP;
    }

    // SWAP by PAIR
    function swapInPair(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        address to
    ) external lock {
        require(to != _tokenIn && to != _tokenOut, "INVALID TO ADDRESS");

        // Convert the input amount to 18 decimals token
        uint256 convertedAmountIn = convertTo18Decimals(_tokenIn, _amountIn);
        uint256 convertedAmountOut;

        // Calculate AmountOut

        convertedAmountOut =
            convertedAmountIn -
            convertedAmountIn.mul(lpFee).div(PERCENTAGE);

        // Convert Amountout to tokenOut's decimals.

        uint256 _amountOut = convertFrom18Decimals(
            _tokenOut,
            convertedAmountOut
        );

        require(
            convertedAmountOut <=
                convertedAmountIn - (convertedAmountIn * totalFee) / PERCENTAGE,
            "insufficient amount in"
        );

        IERC20Upgradeable(_tokenIn).safeTransferFrom(
            msg.sender,
            address(this),
            _amountIn
        );

        //transfer token to recipient

        IERC20Upgradeable(_tokenOut).safeTransfer(to, _amountOut);

        // add swapfee to totalPoolValue
        totalPoolValue =
            totalPoolValue +
            convertedAmountIn.mul(lpFee).div(PERCENTAGE);

        emit SwapInPair(msg.sender, _tokenIn, _tokenOut, _amountIn, to);
    }

    // WITHDRAW LIQUIDITY FUNCTION
    function withdrawLiquidity(
        address _to,
        address _tokenA,
        address _tokenB,
        uint256 _withdrawLP
    ) external returns (bool) {
        (address tokenA, address tokenB) = _tokenA < _tokenB
            ? (_tokenA, _tokenB)
            : (_tokenB, _tokenA);
        require(tokenA == token0, "invalid pair");
        require(tokenB == token1, "invalid pair");
        uint256 availableLP = balanceOf[msg.sender];
        require(_withdrawLP <= availableLP, "insufficient LP token");

        console.log("_withdrawLP : ", _withdrawLP);
        console.log("availableLP : ", availableLP);

        uint256 _totalSupply = totalSupply;
        console.log("_totalSupply: ", _totalSupply);

        // calculate total amount output
        uint256 amountOut = _withdrawLP
            .mul(totalPoolValue)
            .div(_totalSupply)
            .div(2);
        uint256 convertedAmountOut0 = convertTo18Decimals(token0, amountOut);
        uint256 convertedAmountOut1 = convertTo18Decimals(token1, amountOut);
        console.log("convertedAmountOut0 : ", convertedAmountOut0);
        console.log("convertedAmountOut1 : ", convertedAmountOut1);

        require(
            convertedAmountOut0 <=
                IERC20Upgradeable(token0).balanceOf(address(this)),
            "insufficient token 0 balance"
        );
        require(
            convertedAmountOut1 <=
                IERC20Upgradeable(token1).balanceOf(address(this)),
            "insufficient token 1 balance"
        );

        // Calculate totalOut

        uint256 totalOut = convertedAmountOut0 + convertedAmountOut1;

        // Minus totalOut to PoolValue
        totalPoolValue = totalPoolValue - totalOut;

        // burn LP after withdrawing
        _burn(msg.sender, _withdrawLP);

        // send token to Withdrawer

        IERC20Upgradeable(token0).safeTransfer(_to, convertedAmountOut0);
        IERC20Upgradeable(token1).safeTransfer(_to, convertedAmountOut1);

        emit WithdrawLiquidity(msg.sender, token0, token1, _withdrawLP);
    }
}
