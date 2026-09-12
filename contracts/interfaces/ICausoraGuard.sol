// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRelationEngine} from "./IRelationEngine.sol";

/// @title ICausoraGuard
/// @notice The authoritative financial authorization firewall
interface ICausoraGuard {
    enum ActionPolicy {
        StrictPrecedence,      // Requires PROVABLY_FIRST_A to execute A, PROVABLY_FIRST_B to execute B
        FailClosedHold,        // On INDETERMINATE, transition position to HELD
        RequireCausalWitness   // Cross-chain actions must provide valid cryptographic witness
    }

    enum GuardDecision {
        REJECT,     // Invalid proof or tampered input
        ALLOW_A,    // Event A is provably earlier; execute Action A
        ALLOW_B,    // Event B is provably earlier; execute Action B
        HOLD        // Indeterminate cross-chain ordering; freeze/protect position
    }

    event PolicyEvaluated(
        uint256 indexed positionId,
        bytes32 indexed evidenceA,
        bytes32 indexed evidenceB,
        GuardDecision decision,
        string reason
    );

    function evaluateGuardFromEvidence(
        uint256 positionId,
        bytes32 queryIdA,
        bytes32 queryIdB,
        IRelationEngine.CausalWitness calldata witness,
        ActionPolicy policy
    ) external returns (GuardDecision decision, IRelationEngine.RelationResult memory relation);

    function evaluateGuard(
        uint256 positionId,
        IRelationEngine.RelationResult calldata relation,
        ActionPolicy policy
    ) external returns (GuardDecision decision);
}
