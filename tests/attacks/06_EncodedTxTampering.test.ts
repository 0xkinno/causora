import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 06: Tampered encoded transaction type is rejected", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Tampered encoded transaction type is rejected", async function () {
    const badEnc = f.abiCoder.encode(["uint8", "bytes[]"], [99, []]);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      f.registry.admitEvidence(1n, 100n, badEnc, proof, cont)
    ).to.be.revertedWithCustomError(f.registry, "UnsupportedTransactionType");
  });
});
