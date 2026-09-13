import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 26: Guard direct call with fabricated RelationResult is rejected because evaluateGuard is not public", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Guard direct call with fabricated RelationResult is rejected because evaluateGuard is not public", async function () {
    expect((f.guard as any).evaluateGuard).to.be.undefined;

    const fakeSelector = ethers.id("evaluateGuard(uint256,(uint8,uint8,uint64,uint64,uint64,uint64,bytes32,bytes32,string),uint8)").slice(0, 10);
    const dummyCalldata = fakeSelector + "00".repeat(64);
    await expect(
      f.owner.sendTransaction({
        to: await f.guard.getAddress(),
        data: dummyCalldata
      })
    ).to.be.reverted;
  });
});
