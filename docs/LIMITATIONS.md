# Technical Assumptions, Boundary Conditions & Non-Goals

## 1. Core Cryptographic Boundaries

- **Attestcoin Proves Existence & Inclusion, Not Cross-Chain Time**: Attestcoin proves that a transaction occurred within an attested block header. It does not establish a universal cross-chain timestamp clock.
- **Cross-Chain Indeterminacy is a Feature, Not a Failure**: When two independent source chains produce unlinked events, the system will return `CROSS_CHAIN_INDETERMINATE`. This is a deliberate safety guarantee that prevents protocols from guessing timelines.

## 2. Explicit Non-Goals

- **No Synthetic Timestamps**: We will not compare source block header timestamps or server observation times to fabricate cross-chain order.
- **No Reliance on Submission Speed**: Relayer submission speed is untrusted calldata and is never used to determine which event happened first.
- **No Speculative Liquidation**: Positions subject to unprovable cross-chain races are frozen in `HOLD` state until resolved by explicit governance or unambiguous proof.
