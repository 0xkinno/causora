// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {INativeQueryVerifier} from "./INativeQueryVerifier.sol";
import {IEvmV1Decoder} from "./IEvmV1Decoder.sol";

/// @title ICausoraRegistry
/// @notice Central registry for verified Attestcoin events, registered source contracts, and replay guards
interface ICausoraRegistry {
    enum SourceKind {
        None,
        CollateralVault,
        LiquidationEngine,
        CausalWitnessHub,
        GenericDeFi
    }

    struct SourceRegistration {
        SourceKind kind;
        bytes32 expectedEventSignature;
        string description;
        bool exists;
    }

    struct EventEvidence {
        uint64 chainKey;
        uint64 blockHeight;
        uint64 txIndex;
        bytes32 txHash;
        address emitter;
        bytes32 eventSig;
        bytes32 queryId;
        bytes32 payloadHash;
        uint64 verifiedAt;
        bool exists;
    }

    event SourceRegistered(
        uint64 indexed chainKey,
        address indexed emitter,
        SourceKind kind,
        bytes32 expectedEventSignature,
        string description
    );
    event SourceRemoved(uint64 indexed chainKey, address indexed emitter);
    event EventEvidenceAdmitted(
        bytes32 indexed queryId,
        uint64 indexed chainKey,
        uint64 indexed blockHeight,
        uint64 txIndex,
        address emitter,
        bytes32 eventSig
    );
    event QueryReplayDetected(bytes32 indexed queryId);

    function isSourceRegistered(uint64 chainKey, address emitter) external view returns (bool, SourceKind);
    function getSourceRegistration(uint64 chainKey, address emitter) external view returns (SourceKind kind, bytes32 expectedEventSignature, string memory description);
    function getEvidence(bytes32 queryId) external view returns (EventEvidence memory);
    function hasProcessedQuery(bytes32 queryId) external view returns (bool);
    function computeQueryId(
        uint64 chainKey,
        uint64 blockHeight,
        bytes32 merkleRoot,
        INativeQueryVerifier.MerkleProofEntry[] calldata siblings
    ) external view returns (bytes32);

    function registerSource(
        uint64 chainKey,
        address emitter,
        SourceKind kind,
        bytes32 expectedEventSignature,
        string calldata description
    ) external;

    function admitEvidence(
        uint64 chainKey,
        uint64 blockHeight,
        bytes calldata encodedTransaction,
        INativeQueryVerifier.MerkleProof calldata merkleProof,
        INativeQueryVerifier.ContinuityProof calldata continuityProof
    ) external returns (bytes32 queryId, uint64 txIndex, IEvmV1Decoder.ReceiptFields memory receipt);
}
