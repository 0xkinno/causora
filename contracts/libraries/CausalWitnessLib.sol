// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRelationEngine} from "../interfaces/IRelationEngine.sol";
import {ICausoraRegistry} from "../interfaces/ICausoraRegistry.sol";

/// @title CausalWitnessLib
/// @notice Cryptographic verification of causal witnesses between independent chains
library CausalWitnessLib {
    /// @dev Verifies whether Event B has a legitimate cryptographic causal dependency on Event A
    /// @param evidenceA The presumed earlier event
    /// @param evidenceB The presumed later event
    /// @param witness The cryptographic causal witness submitted
    function verifyCausality(
        ICausoraRegistry.EventEvidence calldata evidenceA,
        ICausoraRegistry.EventEvidence calldata evidenceB,
        IRelationEngine.CausalWitness calldata witness
    ) internal pure returns (bool isValid, string memory reason) {
        // 1. If either evidence does not exist, causality cannot be established
        if (!evidenceA.exists || !evidenceB.exists) {
            return (false, "Missing evidence record");
        }

        // 2. Empty or incomplete witness means no causal link provided (fail-closed)
        if (
            witness.capabilityHash == bytes32(0) ||
            witness.parentDigest == bytes32(0) ||
            witness.stateCommitment == bytes32(0)
        ) {
            return (false, "Incomplete or missing causal witness");
        }

        // 3. Verify parent digest linkage: witness must bind to Evidence A's full context
        bytes32 expectedDigestA = keccak256(
            abi.encode(evidenceA.chainKey, evidenceA.blockHeight, evidenceA.queryId, evidenceA.payloadHash)
        );
        
        if (witness.parentDigest != expectedDigestA) {
            return (false, "Witness parentDigest does not match Evidence A");
        }

        // 4. Verify capability hash commitment: hash(capabilityHash + sequence + payloadHash) must match stateCommitment
        bytes32 computedCommitment = keccak256(
            abi.encodePacked(witness.capabilityHash, witness.sequenceNumber, evidenceA.payloadHash)
        );
        if (witness.stateCommitment != computedCommitment) {
            return (false, "Invalid state commitment in causal witness");
        }

        // 5. Verify that Event B payload actually exists
        if (evidenceB.payloadHash == bytes32(0)) {
            return (false, "Event B payload is empty or unverified");
        }

        return (true, "Valid cryptographic causal dependency proven");
    }
}
