// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IChainInfo {
    struct ChainInfo {
        uint64 chainKey;
        uint64 chainId;
        bytes chainName;
        uint8 chainEncoding;
    }

    struct ChainInfoResult {
        ChainInfo info;
        bool exists;
    }

    struct HeightResult {
        uint64 height;
        bool exists;
    }

    struct HashResult {
        bytes32 hash;
        bool exists;
    }

    struct HeightHashResult {
        uint64 height;
        bytes32 hash;
        bool isAttestation;
        bool exists;
    }

    struct BoundsCheckResult {
        uint64 parentHeight;
        bytes32 parentHash;
        bool parentIsAttestation;
        uint64 childHeight;
        bytes32 childHash;
        bool childIsAttestation;
        bool isAttested;
    }

    function get_supported_chains() external view returns (ChainInfo[] memory chains);
    function get_chain_by_key(uint64 chainKey) external view returns (ChainInfoResult memory result);
    function get_attestation_genesis_height(uint64 chainKey) external view returns (uint64 genesisHeight);
    function get_latest_attestation_height_and_hash(uint64 chainKey) external view returns (HeightHashResult memory result);
    function get_latest_checkpoint_height_and_hash(uint64 chainKey) external view returns (HeightHashResult memory result);
    function is_height_attested(uint64 chainKey, uint64 targetHeight) external view returns (bool isAttested);
    function get_attestation_bounds(uint64 chainKey, uint64 targetHeight) external view returns (BoundsCheckResult memory result);
    function get_attestation_height_for_digest(uint64 chainKey, bytes32 digest) external view returns (HeightResult memory);
    function get_checkpoint_for_height(uint64 chainKey, uint64 height) external view returns (HashResult memory);
}

library ChainInfoLib {
    address constant PRECOMPILE_ADDRESS = 0x0000000000000000000000000000000000000fD3;

    function getChainInfo() internal pure returns (IChainInfo) {
        return IChainInfo(PRECOMPILE_ADDRESS);
    }
}
