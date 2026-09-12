# Causora Evidence & Verification Artifacts

This directory contains empirical benchmark data, cryptographic verification trails, and adversarial test artifacts generated directly on the Creditcoin CC3 Testnet and local test environments.

## Measured Cryptographic Claims

| Claim | Verified Artifact | Description |
|---|---|---|
| **Creditcoin CC3 Deployment** | [`deployment/cc3-testnet.json`](./deployment/cc3-testnet.json) | Live deployment tx hashes, blocks, and Blockscout explorer links |
| **Creditcoin CC3 Chain ID is 102031** | [`network.json`](./network.json) | RPC, chainId, and precompile address verification |
| **Attested Source Chains** | [`supported-chains.json`](./supported-chains.json) | Sepolia (chainKey 1) and Mainnet (chainKey 3) mapping |
| **Proof Latency & Pipeline Metrics** | [`benchmarks/latency.json`](./benchmarks/latency.json) | Measured latency across proof verification stages |
| **Gas Efficiency Across Operations** | [`benchmarks/gas.json`](./benchmarks/gas.json) | Real transaction gas consumed on Creditcoin CC3 EVM |
| **Empirical Relation Classifications** | [`relation-cases.jsonl`](./relation-cases.jsonl) | Live decision matrix recordings |
| **Adversarial Fail-Closed Evidence** | [`attacks/`](./attacks/) | 27 attack vectors and mitigation proofs |
| **Live CC3 On-Chain Judging Verification** | [`judging/cc3-testnet-judge.json`](./judging/cc3-testnet-judge.json) | `CC3_TESTNET_VERIFIED` bytecode & precompiles proof |

## Deterministic Verification Gates

To reproduce and verify all evidence claims locally or on Creditcoin CC3 testnet:

```bash
npm test            # Runs 44 unit, attack, and invariant tests (100% passing)
npm run judge:local # Executes local judging verification gate (LOCAL_VERIFIED)
npm run judge:cc3   # Executes live Creditcoin CC3 testnet verification gate (CC3_TESTNET_VERIFIED)
npm run build:ui    # Validates production Next.js compilation
npm run test:e2e    # Runs Playwright E2E suite across 8 device viewports (56/56 passing)
```

