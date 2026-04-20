// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IAggregatorV3.sol";

/// @dev Test-only aggregator. Not intended for testnet or mainnet deployment.
contract MockAggregator is IAggregatorV3 {
    int256 private _answer;
    uint256 private _updatedAt;
    uint80 private _roundId;

    constructor(int256 initialAnswer) {
        _answer = initialAnswer;
        _updatedAt = block.timestamp;
        _roundId = 1;
    }

    function setAnswer(int256 newAnswer) external {
        _answer = newAnswer;
        _updatedAt = block.timestamp;
        _roundId += 1;
    }

    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (_roundId, _answer, _updatedAt, _updatedAt, _roundId);
    }
}
