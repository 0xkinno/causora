// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title INativeQueryVerifier
/// @notice Interface for the Native Query Verifier Precompile at address 0x0FD2 (4050)
interface INativeQueryVerifier {
    struct MerkleProofEntry {
        bytes32 hash;
        bool isLeft;
    }

    struct MerkleProof {
        bytes32 root;
        MerkleProofEntry[] siblings;
    }

    struct ContinuityProof {
        bytes32 lowerEndpointDigest;
        bytes32[] roots;
    }

    event TransactionVerified(
        uint64 indexed chainKey,
        uint64 indexed height,
        uint64 transactionIndex
    );

    function verifyAndEmit(
        uint64 chainKey,
        uint64 height,
        bytes calldata encodedTransaction,
        MerkleProof calldata merkleProof,
        ContinuityProof calldata continuityProof
    ) external returns (bool);

    function verifyAndEmit(
        uint64 chainKey,
        uint64[] calldata heights,
        bytes[] calldata encodedTransactions,
        MerkleProof[] calldata merkleProofs,
        ContinuityProof calldata sharedContinuityProof
    ) external returns (bool);

    function verify(
        uint64 chainKey,
        uint64 height,
        bytes calldata encodedTransaction,
        MerkleProof calldata merkleProof,
        ContinuityProof calldata continuityProof
    ) external view returns (bool);

    function verify(
        uint64 chainKey,
        uint64[] calldata heights,
        bytes[] calldata encodedTransactions,
        MerkleProof[] calldata merkleProofs,
        ContinuityProof calldata sharedContinuityProof
    ) external view returns (bool);

    function calculateTxIndex(MerkleProof calldata merkleProof) external view returns (uint64);
}

library NativeQueryVerifierLib {
    address constant PRECOMPILE_ADDRESS = 0x0000000000000000000000000000000000000FD2;

    function getVerifier() internal pure returns (INativeQueryVerifier) {
        return INativeQueryVerifier(PRECOMPILE_ADDRESS);
    }
}
