export enum RelationClass {
  INVALID = 0,
  SAME_CHAIN_ORDER = 1,
  CROSS_CHAIN_CAUSAL = 2,
  CROSS_CHAIN_INDETERMINATE = 3
}

export enum RelativeOrder {
  UNPROVABLE = 0,
  PROVABLY_FIRST_A = 1,
  PROVABLY_FIRST_B = 2,
  STRICTLY_EQUAL = 3
}

export interface CausalWitness {
  parentDigest: string;
  capabilityHash: string;
  stateCommitment: string;
  sequenceNumber: bigint | number;
  signatureOrProof: string;
}

export interface EventEvidenceRecord {
  chainKey: number;
  blockHeight: number;
  txIndex: number;
  txHash: string;
  emitter: string;
  eventSig: string;
  queryId: string;
  payloadHash: string;
  verifiedAt: number;
  exists: boolean;
}

export interface RelationResult {
  classification: RelationClass;
  order: RelativeOrder;
  heightA: number;
  indexA: number;
  heightB: number;
  indexB: number;
  evidenceDigestA: string;
  evidenceDigestB: string;
  reason: string;
}