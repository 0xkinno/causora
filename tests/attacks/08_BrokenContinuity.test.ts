import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 08: BlockProver rejection on broken continuity", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("BlockProver rejection on broken continuity", async function () {
    const verifierAtFd2 = await ethers.getContractAt("MockBlockProver", "0x0000000000000000000000000000000000000FD2");
    await verifierAtFd2.setShouldFail(true);
    const enc = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      f.registry.admitEvidence(1n, 100n, enc, proof, cont)
    ).to.be.revertedWith("BlockProver: verification failed");
    await verifierAtFd2.setShouldFail(false);
  });
});
