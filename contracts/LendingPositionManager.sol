// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ILendingPositionManager} from "./interfaces/ILendingPositionManager.sol";
import {ICausoraRegistry} from "./interfaces/ICausoraRegistry.sol";
import {IRelationEngine} from "./interfaces/IRelationEngine.sol";
import {ICausoraGuard} from "./interfaces/ICausoraGuard.sol";

/// @title LendingPositionManager
/// @notice Reference cross-chain lending protocol demonstrating the Causora Orderability Firewall
contract LendingPositionManager is ILendingPositionManager, Ownable {
    ICausoraRegistry public immutable registry;
    IRelationEngine public immutable relationEngine;
    ICausoraGuard public immutable guard;

    mapping(uint256 => LendingPosition) public positions;
    uint256[] public positionIds;

    error PositionAlreadyExists(uint256 positionId);
    error PositionNotFound(uint256 positionId);
    error PositionNotAtRisk(uint256 positionId, PositionState currentState);
    error ActionRejected(string reason);
    error ZeroAddress();

    constructor(
        address _registry,
        address _relationEngine,
        address _guard
    ) Ownable(msg.sender) {
        if (_registry == address(0) || _relationEngine == address(0) || _guard == address(0)) {
            revert ZeroAddress();
        }
        registry = ICausoraRegistry(_registry);
        relationEngine = IRelationEngine(_relationEngine);
        guard = ICausoraGuard(_guard);
    }

    /// @notice Opens a new lending position on Creditcoin
    function createPosition(
        uint256 positionId,
        address borrower,
        uint256 collateral,
        uint256 debt
    ) external override {
        if (positions[positionId].state != PositionState.NON_EXISTENT) {
            revert PositionAlreadyExists(positionId);
        }

        positions[positionId] = LendingPosition({
            positionId: positionId,
            borrower: borrower,
            collateralAmount: collateral,
            debtAmount: debt,
            createdAt: uint64(block.timestamp),
            lastUpdatedAt: uint64(block.timestamp),
            state: PositionState.SAFE,
            lastEvidenceDigest: bytes32(0)
        });

        positionIds.push(positionId);

        emit PositionCreated(positionId, borrower, collateral, debt);
    }

    /// @notice Marks a position as AT_RISK (e.g. due to market price movements)
    function markAtRisk(uint256 positionId) external {
        LendingPosition storage pos = positions[positionId];
        if (pos.state == PositionState.NON_EXISTENT) revert PositionNotFound(positionId);
        pos.state = PositionState.AT_RISK;
        pos.lastUpdatedAt = uint64(block.timestamp);
        emit PositionMarkedAtRisk(positionId);
    }

    /// @notice Resolves a race condition between a collateral rescue and a liquidation trigger
    /// @dev Demonstrates how Causora evaluates proof evidence and deterministically transitions state
    function resolveCollateralRace(
        uint256 positionId,
        bytes32 queryIdRescue,
        bytes32 queryIdLiquidation,
        IRelationEngine.CausalWitness calldata witness,
        uint256 additionalCollateral,
        address liquidator
    ) external returns (ICausoraGuard.GuardDecision decision, PositionState finalState) {
        LendingPosition storage pos = positions[positionId];
        if (pos.state == PositionState.NON_EXISTENT) revert PositionNotFound(positionId);

        // 1. Authoritatively evaluate through CausoraGuard reading directly from registry
        IRelationEngine.RelationResult memory relation;
        (decision, relation) = guard.evaluateGuardFromEvidence(
            positionId,
            queryIdRescue,
            queryIdLiquidation,
            witness,
            ICausoraGuard.ActionPolicy.FailClosedHold
        );

        // 2. Mutate state strictly according to cryptographic authorization
        pos.lastEvidenceDigest = relation.evidenceDigestA;
        pos.lastUpdatedAt = uint64(block.timestamp);

        if (decision == ICausoraGuard.GuardDecision.ALLOW_A) {
            // Rescue is provably first: position is saved
            pos.collateralAmount += additionalCollateral;
            pos.state = PositionState.RESCUED;
            emit PositionRescued(positionId, additionalCollateral);
        } else if (decision == ICausoraGuard.GuardDecision.ALLOW_B) {
            // Liquidation is provably first: position is liquidated
            pos.state = PositionState.LIQUIDATED;
            emit PositionLiquidated(positionId, liquidator);
        } else if (decision == ICausoraGuard.GuardDecision.HOLD) {
            // Cross-chain order is unprovable: position is held and locked against malicious liquidation
            pos.state = PositionState.HELD;
            emit PositionHeld(positionId, relation.reason);
        } else {
            revert ActionRejected(relation.reason);
        }

        finalState = pos.state;
    }

    function getPosition(uint256 positionId) external view override returns (LendingPosition memory) {
        return positions[positionId];
    }

    function getPositionCount() external view returns (uint256) {
        return positionIds.length;
    }
}
