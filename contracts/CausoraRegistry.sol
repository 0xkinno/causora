// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CausoraASCBase} from "./base/CausoraASCBase.sol";
import {ICausoraRegistry} from "./interfaces/ICausoraRegistry.sol";
import {INativeQueryVerifier} from "./interfaces/INativeQueryVerifier.sol";
import {IEvmV1Decoder} from "./interfaces/IEvmV1Decoder.sol";
import {EvmV1Decoder} from "./libraries/EvmV1Decoder.sol";
import {EvidenceDigest} from "./libraries/EvidenceDigest.sol";

/// @title CausoraRegistry
/// @notice Master registry for Attestcoin-proven foreign events, source contract permissions, and replay protection
contract CausoraRegistry is CausoraASCBase, ICausoraRegistry, Ownable {
    /// @notice Whitelisted source contracts: chainKey => emitter => SourceKind
    mapping(uint64 => mapping(address => SourceKind)) public sourceContracts;
    
    /// @notice Admitted evidence store: queryId => EventEvidence
    mapping(bytes32 => EventEvidence) public evidenceRecords;
    
    /// @notice List of all admitted queryIds
    bytes32[] public admittedQueryIds;

    error SourceNotRegistered(uint64 chainKey, address emitter);
    error SourceTransactionReverted(uint8 receiptStatus);
    error UnsupportedTransactionType(uint8 txType);
    error NoLogsInTransaction();
    error UnregisteredEmitterLog(address emitter);
    error ZeroAddress();

    constructor() Ownable(msg.sender) {
        // Pre-register canonical testnet source kinds for Sepolia (chainKey 1) and Mainnet (chainKey 3)
    }

    /// @notice Whitelists an external source contract for a specific chainKey
    function registerSource(
        uint64 chainKey,
        address emitter,
        SourceKind kind,
        string calldata description
    ) external onlyOwner {
        if (emitter == address(0)) revert ZeroAddress();
        sourceContracts[chainKey][emitter] = kind;
        emit SourceRegistered(chainKey, emitter, kind, description);
    }

    /// @notice Removes a source contract from the whitelist
    function removeSource(uint64 chainKey, address emitter) external onlyOwner {
        delete sourceContracts[chainKey][emitter];
        emit SourceRemoved(chainKey, emitter);
    }

    function isSourceRegistered(uint64 chainKey, address emitter) external view override returns (bool, SourceKind) {
        SourceKind kind = sourceContracts[chainKey][emitter];
        return (kind != SourceKind.None, kind);
    }

    function getEvidence(bytes32 queryId) external view override returns (EventEvidence memory) {
        return evidenceRecords[queryId];
    }

    function computeQueryId(
        uint64 chainKey,
        uint64 blockHeight,
        bytes32 merkleRoot,
        INativeQueryVerifier.MerkleProofEntry[] calldata siblings
    ) public view override(CausoraASCBase, ICausoraRegistry) returns (bytes32) {
        return super.computeQueryId(chainKey, blockHeight, merkleRoot, siblings);
    }

    function hasProcessedQuery(bytes32 queryId) external view override returns (bool) {
        return processedQueries[queryId];
    }

    function getAdmittedQueryCount() external view returns (uint256) {
        return admittedQueryIds.length;
    }

    /// @notice Admits and records an Attestcoin-proven transaction event
    /// @param chainKey Attestcoin source chain identifier (1 = Sepolia, 3 = Mainnet)
    /// @param blockHeight Source block number
    /// @param encodedTransaction ABI-encoded EVM transaction & receipt bytes
    /// @param merkleProof Inclusion proof
    /// @param continuityProof Block continuity proof
    function admitEvidence(
        uint64 chainKey,
        uint64 blockHeight,
        bytes calldata encodedTransaction,
        INativeQueryVerifier.MerkleProof calldata merkleProof,
        INativeQueryVerifier.ContinuityProof calldata continuityProof
    ) external override returns (bytes32 queryId, uint64 txIndex, IEvmV1Decoder.ReceiptFields memory receipt) {
        // 1. Replay protection check
        queryId = computeQueryId(chainKey, blockHeight, merkleProof.root, merkleProof.siblings);
        if (processedQueries[queryId]) {
            emit QueryReplayDetected(queryId);
            revert QueryAlreadyProcessed(queryId);
        }

        // 2. Synchronously verify on-chain via BlockProver (0xFD2)
        (bool verified, uint64 computedIndex) = _verifyProof(
            chainKey,
            blockHeight,
            encodedTransaction,
            merkleProof,
            continuityProof
        );
        if (!verified) revert ProofVerificationFailed();
        txIndex = computedIndex;

        // 3. Mark queryId as permanently consumed
        processedQueries[queryId] = true;

        // 4. Decode receipt and enforce receiptStatus == 1
        uint8 txType = EvmV1Decoder.getTransactionType(encodedTransaction);
        if (!EvmV1Decoder.isValidTransactionType(txType)) {
            revert UnsupportedTransactionType(txType);
        }

        receipt = EvmV1Decoder.decodeReceiptFields(encodedTransaction);
        if (receipt.receiptStatus != 1) {
            revert SourceTransactionReverted(receipt.receiptStatus);
        }

        if (receipt.receiptLogs.length == 0) {
            revert NoLogsInTransaction();
        }

        // 5. Authenticate emitter
        IEvmV1Decoder.LogEntry memory primaryLog = receipt.receiptLogs[0];
        SourceKind kind = sourceContracts[chainKey][primaryLog.address_];
        if (kind == SourceKind.None) {
            revert SourceNotRegistered(chainKey, primaryLog.address_);
        }

        bytes32 eventSig = primaryLog.topics.length > 0 ? primaryLog.topics[0] : bytes32(0);
        bytes32 payloadHash = keccak256(primaryLog.data);
        bytes32 txHash = keccak256(encodedTransaction);

        // 6. Record admitted evidence
        EventEvidence memory evidence = EventEvidence({
            chainKey: chainKey,
            blockHeight: blockHeight,
            txIndex: txIndex,
            txHash: txHash,
            emitter: primaryLog.address_,
            eventSig: eventSig,
            queryId: queryId,
            payloadHash: payloadHash,
            verifiedAt: uint64(block.timestamp),
            exists: true
        });

        evidenceRecords[queryId] = evidence;
        admittedQueryIds.push(queryId);

        emit EventEvidenceAdmitted(
            queryId,
            chainKey,
            blockHeight,
            txIndex,
            primaryLog.address_,
            eventSig
        );
    }
}
