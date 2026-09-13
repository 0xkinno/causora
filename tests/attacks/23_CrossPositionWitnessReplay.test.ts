import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 23: Reusing evidence/witness across different positions is rejected by LendingPositionManager", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Reusing evidence/witness across different positions is rejected by LendingPositionManager", async function () {
    const posId1 = 501n;
    const posId2 = 502n;

    await f.lending.connect(f.victim).createPosition(posId1, f.victim.address, ethers.parseEther("5"), ethers.parseEther("2000"));
    await f.lending.connect(f.victim).createPosition(posId2, f.victim.address, ethers.parseEther("5"), ethers.parseEther("2000"));
    await f.lending.markAtRisk(posId1);
    await f.lending.markAtRisk(posId2);

    const encSepolia = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const encMainnet = f.makeEncodedTx(1, f.emitterMainnet, f.defaultSig);
    const proof1 = { root: ethers.keccak256(ethers.toUtf8Bytes("root23a")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s23a")), isLeft: false }] };
    const proof2 = { root: ethers.keccak256(ethers.toUtf8Bytes("root23b")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s23b")), isLeft: true }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await f.registry.admitEvidence(1n, 100n, encSepolia, proof1, cont);
    const q1 = await f.registry.computeQueryId(1n, 100n, proof1.root, proof1.siblings);
    await f.registry.admitEvidence(3n, 20000000n, encMainnet, proof2, cont);
    const q2 = await f.registry.computeQueryId(3n, 20000000n, proof2.root, proof2.siblings);

    await f.lending.resolveCollateralRace(
      posId1,
      q1,
      q2,
      CausalWitnessBuilder.empty(),
      ethers.parseEther("1"),
      f.attacker.address
    );

    await expect(
      f.lending.resolveCollateralRace(
        posId2,
        q1,
        q2,
        CausalWitnessBuilder.empty(),
        ethers.parseEther("1"),
        f.attacker.address
      )
    ).to.be.revertedWithCustomError(f.lending, "EvidenceBoundToOtherPosition");
  });
});
