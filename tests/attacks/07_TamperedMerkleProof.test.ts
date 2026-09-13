import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 07: Tampered Merkle proof root reverts in BlockProver", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Tampered Merkle proof root reverts in BlockProver", async function () {
    const enc = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const badProof = { root: ethers.ZeroHash, siblings: [] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      f.registry.admitEvidence(1n, 100n, enc, badProof, cont)
    ).to.be.revertedWith("BlockProver: empty root");
  });
});
