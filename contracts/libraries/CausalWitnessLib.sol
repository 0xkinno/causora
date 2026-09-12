// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRelationEngine} from "../interfaces/IRelationEngine.sol";
import {ICausoraRegistry} from "../interfaces/ICausoraRegistry.sol";

/// @title CausalWitnessLib
/// @notice Cryptographic verification of causal witnesses between independent chains
library CausalWitnessLib {
    bytes32 public constant CAUSALITY_CONSUMED_SIG = keccak256("CausalityConsumed(bytes32,bytes32,uint64,bytes32)");

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

        // 5. Hardened verification: Event B must be CausalityConsumed event and its admitted payload
        // MUST cryptographically commit to the exact witness originating from Event A
        if (evidenceB.eventSig != CAUSALITY_CONSUMED_SIG) {
            return (false, "Event B is not a verified CausalityConsumed event");
        }

        bytes32 expectedPayloadHashB = keccak256(
            abi.encode(witness.parentDigest, witness.capabilityHash, witness.sequenceNumber, witness.stateCommitment)
        );
        if (evidenceB.payloadHash != expectedPayloadHashB) {
            return (false, "Event B payload does not commit to Event A causal witness");
        }

        return (true, "Valid cryptographic causal dependency proven: Event B consumed Event A capability");
    }
}
