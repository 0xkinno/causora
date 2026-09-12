export type ActionDecision = 'ACT' | 'HOLD' | 'REJECT';
export type RelationType = 'BEFORE' | 'AFTER' | 'CONCURRENT_UNPROVABLE' | 'INVALID';

export interface ProofRecord {
  queryId: string;
  chainKey: number;
  blockHeight: number;
  txIndex: number;
  txHash: string;
  sender: string;
  target: string;
  value: string;
  data: string;
  receiptStatus: number;
  blockTimestamp: number;
  inclusionVerified: boolean;
  continuityVerified: boolean;
  blockHash: string;
  verifiedAt: number;
}

export interface CausalWitnessData {
  present: boolean;
  witnessChainKey: number;
  witnessBlockHeight: number;
  witnessTxIndex: number;
  witnessTxHash: string;
  digest: string;
}

export interface DecisionRecord {
  decisionId: string;
  positionId: string;
  depositQueryId: string;
  actionQueryId: string;
  actionType: 'LIQUIDATION' | 'COLLATERAL_SEIZURE' | 'RATE_ADJUSTMENT' | 'CROSS_CHAIN_CALL';
  relation: RelationType;
  action: ActionDecision;
  reasonCode: string;
  reasonDescription: string;
  witnessData?: CausalWitnessData;
  timestamp: number;
  txHash: string;
  blockNumber: number;
  gasUsed: number;
}

export interface LendingPosition {
  id: string;
  borrower: string;
  collateralAsset?: string;
  collateralAmount: string; // e.g. "50.0 ETH"
  debtAmount: string;       // e.g. "120,000 CTC"
  healthFactor: number;     // e.g. 1.42
  lastDepositQueryId: string;
  lastDepositTxHash?: string;
  lastDepositTimestamp?: number;
  lastLiquidationQueryId?: string;
  status: 'ACTIVE' | 'HELD_PENDING_ORDER' | 'LIQUIDATED' | 'HEALTHY' | 'SAFE' | 'AT_RISK' | 'RESCUED';
  history: DecisionRecord[];
}

export interface AttackScenario {
  id: string;
  gate: 'GATE_1_INCLUSION' | 'GATE_2_CONTINUITY' | 'GATE_3_CAUSALITY' | 'GATE_4_SAFETY';
  title: string;
  description: string;
  payload: {
    eventA: Partial<ProofRecord>;
    eventB: Partial<ProofRecord>;
    manipulation: string;
  };
  expectedAction: ActionDecision;
  expectedReason: string;
  invariantProtected: string;
}
