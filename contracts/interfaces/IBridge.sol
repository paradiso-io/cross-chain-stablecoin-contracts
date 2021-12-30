pragma solidity ^0.8.0;

interface IBridge {
    function NATIVE_TOKEN_ADDRESS() external returns (address);
    function setMinApprovers(uint256 _val) external;
    function addApprover(address _addr) external;
    function addApprovers(address[] memory _addrs) external;
    function removeApprover(address _addr) external;
    function setSupportedChainId(uint256 _chainId, bool _val) external;
    function setSupportedChainIds(uint256[] memory _chainIds, bool _val) external;
    function setGovernanceFee(uint256 _fee) external;
    function alreadyClaims(bytes32 _msghash) external returns (bool);
    function tokenMap(uint256 _chainId, address _token) external returns (address);
    function requestBridge(
        address _tokenAddress,
        address _from,
        uint256 _amount,
        uint256 _toChainId
    ) external payable;

    function claimToken(
        address _originToken,
        address _to,
        uint256 _amount,
        uint256[] memory _chainIdsIndex,
        bytes32 _txHash,
        bytes32[] memory r,
        bytes32[] memory s,
        uint8[] memory v,
        string memory _name,
        string memory _symbol,
        uint8 _decimals 
    ) external payable;
    
    function isBridgeToken(address _token) external view returns (bool);
}