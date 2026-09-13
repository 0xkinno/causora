import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 11: Front-runner on independent chain cannot force precedence", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Front-runner on independent chain cannot force precedence", async function () {
    const encA = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const encB = f.makeEncodedTx(1, f.emitterMainnet, f.defaultSig);
    const proofA = { root: ethers.keccak256(ethers.toUtf8Bytes("rootA")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sA")), isLeft: false }] };
    const proofB = { root: ethers.keccak256(ethers.toUtf8Bytes("rootB")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sB")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await f.registry.admitEvidence(1n, 100n, encA, proofA, cont);
    await f.registry.admitEvidence(3n, 50000n, encB, proofB, cont);

    const qA = await f.registry.computeQueryId(1n, 100n, proofA.root, proofA.siblings);
    const qB = await f.registry.computeQueryId(3n, 50000n, proofB.root, proofB.siblings);

    const evA = await f.registry.getEvidence(qA);
    const evB = await f.registry.getEvidence(qB);

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), CausalWitnessBuilder.empty());
    expect(res.classification).to.equal(3);
    expect(res.order).to.equal(0);
  });
});
