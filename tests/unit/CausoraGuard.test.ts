import { expect } from "chai";
import { ethers } from "hardhat";
import { CausoraGuard, RelationEngine } from "../../typechain-types";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("CausoraGuard", function () {
  let relationEngine: RelationEngine;
  let guard: CausoraGuard;

  beforeEach(async function () {
    const relFactory = await ethers.getContractFactory("RelationEngine");
    relationEngine = await relFactory.deploy();
    await relationEngine.waitForDeployment();

    const regFactory = await ethers.getContractFactory("CausoraRegistry");
    const registry = await regFactory.deploy();
    await registry.waitForDeployment();

    const guardFactory = await ethers.getContractFactory("CausoraGuard");
    guard = await guardFactory.deploy(await registry.getAddress(), await relationEngine.getAddress());
    await guard.waitForDeployment();
  });

  it("authorizes Action A on PROVABLY_FIRST_A", async function () {
    const relation = {
      classification: 1, // SAME_CHAIN_ORDER
      order: 1, // PROVABLY_FIRST_A
      heightA: 100n,
      indexA: 1n,
      heightB: 105n,
      indexB: 2n,
      evidenceDigestA: ethers.keccak256(ethers.toUtf8Bytes("A")),
      evidenceDigestB: ethers.keccak256(ethers.toUtf8Bytes("B")),
      reason: "Evidence A is earlier",
    };

    const decision = await guard.evaluateGuard.staticCall(1n, relation, ActionPolicy.FailClosedHold);
    expect(decision).to.equal(GuardDecision.ALLOW_A);
  });

  it("authorizes Action B on PROVABLY_FIRST_B", async function () {
    const relation = {
      classification: 1, // SAME_CHAIN_ORDER
      order: 2, // PROVABLY_FIRST_B
      heightA: 105n,
      indexA: 2n,
      heightB: 100n,
      indexB: 1n,
      evidenceDigestA: ethers.keccak256(ethers.toUtf8Bytes("A")),
      evidenceDigestB: ethers.keccak256(ethers.toUtf8Bytes("B")),
      reason: "Evidence B is earlier",
    };

    const decision = await guard.evaluateGuard.staticCall(1n, relation, ActionPolicy.FailClosedHold);
    expect(decision).to.equal(GuardDecision.ALLOW_B);
  });

  it("enforces fail-closed HOLD on CROSS_CHAIN_INDETERMINATE", async function () {
    const relation = {
      classification: 3, // CROSS_CHAIN_INDETERMINATE
      order: 0, // UNPROVABLE
      heightA: 100n,
      indexA: 1n,
      heightB: 20000000n,
      indexB: 10n,
      evidenceDigestA: ethers.keccak256(ethers.toUtf8Bytes("A")),
      evidenceDigestB: ethers.keccak256(ethers.toUtf8Bytes("B")),
      reason: "Order unprovable across independent chains",
    };

    const decision = await guard.evaluateGuard.staticCall(1n, relation, ActionPolicy.FailClosedHold);
    expect(decision).to.equal(GuardDecision.HOLD);
  });

  it("rejects when evidence is INVALID", async function () {
    const relation = {
      classification: 0, // INVALID
      order: 0,
      heightA: 0n,
      indexA: 0n,
      heightB: 0n,
      indexB: 0n,
      evidenceDigestA: ethers.ZeroHash,
      evidenceDigestB: ethers.ZeroHash,
      reason: "Corrupted proof",
    };

    const decision = await guard.evaluateGuard.staticCall(1n, relation, ActionPolicy.FailClosedHold);
    expect(decision).to.equal(GuardDecision.REJECT);
  });
});
