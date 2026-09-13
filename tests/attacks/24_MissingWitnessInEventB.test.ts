import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 24: Event B payload missing causal witness reference is rejected as INDETERMINATE", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Event B payload missing causal witness reference is rejected as INDETERMINATE", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA24")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA24")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA24")),
      verifiedAt: 100n,
      exists: true
    };
    const validWitness = CausalWitnessBuilder.createWitness(1, 100, evA.queryId, evA.payloadHash, 1);
    const evB = {
      ...evA,
      chainKey: 3n,
      blockHeight: 50n,
      eventSig: ethers.keccak256(ethers.toUtf8Bytes("CausalityConsumed(bytes32,bytes32,uint64,bytes32)")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("completely-unrelated-payload-hash"))
    };

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), validWitness);
    expect(res.classification).to.equal(3);
  });
});
