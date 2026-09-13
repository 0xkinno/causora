import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 12: Event payload tampering changes evidence digest", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Event payload tampering changes evidence digest", async function () {
    const ev1 = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 1n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("q1")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("legitPayload")),
      verifiedAt: 100n,
      exists: true
    };
    const evSubstituted = { ...ev1, payloadHash: ethers.keccak256(ethers.toUtf8Bytes("tamperedPayload")) };

    const res1 = await f.relationEngine.classifyRelation(ev1, ev1, CausalWitnessBuilder.empty());
    const res2 = await f.relationEngine.classifyRelation(evSubstituted, ev1, CausalWitnessBuilder.empty());

    expect(res1.evidenceDigestA).to.not.equal(res2.evidenceDigestA);
  });
});
