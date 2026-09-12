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

    event CausalActionExecuted(
        bytes32 indexed capabilityHash,
        address indexed consumer,
        uint64 sequenceNumber,
        bytes32 parentDigest
    );

    mapping(bytes32 => bool) public consumedCapabilities;

    function mintCapability(
        bytes32 capabilityHash,
        uint64 sequenceNumber,
        bytes32 stateCommitment
    ) external {
        emit CausalCapabilityMinted(capabilityHash, msg.sender, sequenceNumber, stateCommitment);
    }

    function executeWithCapability(
        bytes32 capabilityHash,
        uint64 sequenceNumber,
        bytes32 parentDigest
    ) external {
        require(!consumedCapabilities[capabilityHash], "Capability already consumed");
        consumedCapabilities[capabilityHash] = true;
        emit CausalActionExecuted(capabilityHash, msg.sender, sequenceNumber, parentDigest);
    }
}
