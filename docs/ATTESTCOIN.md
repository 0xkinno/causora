# Attestcoin Protocol Integration & Native Precompiles

## 1. Overview

Attestcoin provides a native cross-chain state verification mechanism for the Creditcoin network. By executing deterministic cryptographic checks over foreign chain block headers and transaction trees, Creditcoin smart contracts can verify the existence and inclusion of foreign events synchronously within an EVM call.

## 2. Native Precompile Architecture

Creditcoin CC3 Testnet hosts two primary precompiles dedicated to Attestcoin operations:

### 2.1 BlockProver (`0x0000000000000000000000000000000000000FD2`)

The `BlockProver` precompile executes Merkle transaction tree verification and multi-block continuity validation at native execution speed:

- **`verifySingle(chainKey, height, encodedTx, merkleProof, continuityProof)`**: Pure view function verifying whether `encodedTx` is included in the attested block header at `height` for source chain `chainKey`.
- **`verifyAndEmitSingle(...)`**: State-changing version that emits an on-chain audit event:
  ```solidity
  event TransactionVerified(uint64 indexed chainKey, uint64 indexed height, uint64 transactionIndex);
  ```
- **`calculateTxIndex(merkleProof)`**: Reconstructs the exact ordinal transaction index within the block by walking leaf-to-root through Merkle sibling laterality flags (`isLeft`).

### 2.2 ChainInfo (`0x0000000000000000000000000000000000000FD3`)

The `ChainInfo` precompile provides querying capabilities for source chain attestation frontiers, block bounds, and chain metadata:

- **`get_supported_chains()`**: Returns all active source chains (`chainKey = 1` for Ethereum Sepolia, `chainKey = 3` for Ethereum Mainnet).
- **`get_attestation_bounds(chainKey, height)`**: Queries the lower and upper attestation boundaries for a target block height.
- **`is_height_attested(chainKey, height)`**: Checks if continuity proofs are available for a given height.

## 3. What Attestcoin Proves vs. What Causora Enforces

| Attestcoin Native Capability | What Attestcoin Proves | What Causora Enforces |
|---|---|---|
| **Foreign Transaction Inclusion** | Transaction `tx` existed in source block `H` | Authenticates emitter contract and parses `receiptStatus == 1` |
| **Ordinal Intra-Block Index** | Leaf index `txIndex` inside block `H` | Evaluates `SAME_CHAIN_ORDER` precedence between events |
| **Block Continuity** | Block `H` is linked to attested frontier | Rejects stale or discontinuous foreign blocks |
| **Independent Source Chains** | Both events exist in their respective histories | **Enforces `CROSS_CHAIN_INDETERMINATE` (fail-closed `HOLD`) when no cryptographic causal witness exists** |
