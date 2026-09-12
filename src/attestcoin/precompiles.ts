import { InterfaceAbi } from 'ethers';

export const BLOCK_PROVER_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000000FD2';
export const CHAIN_INFO_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000000FD3';

export const BLOCK_PROVER_ABI = [
  'function calculateTxIndex((bytes32 root, (bytes32 hash, bool isLeft)[] siblings) merkleProof) external view returns (uint64)',
  'function verify(uint64 chainKey, uint64 height, bytes encodedTransaction, (bytes32 root, (bytes32 hash, bool isLeft)[] siblings) merkleProof, (bytes32 lowerEndpointDigest, bytes32[] roots) continuityProof) external view returns (bool)',
  'function verifyAndEmit(uint64 chainKey, uint64 height, bytes encodedTransaction, (bytes32 root, (bytes32 hash, bool isLeft)[] siblings) merkleProof, (bytes32 lowerEndpointDigest, bytes32[] roots) continuityProof) external returns (bool)',
  'event TransactionVerified(uint64 indexed chainKey, uint64 indexed height, uint64 transactionIndex)'
] as unknown as InterfaceAbi;

export const CHAIN_INFO_ABI = [
  'function get_supported_chains() external view returns (tuple(uint64 chainKey, uint64 chainId, bytes chainName, uint8 chainEncoding)[] chains)',
  'function get_chain_by_key(uint64 chainKey) external view returns (tuple(tuple(uint64 chainKey, uint64 chainId, bytes chainName, uint8 chainEncoding) info, bool exists) result)',
  'function get_latest_attestation_height_and_hash(uint64 chainKey) external view returns (tuple(uint64 height, bytes32 hash, bool isAttestation, bool exists) result)',
  'function get_attestation_bounds(uint64 chainKey, uint64 targetHeight) external view returns (tuple(uint64 parentHeight, bytes32 parentHash, bool parentIsAttestation, uint64 childHeight, bytes32 childHash, bool childIsAttestation, bool isAttested) result)',
  'function is_height_attested(uint64 chainKey, uint64 targetHeight) external view returns (bool isAttested)'
] as unknown as InterfaceAbi;

export interface MerkleProofEntry {
  hash: string;
  isLeft: boolean;
}

export interface TransactionMerkleProof {
  root: string;
  siblings: MerkleProofEntry[];
}

export interface ContinuityProof {
  lowerEndpointDigest: string;
  roots: string[];
}
