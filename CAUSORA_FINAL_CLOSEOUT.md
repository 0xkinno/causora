# CAUSORA FINAL CLOSEOUT — MANDATORY BEFORE VERCEL / DEMO

## Status

DO NOT SHIP YET.

The current repository has a strong thesis and useful adversarial tests, but the public branch still contains several blockers that make some README/live-protocol claims untrue.

The next phase is not a redesign of the thesis. It is a truth-preserving final integration pass.

---

## 0. NON-NEGOTIABLE RULE

Do not mark a feature LIVE unless the following chain is demonstrably true:

CODE → REAL TESTNET → RECEIPT → READ-BACK → UI

A local Hardhat pass is not evidence of Creditcoin CC3 execution.

A static JSON artifact is not evidence.

A timeout-based UI result is not evidence.

A prewritten receipt is not evidence.

---

## 1. REAL CREDITCOIN CC3 DEPLOYMENT — BLOCKER

The current addresses:

- CausoraRegistry: 0x5FbDB2315678afecb367f032d93F642f64180aa3
- RelationEngine: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
- CausoraGuard: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
- LendingPositionManager: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
- CausoraVault: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
- MockERC20: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9

match the familiar Hardhat local deployment sequence.

The existing evidence also records the default Hardhat deployer:
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266.

The deployment command used during the reported build was:

npx hardhat run scripts/deploy.ts

That is not the explicit CC3 deployment command.

### Required

Run the real command:

npm run deploy:cc3

using:

CREDITCOIN_RPC_URL=https://rpc.cc3-testnet.creditcoin.network
CHAIN_ID=102031
PRIVATE_KEY=<funded CC3 testnet deployer>

Then independently verify every deployed address from CC3 RPC / Blockscout.

For each contract record:

- deployment tx hash
- block number
- deployer address
- bytecode present
- chainId
- contract address
- constructor dependencies
- owner
- linked contract addresses
- source verification status where available

Write the result to:

evidence/deployment/cc3-testnet.json

and

deployments/cc3-testnet.json

NEVER overwrite a real CC3 manifest with local Hardhat addresses again.

---

## 2. WIRE LENDING POSITION MANAGER → CAUSORA VAULT — BLOCKER

Current problem:

LendingPositionManager does NOT store or call CausoraVault.

CausoraVault exists, but the actual lending resolution path ends in:

LendingPositionManager state mutation

instead of:

LendingPositionManager → CausoraVault.executeProtectedTransition(...)

Therefore the README claim that HOLD/LIQUIDATION causes real vault token movement is currently not true.

### Required architecture

LendingPositionManager must own an immutable:

ICausoraVault public immutable vault;

and constructor:

registry
relationEngine
guard
vault

The resolution flow must be:

resolveCollateralRace(...)
→ guard.evaluateGuardFromEvidence(...)
→ determine ALLOW_A / ALLOW_B / HOLD / REJECT
→ vault.executeProtectedTransition(...)
→ update protocol state
→ emit final decision

### Required behavior

ALLOW_A:
- rescue accepted
- position becomes RESCUED
- vault hold is cleared where appropriate
- collateral is preserved

ALLOW_B:
- liquidation accepted
- vault transfers the configured liquidation amount to the liquidator
- position becomes LIQUIDATED

HOLD:
- vault sets isHeld=true
- any later ALLOW_B liquidation while held must revert

REJECT:
- no state mutation
- no token transfer
- transaction reverts

### Required invariant

For every financial transition:

position state and vault state must remain coherent.

Add tests proving:

- manager cannot claim LIQUIDATED while vault still holds an unprocessed liquidation state
- HOLD causes actual vault hold
- later liquidation reverts while held
- ALLOW_B produces an actual ERC20 Transfer
- ALLOW_A preserves collateral
- REJECT produces zero token movement

---

## 3. TEST ASSET LANGUAGE — CORRECT THE CLAIM

MockERC20.mint(...) is unrestricted.

That is acceptable for a testnet demo asset, but it is NOT "real financial collateral".

Rename UI / README wording to:

"CC3 testnet collateral asset"
or
"test collateral token"

Do not call ctUSD "real collateral" without the word "testnet".

Keep the test asset because it allows the financial transition to be demonstrated on-chain.

---

## 4. CLOSE THE EVIDENCE EVENT-AUTHENTICATION GAP — BLOCKER

CausoraRegistry currently:

- decodes the receipt
- checks receipt status
- takes receiptLogs[0]
- checks only that its emitter is whitelisted
- stores its topic/data hash

This is too broad.

A transaction from a whitelisted contract can emit multiple logs, and the first log does not necessarily represent the intended event.

### Required upgrade

A registered source must include:

- chainKey
- emitter
- SourceKind
- expectedEventSignature
- description

Admission must:

1. verify Attestcoin proof
2. verify receiptStatus == 1
3. search all logs
4. find the log whose emitter == expected emitter
5. require topics[0] == expectedEventSignature
6. reject if zero matching logs
7. reject if multiple ambiguous matching logs unless explicitly allowed
8. bind the admitted evidence to that exact event

Add an explicit source-event policy.

The registry should NEVER infer the business event from "first receipt log".

---

## 5. REBUILD CROSS-CHAIN CAUSAL WITNESS — BLOCKER

Current CausalWitnessLib is still too self-referential.

It verifies:

parentDigest
capabilityHash
stateCommitment

but the witness values themselves are largely caller-supplied.

A malicious caller can construct a mathematically self-consistent witness without proving that Event B genuinely consumed Event A's capability.

### Required rule

A CROSS_CHAIN_CAUSAL result is valid only when Event B's cryptographically proven payload commits to the exact witness/capability originating from Event A.

Implement a concrete source-event design.

Recommended source event:

CausalityConsumed(
    bytes32 parentDigest,
    bytes32 capabilityHash,
    uint64 sequenceNumber,
    bytes32 stateCommitment
)

The source event must be emitted by a registered source contract.

Registry admission must identify and bind the event.

RelationEngine must only classify:

CROSS_CHAIN_CAUSAL

when the admitted Event B payload commits to the supplied Event A relationship.

Otherwise:

CROSS_CHAIN_INDETERMINATE

Do not use "cryptographic causal witness" language when the witness is only locally self-consistent.

Add adversarial tests:

- fake capability
- correct capability with wrong parent
- correct parent with wrong sequence
- correct witness not actually present in Event B
- replayed capability
- capability consumed twice
- witness copied to unrelated position

---

## 6. REPLAY PROTECTION MUST BE SEMANTIC, NOT ONLY QUERY-ID BASED

Current queryId replay protection is useful, but it only proves the same admitted evidence record is not admitted twice.

Add a business-level consumption key:

positionId + actionType + evidence relation / decision context

This prevents one legitimate source proof from being reused across unrelated financial actions where policy should forbid reuse.

Document the distinction:

QUERY REPLAY ≠ BUSINESS REPLAY

Both must be tested.

---

## 7. POSITION OWNERSHIP / AUTHORIZATION

Current createPosition and markAtRisk are not meaningfully permissioned.

For the demo, this can remain intentionally simple, but the contract must explicitly state whether this is:

- a permissionless reference protocol, or
- a controlled protocol manager.

Do not imply production lending security if any arbitrary address can mark any position at risk.

Recommended:

- borrower can create their own position
- protocol/evaluator role can mark risk
- only authorized liquidator/action path can initiate liquidation
- positionId must bind to borrower and vault position

Add tests for unauthorized mutation.

---

## 8. REMOVE FABRICATED EVIDENCE FILES

The following current artifacts contain placeholder / synthetic values and MUST NOT be presented as empirical live evidence:

- evidence/decisions/indeterminate_hold_decision.json
- evidence/attacks/vector_18_frontrunning_hold.json
- evidence/manifests/sha256.json
- evidence/benchmarks/gas.json
- evidence/benchmarks/latency.json

Examples that must be removed/replaced:

- fake-looking tx hashes
- fake SHA-256 digests
- hardcoded gas numbers not generated from receipts
- hardcoded latency numbers
- "100% safeguarded" claims without actual token balance read-back

Every final evidence artifact must be generated automatically from actual outputs.

### Gas

Use:

receipt.gasUsed

and, if useful:

effectiveGasPrice × gasUsed

Store:

- tx hash
- gas used
- block number
- contract
- method
- timestamp

### Latency

Do NOT publish EVM execution latency as "30ms" unless measured from a controlled reproducible experiment.

Attestcoin proof generation / source attestation latency is an external asynchronous component.

Separate:

- proof generation time
- RPC request time
- transaction inclusion time
- transaction confirmation time

Do not call the entire process "30ms".

---

## 9. JUDGE SCRIPT MUST HAVE TWO MODES

Current npm run judge is effectively a local test harness.

Keep it, but rename:

npm run judge:local

Add:

npm run judge:cc3

The CC3 judge flow must:

1. read deployed CC3 addresses
2. read live source configuration
3. optionally use a pre-created real proof
4. perform actual CC3 registry admission
5. read evidence back
6. perform actual guard evaluation
7. trigger actual vault transition
8. read final vault token balance/state
9. store all transaction hashes

The final evidence must distinguish:

LOCAL_VERIFIED
from
CC3_TESTNET_VERIFIED

Never mix them.

---

## 10. FRONTEND MUST STOP USING MOCK DATA FOR LIVE PAGES

The current:

site/app/app/page.tsx

still initializes the console from:

MOCK_POSITIONS

The order evaluator also performs client-side logic.

The current:

site/app/verify/page.tsx

still imports:

MOCK_PROOFS

and uses setTimeout() to fabricate verification.

The current:

site/app/break-it/page.tsx

still executes scenarios using setTimeout() and predetermined logs.

### Required final architecture

LIVE MODE:
- reads actual contract state
- reads actual evidence
- calls actual ProofBuilder
- sends actual wallet transaction
- waits for actual receipt
- rereads actual contract state

DEMO/LAB MODE:
- explicitly labeled LOCAL LAB
- may use deterministic fixtures
- never displays itself as protocol verification

The default judging route should be LIVE.

---

## 11. UI "VERIFY" MUST BECOME A REAL PROOF INSPECTOR

No:

setTimeout(...)
verified=true
mock sender
mock txHash
mock blockHash

Instead:

Input / select actual source tx
→ ProofBuilder request
→ display proof availability
→ submit proof to CC3 Registry
→ wallet confirmation
→ receipt
→ read evidenceRecords(queryId)
→ display canonical on-chain result

Proof status must come from chain state.

---

## 12. ATTACK ARENA MUST EXECUTE REAL ATTACKS

The UI can preserve the beautiful presentation.

But each LIVE attack must invoke actual contract logic.

Minimum live attacks:

A. Merkle mutation
B. continuity mutation
C. event-signature mismatch
D. unauthorized emitter
E. receiptStatus == 0
F. query replay
G. business replay
H. same-block txIndex inversion
I. cross-chain no-witness HOLD
J. forged causal witness
K. HOLD → liquidation attempt must revert
L. unauthorized position mutation

For each attack capture:

- tx hash
- target contract
- calldata or mutation description
- expected result
- actual receipt/revert
- final state
- invariant preserved

---

## 13. UI WALLET UX

Use a real multi-wallet capable connector strategy.

Preferred:
Reown AppKit + Wagmi

or equivalent production-grade WalletConnect-compatible path.

The current injected() connector alone is not sufficient for a polished mobile judging experience.

Wallet flow:

DISCONNECTED
→ CONNECTING
→ CONNECTED
→ WRONG NETWORK
→ READY
→ SIGNING
→ CONFIRMED / FAILED

Requirements:

- instant provider detection
- one clear Connect button
- one-click CC3 switch
- wallet address from useAccount only
- real disconnect power icon
- no duplicate modal
- no duplicate signing request
- no fake pending state
- explorer link only after real tx hash exists

---

## 14. ABI SOURCE OF TRUTH

Never manually duplicate ABIs.

Build:

contracts
→ Hardhat artifacts
→ export-abis.ts
→ site/lib/generated-contracts.ts

Then verify:

ABI function names == actual deployed bytecode interface.

Add an ABI consistency script that fails CI if generated ABI differs from current artifacts.

---

## 15. DEPLOYMENT CONFIGURATION

Production frontend:

NEXT_PUBLIC_CC3_RPC_URL=https://rpc.cc3-testnet.creditcoin.network
NEXT_PUBLIC_CC3_CHAIN_ID=102031

Actual deployed:

REGISTRY
RELATION_ENGINE
GUARD
LENDING_MANAGER
VAULT
TEST_TOKEN

Source chain:

SEPOLIA_RPC_URL=<real source RPC>

Attestcoin:

PROVER_URL=<official live prover>

Secrets:

PRIVATE_KEY
GEMINI_API_KEY

NEVER expose PRIVATE_KEY.

GEMINI_API_KEY remains server-side only.

---

## 16. MCP / GEMINI

Gemini is advisory only.

It may:

- summarize a verified receipt
- explain why a decision was HOLD
- explain attack results
- translate technical evidence into operator language

It may NOT:

- claim verification
- produce proof
- authorize liquidation
- override the Guard
- create a fake decision
- alter protocol state

The MCP endpoint should read authoritative state and explain it.

Do not hardcode:

"verifiedOnCC3: true"

without reading CC3.

---

## 17. README — REQUIRED CORRECTIONS

Remove localhost links from public Product Links.

Replace with deployed Vercel URL.

Do not claim:

18/18 neutralized

unless the suite actually exists and produces those 18 results.

Do not claim:

verified gas

unless generated from actual receipts.

Do not claim:

30ms end-to-end

unless experimentally measured and precisely defined.

Do not call the MockERC20:

real collateral.

Replace with:

CC3 testnet collateral asset.

Add a compact "Truth & Scope" section:

LIVE:
- CC3 deployment
- Attestcoin verification path
- registry evidence admission
- guard decision
- vault transition
- wallet signing

LOCAL:
- mock adversarial fixtures
- unit-only precompile mocks

ADVISORY:
- Gemini explanations

This transparency improves judge trust.

---

## 18. FINAL 2-MINUTE JUDGING PATH

The default live demo must be:

1. Landing page
2. Open Protocol
3. Connect wallet
4. Switch to CC3
5. Show live testnet contract state
6. Open a guarded position
7. Show source event
8. Generate Attestcoin proof
9. Admit evidence on CC3
10. Evaluate relationship
11. Show INDETERMINATE
12. Execute HOLD
13. Read vault isHeld == true
14. Attempt liquidation
15. Transaction reverts
16. Show actual tx hashes
17. Open Attack page
18. Show same attack as a live failure
19. Open Evidence
20. Copy provenance receipt
21. Optional Gemini explanation

The memorable moment:

"Both events are proven real. Their cross-chain order is not proven. Causora refuses to guess."

---

## 19. UI FINAL PASS

After protocol completion:

- Rebuild landing page around Alethia-inspired visual language
- Keep the ash/white light mode
- Add deep black/charcoal dark mode
- use premium Vurqel-inspired typography
- do not copy branding/assets
- use Framer Motion
- elegant cursor/hover glow
- balanced editorial grid
- squared navigation capsules
- electric active states
- consistent spacing rhythm
- no duplicated controls
- hero object/artifact remains behind text without interference
- responsive at mobile/tablet/desktop
- accessibility labels
- keyboard navigation

Do not let visual polish hide technical placeholders.

---

## 20. FINAL TEST GATE

Do not deploy Vercel until ALL are true:

### Contracts
- [ ] CC3 bytecode exists
- [ ] correct addresses recorded
- [ ] registry → guard → manager → vault graph verified
- [ ] event authentication hardened
- [ ] causal witness genuinely bound
- [ ] business replay protected
- [ ] unauthorized mutation tested

### Attestcoin
- [ ] real source transaction
- [ ] real ProofBuilder response
- [ ] real CC3 precompile verification
- [ ] real registry evidence record
- [ ] source event signature validated

### Finance
- [ ] test token deposited into vault
- [ ] HOLD changes actual vault state
- [ ] HOLD prevents liquidation
- [ ] ALLOW_B transfers token
- [ ] ALLOW_A preserves collateral
- [ ] REJECT produces no transfer

### Frontend
- [ ] zero fake wallet address
- [ ] zero fake verification state
- [ ] zero fake live receipt
- [ ] no default LIVE page powered by mockData
- [ ] no live "verified" setTimeout
- [ ] no live attack setTimeout
- [ ] actual transaction lifecycle visible

### Evidence
- [ ] every tx hash real
- [ ] every gas measurement from receipt
- [ ] every latency metric defined
- [ ] hashes are actual SHA-256 values
- [ ] manifests generated automatically

### README
- [ ] Vercel URL
- [ ] GitHub URL
- [ ] real CC3 addresses
- [ ] real proof links
- [ ] truthful claim matrix
- [ ] no stale localhost links
- [ ] no unsupported performance claims

Only after all boxes pass:

npm run build
npm test
npm run judge:local
npm run judge:cc3
npm run build:ui
npm run test:e2e

Then deploy Vercel.

---

# Final architecture to preserve

SOURCE CHAIN
→ Attestcoin ProofBuilder
→ Creditcoin BlockProver / ChainInfo
→ CausoraRegistry
→ RelationEngine
→ CausoraGuard
→ LendingPositionManager
→ CausoraVault
→ REAL TESTNET TOKEN STATE
→ UI READ-BACK

The UI is the window.

The contracts are the authority.

Attestcoin is the evidence primitive.

Causora's innovation is the orderability boundary + fail-closed financial enforcement.

Do not add feature breadth until these truths are real.
