# CAUSORA — Comprehensive Forensic Audit Report
**Date:** September 12, 2026  
**Auditor:** Antigravity Autonomous Security & Architecture Agent  
**Specification:** `CAUSORA_MASTER_OVERHAUL.md`

---

## 1. Executive Summary

A forensic audit of the entire CAUSORA repository was conducted across Smart Contracts (`contracts/`), Frontend UI (`site/`), TypeScript SDK (`src/`), Evidence (`evidence/`), Tests (`tests/`), and Scripts (`scripts/`).

### Overall System Classification
- **Smart Contracts:** ~80% Complete core protocol logic, but contains **two critical P0 security flaws** (Guard trust boundary accepting caller-supplied `RelationResult`, and weak non-cryptographic `CausalWitnessLib` validation).
- **Frontend (`site/`):** 100% Mock / Simulated prototype. No active Wagmi provider, fake `useState` wallet toggle with hardcoded `0x71C8...08b5E`, fake `setTimeout()` execution in attacks/verifier/MCP, and stale/invented ABIs in `site/lib/contracts.ts`.
- **TypeScript Core (`src/`):** Broken build due to template literal syntax errors in `proof-builder.ts` and missing module `src/decoder/evm-v1-decoder.ts`.
- **Evidence (`evidence/`):** 100% Synthetic mock files with zero verifiable on-chain transaction hashes or live testnet receipts.

---

## 2. Forensic Findings by Subsystem

### P0. Smart Contract Security & Architecture
1. **Guard Trust Boundary Flaw (`CausoraGuard.sol:20-24`):**
   - `evaluateGuard(uint256 positionId, IRelationEngine.RelationResult calldata relation, ActionPolicy policy)` accepts the full `RelationResult` directly as calldata from any caller.
   - An attacker could supply a forged `RelationResult` with `order = PROVABLY_FIRST_B` without having verified evidence admitted in `CausoraRegistry`.
   - **Remediation:** Guard must either re-evaluate or execute resolutions directly by querying `CausoraRegistry` and calling `RelationEngine` internally, or strictly restrict state authorization to authorized callers.
2. **Weak Causal Witness Verification (`CausalWitnessLib.sol:43-49`):**
   - Returns `true` merely if `evidenceB.payloadHash != bytes32(0) && witness.capabilityHash != bytes32(0)` or falls back to `true` on line 48.
   - Does NOT cryptographically prove that Event B actually consumed or committed to Event A's output.
   - **Remediation:** Cryptographically bind Event B's verified payload/topics to Event A's state commitment and capability hash. Return `false` (fail-closed) on any missing or invalid linkage.
3. **Evidence Record Discrepancy (`CausoraRegistry.sol:143`):**
   - Sets `txHash: merkleProof.root`. A Merkle root is not the transaction hash.
   - **Remediation:** Distinguish source transaction identity from block Merkle root.
4. **Query ID Implementation vs. Spec:**
   - Assembly hash in `CausoraASCBase.sol` packs `(chainKey, blockHeight, merkleRoot)`. Needs formal documentation in `docs/QUERY_ID.md` matching SDK query builder semantics.

---

### P0. Frontend & UI Wiring (`site/`)
1. **Fake Wallet Connection (`site/components/Navbar.tsx`):**
   - Uses `useState(false)` boolean toggle.
   - On click, displays hardcoded string `'0x71C8...08b5E'`.
   - No `WagmiProvider`, no `QueryClientProvider`, no wallet connector used.
2. **100% Stale / Invented ABIs (`site/lib/contracts.ts`):**
   - Exposes fake function names: `registerProof`, `getProof`, `evaluateRelation`, `executeGuardedAction`, `depositCollateralCrossChain`, `attemptLiquidationCrossChain`.
   - Real contract functions are: `admitEvidence`, `getEvidence`, `classifyRelation`, `evaluateGuard`, `createPosition`, `resolveCollateralRace`.
3. **Placeholder Contract Addresses (`site/lib/chains.ts`):**
   - Contains placeholder addresses `0x1111111111111111111111111111111111111101` through `0x4444...4404`.
   - Real precompiles `0x0000000000000000000000000000000000000FD2` and `0xFD3` are correctly addressed.
4. **Simulated Interactions (`site/app/`):**
   - `/break-it`: 700ms `setTimeout()` writing pre-scripted log strings.
   - `/verify`: 500ms `setTimeout()` displaying hardcoded `MOCK_PROOFS`.
   - `/mcp`: 450ms `setTimeout()` returning canned JSON.
   - `/app`: Renders `MOCK_POSITIONS` directly without RPC read.

---

### P0. TypeScript SDK & Build (`src/`, `package.json`)
1. **`src/attestcoin/proof-builder.ts`:**
   - Broken syntax at line 24: `fetch(${this.baseUrl}/proof//)` (missing backticks and interpolation variables).
   - Broken syntax at line 26: `throw new Error(ProofBuilder API returned status : )` (missing quotes).
2. **`src/index.ts`:**
   - Exports from `./decoder/evm-v1-decoder`, but `src/decoder/` directory is empty.
3. **Dead Scripts in `package.json`:**
   - `"seed": "ts-node scripts/seed-source.ts"` (File missing).
   - `"prove": "ts-node scripts/prove.ts"` (File missing).

---

### Evidence & Benchmarks (`evidence/`)
1. All JSON files in `evidence/` (`gas-results.json`, `proof-latency.json`, `attacks/*.json`) were populated with synthetic hardcoded constants via `build-evidence.js`.
2. Zero real on-chain transaction receipts currently saved.

---

## 3. Remediation Strategy & Action Plan
Proceed to execute according to `TASK.md` across Phases 1 through 10.
