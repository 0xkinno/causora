import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector 10: Duplicated evidence is prevented by permanent query registration", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("Duplicated evidence is prevented by permanent query registration", async function () {
    const enc = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root10")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s10")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await f.registry.admitEvidence(1n, 100n, enc, proof, cont);
    const q = await f.registry.computeQueryId(1n, 100n, proof.root, proof.siblings);
    expect(await f.registry.hasProcessedQuery(q)).to.be.true;
  });
});
