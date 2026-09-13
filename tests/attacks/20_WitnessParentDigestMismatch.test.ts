import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 20: Causal Witness with wrong parentDigest is rejected as INDETERMINATE", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Causal Witness with wrong parentDigest is rejected as INDETERMINATE", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA20")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA20")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA20")),
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

    const badParentWitness = {
      ...validWitness,
      parentDigest: ethers.keccak256(ethers.toUtf8Bytes("completely-wrong-parent"))
    };

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), badParentWitness);
    expect(res.classification).to.equal(3);
  });
});
