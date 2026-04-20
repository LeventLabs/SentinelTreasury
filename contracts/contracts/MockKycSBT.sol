// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IKycSBT.sol";

contract MockKycSBT is IKycSBT, Ownable {
    struct Record {
        string ensName;
        KycLevel level;
        KycStatus status;
        uint256 createTime;
    }

    mapping(address => Record) private _records;
    mapping(address => mapping(string => bool)) private _ensNameApproved;

    uint256 private _totalFee;

    constructor() Ownable(msg.sender) {
        _totalFee = 0.0001 ether;
    }

    function _checkOwner() internal view override {
        require(owner() == _msgSender(), "not owner");
    }

    function getTotalFee() external view returns (uint256) {
        return _totalFee;
    }

    function setTotalFee(uint256 newFee) external onlyOwner {
        _totalFee = newFee;
    }

    function requestKyc(string calldata ensName) external payable {
        require(msg.value >= _totalFee, "insufficient fee");
        require(_records[msg.sender].createTime == 0, "already registered");

        _records[msg.sender] = Record({
            ensName: ensName,
            level: KycLevel.BASIC,
            status: KycStatus.APPROVED,
            createTime: block.timestamp
        });

        emit KycRequested(msg.sender, ensName);
        emit KycLevelUpdated(msg.sender, KycLevel.BASIC);
    }

    function setKycInfo(
        address user,
        string calldata ensName,
        KycLevel level,
        KycStatus status
    ) external onlyOwner {
        Record storage rec = _records[user];
        if (rec.createTime == 0) {
            rec.createTime = block.timestamp;
        }
        rec.ensName = ensName;
        rec.level = level;
        rec.status = status;
    }

    function revokeKyc(address user) external onlyOwner {
        _records[user].status = KycStatus.REVOKED;
        emit KycRevoked(user);
        emit KycStatusUpdated(user, KycStatus.REVOKED);
    }

    function restoreKyc(address user) external onlyOwner {
        _records[user].status = KycStatus.APPROVED;
        emit KycRestored(user);
        emit KycStatusUpdated(user, KycStatus.APPROVED);
    }

    function isHuman(address account) external view returns (bool, uint8) {
        Record storage rec = _records[account];
        if (rec.status == KycStatus.APPROVED) {
            return (true, uint8(rec.level));
        }
        return (false, 0);
    }

    function getKycInfo(address account) external view returns (
        string memory ensName,
        KycLevel level,
        KycStatus status,
        uint256 createTime
    ) {
        Record storage rec = _records[account];
        return (rec.ensName, rec.level, rec.status, rec.createTime);
    }

    function approveEnsName(address user, string calldata ensName) external onlyOwner {
        _ensNameApproved[user][ensName] = true;
        emit EnsNameApproved(user, ensName);
    }

    function isEnsNameApproved(address user, string calldata ensName) external view returns (bool) {
        return _ensNameApproved[user][ensName];
    }
}
