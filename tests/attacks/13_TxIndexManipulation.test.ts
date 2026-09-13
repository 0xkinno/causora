import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 13: Ordinal txIndex strictly respected inside same block", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Ordinal txIndex strictly respected inside same block", async function () {
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
    const evB = { ...evA, txIndex: 1n, queryId: ethers.keccak256(ethers.toUtf8Bytes("qB")) };

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), CausalWitnessBuilder.empty());
    expect(res.order).to.equal(1);
  });
});
