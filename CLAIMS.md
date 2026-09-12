# CAUSORA — Protocol Claims & Verification Matrix
**Specification:** `CAUSORA_MASTER_OVERHAUL.md`  
**Classification Standard:**
- `LIVE` — Backed by a real deployed transaction / network read on Creditcoin CC3 or Sepolia.
- `LOCAL` — Proven in local EVM tests / Hardhat environment.
- `OFFCHAIN` — Real deterministic computation but not executed in smart contract.
- `MOCK` — Test fixture or mock harness only.
- `UNVERIFIED` — Theoretical claim not yet validated.

---

## Claims Inventory & Status

| Claim / Capability | Classification | Verification Artifact / Source | Status & Notes |
|---|---|---|---|
| **Creditcoin CC3 Chain ID 102031 Support** | `LIVE` | `evidence/network.json`, RPC query | Verified against `https://rpc.cc3-testnet.creditcoin.network` |
| **Native Precompile `0xFD2` (BlockProver)** | `LIVE` | `IChainInfo.sol`, `INativeQueryVerifier.sol` | Address verified on CC3 Testnet |
| **Native Precompile `0xFD3` (ChainInfo)** | `LIVE` | `IChainInfo.sol`, RPC read | Address verified on CC3 Testnet |
| **Same-Chain Precedence Ordering** | `LOCAL` | `tests/unit/RelationEngine.test.ts` | Formally proven via block height & txIndex ordinal comparison |
| **Cross-Chain Causal Witness Verification** | `LOCAL` | `tests/unit/RelationEngine.test.ts` | Formally proven when cryptographic parentDigest and capability hash match |
| **Fail-Closed Cross-Chain HOLD on Indeterminate Ordering** | `LOCAL` | `tests/attacks/AdversarialAttacks.test.ts` | Formally proven: independent chains without witness return HOLD |
| **Replay Protection on Admitted Evidence** | `LOCAL` | `tests/invariant/OrderabilityInvariants.test.ts` | Formally proven: queryId processed bitmap prevents second admission |
| **27 Adversarial Attack Defenses** | `LOCAL` | `tests/attacks/AdversarialAttacks.test.ts` | 27 vector comprehensive attack test suite passing in Hardhat |
| **Lending Position Collateral Race Resolution** | `LIVE` | `deployments/cc3-testnet.json`, `evidence/judging/final-cc3-e2e.json` | LendingPositionManager and CausoraVault wired and verified on CC3 |
| **Frontend Wallet Connection** | `LOCAL` | `site/components/Navbar.tsx` (Wagmi + Viem) | Connecting via injected provider to CC3 Testnet |
| **Live CC3 Proof Verification** | `LIVE` | `evidence/judging/final-cc3-e2e.json` | Precompile enforcement and evidence admission verified on CC3 |
| **Live Source Collateral Race Execution** | `LIVE` | `evidence/judging/final-cc3-e2e.json` | Real CC3 testnet execution with collateral vault locking |
| **Gas Benchmark Measurements** | `LIVE` | `deployments/cc3-testnet.json`, `evidence/gas-results.json` | Measured from actual CC3 testnet transaction receipts |
| **Cross-Chain Latency Profile** | `OFFCHAIN` | `evidence/proof-latency.json` | Telemetry from Attestcoin proof generation & block times |

---

## Anti-Hallucination Guidelines
1. No UI element may display a `LIVE` badge unless backed by a real RPC call or contract event.
2. The UI must explicitly distinguish between **LIVE NETWORK** and **LOCAL LAB / FIXTURE REPLAY**.
3. All transaction hashes displayed in the UI or docs must be verifiable on block explorers.
