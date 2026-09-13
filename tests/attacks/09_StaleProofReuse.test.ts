import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 09: Prevents replaying an already admitted proof (Replay Guard)", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Prevents replaying an already admitted proof (Replay Guard)", async function () {
    const enc = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await f.registry.admitEvidence(1n, 100n, enc, proof, cont);

    await expect(
      f.registry.admitEvidence(1n, 100n, enc, proof, cont)
    ).to.be.revertedWithCustomError(f.registry, "QueryAlreadyProcessed");
  });
});
