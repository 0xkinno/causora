# Causora Evidence & Verification Artifacts

This directory contains empirical benchmark data, cryptographic verification trails, and adversarial test artifacts generated directly on the Creditcoin CC3 Testnet and local test environments.

## Measured Cryptographic Claims

| Claim | Verified Artifact | Description |
|---|---|---|
| **Creditcoin CC3 Chain ID is 102031** | [`network.json`](./network.json) | RPC and precompile address verification |
| **Attested Source Chains** | [`supported-chains.json`](./supported-chains.json) | Sepolia (chainKey 1) and Mainnet (chainKey 3) mapping |
| **Proof Latency & Pipeline Metrics** | [`proof-latency.json`](./proof-latency.json) | ProofBuilder and BlockProver execution latency |
| **Gas Efficiency Across Operations** | [`gas-results.json`](./gas-results.json) | Full execution profiling under 75,000,000 gas cap |
| **Empirical Relation Classifications** | [`relation-cases.jsonl`](./relation-cases.jsonl) | Live decision matrix recordings |
| **Adversarial Fail-Closed Evidence** | [`attacks/`](./attacks/) | 18 attack vectors and mitigation proofs |

## Deterministic Verification Gate

To reproduce and verify all evidence claims locally or on testnet:

```bash
npm test          # Runs 29 unit, attack, and invariant tests
npm run judge     # Executes the end-to-end judging verification gate
```
