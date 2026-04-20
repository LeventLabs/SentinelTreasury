// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IKycSBT {
    enum KycLevel { NONE, BASIC, ADVANCED, PREMIUM, ULTIMATE }
    enum KycStatus { NONE, APPROVED, REVOKED }

    event KycRequested(address indexed user, string ensName);
    event KycLevelUpdated(address indexed user, KycLevel level);
    event KycStatusUpdated(address indexed user, KycStatus status);
    event KycRevoked(address indexed user);
    event KycRestored(address indexed user);
    event EnsNameApproved(address indexed user, string ensName);

    function requestKyc(string calldata ensName) external payable;
    function revokeKyc(address user) external;
    function restoreKyc(address user) external;
    function isHuman(address account) external view returns (bool, uint8);
    function getKycInfo(address account) external view returns (
        string memory ensName,
        KycLevel level,
        KycStatus status,
        uint256 createTime
    );
    function approveEnsName(address user, string calldata ensName) external;
    function isEnsNameApproved(address user, string calldata ensName) external view returns (bool);
}
