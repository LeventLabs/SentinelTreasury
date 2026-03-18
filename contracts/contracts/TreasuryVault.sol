// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IKycSBT.sol";

contract TreasuryVault {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public owner;
    address public yieldVault;
    IKycSBT public kycSBT; // optional, address(0) = disabled

    mapping(address => bool) public approvers;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event AllocatedToYield(uint256 amount);
    event WithdrawnFromYield(uint256 amount);
    event PayoutSent(address indexed to, uint256 amount);
    event ApproverUpdated(address indexed approver, bool status);

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
        if (address(kycSBT) != address(0)) {
            (bool isValid,) = kycSBT.isHuman(msg.sender);
            require(isValid, "KYC required");
        }
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external onlyOwner {
        token.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function allocateToYield(uint256 amount) external onlyApprover {
        token.safeTransfer(yieldVault, amount);
        emit AllocatedToYield(amount);
    }

    function withdrawFromYield(uint256 amount) external onlyApprover {
        MockYieldVaultLike(yieldVault).withdraw(amount);
        emit WithdrawnFromYield(amount);
    }

    function payout(address to, uint256 amount) external onlyApprover {
        token.safeTransfer(to, amount);
        emit PayoutSent(to, amount);
    }

    function getBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function addApprover(address a) external onlyOwner {
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
}

interface MockYieldVaultLike {
    function withdraw(uint256 amount) external;
}
