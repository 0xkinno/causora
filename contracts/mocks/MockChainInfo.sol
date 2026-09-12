// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IChainInfo} from "../interfaces/IChainInfo.sol";

/// @title MockChainInfo
/// @notice Local test implementation of the Creditcoin ChainInfo Precompile (0xFD3)
contract MockChainInfo is IChainInfo {
    function get_supported_chains() external pure override returns (ChainInfo[] memory chains) {
        chains = new ChainInfo[](2);
        chains[0] = ChainInfo({
            chainKey: 1,
            chainId: 11155111,
            chainName: "Ethereum Sepolia",
            chainEncoding: 1
        });
        chains[1] = ChainInfo({
            chainKey: 3,
            chainId: 1,
            chainName: "Ethereum Mainnet",
            chainEncoding: 1
        });
    }

    function get_chain_by_key(uint64 chainKey) external pure override returns (ChainInfoResult memory result) {
        if (chainKey == 1) {
            result.info = ChainInfo(1, 11155111, "Ethereum Sepolia", 1);
            result.exists = true;
        } else if (chainKey == 3) {
            result.info = ChainInfo(3, 1, "Ethereum Mainnet", 1);
            result.exists = true;
        } else {
            result.exists = false;
        }
    }

    function get_attestation_genesis_height(uint64) external pure override returns (uint64) {
        return 1000;
    }

    function get_latest_attestation_height_and_hash(uint64) external pure override returns (HeightHashResult memory result) {
        result.height = 5000000;
        result.hash = keccak256("latest_attestation");
        result.isAttestation = true;
        result.exists = true;
    }

    function get_latest_checkpoint_height_and_hash(uint64) external pure override returns (HeightHashResult memory result) {
        result.height = 5000000;
        result.hash = keccak256("latest_checkpoint");
        result.isAttestation = false;
        result.exists = true;
    }

    function is_height_attested(uint64, uint64) external pure override returns (bool) {
        return true;
    }

    function get_attestation_bounds(uint64, uint64 targetHeight) external pure override returns (BoundsCheckResult memory result) {
        result.parentHeight = targetHeight > 10 ? targetHeight - 5 : 0;
        result.parentHash = keccak256(abi.encodePacked(result.parentHeight));
        result.parentIsAttestation = true;
        result.childHeight = targetHeight + 5;
        result.childHash = keccak256(abi.encodePacked(result.childHeight));
        result.childIsAttestation = true;
        result.isAttested = true;
    }

    function get_attestation_height_for_digest(uint64, bytes32) external pure override returns (HeightResult memory result) {
        result.height = 1000;
        result.exists = true;
    }

    function get_checkpoint_for_height(uint64, uint64) external pure override returns (HashResult memory result) {
        result.hash = keccak256("checkpoint");
        result.exists = true;
    }
}
