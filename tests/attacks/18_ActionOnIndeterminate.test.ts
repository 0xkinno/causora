import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 18: Financial action MUST fail closed to HOLD when relation is INDETERMINATE", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Financial action MUST fail closed to HOLD when relation is INDETERMINATE", async function () {
    const encSepolia = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const encMainnet = f.makeEncodedTx(1, f.emitterMainnet, f.defaultSig);
    const proof1 = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proof2 = { root: ethers.keccak256(ethers.toUtf8Bytes("root2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: true }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await f.registry.admitEvidence(1n, 100n, encSepolia, proof1, cont);
    const q1 = await f.registry.computeQueryId(1n, 100n, proof1.root, proof1.siblings);

    await f.registry.admitEvidence(3n, 20000000n, encMainnet, proof2, cont);
    const q2 = await f.registry.computeQueryId(3n, 20000000n, proof2.root, proof2.siblings);

    const [decision] = await f.guard.evaluateGuardFromEvidence.staticCall(
      999n,
      q1,
      q2,
      CausalWitnessBuilder.empty(),
      ActionPolicy.FailClosedHold
    );
    expect(decision).to.equal(GuardDecision.HOLD);
  });
});
