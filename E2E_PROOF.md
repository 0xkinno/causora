# CAUSORA — End-to-End Cryptographic Proof Plan
**Specification:** `CAUSORA_MASTER_OVERHAUL.md` (Section 26, Phase 5)

---

## The Complete End-to-End Verification Pipeline

```text
ETHEREUM SEPOLIA (Source Chain: chainKey 1)
      │
      │ 1. Real on-chain events:
      │    - CollateralDeposit (block A, txIndex A)
      │    - LiquidationTrigger (block B, txIndex B)
      ▼
ATTESTCOIN PROOF BUILDER / RELAYER
      │
      │ 2. Construct cryptographic proof:
      │    - Merkle inclusion proof (receipt trie)
      │    - Continuity proof (block header chain)
      ▼
CREDITCOIN CC3 TESTNET (Settlement Chain: chainId 102031)
      │
      ├──> Native Precompile 0xFD2 (BlockProver)
      │      - Validates Merkle inclusion & continuity
      │
      ├──> CausoraRegistry.sol
      │      - Admits evidence, computes queryId, enforces replay protection
      │
      ├──> RelationEngine.sol
      │      - Classifies SAME_CHAIN_ORDER or CROSS_CHAIN_INDETERMINATE / CROSS_CHAIN_CAUSAL
      │
      ├──> CausoraGuard.sol
      │      - Enforces fail-closed financial policy
      │
      └──> LendingPositionManager.sol
             - Executes state transition (SAFE -> RESCUED or HELD or LIQUIDATED)
             - Generates verifiable Decision Receipt
      ▼
CAUSORA UI
      - Reads on-chain state via Wagmi/Viem
      - Displays canonical Decision Receipt with cryptographic digests
```

---

## 2. Test Cases to Execute

1. **Intra-Chain Clear Precedence (ACT):**
   - Event A (Deposit) occurs at block 5,824,100, index 10.
   - Event B (Liquidation) occurs at block 5,824,100, index 25.
   - Engine evaluates: `PROVABLY_FIRST_A`.
   - Guard decision: `ALLOW_A`. Position transitions to `RESCUED`.

2. **Cross-Chain Independent Race (HOLD - Fail-Closed):**
   - Event A on Sepolia (chainKey 1).
   - Event B on Arbitrum / Bitcoin / ChainKey 2.
   - No cryptographic causal witness provided.
   - Engine evaluates: `CROSS_CHAIN_INDETERMINATE`.
   - Guard decision: `HOLD`. Position transitions to `HELD` (capital protected against malicious front-running).

3. **Tampered Evidence Bit-Flip (REJECT):**
   - Merkle proof sibling or root is mutated.
   - BlockProver (`0xFD2`) reverts.
   - Guard decision: `REJECT`.
