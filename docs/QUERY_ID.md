# CAUSORA — Attestcoin Query ID Specification & Layout

## 1. Overview

In the Attestcoin architecture on Creditcoin CC3, an event query identity (`queryId`) uniquely identifies a proven foreign transaction or event. It provides deterministic, replay-protected addressing across heterogeneous blockchains.

---

## 2. Canonical 72-Byte Packed Layout

The `queryId` is computed as the `keccak256` hash of a 72-byte contiguous memory buffer composed of three packed fields:

| Field | Solidity Type | Byte Offset | Size (Bytes) | Description |
|---|---|---|---|---|
| `chainKey` | `uint64` (in 32-byte slot) | `0x00 .. 0x1F` | 32 | Attestcoin foreign chain identifier (`1` = Sepolia, `3` = Mainnet) |
| `blockHeight` | `uint64` | `0x20 .. 0x27` | 8 | Source chain block number containing the transaction |
| `txIndex` | `uint256` | `0x28 .. 0x47` | 32 | Ordinal index of the transaction in the block, derived from Merkle tree siblings |
| **Total** | | | **72 bytes** | |

---

## 3. Reference Solidity Implementation

```solidity
function computeQueryId(
    uint64 chainKey,
    uint64 blockHeight,
    uint256 txIndex
) internal pure returns (bytes32 queryId) {
    assembly {
        let ptr := mload(0x40)
        mstore(ptr, chainKey)
        mstore(add(ptr, 32), shl(192, blockHeight))
        mstore(add(ptr, 40), txIndex)
        queryId := keccak256(ptr, 72)
    }
}
```

---

## 4. TypeScript / SDK Parity Implementation

In TypeScript / ethers / viem:

```typescript
import { ethers } from 'ethers';

export function computeQueryId72(
  chainKey: number | bigint,
  blockHeight: number | bigint,
  txIndex: number | bigint
): string {
  const chainKeyBytes = ethers.zeroPadValue(ethers.toBeHex(chainKey), 32);
  const blockHeightBytes = ethers.zeroPadValue(ethers.toBeHex(blockHeight), 8);
  const txIndexBytes = ethers.zeroPadValue(ethers.toBeHex(txIndex), 32);

  const packed = ethers.concat([chainKeyBytes, blockHeightBytes, txIndexBytes]);
  return ethers.keccak256(packed);
}
```

---

## 5. Security & Invariant Guarantees

1. **Cross-Chain Collision Resistance**: Since `chainKey` occupies the first 32 bytes, identical block heights and transaction indices on different chains always yield distinct `queryId`s.
2. **Deterministic Replay Defense**: Once a `queryId` is admitted in `CausoraRegistry`, it is permanently marked as consumed (`processedQueries[queryId] = true`), preventing double-spend or duplicate admission attacks.
