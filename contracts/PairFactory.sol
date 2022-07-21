pragma solidity >= 0.8.0;

import './interfaces/IPairFactory.sol';
import './SwapPair.sol';

contract PairFactory is IPairFactory {
    address public override feeTo;
    address public override feeToSetter;
    address public owner;
    mapping(address => mapping(address => address)) public override getPair;
    address[] public override allPairs;

    // event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    constructor(address _feeToSetter) public {
        owner = msg.sender;
        feeToSetter = _feeToSetter;
    }
    modifier onlyOwner() {
      if (msg.sender != owner) {
        revert("not owner");
      }    
      _;
    }

    function allPairsLength() external view override returns (uint) {
        return allPairs.length;
    }

    function createPair (address tokenA, address tokenB) external override onlyOwner returns (address pair) {
        require(tokenA != tokenB, 'DTO: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'DTO: ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'DTO: PAIR_EXISTS'); // single check is sufficient
        bytes memory bytecode = type(SwapPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        ISwapPair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external override {
        require(msg.sender == feeToSetter, 'DTO: FORBIDDEN');
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external override {
        require(msg.sender == feeToSetter, 'DTO: FORBIDDEN');
        feeToSetter = _feeToSetter;
    }

    function getPairFromToken(address tokenA, address tokenB)
        public
        view
        returns (address)
    {
        return getPair[tokenA][tokenB];
    }

}
