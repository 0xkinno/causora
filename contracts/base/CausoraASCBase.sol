// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {INativeQueryVerifier, NativeQueryVerifierLib} from "../interfaces/INativeQueryVerifier.sol";
import {IChainInfo, ChainInfoLib} from "../interfaces/IChainInfo.sol";

/// @title CausoraASCBase
/// @notice Base contract for Attestcoin Smart Contracts (ASC) on Creditcoin CC3
/// @dev Implements canonical queryId calculation, precompile binding, and replay guards
abstract contract CausoraASCBase {
    INativeQueryVerifier public immutable VERIFIER;
    IChainInfo public immutable CHAIN_INFO;

    /// @notice Replay protection map: queryId => consumed
    mapping(bytes32 => bool) public processedQueries;

    error QueryAlreadyProcessed(bytes32 queryId);
    error ProofVerificationFailed();
    error BlockProverPrecompileError();

    constructor() {
        VERIFIER = NativeQueryVerifierLib.getVerifier();
        CHAIN_INFO = ChainInfoLib.getChainInfo();
    }

    /// @notice Computes the canonical 72-byte packed queryId: keccak256(chainKey, blockHeight, txIndex)
    function computeQueryId(
        uint64 chainKey,
        uint64 blockHeight,
        bytes32 merkleRoot,
        INativeQueryVerifier.MerkleProofEntry[] calldata siblings
    ) public view virtual returns (bytes32 queryId) {
        INativeQueryVerifier.MerkleProof memory merkle_proof = INativeQueryVerifier.MerkleProof({
            root: merkleRoot,
            siblings: siblings
        });

        uint256 txIndex = VERIFIER.calculateTxIndex(merkle_proof);

        assembly {
            let ptr := mload(0x40)
            mstore(ptr, chainKey)
            mstore(add(ptr, 32), shl(192, blockHeight))
            mstore(add(ptr, 40), txIndex)
            queryId := keccak256(ptr, 72)
        }
    }

    /// @dev Internal proof verification call to BlockProver precompile (0xFD2)
    function _verifyProof(
        uint64 chainKey,
        uint64 blockHeight,
        bytes calldata encodedTransaction,
        INativeQueryVerifier.MerkleProof calldata merkleProof,
        INativeQueryVerifier.ContinuityProof calldata continuityProof
    ) internal returns (bool verified, uint64 txIndex) {
        // Compute transaction index from Merkle siblings
        txIndex = VERIFIER.calculateTxIndex(merkleProof);

        // Verify inclusion and continuity via BlockProver
        verified = VERIFIER.verifyAndEmit(
            chainKey,
            blockHeight,
            encodedTransaction,
            merkleProof,
            continuityProof
        );
    }
}
