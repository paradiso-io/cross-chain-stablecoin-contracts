pragma solidity >=0.5.16;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./libraries/Governance.sol";
import "./interfaces/IBridge.sol";
import "./CrossChainStableCoinPool.sol";
import "./libraries/DTOUpgradeableBase.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

contract Swap is CrossChainStableCoinPool, Governable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;
    IBridge internal bridge;
    // string[3] internal toTokens;
    event RequestBridge(uint256[] amountsOut);
    event ClaimToken(uint256[] amountsOut);

    function initialize(address _bridgeContract, address[] memory stableCoin) public initializer {
        __Governable_initialize();
        __CrossChainStableCoinPool_initialize(stableCoin);
        bridge = IBridge(_bridgeContract);
        // toTokens[0] = ERC20Upgradeable(token0).name();
        // toTokens[1] = ERC20Upgradeable(token1).name();
        // toTokens[2] = ERC20Upgradeable(token2).name();
    }

    function setMinApprovers(uint256 _val) public onlyGovernance {
        bridge.setMinApprovers(_val);
    }

    function addApprover(address _addr) public onlyGovernance {
        bridge.addApprover(_addr);
    }

    function addApprovers(address[] memory _addrs) public onlyGovernance {
        bridge.addApprovers(_addrs);
    }

    function removeApprover(address _addr) public onlyGovernance {
        bridge.removeApprover(_addr);
    }

    function addSwapedToken(address _addr) public onlyGovernance {
        bridge.removeApprover(_addr);
    }

    function setSupportedChainId(uint256 _chainId, bool _val)
        public
        onlyGovernance
    {
        bridge.setSupportedChainId(_chainId, _val);
    }

    function setSupportedChainIds(uint256[] memory _chainIds, bool _val)
        public
        onlyGovernance
    {
        bridge.setSupportedChainIds(_chainIds, _val);
    }

    function setGovernanceFee(uint256 _fee) public onlyGovernance {
        bridge.setGovernanceFee(_fee);
    }

    function alreadyClaims(bytes32 _msghash) public returns (bool)  {
        bridge.alreadyClaims(_msghash);
    }

    function tokenMap(uint256 _chainId, address _token) public returns (address) {
        bridge.tokenMap(_chainId, _token);
    }

function requestBridge(
        address _tokenAddress,
        address _toAddr,
        uint256 _amount,
        uint256 _toChainId,
        uint256[] memory _amountsOut
    ) public payable nonReentrant {
        if (!isBridgeToken(_tokenAddress)) {
            IERC20(_tokenAddress).approve(address(bridge), _amount); 
            safeTransferIn(_tokenAddress, msg.sender, _amount);
        }else{
            ERC20BurnableUpgradeable(_tokenAddress).burnFrom(
                msg.sender,
                _amount
            );
        }
        bridge.requestBridge{value: msg.value}(
            _tokenAddress,
            _toAddr,
            _amount,
             _toChainId
        );
        emit RequestBridge(
            // toTokens,
            _amountsOut
        );
    }

    function claimToken(
        address _originToken,
        address _toAddr,
        uint256 _amount,
        uint256[] memory _chainIdsIndex,
        bytes32 _txHash,
        bytes32[] memory r,
        bytes32[] memory s,
        uint8[] memory v,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256[] memory _amountsOut
    ) external payable nonReentrant {
        bridge.claimToken{value: msg.value}(
            _originToken,
            address(this),
            _amount,
            _chainIdsIndex,
            _txHash,
            r,
            s,
            v,
            _name,
            _symbol,
            _decimals
        ); 

        for(uint256 i = 0; i < stableCoinList.length; i++) {
            if(keccak256(abi.encodePacked(_name)) == keccak256(abi.encodePacked(ERC20Upgradeable(stableCoinList[i]).name()))){
                uint256[] memory amountsIn = new uint256[](stableCoinList.length);
                amountsIn[i] = _amount;
                swap(amountsIn, _amountsOut, _toAddr);
            }
        }
        
        emit ClaimToken(
            // toTokens,
            _amountsOut
        );   
    }

    function isBridgeToken(address _token) public view returns (bool) {
        return bridge.isBridgeToken(_token);
    }

   function safeTransferIn(
        address _token,
        address _fromAddr,
        uint256 _amount
    ) internal {
        if (_token == bridge.NATIVE_TOKEN_ADDRESS()) {
            require(msg.value == _amount, "invalid bridge amount");
        } else {
            IERC20Upgradeable erc20 = IERC20Upgradeable(_token);
            uint256 balBefore = erc20.balanceOf(address(this));
            erc20.safeTransferFrom(_fromAddr, address(this), _amount);
            require(
                erc20.balanceOf(address(this)).sub(balBefore) == _amount,
                "!transfer from"
            );
        }
    }

}