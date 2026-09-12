# Adversarial Threat Model & Security Invariants

## 1. Security Invariant

> **NO FINANCIAL ACTION MAY DEPEND ON AN ORDER RELATION UNLESS THE RELATION IS DERIVED FROM CRYPTOGRAPHICALLY ADMITTED EVIDENCE OR AN EXPLICIT PRE-COMMITTED CAUSAL WITNESS.**

## 2. Adversarial Vectors & Defenses

| Attack Vector | Attacker Capability | Protocol Defense | Mitigation Result |
|---|---|---|---|
| **1. Submission-Order Attack** | Submitting a later event prior to an earlier event | Order is derived strictly from proven `(height, txIndex)`, never submission time | **Neutralized** |
| **2. Delayed Proof Sniping** | Artificially delaying proof delivery to win races | Causora verifies source block heights and requires provable precedence | **Neutralized** |
| **3. Wrong-Chain Replay** | Replaying Sepolia proof against a Mainnet registry | Canonical queryId binds `chainKey`: `keccak256(chainKey, blockHeight, txIndex)` | **Reverts** |
| **4. Unauthorized Emitter** | Deploying a look-alike contract emitting forged events | Source whitelist registry checks `log.address_` against authorized emitters | **Reverts (`SourceNotRegistered`)** |
| **5. Failed Transaction Ingest** | Presenting a reverted transaction with matching topics | EVM decoder enforces `receipt.receiptStatus == 1` | **Reverts (`SourceTransactionReverted`)** |
| **6. Encoded TX Tampering** | Altering calldata or payload bytes | BlockProver verifies inclusion of exact encoded bytes against Merkle root | **Reverts (`BlockProver`)** |
| **7. Tampered Merkle Proof** | Bit-flipping sibling hashes | Cryptographic Merkle path fails against attested block root | **Reverts** |
| **8. Broken Continuity** | Providing fake unlinked block roots | Block continuity validation checks chain against attested frontier | **Reverts** |
| **9. Stale Proof Reuse** | Resubmitting previously consumed proofs | Storage map `processedQueries[queryId]` burns queryId permanently on admission | **Reverts (`QueryAlreadyProcessed`)** |
| **10. Duplicated Evidence** | Injecting identical proofs in batch operations | Atomic uniqueness checks on queryId array | **Reverts** |
| **11. Front-Running Manipulation** | Racing liquidation trigger on independent chain | Cross-chain events without witness classify as `INDETERMINATE` and enter `HOLD` | **Fail-Closed `HOLD`** |
| **12. Argument Substitution** | Tampering with loanId or amount | Event evidence digest binds `payloadHash = keccak256(log.data)` | **Digest Mismatch** |
| **13. TxIndex Manipulation** | Flipping sibling `isLeft` flags | Reconstructed Merkle root changes and fails inclusion check | **Reverts** |
| **14. Same-Block Race Confusion** | Claiming higher txIndex was executed first | `calculateTxIndex` deterministically recovers ordinal index | **Ordered Correctly** |
| **15. Timestamp Clock Spoofing** | Presenting block header timestamps across chains | Protocol rejects timestamps as cross-chain order authority | **Enforces `INDETERMINATE`** |
| **16. Malformed Causal Witness** | Fabricating unlinked witness parent digest | `CausalWitnessLib` strictly verifies hash chain commitment | **Enforces `INDETERMINATE`** |
| **17. Capability Reuse** | Replaying single-use witness capabilities | Sequence number and commitment validation prevent double-spending | **Enforces `INDETERMINATE`** |
| **18. Action on Indeterminate** | Forcing liquidation during `INDETERMINATE` | `CausoraGuard` enforces fail-closed `HOLD`, freezing liquidation | **Capital Protected** |
