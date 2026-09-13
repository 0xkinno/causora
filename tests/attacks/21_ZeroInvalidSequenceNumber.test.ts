import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 21: Causal Witness with zero/invalid sequence is rejected as INDETERMINATE", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Causal Witness with zero/invalid sequence is rejected as INDETERMINATE", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA21")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA21")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA21")),
      verifiedAt: 100n,
      exists: true
    };
    const validWitness = CausalWitnessBuilder.createWitness(1, 100, evA.queryId, evA.payloadHash, 1);
    const { payloadHash: payloadHashB, eventSig: sigB } = CausalWitnessBuilder.createConsumptionPayload(validWitness);
    const evB = {
      ...evA,
      chainKey: 3n,
      blockHeight: 50n,
      eventSig: sigB,
      payloadHash: payloadHashB
    };

    const badSeqWitness = {
      ...validWitness,
      sequenceNumber: 0n
    };

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), badSeqWitness);
    expect(res.classification).to.equal(3);
  });
});
