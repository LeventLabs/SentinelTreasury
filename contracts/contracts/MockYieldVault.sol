// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockYieldVault {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public owner;
    mapping(address => uint256) public balances;

    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event YieldSimulated(uint256 amount);

    constructor(address _token) {
        token = IERC20(_token);
        owner = msg.sender;
    }

    function deposit(uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "insufficient balance");
        balances[msg.sender] -= amount;
        token.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    // Owner can simulate yield by transferring extra tokens to this contract
    function simulateYield(address depositor, uint256 amount) external {
        require(msg.sender == owner, "not owner");
        balances[depositor] += amount;
        emit YieldSimulated(amount);
    }

    function getBalance(address account) external view returns (uint256) {
        return balances[account];
    }

    function getAPY() external pure returns (uint256) {
        return 800; // 8.00%
    }

    function totalDeposits() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
