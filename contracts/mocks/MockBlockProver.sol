// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {INativeQueryVerifier} from "../interfaces/INativeQueryVerifier.sol";

/// @title MockBlockProver
/// @notice Local test implementation of the Creditcoin BlockProver Precompile (0xFD2)
contract MockBlockProver is INativeQueryVerifier {
    bool public shouldFail = false;

    function setShouldFail(bool _shouldFail) external {
        shouldFail = _shouldFail;
    }

    function calculateTxIndex(MerkleProof calldata merkleProof) public pure override returns (uint64) {
        uint64 index = 0;
        for (uint256 i = 0; i < merkleProof.siblings.length; i++) {
            if (merkleProof.siblings[i].isLeft) {
                index |= uint64(1 << i);
            }
        }
        return index;
    }

    function verify(
        uint64,
        uint64,
        bytes calldata,
        MerkleProof calldata merkleProof,
        ContinuityProof calldata
    ) external view override returns (bool) {
        if (shouldFail) revert("BlockProver: verification failed");
        if (merkleProof.root == bytes32(0)) revert("BlockProver: empty root");
        return true;
    }

    function verifyAndEmit(
        uint64 chainKey,
        uint64 height,
        bytes calldata encodedTransaction,
        MerkleProof calldata merkleProof,
        ContinuityProof calldata continuityProof
    ) external override returns (bool) {
        if (shouldFail) revert("BlockProver: verification failed");
        if (merkleProof.root == bytes32(0)) revert("BlockProver: empty root");
        
        uint64 txIndex = calculateTxIndex(merkleProof);
        emit TransactionVerified(chainKey, height, txIndex);
        return true;
    }

    function verify(
        uint64,
        uint64[] calldata,
        bytes[] calldata,
        MerkleProof[] calldata,
        ContinuityProof calldata
    ) external view override returns (bool) {
        if (shouldFail) revert("BlockProver: batch verification failed");
        return true;
    }

    function verifyAndEmit(
        uint64 chainKey,
        uint64[] calldata heights,
        bytes[] calldata,
        MerkleProof[] calldata merkleProofs,
        ContinuityProof calldata
    ) external override returns (bool) {
        if (shouldFail) revert("BlockProver: batch verification failed");
        for (uint256 i = 0; i < heights.length; i++) {
            uint64 txIndex = calculateTxIndex(merkleProofs[i]);
            emit TransactionVerified(chainKey, heights[i], txIndex);
        }
        return true;
    }
}
