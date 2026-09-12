# CAUSORA — Deployment Record & Specification
**Network:** Creditcoin CC3 Testnet  
**Chain ID:** `102031`  
**RPC URL:** `https://rpc.cc3-testnet.creditcoin.network`  
**Block Explorer:** `https://creditcoin-testnet.blockscout.com` (or equivalent CC3 Explorer)

---

## 1. Native Precompiles (Creditcoin CC3)

| Precompile Name | Address | Precompile ID | Description |
|---|---|---|---|
| **BlockProver (NativeQueryVerifier)** | `0x0000000000000000000000000000000000000FD2` | `4050` | Synchronously verifies Merkle inclusion proofs and block header continuity proofs |
| **ChainInfo** | `0x0000000000000000000000000000000000000fD3` | `4051` | Provides foreign chain attestation status, genesis heights, and attested checkpoints |

---

## 2. Target Core Contracts (To Deploy)

| Contract | Target Network | Constructor Arguments | Deployment Status |
|---|---|---|---|
| **`CausoraRegistry`** | CC3 Testnet (`102031`) | `None` (inherits `CausoraASCBase` binding `0xFD2` & `0xFD3`) | Ready for deployment |
| **`RelationEngine`** | CC3 Testnet (`102031`) | `None` (pure functional engine) | Ready for deployment |
| **`CausoraGuard`** | CC3 Testnet (`102031`) | `address _registry`, `address _relationEngine` | Ready for deployment |
| **`LendingPositionManager`** | CC3 Testnet (`102031`) | `address _registry`, `address _relationEngine`, `address _guard` | Ready for deployment |

---

## 3. Deployment Artifacts & Manifests
Upon deployment, exact contract addresses, deployer address, transaction hashes, block numbers, and gas used will be recorded in:
- `deployments/cc3-testnet.json`
- `evidence/deployment.json`
- `site/lib/generated-contracts.ts`
