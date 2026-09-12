// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ICausoraGuard} from "./interfaces/ICausoraGuard.sol";
import {IRelationEngine} from "./interfaces/IRelationEngine.sol";
import {ICausoraRegistry} from "./interfaces/ICausoraRegistry.sol";

/// @title CausoraGuard
/// @notice The financial policy firewall enforcing orderability boundaries on Creditcoin DeFi
contract CausoraGuard is ICausoraGuard {
    ICausoraRegistry public immutable registry;
    IRelationEngine public immutable relationEngine;

    error ZeroAddress();

    constructor(address _registry, address _relationEngine) {
        if (_relationEngine == address(0)) revert ZeroAddress();
        relationEngine = IRelationEngine(_relationEngine);
        registry = ICausoraRegistry(_registry);
    }

    /// @notice Evaluates a financial guard policy against authoritative evidence in the registry
    /// @param positionId Monitored position ID
    /// @param queryIdA Admitted evidence query ID for Event A
    /// @param queryIdB Admitted evidence query ID for Event B
    /// @param witness Optional cryptographic causal witness
    /// @param policy The requested guard policy
    function evaluateGuardFromEvidence(
        uint256 positionId,
        bytes32 queryIdA,
        bytes32 queryIdB,
        IRelationEngine.CausalWitness calldata witness,
        ActionPolicy policy
    ) external override returns (GuardDecision decision, IRelationEngine.RelationResult memory relation) {
        ICausoraRegistry.EventEvidence memory evidenceA = registry.getEvidence(queryIdA);
        ICausoraRegistry.EventEvidence memory evidenceB = registry.getEvidence(queryIdB);

        relation = relationEngine.classifyRelation(evidenceA, evidenceB, witness);
        decision = evaluateGuard(positionId, relation, policy);
    }

    /// @notice Evaluates a financial guard policy against the formal relation classification
    /// @param positionId Monitored position ID
    /// @param relation The output from RelationEngine
    /// @param policy The requested guard policy
    function evaluateGuard(
        uint256 positionId,
        IRelationEngine.RelationResult memory relation,
        ActionPolicy policy
    ) public override returns (GuardDecision decision) {
        // 1. Invalid Evidence -> REJECT
        if (relation.classification == IRelationEngine.RelationClass.INVALID) {
            decision = GuardDecision.REJECT;
            emit PolicyEvaluated(positionId, relation.evidenceDigestA, relation.evidenceDigestB, decision, "Evidence is invalid or unverified");
            return decision;
        }

        // 2. Provably First A -> ALLOW_A
        if (relation.order == IRelationEngine.RelativeOrder.PROVABLY_FIRST_A) {
            decision = GuardDecision.ALLOW_A;
            emit PolicyEvaluated(positionId, relation.evidenceDigestA, relation.evidenceDigestB, decision, "Action A authorized by cryptographic proof");
            return decision;
        }

        // 3. Provably First B -> ALLOW_B
        if (relation.order == IRelationEngine.RelativeOrder.PROVABLY_FIRST_B) {
            decision = GuardDecision.ALLOW_B;
            emit PolicyEvaluated(positionId, relation.evidenceDigestA, relation.evidenceDigestB, decision, "Action B authorized by cryptographic proof");
            return decision;
        }

        // 4. Indeterminate Cross-Chain Order -> Fail-Closed HOLD
        if (relation.classification == IRelationEngine.RelationClass.CROSS_CHAIN_INDETERMINATE) {
            if (policy == ActionPolicy.FailClosedHold || policy == ActionPolicy.StrictPrecedence) {
                decision = GuardDecision.HOLD;
                emit PolicyEvaluated(
                    positionId,
                    relation.evidenceDigestA,
                    relation.evidenceDigestB,
                    decision,
                    "Order indeterminate across independent chains. Position protected in HOLD state."
                );
                return decision;
            } else if (policy == ActionPolicy.RequireCausalWitness) {
                decision = GuardDecision.REJECT;
                emit PolicyEvaluated(
                    positionId,
                    relation.evidenceDigestA,
                    relation.evidenceDigestB,
                    decision,
                    "Missing required cryptographic causal witness."
                );
                return decision;
            }
        }

        decision = GuardDecision.HOLD;
        emit PolicyEvaluated(positionId, relation.evidenceDigestA, relation.evidenceDigestB, decision, "Default fail-closed HOLD policy invoked");
    }
}
