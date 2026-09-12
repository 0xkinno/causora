import { ethers } from "ethers";
import { ActionDecision, RelationType } from "./types";
export * from "./generated-contracts";
import {
  CAUSORA_REGISTRY_ABI,
  RELATION_ENGINE_ABI,
  CAUSORA_GUARD_ABI,
  LENDING_POSITION_MANAGER_ABI,
  BLOCK_PROVER_ABI,
  CHAIN_INFO_ABI,
  CONTRACT_ADDRESSES
} from "./generated-contracts";

/**
 * Computes the canonical 72-byte packed queryId matching Attestcoin ASC assembly:
 * keccak256(uint64 chainKey [32 bytes], uint64 blockHeight [8 bytes], uint256 txIndex [32 bytes])
 */
export function computeQueryId(chainKey: number | bigint, blockHeight: number | bigint, txIndex: number | bigint): string {
  const chainKeyBytes = ethers.zeroPadValue(ethers.toBeHex(chainKey), 32);
  const blockHeightBytes = ethers.zeroPadValue(ethers.toBeHex(blockHeight), 8);
  const txIndexBytes = ethers.zeroPadValue(ethers.toBeHex(txIndex), 32);

  const packed = ethers.concat([chainKeyBytes, blockHeightBytes, txIndexBytes]);
  return ethers.keccak256(packed);
}

/**
 * GuardDecision enum in ICausoraGuard.sol:
 * 0 = REJECT, 1 = ALLOW_A, 2 = ALLOW_B, 3 = HOLD
 */
export function decodeAction(actionCode: number): ActionDecision {
  switch (actionCode) {
    case 1:
    case 2:
      return 'ACT';
    case 3:
      return 'HOLD';
    case 0:
    default:
      return 'REJECT';
  }
}

/**
 * RelationClass enum in IRelationEngine.sol:
 * 0 = INVALID, 1 = SAME_CHAIN_ORDER, 2 = CROSS_CHAIN_CAUSAL, 3 = CROSS_CHAIN_INDETERMINATE
 */
export function decodeRelation(relationCode: number): RelationType {
  switch (relationCode) {
    case 1:
      return 'BEFORE';
    case 2:
      return 'AFTER';
    case 3:
      return 'CONCURRENT_UNPROVABLE';
    case 0:
    default:
      return 'INVALID';
  }
}

export {
  CAUSORA_REGISTRY_ABI,
  RELATION_ENGINE_ABI,
  CAUSORA_GUARD_ABI,
  LENDING_POSITION_MANAGER_ABI,
  BLOCK_PROVER_ABI,
  CHAIN_INFO_ABI,
  CONTRACT_ADDRESSES
};
