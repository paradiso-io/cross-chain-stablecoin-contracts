pragma solidity >=0.5.16;

import './interfaces/ICrossChainStableCoinLP.sol';
import './CrossChainStableCoinLP.sol';
import './libraries/Math.sol';
import './libraries/UQ112x112.sol';
import './interfaces/IERC20.sol';

contract CrossChainStableCoinPool is CrossChainStableCoinLP {
    using SafeMath  for uint;

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

    address public token0;
    address public token1;
    address public token2;

    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public reserve2;

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
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _reserve2 = reserve2;
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

    function _update() internal {
        reserve0 = IERC20(token0).balanceOf(address(this));
        reserve1 = IERC20(token1).balanceOf(address(this));
        emit Sync(reserve0, reserve1);
    }

    function computeLiquidityUnit(uint256 _reserve0, uint256 _reserve1) public view returns (uint256) {
        if (decimals0 > decimals1) {
            return _reserve0.add(_reserve1.mul(10**uint256((decimals0 - decimals1))));
        } else {
            return _reserve1.add(_reserve0.mul(10**uint256((decimals1 - decimals0))));
        }
    }

    // this low-level function should be called from a contract which performs important safety checks
    function mint(address to) external override lock returns (uint liquidity) {
        (uint _reserve0, uint _reserve1) = getReserves(); // gas savings
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));

        uint256 reserveLiquidityUnit = computeLiquidityUnit(_reserve0, _reserve1);
        uint amount0 = balance0.sub(_reserve0);
        uint amount1 = balance1.sub(_reserve1);
        uint256 addedLiquidityUnit = computeLiquidityUnit(amount0, amount1);

        if (totalSupply > 0) {
            liquidity = addedLiquidityUnit.mul(totalSupply).div(reserveLiquidityUnit);
        } else {
            uint8 biggerDecimals = decimals0 > decimals1? decimals0:decimals1;
            liquidity = addedLiquidityUnit.mul(1e18).div(10**biggerDecimals);
        }

        _mint(to, liquidity);

        _update();
        emit Mint(msg.sender, amount0, amount1);
    }

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
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external override lock {
        require(amount0Out > 0 || amount1Out > 0, 'DTOPeggedSwap: INSUFFICIENT_OUTPUT_AMOUNT');
        (uint _reserve0, uint _reserve1) = getReserves(); // gas savings
        require(amount0Out < _reserve0 && amount1Out < _reserve1, 'DTOPeggedSwap: INSUFFICIENT_LIQUIDITY');

        uint balance0;
        uint balance1;
        { // scope for _token{0,1}, avoids stack too deep errors
            address _token0 = token0;
            address _token1 = token1;
            require(to != _token0 && to != _token1, 'DTOPeggedSwap: INVALID_TO');
            if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out); // optimistically transfer tokens
            if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out); // optimistically transfer tokens
            balance0 = IERC20(_token0).balanceOf(address(this));
            balance1 = IERC20(_token1).balanceOf(address(this));
        }
        uint amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
        require(amount0In > 0 || amount1In > 0, 'DTOPeggedSwap: INSUFFICIENT_INPUT_AMOUNT');

        { // scope for reserve{0,1}Adjusted, avoids stack too deep errors
            uint256 swapFee = IDTOPeggedSwapFactory(factory).swapFee();
            uint balance0Adjusted = balance0.sub(amount0In.mul(swapFee).div(1000));   //minusfee
            uint balance1Adjusted = balance1.sub(amount1In.mul(swapFee).div(1000));   //minus fee
            require(computeLiquidityUnit(balance0Adjusted, balance1Adjusted) >= computeLiquidityUnit(_reserve0, _reserve1), "DTOPeggedSwap: Swap Liquidity Unit");
        }

        _update();
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    // force reserves to match balances
    function sync() external override lock {
        _update();
    }
}
