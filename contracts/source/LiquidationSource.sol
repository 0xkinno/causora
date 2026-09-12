// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title LiquidationSource
/// @notice Controlled source-chain contract deployed on independent source chain for LiquidationTriggered events
contract LiquidationSource {
    event LiquidationTriggered(
        uint256 indexed positionId,
        address indexed liquidator,
        uint256 debtAmount,
        bytes32 conditionHash
    );

    function triggerLiquidation(
        uint256 positionId,
        uint256 debtAmount,
        bytes32 conditionHash
    ) external {
        emit LiquidationTriggered(positionId, msg.sender, debtAmount, conditionHash);
    }
}
