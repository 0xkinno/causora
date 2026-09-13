import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 16: Rejects malformed causal witness with mismatched parent digest", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Rejects malformed causal witness with mismatched parent digest", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA")),
      verifiedAt: 100n,
      exists: true
    };
    const evB = { ...evA, chainKey: 3n, blockHeight: 50n };

    const badWitness = {
      parentDigest: ethers.keccak256(ethers.toUtf8Bytes("wrongParent")),
      capabilityHash: ethers.keccak256(ethers.toUtf8Bytes("cap")),
      stateCommitment: ethers.keccak256(ethers.toUtf8Bytes("commit")),
      sequenceNumber: 1n,
      signatureOrProof: "0x"
    };

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), badWitness);
    expect(res.classification).to.equal(3);
  });
});
