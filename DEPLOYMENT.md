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

## 2. Deployed Core Contracts (Creditcoin CC3 Testnet)

| Contract | Address | Block Number | Deployment Tx Hash | Status |
|---|---|---|---|---|
| **`CausoraRegistry`** | `0x87F61f848EdD7C3e0752Ded3bf9C303E7c74BD81` | `5477105` | `0xf578a0dce2b3679550da19de29640f3d01f571511363850bb11eef68049a0872` | **Verified (`102031`)** |
| **`RelationEngine`** | `0x59a9771e60ED99cBC583fe4C3fd9e83e94AF606d` | `5477106` | `0x129fb301d1fc93ae8d12a3fc238fca0e733b64b6d570fd766ca92cffd500ec34` | **Verified (`102031`)** |
| **`CausoraGuard`** | `0x4CABa84eF2D49dCFfDD5456AADEA5A42eB4a4699` | `5477107` | `0xbb01f9a6c3416345578b9b8a6698d77eec4ce81556bc40f95ddf835c2a40c034` | **Verified (`102031`)** |
| **`MockERC20 (ctUSD)`** | `0xC9F496A95f2Ab073976579CdeED113Bd1Ee71C11` | `5477108` | `0x9b05610346688db51cd6476efab3bdddc9e6a9942d839d0489a6d1bc2e3841dd` | **Verified (`102031`)** |
| **`CausoraVault`** | `0x196a78ef8e039bD7E03C8d38694A0e5fB4EeBE92` | `5477109` | `0x46bb455eaeeac67da9c375610a36742ed8dece023f93448bd35a7b08149f1d1f` | **Verified (`102031`)** |
| **`LendingPositionManager`** | `0x94B336Cdb7aDacffE270a8f1B607499Be3656518` | `5477110` | `0x46fecf8260f94c1071042302e7031a974e22c206d718dcab52d9d126c466435e` | **Verified (`102031`)** |

---

## 3. Deployment Artifacts & Manifests
The complete, authoritative deployment telemetry is recorded in:
- `deployments/cc3-testnet.json`
- `evidence/deployment/cc3-testnet.json`
- `evidence/judging/cc3-testnet-judge.json`
- `evidence/judging/final-cc3-e2e.json`
- `site/lib/generated-contracts.ts`
