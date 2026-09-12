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
