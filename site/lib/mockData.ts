import { LendingPosition, DecisionRecord, AttackScenario, ProofRecord } from "./types";
import { computeQueryId } from "./contracts";

export const MOCK_PROOFS: Record<string, ProofRecord> = {
  "proof_dep_1": {
    queryId: computeQueryId(1, 5824100, 42),
    chainKey: 1, // Sepolia
    blockHeight: 5824100,
    txIndex: 42,
    txHash: "0x8fa19e34c56e78a2d109f5bc3a2e1d0987fecba1234567890abcdef123456789",
    sender: "0x71C83637e69bA4FfB95079a405786f0646D08b5E",
    target: "0x2A54E1b1C89F3d2D78aB0c9e6B0eC701B41a6b0c",
    value: "50000000000000000000", // 50 ETH
    data: "0xd0e30db0",
    receiptStatus: 1,
    blockTimestamp: 1718000000,
    inclusionVerified: true,
    continuityVerified: true,
    blockHash: "0x34a8e29bf0a1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
    verifiedAt: 1718000020,
  },
  "proof_liq_valid": {
    queryId: computeQueryId(1, 5824200, 15),
    chainKey: 1, // Sepolia
    blockHeight: 5824200,
    txIndex: 15,
    txHash: "0x91b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    sender: "0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E",
    target: "0x2A54E1b1C89F3d2D78aB0c9e6B0eC701B41a6b0c",
    value: "0",
    data: "0xba530800",
    receiptStatus: 1,
    blockTimestamp: 1718001200,
    inclusionVerified: true,
    continuityVerified: true,
    blockHash: "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
    verifiedAt: 1718001215,
  },
  "proof_cross_btc": {
    queryId: computeQueryId(3, 850100, 3),
    chainKey: 3, // Bitcoin
    blockHeight: 850100,
    txIndex: 3,
    txHash: "0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
    sender: "0x0000000000000000000000000000000000000000",
    target: "0x0000000000000000000000000000000000000000",
    value: "150000000",
    data: "0x",
    receiptStatus: 1,
    blockTimestamp: 1718000500,
    inclusionVerified: true,
    continuityVerified: true,
    blockHash: "0x0000000000000000000284759473849382746152435465748392019283746521",
    verifiedAt: 1718000530,
  }
};

export const MOCK_POSITIONS: LendingPosition[] = [
  {
    id: "POS-001-ETH-SEP",
    borrower: "0x71C83637e69bA4FfB95079a405786f0646D08b5E",
    collateralAmount: "50.0 ETH",
    debtAmount: "75,000 tCTC",
    healthFactor: 1.82,
    lastDepositQueryId: computeQueryId(1, 5824100, 42),
    lastDepositTxHash: "0x8fa19e34c56e78a2d109f5bc3a2e1d0987fecba1234567890abcdef123456789",
    lastDepositTimestamp: 1718000000,
    status: "ACTIVE",
    history: [
      {
        decisionId: "0xdec001a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9",
        positionId: "POS-001-ETH-SEP",
        depositQueryId: computeQueryId(1, 5824100, 42),
        actionQueryId: computeQueryId(1, 5824050, 10),
        actionType: "LIQUIDATION",
        relation: "BEFORE",
        action: "REJECT",
        reasonCode: "ERR_ORDER_INVALID_PRIOR",
        reasonDescription: "Liquidation trigger event occurred at block 5824050 prior to borrower deposit at block 5824100.",
        timestamp: 1718000200,
        txHash: "0xabc1237890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        blockNumber: 10420,
        gasUsed: 42150
      }
    ]
  },
  {
    id: "POS-002-CROSS-BTC",
    borrower: "0x3456789aBCdEF0123456789aBCdEF0123456789a",
    collateralAmount: "2.5 BTC",
    debtAmount: "140,000 tCTC",
    healthFactor: 1.05,
    lastDepositQueryId: computeQueryId(3, 850100, 3),
    lastDepositTxHash: "0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
    lastDepositTimestamp: 1718000500,
    status: "HELD_PENDING_ORDER",
    history: [
      {
        decisionId: "0xdec002b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9a0",
        positionId: "POS-002-CROSS-BTC",
        depositQueryId: computeQueryId(3, 850100, 3),
        actionQueryId: computeQueryId(1, 5824150, 2),
        actionType: "LIQUIDATION",
        relation: "CONCURRENT_UNPROVABLE",
        action: "HOLD",
        reasonCode: "ERR_CROSS_CHAIN_UNORDERED_HOLD",
        reasonDescription: "No cross-chain causal witness provided between Bitcoin block 850100 and Sepolia block 5824150. State preserved.",
        timestamp: 1718000950,
        txHash: "0xdef4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        blockNumber: 10455,
        gasUsed: 48920
      }
    ]
  },
  {
    id: "POS-003-SETTLED-ETH",
    borrower: "0x9876543210abcdef9876543210abcdef98765432",
    collateralAmount: "12.0 ETH",
    debtAmount: "30,000 tCTC",
    healthFactor: 0.85,
    lastDepositQueryId: computeQueryId(1, 5824000, 5),
    lastDepositTxHash: "0xfeedbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
    lastDepositTimestamp: 1717999000,
    status: "LIQUIDATED",
    history: [
      {
        decisionId: "0xdec003c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9a0b1",
        positionId: "POS-003-SETTLED-ETH",
        depositQueryId: computeQueryId(1, 5824000, 5),
        actionQueryId: computeQueryId(1, 5824200, 15),
        actionType: "LIQUIDATION",
        relation: "AFTER",
        action: "ACT",
        reasonCode: "OK_PROVEN_ORDER_AFTER",
        reasonDescription: "Liquidation event strictly proven strictly after deposit on Sepolia (5824200 > 5824000). Action executed.",
        timestamp: 1718001250,
        txHash: "0x789abc1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        blockNumber: 10490,
        gasUsed: 89400
      }
    ]
  }
];

export const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    id: "ATTACK-01-MERKLE-TAMPER",
    gate: "GATE_1_INCLUSION",
    title: "Forged Merkle Inclusion Proof",
    description: "Attacker submits a manipulated Merkle receipt branch attempting to convince Causora that collateral was deposited.",
    payload: {
      eventA: { chainKey: 1, blockHeight: 5824100, txIndex: 42, inclusionVerified: false },
      eventB: { chainKey: 1, blockHeight: 5824100, txIndex: 42 },
      manipulation: "Tampered receipt trie root hashes in proof chunks"
    },
    expectedAction: "REJECT",
    expectedReason: "ERR_VERIFIER_FAILED_INCLUSION",
    invariantProtected: "Strict Non-Verifiable Rejection: 0xFD2 reverts on invalid root trie calculation."
  },
  {
    id: "ATTACK-02-FORK-HEADER-REPLAY",
    gate: "GATE_2_CONTINUITY",
    title: "Orphan Fork / Stale Header Replay",
    description: "Attacker provides an inclusion proof rooted in an uncle/reorged header not committed in the canonical continuity chain.",
    payload: {
      eventA: { chainKey: 1, blockHeight: 5824100, continuityVerified: false },
      eventB: { chainKey: 1, blockHeight: 5824100 },
      manipulation: "Parent hash mismatch against 0xFD3 canonical tip"
    },
    expectedAction: "REJECT",
    expectedReason: "ERR_VERIFIER_FAILED_CONTINUITY",
    invariantProtected: "Continuity Chain Invariant: Unratified headers cannot serve as causality anchors."
  },
  {
    id: "ATTACK-03-CROSS-CHAIN-DRIFT",
    gate: "GATE_3_CAUSALITY",
    title: "Independent Chain Clock Drift Exploitation",
    description: "Attacker claims an event on Bitcoin happened 'after' a Sepolia event because Bitcoin miner timestamp was forged ahead by 7,200s.",
    payload: {
      eventA: { chainKey: 1, blockHeight: 5824100, blockTimestamp: 1718000000 },
      eventB: { chainKey: 3, blockHeight: 850100, blockTimestamp: 1718007200 },
      manipulation: "Miner timestamp warp without Merkle causal witness"
    },
    expectedAction: "HOLD",
    expectedReason: "ERR_CROSS_CHAIN_UNORDERED_HOLD",
    invariantProtected: "Fail-Closed Safety: Causora never trusts foreign block timestamps for ordering; holds position safely."
  },
  {
    id: "ATTACK-04-PREMATURE-LIQUIDATION",
    gate: "GATE_4_SAFETY",
    title: "Reversed Intra-Chain Liquidation Front-Running",
    description: "Liquidator attempts to liquidate position using a price drop event that occurred BEFORE the borrower's top-up deposit in the same block.",
    payload: {
      eventA: { chainKey: 1, blockHeight: 5824100, txIndex: 42 }, // Deposit
      eventB: { chainKey: 1, blockHeight: 5824100, txIndex: 12 }, // Drop
      manipulation: "Submitting txIndex 12 as evidence against txIndex 42"
    },
    expectedAction: "REJECT",
    expectedReason: "ERR_ORDER_INVALID_PRIOR",
    invariantProtected: "Deterministic Intra-Chain Ordering: (blockA, txIndexA) <= (blockB, txIndexB) prevents retro-active liquidations."
  },
  {
    id: "ATTACK-05-PROOF-MUTATION",
    gate: "GATE_1_INCLUSION",
    title: "Proof Payload Malleability & Query ID Tampering",
    description: "Attacker shifts queryId byte padding to bypass unique execution guard in CausoraGuard.",
    payload: {
      eventA: { chainKey: 1, blockHeight: 5824100, txIndex: 42 },
      eventB: { chainKey: 1, blockHeight: 5824100, txIndex: 42 },
      manipulation: "Mutated trailing bytes in ABI packed representation"
    },
    expectedAction: "REJECT",
    expectedReason: "ERR_QUERY_ID_MISMATCH",
    invariantProtected: "Deterministic 72-byte Packed Query ID: Enforces canonical hash identity."
  },
  {
    id: "ATTACK-06-FORGED-CAUSAL-WITNESS",
    gate: "GATE_3_CAUSALITY",
    title: "Forged Cross-Chain Witness Commitment",
    description: "Attacker supplies a synthetic cross-chain witness whose embedded hash digest does not match the actual Sepolia transaction payload.",
    payload: {
      eventA: { chainKey: 1, blockHeight: 5824100, txIndex: 42 },
      eventB: { chainKey: 3, blockHeight: 850100, txIndex: 3 },
      manipulation: "Forged keccak256 digest in witness payload"
    },
    expectedAction: "HOLD",
    expectedReason: "ERR_WITNESS_DIGEST_INVALID",
    invariantProtected: "Cryptographic Witness Binding: Witness digest must strictly match keccak256(eventA)."
  }
];
