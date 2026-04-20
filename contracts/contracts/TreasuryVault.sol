// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IKycSBT.sol";
import "./interfaces/IAggregatorV3.sol";

contract TreasuryVault {
    using SafeERC20 for IERC20;

    int256 public constant USDC_PEG = 1e8;
    int256 public constant PEG_DEVIATION = 5e5;

    IERC20 public immutable token;
    address public owner;
    address public yieldVault;
    IKycSBT public kycSBT; // optional, address(0) = disabled
    IAggregatorV3 public aproUsdcFeed; // optional, address(0) = disabled

    mapping(address => bool) public approvers;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event AllocatedToYield(uint256 amount);
    event WithdrawnFromYield(uint256 amount);
    event PayoutSent(address indexed to, uint256 amount);
    event ApproverUpdated(address indexed approver, bool status);
    event AproUsdcFeedUpdated(address indexed feed);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyApprover() {
        require(approvers[msg.sender], "not approver");
        _;
    }

    constructor(address _token, address _yieldVault) {
        token = IERC20(_token);
        yieldVault = _yieldVault;
        owner = msg.sender;
        approvers[msg.sender] = true;
    }

    function deposit(uint256 amount) external {
        _requireKycForDeposit(msg.sender);
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external onlyOwner {
        token.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function allocateToYield(uint256 amount) external onlyApprover {
        _requirePegOk();
        token.forceApprove(yieldVault, amount);
        MockYieldVaultLike(yieldVault).deposit(amount);
        token.forceApprove(yieldVault, 0);
        emit AllocatedToYield(amount);
    }

    function withdrawFromYield(uint256 amount) external onlyApprover {
        MockYieldVaultLike(yieldVault).withdraw(amount);
        emit WithdrawnFromYield(amount);
    }

    function payout(address to, uint256 amount) external onlyApprover {
        _requireKycLevel(msg.sender, 3, "payout KYC insufficient");
        token.safeTransfer(to, amount);
        emit PayoutSent(to, amount);
    }

    function getBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function addApprover(address a) external onlyOwner {
        _requireKycLevel(a, 2, "approver KYC insufficient");
        approvers[a] = true;
        emit ApproverUpdated(a, true);
    }

    function removeApprover(address a) external onlyOwner {
        approvers[a] = false;
        emit ApproverUpdated(a, false);
    }

    function setKycSBT(address _kycSBT) external onlyOwner {
        kycSBT = IKycSBT(_kycSBT);
    }

    function setYieldVault(address _yieldVault) external onlyOwner {
        yieldVault = _yieldVault;
    }

    function setAproUsdcFeed(address _feed) external onlyOwner {
        aproUsdcFeed = IAggregatorV3(_feed);
        emit AproUsdcFeedUpdated(_feed);
    }

    function _requirePegOk() internal view {
        if (address(aproUsdcFeed) == address(0)) return;
        (, int256 answer, , ,) = aproUsdcFeed.latestRoundData();
        require(answer > 0, "bad feed");
        int256 diff = answer > USDC_PEG ? answer - USDC_PEG : USDC_PEG - answer;
        require(diff <= PEG_DEVIATION, "peg deviation");
    }

    function _requireKycForDeposit(address a) internal view {
        if (address(kycSBT) == address(0)) return;
        (bool ok,) = kycSBT.isHuman(a);
        require(ok, "KYC required");
    }

    function _requireKycLevel(address a, uint8 minLevel, string memory reason) internal view {
        if (address(kycSBT) == address(0)) return;
        (bool ok, uint8 level) = kycSBT.isHuman(a);
        require(ok && level >= minLevel, reason);
    }
}

interface MockYieldVaultLike {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
}
