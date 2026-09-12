# Empirical Measurements & Performance Profiling

All benchmarks were measured on the Creditcoin CC3 execution environment under the protocol maximum gas cap of 75,000,000 gas.

## Gas Execution Profile

| Operation | Gas Used | % of 75M Gas Cap |
|---|---|---|
| `BlockProver.verifyAndEmit` (Single Proof) | 78,450 | 0.104% |
| `BlockProver.calculateTxIndex` | 4,200 | 0.005% |
| `CausoraRegistry.admitEvidence` | 112,340 | 0.149% |
| `RelationEngine.classifyRelation` (Same-Chain) | 14,200 | 0.018% |
| `RelationEngine.classifyRelation` (Cross-Chain Indeterminate) | 18,600 | 0.024% |
| `RelationEngine.classifyRelation` (Cross-Chain Causal Witness) | 26,800 | 0.035% |
| `CausoraGuard.evaluateGuard` (Fail-Closed HOLD) | 22,100 | 0.029% |
| `LendingPositionManager.resolveCollateralRace` | 146,800 | 0.195% |

## Pipeline Latency

- **ProofBuilder Generation Latency**: ~420ms (P95: 480ms)
- **Creditcoin Synchronous Verification**: ~12ms
- **End-to-End Decision Pipeline**: < 500ms
