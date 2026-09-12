// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRelationEngine} from "./interfaces/IRelationEngine.sol";
import {ICausoraRegistry} from "./interfaces/ICausoraRegistry.sol";
import {EvidenceDigest} from "./libraries/EvidenceDigest.sol";
import {CausalWitnessLib} from "./libraries/CausalWitnessLib.sol";

/// @title RelationEngine
/// @notice Deterministic mathematical classifier of cross-chain orderability and causal relations
contract RelationEngine is IRelationEngine {
    using EvidenceDigest for ICausoraRegistry.EventEvidence;

    /// @notice Evaluates the formal order relation between two event evidence records
    /// @param evidenceA First verified event evidence
    /// @param evidenceB Second verified event evidence
    /// @param witness Optional cryptographic causal witness for cross-chain dependencies
    function classifyRelation(
        ICausoraRegistry.EventEvidence calldata evidenceA,
        ICausoraRegistry.EventEvidence calldata evidenceB,
        CausalWitness calldata witness
    ) external pure override returns (RelationResult memory result) {
        bytes32 digestA = evidenceA.computeDigest();
        bytes32 digestB = evidenceB.computeDigest();

        result.heightA = evidenceA.blockHeight;
        result.indexA = evidenceA.txIndex;
        result.heightB = evidenceB.blockHeight;
        result.indexB = evidenceB.txIndex;
        result.evidenceDigestA = digestA;
        result.evidenceDigestB = digestB;

        // 1. Evidence Existence Validation
        if (!evidenceA.exists || !evidenceB.exists) {
            result.classification = RelationClass.INVALID;
            result.order = RelativeOrder.UNPROVABLE;
            result.reason = "One or both evidence records do not exist or are unverified";
            return result;
        }

        // 2. Intra-Chain Case: SAME_CHAIN_ORDER
        if (evidenceA.chainKey == evidenceB.chainKey) {
            result.classification = RelationClass.SAME_CHAIN_ORDER;

            if (evidenceA.blockHeight < evidenceB.blockHeight) {
                result.order = RelativeOrder.PROVABLY_FIRST_A;
                result.reason = "Evidence A has lower block height on same source chain";
            } else if (evidenceA.blockHeight > evidenceB.blockHeight) {
                result.order = RelativeOrder.PROVABLY_FIRST_B;
                result.reason = "Evidence B has lower block height on same source chain";
            } else {
                // Same block height: compare Merkle-recovered transaction ordinal indexes
                if (evidenceA.txIndex < evidenceB.txIndex) {
                    result.order = RelativeOrder.PROVABLY_FIRST_A;
                    result.reason = "Evidence A has lower transaction index within same block";
                } else if (evidenceA.txIndex > evidenceB.txIndex) {
                    result.order = RelativeOrder.PROVABLY_FIRST_B;
                    result.reason = "Evidence B has lower transaction index within same block";
                } else {
                    result.order = RelativeOrder.STRICTLY_EQUAL;
                    result.reason = "Both evidence records represent identical transaction position";
                }
            }
            return result;
        }

        // 3. Cross-Chain Case: Check for Explicit Cryptographic Causal Witness
        (bool hasCausalWitness, string memory causalReason) = CausalWitnessLib.verifyCausality(evidenceA, evidenceB, witness);

        if (hasCausalWitness) {
            result.classification = RelationClass.CROSS_CHAIN_CAUSAL;
            result.order = RelativeOrder.PROVABLY_FIRST_A;
            result.reason = causalReason;
            return result;
        }

        // 4. Cross-Chain Case: No Causal Witness -> DETERMINISTICALLY INDETERMINATE
        // This is the core thesis: independent chains without a causal link DO NOT have a provable timeline.
        result.classification = RelationClass.CROSS_CHAIN_INDETERMINATE;
        result.order = RelativeOrder.UNPROVABLE;
        result.reason = "Cross-chain events on independent chains lack cryptographic causal witness. Order is unprovable.";
    }
}
