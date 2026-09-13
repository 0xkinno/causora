import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 19: Forged Causal Witness with random capability returns CROSS_CHAIN_INDETERMINATE", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Forged Causal Witness with random capability returns CROSS_CHAIN_INDETERMINATE", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA19")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA19")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA19")),
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

    const forgedWitness = {
      ...validWitness,
      capabilityHash: ethers.keccak256(ethers.toUtf8Bytes("forged-capability"))
    };

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), forgedWitness);
    expect(res.classification).to.equal(3);
  });
});
