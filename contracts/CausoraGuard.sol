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

    uint256 public constant override MAX_EVIDENCE_AGE = 7 days;
    mapping(uint256 => uint256) public override positionDecisionNonces;

    error EvidenceNotFound(bytes32 queryId);

    /// @notice Evaluates a financial guard policy against authoritative evidence in the registry
    /// @dev Sole public entrypoint; external callers cannot supply a fabricated RelationResult
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

        uint256 nonce = ++positionDecisionNonces[positionId];

        // 1. Evidence Existence Check
        if (!evidenceA.exists || !evidenceB.exists) {
            decision = GuardDecision.REJECT;
            relation = relationEngine.classifyRelation(evidenceA, evidenceB, witness);
            emit PolicyEvaluated(
                positionId,
                queryIdA,
                queryIdB,
                decision,
                "One or both evidence query IDs not found in registry"
            );
            emit PolicyEvaluatedWithNonce(
                positionId,
                nonce,
                queryIdA,
                queryIdB,
                decision,
                "One or both evidence query IDs not found in registry"
            );
            return (decision, relation);
        }

        // 2. Evidence Freshness Check
        bool isStale = (block.timestamp > evidenceA.verifiedAt + MAX_EVIDENCE_AGE) ||
                       (block.timestamp > evidenceB.verifiedAt + MAX_EVIDENCE_AGE);

        relation = relationEngine.classifyRelation(evidenceA, evidenceB, witness);

        if (isStale) {
            if (policy == ActionPolicy.FailClosedHold) {
                decision = GuardDecision.HOLD;
                emit PolicyEvaluated(
                    positionId,
                    relation.evidenceDigestA,
                    relation.evidenceDigestB,
                    decision,
                    "Evidence is stale: outside max permitted age. Position protected in HOLD state."
                );
                emit PolicyEvaluatedWithNonce(
                    positionId,
                    nonce,
                    relation.evidenceDigestA,
                    relation.evidenceDigestB,
                    decision,
                    "Evidence is stale: outside max permitted age. Position protected in HOLD state."
                );
                return (decision, relation);
            } else {
                decision = GuardDecision.REJECT;
                emit PolicyEvaluated(
                    positionId,
                    relation.evidenceDigestA,
                    relation.evidenceDigestB,
                    decision,
                    "Evidence is stale: outside max permitted age. Action rejected."
                );
                emit PolicyEvaluatedWithNonce(
                    positionId,
                    nonce,
                    relation.evidenceDigestA,
                    relation.evidenceDigestB,
                    decision,
                    "Evidence is stale: outside max permitted age. Action rejected."
                );
                return (decision, relation);
            }
        }

        decision = _evaluateGuardInternal(positionId, nonce, relation, policy);
    }

    /// @notice Internal guard evaluation policy engine — NOT callable directly by external callers
    function _evaluateGuardInternal(
        uint256 positionId,
        uint256 nonce,
        IRelationEngine.RelationResult memory relation,
        ActionPolicy policy
    ) internal returns (GuardDecision decision) {
        // 1. Invalid Evidence -> REJECT
        if (relation.classification == IRelationEngine.RelationClass.INVALID) {
            decision = GuardDecision.REJECT;
            emit PolicyEvaluated(positionId, relation.evidenceDigestA, relation.evidenceDigestB, decision, "Evidence is invalid or unverified");
            emit PolicyEvaluatedWithNonce(positionId, nonce, relation.evidenceDigestA, relation.evidenceDigestB, decision, "Evidence is invalid or unverified");
            return decision;
        }

        // 2. Provably First A -> ALLOW_A
        if (relation.order == IRelationEngine.RelativeOrder.PROVABLY_FIRST_A) {
            decision = GuardDecision.ALLOW_A;
            emit PolicyEvaluated(positionId, relation.evidenceDigestA, relation.evidenceDigestB, decision, "Action A authorized by cryptographic proof");
            emit PolicyEvaluatedWithNonce(positionId, nonce, relation.evidenceDigestA, relation.evidenceDigestB, decision, "Action A authorized by cryptographic proof");
            return decision;
        }

        // 3. Provably First B -> ALLOW_B
        if (relation.order == IRelationEngine.RelativeOrder.PROVABLY_FIRST_B) {
            decision = GuardDecision.ALLOW_B;
            emit PolicyEvaluated(positionId, relation.evidenceDigestA, relation.evidenceDigestB, decision, "Action B authorized by cryptographic proof");
            emit PolicyEvaluatedWithNonce(positionId, nonce, relation.evidenceDigestA, relation.evidenceDigestB, decision, "Action B authorized by cryptographic proof");
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
                emit PolicyEvaluatedWithNonce(
                    positionId,
                    nonce,
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
                emit PolicyEvaluatedWithNonce(
                    positionId,
                    nonce,
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
        emit PolicyEvaluatedWithNonce(positionId, nonce, relation.evidenceDigestA, relation.evidenceDigestB, decision, "Default fail-closed HOLD policy invoked");
    }
}
