pragma solidity >= 0.5.16;
import "./libraries/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

abstract contract ChainIdHolding {
    uint256 public chainId;

    function __ChainIdHolding_initialize() internal {
        uint256 _cid;
        assembly {
            _cid := chainid()
        }
        chainId = _cid;
    }
}
