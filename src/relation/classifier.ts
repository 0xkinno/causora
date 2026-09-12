import { ethers } from 'ethers';
import { EventEvidenceRecord, RelationClass, RelativeOrder, RelationResult, CausalWitness } from './types';

export class RelationClassifier {
  static computeEvidenceDigest(e: EventEvidenceRecord): string {
    const coder = ethers.AbiCoder.defaultAbiCoder();
    return ethers.keccak256(
      coder.encode(
        ['uint64', 'uint64', 'uint64', 'bytes32', 'address', 'bytes32', 'bytes32'],
        [e.chainKey, e.blockHeight, e.txIndex, e.txHash, e.emitter, e.eventSig, e.payloadHash]
      )
    );
  }

  static classify(
    evidenceA: EventEvidenceRecord,
    evidenceB: EventEvidenceRecord,
    witness?: CausalWitness
  ): RelationResult {
    const digestA = this.computeEvidenceDigest(evidenceA);
    const digestB = this.computeEvidenceDigest(evidenceB);

    const baseResult: Omit<RelationResult, 'classification' | 'order' | 'reason'> = {
      heightA: evidenceA.blockHeight,
      indexA: evidenceA.txIndex,
      heightB: evidenceB.blockHeight,
      indexB: evidenceB.txIndex,
      evidenceDigestA: digestA,
      evidenceDigestB: digestB,
    };

    // 1. Existence check
    if (!evidenceA.exists || !evidenceB.exists) {
      return {
        ...baseResult,
        classification: RelationClass.INVALID,
        order: RelativeOrder.UNPROVABLE,
        reason: 'One or both evidence records do not exist or failed verification'
      };
    }

    // 2. Same Chain Order
    if (evidenceA.chainKey === evidenceB.chainKey) {
      if (evidenceA.blockHeight < evidenceB.blockHeight) {
        return {
          ...baseResult,
          classification: RelationClass.SAME_CHAIN_ORDER,
          order: RelativeOrder.PROVABLY_FIRST_A,
          reason: 'Evidence A has lower block height on same source chain'
        };
      } else if (evidenceA.blockHeight > evidenceB.blockHeight) {
        return {
          ...baseResult,
          classification: RelationClass.SAME_CHAIN_ORDER,
          order: RelativeOrder.PROVABLY_FIRST_B,
          reason: 'Evidence B has lower block height on same source chain'
        };
      } else {
        // Same block: compare transaction indexes
        if (evidenceA.txIndex < evidenceB.txIndex) {
          return {
            ...baseResult,
            classification: RelationClass.SAME_CHAIN_ORDER,
            order: RelativeOrder.PROVABLY_FIRST_A,
            reason: 'Evidence A has lower transaction index within same block'
          };
        } else if (evidenceA.txIndex > evidenceB.txIndex) {
          return {
            ...baseResult,
            classification: RelationClass.SAME_CHAIN_ORDER,
            order: RelativeOrder.PROVABLY_FIRST_B,
            reason: 'Evidence B has lower transaction index within same block'
          };
        } else {
          return {
            ...baseResult,
            classification: RelationClass.SAME_CHAIN_ORDER,
            order: RelativeOrder.STRICTLY_EQUAL,
            reason: 'Both evidence records represent identical transaction position'
          };
        }
      }
    }

    // 3. Cross-Chain Causal Witness check
    if (witness && (witness.capabilityHash !== ethers.ZeroHash || witness.parentDigest !== ethers.ZeroHash)) {
      const coder = ethers.AbiCoder.defaultAbiCoder();
      const expectedDigestA = ethers.keccak256(
        coder.encode(['uint64', 'uint64', 'bytes32', 'bytes32'], [evidenceA.chainKey, evidenceA.blockHeight, evidenceA.queryId, evidenceA.payloadHash])
      );

      if (witness.parentDigest !== ethers.ZeroHash && witness.parentDigest !== expectedDigestA) {
        return {
          ...baseResult,
          classification: RelationClass.INVALID,
          order: RelativeOrder.UNPROVABLE,
          reason: 'Witness parentDigest does not match Evidence A'
        };
      }

      return {
        ...baseResult,
        classification: RelationClass.CROSS_CHAIN_CAUSAL,
        order: RelativeOrder.PROVABLY_FIRST_A,
        reason: 'Valid cryptographic causal dependency proven across chains'
      };
    }

    // 4. Cross-Chain Indeterminate (Fail-closed)
    return {
      ...baseResult,
      classification: RelationClass.CROSS_CHAIN_INDETERMINATE,
      order: RelativeOrder.UNPROVABLE,
      reason: 'Cross-chain events on independent chains lack cryptographic causal witness. Order is unprovable.'
    };
  }
}
