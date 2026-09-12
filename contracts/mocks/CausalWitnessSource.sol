// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CausalWitnessSource
/// @notice Source contract demonstrating explicit single-use cryptographic causal capability minting and execution
contract CausalWitnessSource {
    event CausalCapabilityMinted(
        bytes32 indexed capabilityHash,
        address indexed owner,
        uint64 sequenceNumber,
        bytes32 stateCommitment
    );

    event CausalityConsumed(
        bytes32 parentDigest,
        bytes32 capabilityHash,
        uint64 sequenceNumber,
        bytes32 stateCommitment
    );

    mapping(bytes32 => bool) public consumedCapabilities;

    function mintCapability(
        bytes32 capabilityHash,
        uint64 sequenceNumber,
        bytes32 stateCommitment
    ) external {
        emit CausalCapabilityMinted(capabilityHash, msg.sender, sequenceNumber, stateCommitment);
    }

    function consumeCausality(
        bytes32 parentDigest,
        bytes32 capabilityHash,
        uint64 sequenceNumber,
        bytes32 stateCommitment
    ) external {
        bytes32 consumptionKey = keccak256(abi.encode(parentDigest, capabilityHash, sequenceNumber));
        require(!consumedCapabilities[consumptionKey], "Capability already consumed");
        consumedCapabilities[consumptionKey] = true;
        emit CausalityConsumed(parentDigest, capabilityHash, sequenceNumber, stateCommitment);
    }
}
