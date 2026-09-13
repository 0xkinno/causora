import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 01: Submission order does NOT manipulate derived block/index order", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Submission order does NOT manipulate derived block/index order", async function () {
    const encEarly = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const encLate = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const proofEarly = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proofLate = { root: ethers.keccak256(ethers.toUtf8Bytes("root2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: true }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await f.registry.admitEvidence(1n, 105n, encLate, proofLate, cont);
    const qLate = await f.registry.computeQueryId(1n, 105n, proofLate.root, proofLate.siblings);

    await f.registry.admitEvidence(1n, 100n, encEarly, proofEarly, cont);
    const qEarly = await f.registry.computeQueryId(1n, 100n, proofEarly.root, proofEarly.siblings);

    const evEarly = await f.registry.getEvidence(qEarly);
    const evLate = await f.registry.getEvidence(qLate);

    const result = await f.relationEngine.classifyRelation(f.toPlainEvidence(evEarly), f.toPlainEvidence(evLate), CausalWitnessBuilder.empty());
    expect(result.order).to.equal(1);
  });
});
