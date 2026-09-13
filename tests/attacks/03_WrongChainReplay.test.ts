import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 03: Wrong-chain replay is prevented by chainKey binding in queryId", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Wrong-chain replay is prevented by chainKey binding in queryId", async function () {
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const qSepolia = await f.registry.computeQueryId(1n, 100n, proof.root, proof.siblings);
    const qMainnet = await f.registry.computeQueryId(3n, 100n, proof.root, proof.siblings);
    expect(qSepolia).to.not.equal(qMainnet);
  });
});
