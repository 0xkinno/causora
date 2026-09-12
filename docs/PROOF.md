# Cryptographic Proof Reproducibility Guide

Every claim made by the Causora protocol is mathematically and cryptographically reproducible on-chain.

## 1. Verifying Network & Precompile State

Run the diagnostic script against the live Creditcoin CC3 Testnet:
```bash
npm run doctor
```

## 2. Running the Full Judging Verification Gate

Execute the end-to-end judging verification gate to prove:
1. Proof admission on Creditcoin
2. QueryId replay rejection
3. Same-chain ordinal resolution
4. Cross-chain fail-closed `HOLD` enforcement on indeterminate ordering

```bash
npm run judge
```

## 3. Running the Adversarial Attack Suite

Verify all 27 adversarial attack vectors revert or fail closed:
```bash
npm run test:attacks
```
