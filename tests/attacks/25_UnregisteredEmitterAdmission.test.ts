import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 25: Unregistered emitter attempting evidence admission is rejected", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Unregistered emitter attempting evidence admission is rejected", async function () {
    const unapprovedEmitter = "0x9999999999999999999999999999999999999999";
    const encUnapproved = f.makeEncodedTx(1, unapprovedEmitter, f.defaultSig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root25")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s25")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      f.registry.admitEvidence(1n, 100n, encUnapproved, proof, cont)
    ).to.be.revertedWithCustomError(f.registry, "SourceNotRegistered");
  });
});
