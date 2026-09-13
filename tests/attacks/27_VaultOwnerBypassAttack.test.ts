import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 27: Vault direct call to executeProtectedTransition by owner reverts with UnauthorizedCaller", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Vault direct call to executeProtectedTransition by owner reverts with UnauthorizedCaller", async function () {
    await expect(
      f.vault.connect(f.owner).executeProtectedTransition(
        1001n,
        2,
        f.attacker.address,
        f.victim.address,
        ethers.parseEther("1")
      )
    ).to.be.revertedWithCustomError(f.vault, "UnauthorizedCaller");
  });
});
