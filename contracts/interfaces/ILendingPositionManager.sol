// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ILendingPositionManager
/// @notice Manages cross-chain collateral and protected lending positions
interface ILendingPositionManager {
    enum PositionState {
        NON_EXISTENT,
        SAFE,
        AT_RISK,
        HELD,          // Protected by Causora Firewall on unprovable cross-chain order
        RESCUED,       // Successfully collateralized before liquidation
        LIQUIDATED     // Liquidated only when liquidation is PROVABLY prior
    }

    struct LendingPosition {
        uint256 positionId;
        address borrower;
        uint256 collateralAmount;
        uint256 debtAmount;
        uint64 createdAt;
        uint64 lastUpdatedAt;
        PositionState state;
        bytes32 lastEvidenceDigest;
    }

    event PositionCreated(uint256 indexed positionId, address indexed borrower, uint256 collateral, uint256 debt);
    event PositionHeld(uint256 indexed positionId, string reason);
    event PositionRescued(uint256 indexed positionId, uint256 additionalCollateral);
    event PositionLiquidated(uint256 indexed positionId, address indexed liquidator);
    event PositionMarkedAtRisk(uint256 indexed positionId);

    function createPosition(uint256 positionId, address borrower, uint256 collateral, uint256 debt) external;
    function getPosition(uint256 positionId) external view returns (LendingPosition memory);
}
