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
/// @notice Master registry for Attestcoin-proven foreign events, hardened source contracts, and replay protection
contract CausoraRegistry is CausoraASCBase, ICausoraRegistry, Ownable {
    /// @notice Whitelisted source contracts: chainKey => emitter => SourceRegistration
    mapping(uint64 => mapping(address => SourceRegistration)) public sourceRegistrations;

    /// @notice Admitted evidence store: queryId => EventEvidence
    mapping(bytes32 => EventEvidence) public evidenceRecords;

    /// @notice List of all admitted queryIds
    bytes32[] public admittedQueryIds;

    error SourceNotRegistered(uint64 chainKey, address emitter);
    error SourceTransactionReverted(uint8 receiptStatus);
    error UnsupportedTransactionType(uint8 txType);
    error NoLogsInTransaction();
    error ExpectedEventNotFound(uint64 chainKey);
    error AmbiguousEventLogs(uint64 chainKey, uint256 matchCount);
    error ZeroAddress();
    error ZeroEventSignature();

    constructor() Ownable(msg.sender) {}

    /// @notice Whitelists an external source contract with expected event signature
    function registerSource(
        uint64 chainKey,
        address emitter,
        SourceKind kind,
        bytes32 expectedEventSignature,
        string calldata description
    ) external override onlyOwner {
        if (emitter == address(0)) revert ZeroAddress();
        if (expectedEventSignature == bytes32(0)) revert ZeroEventSignature();

        sourceRegistrations[chainKey][emitter] = SourceRegistration({
            kind: kind,
            expectedEventSignature: expectedEventSignature,
            description: description,
            exists: true
        });

        emit SourceRegistered(chainKey, emitter, kind, expectedEventSignature, description);
    }

    /// @notice Removes a source contract from the whitelist
    function removeSource(uint64 chainKey, address emitter) external onlyOwner {
        delete sourceRegistrations[chainKey][emitter];
        emit SourceRemoved(chainKey, emitter);
    }

    function isSourceRegistered(uint64 chainKey, address emitter) external view override returns (bool, SourceKind) {
        SourceRegistration memory reg = sourceRegistrations[chainKey][emitter];
        return (reg.exists, reg.kind);
    }

    function getSourceRegistration(
        uint64 chainKey,
        address emitter
    ) external view override returns (SourceKind kind, bytes32 expectedEventSignature, string memory description) {
        SourceRegistration memory reg = sourceRegistrations[chainKey][emitter];
        return (reg.kind, reg.expectedEventSignature, reg.description);
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

    /// @dev Authenticates logs against registered source contracts and strict event signature
    function _authenticateReceiptLog(
        uint64 chainKey,
        IEvmV1Decoder.LogEntry[] memory logs
    ) internal view returns (IEvmV1Decoder.LogEntry memory matchedLog) {
        bool foundRegisteredEmitter = false;
        address firstUnregisteredEmitter = address(0);
        uint256 matchCount = 0;
        uint256 matchedLogIndex = 0;

        for (uint256 i = 0; i < logs.length; i++) {
            IEvmV1Decoder.LogEntry memory logEntry = logs[i];
            SourceRegistration memory reg = sourceRegistrations[chainKey][logEntry.address_];
            if (reg.exists) {
                foundRegisteredEmitter = true;
                if (logEntry.topics.length > 0 && logEntry.topics[0] == reg.expectedEventSignature) {
                    matchCount++;
                    matchedLogIndex = i;
                }
            } else if (firstUnregisteredEmitter == address(0)) {
                firstUnregisteredEmitter = logEntry.address_;
            }
        }

        if (!foundRegisteredEmitter) {
            revert SourceNotRegistered(chainKey, firstUnregisteredEmitter);
        }
        if (matchCount == 0) {
            revert ExpectedEventNotFound(chainKey);
        }
        if (matchCount > 1) {
            revert AmbiguousEventLogs(chainKey, matchCount);
        }

        matchedLog = logs[matchedLogIndex];
    }

    /// @notice Admits and records an Attestcoin-proven transaction event with hardened event authentication
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

        // 5. Search logs and authenticate source event (Priority 3: No blind receiptLogs[0])
        IEvmV1Decoder.LogEntry memory primaryLog = _authenticateReceiptLog(chainKey, receipt.receiptLogs);
        bytes32 eventSig = primaryLog.topics[0];
        bytes32 payloadHash = keccak256(primaryLog.data);
        bytes32 txHash = keccak256(encodedTransaction);

        // 6. Record admitted evidence bound strictly to the authentic event
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
