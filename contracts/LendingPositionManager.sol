// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ILendingPositionManager} from "./interfaces/ILendingPositionManager.sol";
import {ICausoraRegistry} from "./interfaces/ICausoraRegistry.sol";
import {IRelationEngine} from "./interfaces/IRelationEngine.sol";
import {ICausoraGuard} from "./interfaces/ICausoraGuard.sol";
import {ICausoraVault} from "./interfaces/ICausoraVault.sol";

/// @title LendingPositionManager
/// @notice Reference cross-chain lending protocol demonstrating the Causora Orderability Firewall
contract LendingPositionManager is ILendingPositionManager, Ownable {
    ICausoraRegistry public immutable registry;
    IRelationEngine public immutable relationEngine;
    ICausoraGuard public immutable guard;
    ICausoraVault public immutable vault;

    mapping(uint256 => LendingPosition) public positions;
    uint256[] public positionIds;

    /// @notice Business-level semantic replay guard: actionKey => consumed
    mapping(bytes32 => bool) public consumedActionKeys;

    /// @notice Evidence binding: queryId => bound positionId
    mapping(bytes32 => uint256) public evidenceBoundPosition;

    /// @notice Consumed evidence pairs: pairKey => consumed
    mapping(bytes32 => bool) public consumedEvidencePairs;

    /// @notice Authorized risk evaluators
    mapping(address => bool) public riskEvaluators;

    error PositionAlreadyExists(uint256 positionId);
    error PositionNotFound(uint256 positionId);
    error PositionNotAtRisk(uint256 positionId, PositionState currentState);
    error ActionRejected(string reason);
    error BusinessActionAlreadyConsumed(bytes32 actionKey);
    error EvidenceBoundToOtherPosition(bytes32 queryId, uint256 boundPositionId);
    error EvidencePairAlreadyConsumed(bytes32 pairKey);
    error UnauthorizedCaller();
    error ZeroAddress();

    event BusinessActionConsumed(bytes32 indexed actionKey, uint256 indexed positionId);
    event RiskEvaluatorUpdated(address indexed evaluator, bool approved);

    modifier onlyRiskEvaluator() {
        if (msg.sender != owner() && !riskEvaluators[msg.sender]) {
            revert UnauthorizedCaller();
        }
        _;
    }

    constructor(
        address _registry,
        address _relationEngine,
        address _guard,
        address _vault
    ) Ownable(msg.sender) {
        if (
            _registry == address(0) ||
            _relationEngine == address(0) ||
            _guard == address(0) ||
            _vault == address(0)
        ) {
            revert ZeroAddress();
        }
        registry = ICausoraRegistry(_registry);
        relationEngine = IRelationEngine(_relationEngine);
        guard = ICausoraGuard(_guard);
        vault = ICausoraVault(_vault);
    }

    function setRiskEvaluator(address evaluator, bool approved) external onlyOwner {
        if (evaluator == address(0)) revert ZeroAddress();
        riskEvaluators[evaluator] = approved;
        emit RiskEvaluatorUpdated(evaluator, approved);
    }

    /// @notice Opens a new lending position on Creditcoin
    /// @dev Borrower can create their own position, or owner can provision for demos
    function createPosition(
        uint256 positionId,
        address borrower,
        uint256 collateral,
        uint256 debt
    ) external override {
        if (msg.sender != borrower && msg.sender != owner()) {
            revert UnauthorizedCaller();
        }
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
    function markAtRisk(uint256 positionId) external onlyRiskEvaluator {
        LendingPosition storage pos = positions[positionId];
        if (pos.state == PositionState.NON_EXISTENT) revert PositionNotFound(positionId);
        pos.state = PositionState.AT_RISK;
        pos.lastUpdatedAt = uint64(block.timestamp);
        emit PositionMarkedAtRisk(positionId);
    }

    /// @notice Resolves a race condition between a collateral rescue and a liquidation trigger
    /// @dev Demonstrates how Causora evaluates proof evidence and deterministically transitions state & vault
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
        if (pos.state != PositionState.AT_RISK && pos.state != PositionState.HELD) {
            revert PositionNotAtRisk(positionId, pos.state);
        }

        // Semantic business-level replay protection
        ICausoraGuard.ActionPolicy policy = ICausoraGuard.ActionPolicy.FailClosedHold;
        bytes32 actionKey = keccak256(
            abi.encode(positionId, "COLLATERAL_RACE", queryIdRescue, queryIdLiquidation, uint8(policy))
        );
        if (consumedActionKeys[actionKey]) {
            revert BusinessActionAlreadyConsumed(actionKey);
        }

        // Evidence-to-position binding protection
        if (evidenceBoundPosition[queryIdRescue] != 0 && evidenceBoundPosition[queryIdRescue] != positionId) {
            revert EvidenceBoundToOtherPosition(queryIdRescue, evidenceBoundPosition[queryIdRescue]);
        }
        if (evidenceBoundPosition[queryIdLiquidation] != 0 && evidenceBoundPosition[queryIdLiquidation] != positionId) {
            revert EvidenceBoundToOtherPosition(queryIdLiquidation, evidenceBoundPosition[queryIdLiquidation]);
        }

        // Consumed evidence pair protection
        bytes32 pairKey = keccak256(abi.encode(queryIdRescue, queryIdLiquidation));
        if (consumedEvidencePairs[pairKey]) {
            revert EvidencePairAlreadyConsumed(pairKey);
        }

        // 1. Authoritatively evaluate through CausoraGuard reading directly from registry
        IRelationEngine.RelationResult memory relation;
        (decision, relation) = guard.evaluateGuardFromEvidence(
            positionId,
            queryIdRescue,
            queryIdLiquidation,
            witness,
            policy
        );

        // 2. If decision is REJECT, fail-closed immediately without state or vault mutation
        if (decision == ICausoraGuard.GuardDecision.REJECT) {
            revert ActionRejected(relation.reason);
        }

        // 3. Mark business action, evidence pair, and evidence-position binding consumed permanently
        consumedActionKeys[actionKey] = true;
        consumedEvidencePairs[pairKey] = true;
        evidenceBoundPosition[queryIdRescue] = positionId;
        evidenceBoundPosition[queryIdLiquidation] = positionId;
        emit BusinessActionConsumed(actionKey, positionId);

        // 4. Mutate vault state & transfer collateral strictly according to decision
        vault.executeProtectedTransition(
            positionId,
            decision,
            liquidator,
            pos.borrower,
            pos.collateralAmount
        );

        // 5. Mutate protocol position state coherent with vault
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
