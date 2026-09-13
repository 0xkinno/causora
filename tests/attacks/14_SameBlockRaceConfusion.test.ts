import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 14: Same-block race condition resolves by txIndex", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Same-block race condition resolves by txIndex", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 5n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA14")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA14")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA14")),
      verifiedAt: 100n,
      exists: true
    };
    const evB = { ...evA, txIndex: 2n, queryId: ethers.keccak256(ethers.toUtf8Bytes("qB14")) };

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), CausalWitnessBuilder.empty());
    expect(res.order).to.equal(2);
  });
});
