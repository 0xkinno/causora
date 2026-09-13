import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 02: Delayed proof cannot manufacture artificial precedence over provably earlier event", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Delayed proof cannot manufacture artificial precedence over provably earlier event", async function () {
    const enc1 = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const enc2 = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const proof1 = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proof2 = { root: ethers.keccak256(ethers.toUtf8Bytes("root2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await f.registry.admitEvidence(1n, 50n, enc1, proof1, cont);
    await f.registry.admitEvidence(1n, 80n, enc2, proof2, cont);

    const q1 = await f.registry.computeQueryId(1n, 50n, proof1.root, proof1.siblings);
    const q2 = await f.registry.computeQueryId(1n, 80n, proof2.root, proof2.siblings);

    const ev1 = await f.registry.getEvidence(q1);
    const ev2 = await f.registry.getEvidence(q2);

    const result = await f.relationEngine.classifyRelation(f.toPlainEvidence(ev2), f.toPlainEvidence(ev1), CausalWitnessBuilder.empty());
    expect(result.order).to.equal(2);
  });
});
