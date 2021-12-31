pragma solidity ^0.8.0;

interface ICrossChainStableCoinPool {
    function stableCoinList() external returns (address[] memory);
    function swap(
        uint256[] memory amountsIn,
        uint256[] memory amountsOut,
        address to
    ) external;
    function getStableCoinList() external returns (address[] memory);
}
