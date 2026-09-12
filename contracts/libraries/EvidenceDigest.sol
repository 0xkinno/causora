// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ICausoraRegistry} from "../interfaces/ICausoraRegistry.sol";

/// @title EvidenceDigest
/// @notice Deterministic hashing for event evidence records
library EvidenceDigest {
    function computeDigest(ICausoraRegistry.EventEvidence memory e) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                e.chainKey,
                e.blockHeight,
                e.txIndex,
                e.txHash,
                e.emitter,
                e.eventSig,
                e.payloadHash
            )
        );
    }
}
