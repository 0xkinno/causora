# The Formal Orderability Model

## 1. Thesis & Definitions

In a multi-chain ecosystem, two independent blockchains possess separate, asynchronous consensus engines. While each chain maintains a strict total order over its own internal transactions, **no universal clock exists across independent source chains without an explicit cryptographic causal dependency**.

Causora establishes a formal mathematical classification framework for cross-chain event relations.

## 2. Relation Classes

Given two verified foreign event records \( E_A = (K_A, H_A, I_A, D_A) \) and \( E_B = (K_B, H_B, I_B, D_B) \) where \( K \) is the chainKey, \( H \) is the block height, \( I \) is the transaction index, and \( D \) is the event digest:

### 2.1 Class 1: `SAME_CHAIN_ORDER` (Intra-Chain Order)
When \( K_A = K_B \):
- If \( H_A < H_B \implies \text{PROVABLY\_FIRST\_A} \)
- If \( H_A > H_B \implies \text{PROVABLY\_FIRST\_B} \)
- If \( H_A = H_B \):
  - If \( I_A < I_B \implies \text{PROVABLY\_FIRST\_A} \)
  - If \( I_A > I_B \implies \text{PROVABLY\_FIRST\_B} \)
  - If \( I_A = I_B \implies \text{STRICTLY\_EQUAL} \)

### 2.2 Class 2: `CROSS_CHAIN_CAUSAL` (Cryptographically Witnessed Dependency)
When \( K_A \neq K_B \), but an explicit cryptographic causal witness \( W = (P_D, C_H, S_C, N, \sigma) \) satisfies:
\[
S_C = \text{keccak256}(C_H \parallel N \parallel \text{payload}_A) \quad \land \quad P_D = \text{keccak256}(K_A \parallel H_A \parallel Q_A \parallel \text{payload}_A)
\]
Then event \( E_B \) deterministically depends on \( E_A \), establishing:
\[
\text{order} = \text{PROVABLY\_FIRST\_A}
\]

### 2.3 Class 3: `CROSS_CHAIN_INDETERMINATE` (Independent Chains, No Causal Witness)
When \( K_A \neq K_B \) and no valid causal witness exists:
\[
\text{order} = \text{UNPROVABLE} \implies \text{FIREWALL DECISION} = \text{HOLD}
\]
The protocol deterministically refuses to invent an ordering timeline, failing closed to protect user assets.

### 2.4 Class 4: `INVALID`
If either evidence record is corrupted, missing, unregistered, or fails on-chain verification:
\[
\text{FIREWALL DECISION} = \text{REJECT}
\]
