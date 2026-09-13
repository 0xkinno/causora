import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 04: Rejects un-whitelisted emitter contracts and mismatched signatures", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Rejects un-whitelisted emitter contracts and mismatched signatures", async function () {
    const unapprovedEmitter = "0x9999999999999999999999999999999999999999";
    const sig = ethers.keccak256(ethers.toUtf8Bytes("FakeEvent()"));
    const enc = f.makeEncodedTx(1, unapprovedEmitter, sig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      f.registry.admitEvidence(1n, 100n, enc, proof, cont)
    ).to.be.revertedWithCustomError(f.registry, "SourceNotRegistered");
  });
});
