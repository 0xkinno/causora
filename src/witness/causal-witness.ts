import { ethers } from 'ethers';
import { CausalWitness } from '../relation/types';

export class CausalWitnessBuilder {
  static createWitness(
    parentChainKey: number,
    parentHeight: number,
    parentQueryId: string,
    parentPayloadHash: string,
    sequenceNumber: number = 1
  ): CausalWitness {
    const coder = ethers.AbiCoder.defaultAbiCoder();
    const parentDigest = ethers.keccak256(
      coder.encode(['uint64', 'uint64', 'bytes32', 'bytes32'], [parentChainKey, parentHeight, parentQueryId, parentPayloadHash])
    );

    const capabilityHash = ethers.keccak256(
      ethers.solidityPacked(['bytes32', 'uint64'], [parentDigest, sequenceNumber])
    );

    const stateCommitment = ethers.keccak256(
      ethers.solidityPacked(['bytes32', 'uint64', 'bytes32'], [capabilityHash, sequenceNumber, parentPayloadHash])
    );

    return {
      parentDigest,
      capabilityHash,
      stateCommitment,
      sequenceNumber,
      signatureOrProof: '0x'
    };
  }

  static createConsumptionPayload(witness: CausalWitness): { data: string; payloadHash: string; eventSig: string } {
    const coder = ethers.AbiCoder.defaultAbiCoder();
    const data = coder.encode(
      ['bytes32', 'bytes32', 'uint64', 'bytes32'],
      [witness.parentDigest, witness.capabilityHash, witness.sequenceNumber, witness.stateCommitment]
    );
    const payloadHash = ethers.keccak256(data);
    const eventSig = ethers.keccak256(ethers.toUtf8Bytes("CausalityConsumed(bytes32,bytes32,uint64,bytes32)"));
    return { data, payloadHash, eventSig };
  }

  static empty(): CausalWitness {
    return {
      parentDigest: ethers.ZeroHash,
      capabilityHash: ethers.ZeroHash,
      stateCommitment: ethers.ZeroHash,
      sequenceNumber: 0,
      signatureOrProof: '0x'
    };
  }
}
