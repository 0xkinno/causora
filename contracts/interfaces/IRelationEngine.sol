// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {INativeQueryVerifier} from "./INativeQueryVerifier.sol";
import {ICausoraRegistry} from "./ICausoraRegistry.sol";

/// @title IRelationEngine
/// @notice Formal deterministic orderability classifier
interface IRelationEngine {
    enum RelationClass {
        INVALID,
        SAME_CHAIN_ORDER,
        CROSS_CHAIN_CAUSAL,
        CROSS_CHAIN_INDETERMINATE
    }

    enum RelativeOrder {
        UNPROVABLE,
        PROVABLY_FIRST_A,
        PROVABLY_FIRST_B,
        STRICTLY_EQUAL
    }

    struct CausalWitness {
        bytes32 parentDigest;
        bytes32 capabilityHash;
        bytes32 stateCommitment;
        uint64 sequenceNumber;
        bytes signatureOrProof;
    }

    struct RelationResult {
        RelationClass classification;
        RelativeOrder order;
        uint64 heightA;
        uint64 indexA;
        uint64 heightB;
        uint64 indexB;
        bytes32 evidenceDigestA;
        bytes32 evidenceDigestB;
        string reason;
    }

    event RelationEvaluated(
        bytes32 indexed evidenceDigestA,
        bytes32 indexed evidenceDigestB,
        RelationClass indexed classification,
        RelativeOrder order,
        string reason
    );

    function classifyRelation(
        ICausoraRegistry.EventEvidence calldata evidenceA,
        ICausoraRegistry.EventEvidence calldata evidenceB,
        CausalWitness calldata witness
    ) external pure returns (RelationResult memory result);
}
