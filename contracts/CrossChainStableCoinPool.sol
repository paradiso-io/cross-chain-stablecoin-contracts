pragma solidity >=0.5.16;

import './interfaces/ICrossChainStableCoinLP.sol';
import './CrossChainStableCoinLP.sol';
import './libraries/Math.sol';
import './libraries/UQ112x112.sol';
import './interfaces/IERC20.sol';
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract CrossChainStableCoinPool is CrossChainStableCoinLP {
    using SafeMath for uint;
    using SafeERC20Upgradeable for address;

    event Mint(address indexed sender, uint amount0, uint amount1, uint amount2);
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

    uint public constant override MINIMUM_LIQUIDITY = 10**3;
    bytes4 private constant SELECTOR = bytes4(keccak256(bytes('transfer(address,uint256)')));
    uint public swapFee = 20;   // 0.2% = 20/10000
    uint public constant PERCENTAGE = 10000;

    address public token0;
    address public token1;
    address public token2;

    uint8 public decimals0;
    uint8 public decimals1;
    uint8 public decimals2;

    uint private unlocked = 1;
    modifier lock() {
        require(unlocked == 1, 'CrossChainStableCoinPool: LOCKED');
        unlocked = 0;
        _;
        unlocked = 1;
    }

    function getReserves() public view override returns (uint _reserve0, uint _reserve1, uint _reserve2) {
        _reserve0 = address(token0).balanceOf(address(this));
        _reserve1 = address(token1).balanceOf(address(this));
        _reserve2 = address(token2).balanceOf(address(this));
    }

    function _safeTransfer(address token, address to, uint value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(SELECTOR, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'CrossChainStableCoinPool: TRANSFER_FAILED');
    }

    constructor() public {
        factory = msg.sender;
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

    // // this low-level function should be called from a contract which performs important safety checks
    // function mint(address to) external override lock returns (uint liquidity) {
    //     (uint _reserve0, uint _reserve1) = getReserves(); // gas savings
    //     uint balance0 = IERC20(token0).balanceOf(address(this));
    //     uint balance1 = IERC20(token1).balanceOf(address(this));

    //     uint256 reserveLiquidityUnit = computeLiquidityUnit(_reserve0, _reserve1);
    //     uint amount0 = balance0.sub(_reserve0);
    //     uint amount1 = balance1.sub(_reserve1);
    //     uint256 addedLiquidityUnit = computeLiquidityUnit(amount0, amount1);

    //     if (totalSupply > 0) {
    //         liquidity = addedLiquidityUnit.mul(totalSupply).div(reserveLiquidityUnit);
    //     } else {
    //         uint8 biggerDecimals = decimals0 > decimals1? decimals0:decimals1;
    //         liquidity = addedLiquidityUnit.mul(1e18).div(10**biggerDecimals);
    //     }

    //     _mint(to, liquidity);

    //     _update();
    //     emit Mint(msg.sender, amount0, amount1);
    // }

    // this low-level function should be called from a contract which performs important safety checks
    function burn(address to) external override lock returns (uint256 amount0, uint256 amount1) {
        address _token0 = token0;                                // gas savings
        address _token1 = token1;                                // gas savings
        uint balance0 = IERC20(_token0).balanceOf(address(this));
        uint balance1 = IERC20(_token1).balanceOf(address(this));

        uint256 liquidity = balanceOf[address(this)];
        uint256 _totalSupply = totalSupply;

        amount0 = liquidity.mul(balance0).div(_totalSupply);
        amount1 = liquidity.mul(balance1).div(_totalSupply);

        _burn(address(this), liquidity);
        _safeTransfer(_token0, to, amount0);
        _safeTransfer(_token1, to, amount1);

        _update();
        emit Burn(msg.sender, amount0, amount1, to);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function swap(uint[3] memory amountsIn, uint[3] memory amountsOut, address to) external lock {
        uint totalIn = 0;
        for(uint i = 0; i < amountsIn.length; i++) {
            totalIn += amountsIn[i];
        }

        uint totalOut = 0;
        for(uint i = 0; i < amountsOut.length; i++) {
            totalOut += amountsOut[i];
        }

        require(totalOut <= totalIn - totalIn * swapFee / PERCENTAGE, "insufficient amount in");

        require(amountsOut[0] <= IERC20(token0).balanceOf(address(this)), "insufficient amount out 0");
        require(amountsOut[1] <= IERC20(token1).balanceOf(address(this)), "insufficient amount out 1");
        require(amountsOut[2] <= IERC20(token2).balanceOf(address(this)), "insufficient amount out 2");

        token0.safeTransferFrom(msg.sender, address(this), amountsIn[0]);
        token1.safeTransferFrom(msg.sender, address(this), amountsIn[1]);
        token2.safeTransferFrom(msg.sender, address(this), amountsIn[2]);

        //transfer token to recipient
        token0.safeTransfer(to, amountsOut[0]);
        token1.safeTransfer(to, amountsOut[1]);
        token2.safeTransfer(to, amountsOut[2]);
        
        emit Swap(msg.sender, amount0In, amount1In, amount2In, amount0Out, amount1Out, amount2Out, to);
    }

    // force reserves to match balances
    function sync() external override lock {
        _update();
    }
}
