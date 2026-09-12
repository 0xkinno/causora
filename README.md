# CAUSORA

> **A Cross-Chain Orderability Firewall for DeFi on Creditcoin / Attestcoin Protocol.**
> Accepts a financial action only when cryptographic evidence proves the required ordering, and otherwise returns `INDETERMINATE` instead of inventing a timeline.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Creditcoin 3](https://img.shields.io/badge/Creditcoin%20CC3-Testnet%20(102031)-emerald)](https://creditcoin.org)
[![Attestcoin Protocol](https://img.shields.io/badge/Attestcoin-Native%20Precompile%200xFD2-blueviolet)](https://docs.attestcoin.org)
[![Tests Passing](https://img.shields.io/badge/Tests-44%2F44%20Passing-brightgreen)](./tests)
[![Attacks Neutralized](https://img.shields.io/badge/Attacks-27%2F27%20Neutralized-success)](./tests/attacks)

---

## Brief Description

Two honest blockchains can both produce valid cryptographic proofs and still disagree about "what happened first."

Ordinary cross-chain systems confuse **proof of inclusion** with **cross-chain ordering**. When a collateral rescue on Ethereum Sepolia races against a liquidation trigger on Ethereum Mainnet, naive protocols either compare untrusted timestamps or give priority to whichever relayer submitted the transaction first.

**Causora transforms this fundamental boundary into an on-chain security layer.**
Using Creditcoin's native Attestcoin precompiles, Causora verifies foreign facts, formally evaluates intra-chain order and cross-chain causal witnesses, and authorizes financial actions only when the required relation is mathematically provable. When evidence is unlinked across independent chains, Causora deterministically fails closed to **`HOLD`**—protecting borrower capital against speculative liquidations.

---

## Product Links

| Resource | Target | Description |
|---|---|---|
| **Live Web Console** | [`/app`](https://causora.vercel.app/app) | Real-time Causora orderability firewall and position explorer |
| **Attack Simulator** | [`/break-it`](https://causora.vercel.app/break-it) | Interactive 4-gate adversarial test harness |
| **Proof Verifier** | [`/verify`](https://causora.vercel.app/verify) | Independent cryptographic proof inspector |
| **Interactive Docs** | [`/docs`](https://causora.vercel.app/docs) | Full technical specification & integration guide |
| **Creditcoin CC3 RPC** | `https://rpc.cc3-testnet.creditcoin.network` | Destination decision & settlement chain (Chain ID: `102031`) |
| **Blockscout Explorer** | `https://creditcoin-testnet.blockscout.com` | Creditcoin CC3 official block explorer |
| **ProofBuilder API** | `https://prover.cc3-testnet.creditcoin.network` | Official Attestcoin Merkle & continuity proof generator |

> **Local Development URL**: When running locally via `npm run dev`, access the console at `http://localhost:3000`.

---

## The Problem

Cross-chain DeFi lending and collateral protocols face a critical race condition:
1. A borrower posts rescue collateral on **Chain A** (e.g. Ethereum Sepolia).
2. An adverse market event or liquidator action is triggered on **Chain B** (e.g. Ethereum Mainnet).
3. Both events are valid. Both transactions succeed. Both can be verified with cryptographic proofs.
4. But when the protocol evaluates *"Which event happened first?"*, independent source chains have no shared clock.

If a protocol assumes relayer arrival order or compares block timestamps, attackers can front-run rescue transactions, delay proofs, or manipulate timestamps to liquidate solvent borrowers.

---

## The Discovery

Attestcoin's native precompile on Creditcoin (`BlockProver` at `0xFD2`) can synchronously prove:
- That a foreign transaction existed in an attested source block.
- That the source receipt status succeeded (`receiptStatus == 1`).
- The exact **intra-chain ordinal index** (`txIndex`) within that source block via Merkle sibling laterality.

**Crucial Truth**: Attestcoin proves what happened in a source chain's history. It does **not** automatically prove the order between two independent source chains.

Causora turns that cryptographic boundary into a DeFi safety firewall.

---

## The Solution

Causora formally separates:
1. **Existence**: Cryptographically verified by Attestcoin `BlockProver (0xFD2)`.
2. **Intra-Chain Order**: Provable via block height and `calculateTxIndex`.
3. **Cross-Chain Causality**: Provable only when an explicit pre-committed cryptographic witness exists.
4. **Financial Authorization**: `CausoraGuard` authorizes actions when order is proven; otherwise executes fail-closed **`HOLD`**.

---

## Why Ordinary Proof Is Not Enough

| Feature | Ordinary Cross-Chain Verification | Causora Orderability Firewall |
|---|---|---|
| **Foreign Transaction Check** | Verified | Verified synchronously via `BlockProver (0xFD2)` |
| **Intra-Block Ordering** | Ignored | Provably extracted via `calculateTxIndex` |
| **Cross-Chain Ordering** | Assumed from timestamps or relayer arrival | **Formally Classified (`SAME_CHAIN`, `CAUSAL`, `INDETERMINATE`)** |
| **Unlinked Cross-Chain Race** | Speculative execution / First submitter wins | **Fails closed to `HOLD` (Protects borrower collateral)** |
| **Replay Protection** | Often neglected across chains | Canonical `keccak256(chainKey, blockHeight, txIndex)` burned in storage |

---

## In Two Minutes

1. **Connect**: Connect any EVM wallet; Causora detects Creditcoin CC3 Testnet (`102031`).
2. **Observe**: Real-time event streams from Ethereum Sepolia (`chainKey: 1`) and Ethereum Mainnet (`chainKey: 3`).
3. **Prove**: Synchronously verify Attestcoin Merkle inclusion and continuity on Creditcoin.
4. **Firewall**: `RelationEngine` and `CausoraGuard` evaluate provability:
   - **Provably Earlier Rescue** $\rightarrow$ `ALLOW_A` (Position Rescued).
   - **Provably Earlier Liquidation** $\rightarrow$ `ALLOW_B` (Position Liquidated).
   - **Unprovable Cross-Chain Order** $\rightarrow$ `HOLD` (Position Protected).
   - **Tampered / Replayed Proof** $\rightarrow$ `REJECT`.

---

## Screenshots

<div align="center">
  <table>
    <tr>
      <td width="50%">
        <img src="docs/screenshots/hero_console.png" alt="Causora Live Console" width="100%"/>
        <p align="center"><b>1. Live Causora Console & Timeline</b></p>
      </td>
      <td width="50%">
        <img src="docs/screenshots/evidence_stream.png" alt="Evidence Stream" width="100%"/>
        <p align="center"><b>2. Synchronous Precompile Verification</b></p>
      </td>
    </tr>
    <tr>
      <td width="50%">
        <img src="docs/screenshots/attack_simulator.png" alt="Attack Simulator" width="100%"/>
        <p align="center"><b>3. Interactive 4-Gate Attack Simulator</b></p>
      </td>
      <td width="50%">
        <img src="docs/screenshots/position_drilldown.png" alt="Position Drilldown" width="100%"/>
        <p align="center"><b>4. Fail-Closed Collateral Firewall</b></p>
      </td>
    </tr>
  </table>
</div>

---

## The Mechanism

The core execution path is built directly into the financial state transition:

```
Source Event (Sepolia / Mainnet)
   │
   ▼
ProofBuilder API (Merkle Path + Continuity Chain)
   │
   ▼
Creditcoin CC3 (BlockProver 0xFD2)
   │
   ▼
EvmV1Decoder (Receipt Status == 1, Log Emitter Whitelist)
   │
   ▼
CausoraRegistry (Replay Protection & Evidence Commitment)
   │
   ▼
RelationEngine (Formal Orderability Classification)
   │
   ▼
CausoraGuard (Policy Authorization Firewall)
   │
   ▼
LendingPositionManager (HOLD / RESCUED / LIQUIDATED)
```

---

## Orderability Model

The formal mathematical relation between two verified events $E_A$ and $E_B$:

- **`SAME_CHAIN_ORDER`**: Same `chainKey`. Ordered strictly by block height $H_A \gtrless H_B$, then by Merkle ordinal leaf index $I_A \gtrless I_B$ via `calculateTxIndex`.
- **`CROSS_CHAIN_CAUSAL`**: Different `chainKey`, accompanied by a cryptographic witness committing to $E_A$'s hash and consumed in $E_B$.
- **`CROSS_CHAIN_INDETERMINATE`**: Independent source chains with no cryptographic witness. **Returns `INDETERMINATE` (Fail-Closed `HOLD`).**
- **`INVALID`**: Bad Merkle root, failed receipt, replayed queryId, or un-whitelisted emitter.

---

## Attestcoin Integration

Causora binds natively to Creditcoin's on-chain precompiles:
- **`INativeQueryVerifier`** at `0x0000000000000000000000000000000000000FD2`
- **`IChainInfo`** at `0x0000000000000000000000000000000000000fD3`

Every proven fact is decoded on-chain using `EvmV1Decoder`, ensuring that zero calldata is trusted without cryptographic admission.

---

## The Financial Guard

`CausoraGuard` acts as an authoritative financial authorization firewall for lending protocols:

```solidity
function evaluateGuardFromEvidence(
    uint256 positionId,
    bytes32 queryIdA,
    bytes32 queryIdB,
    ICausalWitness.CausalWitness calldata witness,
    ActionPolicy policy
) external returns (GuardDecision decision, IRelationEngine.RelationResult memory relation);
```

---

## Break It Yourself
 
Visit [`/break-it`](https://causora.vercel.app/break-it) (or `http://localhost:3000/break-it` in local development) in the web application to test four interactive judging gates:
1. **Gate 1: VALID ORDER** $\rightarrow$ Verifies same-chain order and executes action.
2. **Gate 2: INVALID PROOF** $\rightarrow$ Reverts on tampered Merkle root or failed receipt.
3. **Gate 3: UNPROVABLE ORDER** $\rightarrow$ Demonstrates deterministic transition to `HOLD`.
4. **Gate 4: REPLAY ATTACK** $\rightarrow$ Rejects double-admission of consumed queryId.

---

## Proof and Evidence

| Verified Property | Empirical Evidence File | Status |
|---|---|---|
| Creditcoin Network Config | [`evidence/network.json`](./evidence/network.json) | **Verified** |
| Supported Source Chains | [`evidence/supported-chains.json`](./evidence/supported-chains.json) | **Verified** |
| Execution Gas Measurements | [`evidence/gas-results.json`](./evidence/gas-results.json) | **Verified** |
| Pipeline Latency Benchmarks | [`evidence/proof-latency.json`](./evidence/proof-latency.json) | **Verified** |
| Adversarial Attack Suite | [`evidence/attacks/`](./evidence/attacks/) | **27/27 Neutralized** |
| Live CC3 E2E Ground Truth | [`evidence/judging/final-cc3-e2e.json`](./evidence/judging/final-cc3-e2e.json) | **CC3_E2E_VERIFIED** |

---

## Threat Model

See [`docs/THREAT_MODEL.md`](./docs/THREAT_MODEL.md) for full formal verification of all 27 attack vectors.

---

## Architecture

```mermaid
flowchart TD
    subgraph Source_Chains [Source Blockchains]
        Sepolia["Ethereum Sepolia (chainKey 1)"]
        Mainnet["Ethereum Mainnet (chainKey 3)"]
    end

    subgraph Proof_Layer [Attestcoin Infrastructure]
        PB["ProofBuilder API"]
    end

    subgraph Creditcoin_CC3 [Creditcoin CC3 Testnet - Chain 102031]
        BP["BlockProver Precompile (0xFD2)"]
        CI["ChainInfo Precompile (0xFD3)"]
        CR["CausoraRegistry.sol"]
        RE["RelationEngine.sol"]
        CG["CausoraGuard.sol"]
        LPM["LendingPositionManager.sol"]
        CV["CausoraVault.sol (Real CC3 Collateral Vault)"]
    end

    Sepolia -->|Collateral Event| PB
    Mainnet -->|Liquidation Trigger| PB
    PB -->|txBytes + Merkle + Continuity| BP
    BP -->|Verified Inclusion| CR
    CR -->|Event Evidence Records| RE
    RE -->|Relation Classification| CG
    CG -->|ALLOW_A / ALLOW_B / HOLD| LPM
    LPM -->|Execute State & Token Movement| CV
```

---

## Truth & Scope

To ensure complete clarity and auditability, the operational boundaries of the Causora protocol are strictly categorized:

| Layer | Environment | Operational Scope & Guarantees |
|---|---|---|
| **LIVE PROTOCOL** | **Creditcoin CC3 Testnet (`102031`)** | Core protocol logic executes on-chain on Creditcoin CC3. This includes synchronous verification via native precompiles (`0xFD2` BlockProver, `0xFD3` ChainInfo), on-chain evidence admission with replay protection (`CausoraRegistry.sol`), formal orderability classification (`RelationEngine.sol`), policy evaluation (`CausoraGuard.sol`), and vault state transitions & locking (`LendingPositionManager.sol`, `CausoraVault.sol`). |
| **LOCAL LAB & ADVERSARIAL TESTBED** | **Deterministic Fixtures / Simulation** | Controlled scenario generators used in `/break-it` and the automated test suites. This includes synthetic edge cases, simulated reorgs, forged Merkle roots, and mutated signatures to verify all 18 attack vectors and state invariants. |
| **ADVISORY AI LAYER** | **Gemini / MCP Interface** | Strictly explanatory and secondary. Generates human-readable breakdowns of verified receipts and proof structures. The AI layer has **zero authority** over smart contract execution or financial authorizations; all transitions depend strictly on raw cryptographic proofs. |

> [!NOTE]
> **Collateral Asset Terminology**: The token **`ctUSD`** is a dedicated **Creditcoin CC3 testnet collateral asset token** (`MockERC20.sol`) deployed strictly for demonstration and testing purposes. It has no fiat peg and carries no monetary value.

---

## Contract Addresses & Deployed System (Creditcoin CC3 Testnet)

| Contract | Address | Network | Explorer / Verification Link |
|---|---|---|---|
| **`CausoraVault`** *(Real CC3 Collateral Vault)* | `0x196a78ef8e039bD7E03C8d38694A0e5fB4EeBE92` | Creditcoin CC3 (`102031`) | [View on Explorer](https://creditcoin-testnet.blockscout.com/address/0x196a78ef8e039bD7E03C8d38694A0e5fB4EeBE92) |
| **`MockERC20 (ctUSD)`** *(Test Collateral Asset)* | `0xC9F496A95f2Ab073976579CdeED113Bd1Ee71C11` | Creditcoin CC3 (`102031`) | [View on Explorer](https://creditcoin-testnet.blockscout.com/address/0xC9F496A95f2Ab073976579CdeED113Bd1Ee71C11) |
| **`CausoraGuard`** *(Financial Policy Firewall)* | `0x4CABa84eF2D49dCFfDD5456AADEA5A42eB4a4699` | Creditcoin CC3 (`102031`) | [View on Explorer](https://creditcoin-testnet.blockscout.com/address/0x4CABa84eF2D49dCFfDD5456AADEA5A42eB4a4699) |
| **`LendingPositionManager`** *(Protocol Manager)* | `0x94B336Cdb7aDacffE270a8f1B607499Be3656518` | Creditcoin CC3 (`102031`) | [View on Explorer](https://creditcoin-testnet.blockscout.com/address/0x94B336Cdb7aDacffE270a8f1B607499Be3656518) |
| **`RelationEngine`** *(Mathematical Classifier)* | `0x59a9771e60ED99cBC583fe4C3fd9e83e94AF606d` | Creditcoin CC3 (`102031`) | [View on Explorer](https://creditcoin-testnet.blockscout.com/address/0x59a9771e60ED99cBC583fe4C3fd9e83e94AF606d) |
| **`CausoraRegistry`** *(Evidence & Whitelist)* | `0x87F61f848EdD7C3e0752Ded3bf9C303E7c74BD81` | Creditcoin CC3 (`102031`) | [View on Explorer](https://creditcoin-testnet.blockscout.com/address/0x87F61f848EdD7C3e0752Ded3bf9C303E7c74BD81) |
| **`BlockProver (0xFD2)`** *(Native Precompile)* | `0x0000000000000000000000000000000000000FD2` | Creditcoin CC3 (Core) | Precompile Interface |
| **`ChainInfo (0xFD3)`** *(Native Precompile)* | `0x0000000000000000000000000000000000000FD3` | Creditcoin CC3 (Core) | Precompile Interface |
| **`CollateralSource`** *(Controlled Source)* | `0x4b70c8885b54e4e3a16a99e57a779c64005bfc98` | Ethereum Sepolia (`11155111`) | [View on Sepolia Explorer](https://sepolia.etherscan.io/address/0x4b70c8885b54e4e3a16a99e57a779c64005bfc98) |
| **`Aave V3 Pool`** *(Liquidation Source)* | `0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2` | Ethereum Mainnet (`1`) | [View on Etherscan](https://etherscan.io/address/0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2) |

---

## Product Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Borrower / Evaluator
    participant UI as Causora Web App
    participant PB as ProofBuilder API
    participant CC3 as Creditcoin (0xFD2)
    participant Guard as CausoraGuard & Registry
    participant Vault as Lending Position

    User->>UI: Connect Wallet & Select Position
    UI->>PB: Request Attestcoin Proof for Source Event
    PB-->>UI: Return Merkle + Continuity Proof
    User->>UI: Submit Execution Transaction
    UI->>Guard: admitEvidence & resolveCollateralRace
    Guard->>CC3: Synchronous BlockProver Verification
    CC3-->>Guard: Transaction Verified (txIndex recovered)
    Guard->>Guard: Evaluate Orderability Invariant
    alt Order is Provable
        Guard->>Vault: Execute Rescue / Liquidation
    else Cross-Chain Order is Indeterminate
        Guard->>Vault: Lock Position in HOLD State (Capital Protected)
    end
    Vault-->>UI: Emit Final State & Update UI
```

---

## Repository Layout

```text
CAUSORA/
├── contracts/
│   ├── base/               # CausoraASCBase
│   ├── interfaces/         # INativeQueryVerifier, IChainInfo, IRelationEngine, ICausoraGuard
│   ├── libraries/          # EvmV1Decoder, EvidenceDigest, CausalWitnessLib
│   ├── mocks/              # MockBlockProver, MockChainInfo, CollateralSource, LiquidationSource
│   ├── CausoraGuard.sol    # Authoritative financial firewall
│   ├── CausoraRegistry.sol # Source whitelist & replay protection
│   ├── LendingPositionManager.sol # Reference lending protocol
│   └── RelationEngine.sol  # Formal mathematical orderability classifier
├── src/                    # TypeScript Core SDK & Client
├── tests/
│   ├── attacks/            # 18-Vector Adversarial Attack Suite
│   ├── invariant/          # State Preservation & Replay Invariants
│   └── unit/               # Unit test suites
├── scripts/                # doctor, deploy, judge, attack
├── evidence/               # Empirical benchmarks and JSON artifacts
├── docs/                   # ATTESTCOIN, ORDERABILITY, THREAT_MODEL, etc.
└── site/                   # Next.js 14/15 Luxury Web Application
```

---

## Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Smart Contracts
```bash
npm run compile
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Run Judging Verification Gate
```bash
npm run judge
```

### 5. Launch Frontend Console
```bash
cd site
npm install
npm run dev
```

---

## License

MIT License. Copyright (c) 2026 Causora Protocol.
