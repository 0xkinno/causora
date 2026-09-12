import { expect } from "chai";
import { ethers } from "hardhat";
import { setupPrecompiles } from "../setupPrecompiles";
import {
  CausoraRegistry,
  RelationEngine,
  CausoraGuard,
} from "../../typechain-types";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("CausoraGuard", function () {
  let registry: CausoraRegistry;
  let relationEngine: RelationEngine;
  let guard: CausoraGuard;
  let owner: any;
  let user: any;

  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const emitterSepolia = "0x1111111111111111111111111111111111111111";
  const emitterMainnet = "0x2222222222222222222222222222222222222222";
  const defaultSig = ethers.keccak256(ethers.toUtf8Bytes("TestEvent()"));

  function makeEncodedTx(status: number, emitter: string, logSig: string, data: string = "0x") {
    const commonChunk = abiCoder.encode(
      ["uint64", "uint64", "address", "bool", "address", "uint256", "bytes"],
      [1n, 21000n, user.address, false, emitter, 0n, "0x"]
    );
    const receiptChunk = abiCoder.encode(
      ["uint8", "uint64", "tuple(address address_, bytes32[] topics, bytes data)[]", "bytes"],
      [
        status,
        21000n,
        [{ address_: emitter, topics: [logSig], data: data }],
        "0x",
      ]
    );
    return abiCoder.encode(["uint8", "bytes[]"], [2, [commonChunk, receiptChunk]]);
  }

  beforeEach(async function () {
    await setupPrecompiles();
    [owner, user] = await ethers.getSigners();

    const regFactory = await ethers.getContractFactory("CausoraRegistry");
    registry = await regFactory.deploy();
    await registry.waitForDeployment();

    const relFactory = await ethers.getContractFactory("RelationEngine");
    relationEngine = await relFactory.deploy();
    await relationEngine.waitForDeployment();

    const guardFactory = await ethers.getContractFactory("CausoraGuard");
    guard = await guardFactory.deploy(await registry.getAddress(), await relationEngine.getAddress());
    await guard.waitForDeployment();

    await registry.registerSource(1n, emitterSepolia, 1, defaultSig, "Sepolia Collateral");
    await registry.registerSource(3n, emitterMainnet, 2, defaultSig, "Mainnet Liquidation");
  });

  it("authorizes Action A on PROVABLY_FIRST_A", async function () {
    const encEarly = makeEncodedTx(1, emitterSepolia, defaultSig);
    const encLate = makeEncodedTx(1, emitterSepolia, defaultSig);

    const proofEarly = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proofLate = { root: ethers.keccak256(ethers.toUtf8Bytes("root2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: true }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(1n, 100n, encEarly, proofEarly, cont);
    const qEarly = await registry.computeQueryId(1n, 100n, proofEarly.root, proofEarly.siblings);

    await registry.admitEvidence(1n, 105n, encLate, proofLate, cont);
    const qLate = await registry.computeQueryId(1n, 105n, proofLate.root, proofLate.siblings);

    const [decision, relation] = await guard.evaluateGuardFromEvidence.staticCall(
      1n,
      qEarly,
      qLate,
      CausalWitnessBuilder.empty(),
      ActionPolicy.FailClosedHold
    );

    expect(decision).to.equal(GuardDecision.ALLOW_A);
    expect(relation.order).to.equal(1); // PROVABLY_FIRST_A
  });

  it("authorizes Action B on PROVABLY_FIRST_B", async function () {
    const encEarly = makeEncodedTx(1, emitterSepolia, defaultSig);
    const encLate = makeEncodedTx(1, emitterSepolia, defaultSig);

    const proofEarly = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proofLate = { root: ethers.keccak256(ethers.toUtf8Bytes("root2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: true }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(1n, 100n, encEarly, proofEarly, cont);
    const qEarly = await registry.computeQueryId(1n, 100n, proofEarly.root, proofEarly.siblings);

    await registry.admitEvidence(1n, 105n, encLate, proofLate, cont);
    const qLate = await registry.computeQueryId(1n, 105n, proofLate.root, proofLate.siblings);

    // Swap arguments: qLate as A, qEarly as B -> B is provably earlier
    const [decision, relation] = await guard.evaluateGuardFromEvidence.staticCall(
      1n,
      qLate,
      qEarly,
      CausalWitnessBuilder.empty(),
      ActionPolicy.FailClosedHold
    );

    expect(decision).to.equal(GuardDecision.ALLOW_B);
    expect(relation.order).to.equal(2); // PROVABLY_FIRST_B
  });

  it("enforces fail-closed HOLD on CROSS_CHAIN_INDETERMINATE", async function () {
    const encSepolia = makeEncodedTx(1, emitterSepolia, defaultSig);
    const encMainnet = makeEncodedTx(1, emitterMainnet, defaultSig);

    const proof1 = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proof2 = { root: ethers.keccak256(ethers.toUtf8Bytes("root2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: true }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(1n, 100n, encSepolia, proof1, cont);
    const q1 = await registry.computeQueryId(1n, 100n, proof1.root, proof1.siblings);

    await registry.admitEvidence(3n, 20000000n, encMainnet, proof2, cont);
    const q2 = await registry.computeQueryId(3n, 20000000n, proof2.root, proof2.siblings);

    const [decision, relation] = await guard.evaluateGuardFromEvidence.staticCall(
      1n,
      q1,
      q2,
      CausalWitnessBuilder.empty(),
      ActionPolicy.FailClosedHold
    );

    expect(decision).to.equal(GuardDecision.HOLD);
    expect(relation.classification).to.equal(3); // CROSS_CHAIN_INDETERMINATE
  });

  it("rejects when evidence does not exist in registry", async function () {
    const enc = makeEncodedTx(1, emitterSepolia, defaultSig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(1n, 100n, enc, proof, cont);
    const q1 = await registry.computeQueryId(1n, 100n, proof.root, proof.siblings);

    const fakeQueryId = ethers.keccak256(ethers.toUtf8Bytes("non-existent-query-id"));

    const [decision] = await guard.evaluateGuardFromEvidence.staticCall(
      1n,
      q1,
      fakeQueryId,
      CausalWitnessBuilder.empty(),
      ActionPolicy.FailClosedHold
    );

    expect(decision).to.equal(GuardDecision.REJECT);
  });

  it("enforces MAX_EVIDENCE_AGE freshness invariant and fails closed to HOLD", async function () {
    const encSepolia = makeEncodedTx(1, emitterSepolia, defaultSig);
    const encMainnet = makeEncodedTx(1, emitterMainnet, defaultSig);

    const proof1 = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proof2 = { root: ethers.keccak256(ethers.toUtf8Bytes("root2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: true }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(1n, 100n, encSepolia, proof1, cont);
    const q1 = await registry.computeQueryId(1n, 100n, proof1.root, proof1.siblings);

    await registry.admitEvidence(3n, 20000000n, encMainnet, proof2, cont);
    const q2 = await registry.computeQueryId(3n, 20000000n, proof2.root, proof2.siblings);

    // Fast-forward EVM time past MAX_EVIDENCE_AGE (7 days + 1 hour)
    await ethers.provider.send("evm_increaseTime", [7 * 86400 + 3600]);
    await ethers.provider.send("evm_mine", []);

    // Freshness check triggers fail-closed HOLD
    const [decisionHold] = await guard.evaluateGuardFromEvidence.staticCall(
      1n,
      q1,
      q2,
      CausalWitnessBuilder.empty(),
      ActionPolicy.FailClosedHold
    );
    expect(decisionHold).to.equal(GuardDecision.HOLD);

    // With RequireCausalWitness policy, triggers REJECT
    const [decisionReject] = await guard.evaluateGuardFromEvidence.staticCall(
      1n,
      q1,
      q2,
      CausalWitnessBuilder.empty(),
      ActionPolicy.RequireCausalWitness
    );
    expect(decisionReject).to.equal(GuardDecision.REJECT);
  });

  it("increments positionDecisionNonces on every evaluation", async function () {
    const enc1 = makeEncodedTx(1, emitterSepolia, defaultSig);
    const enc2 = makeEncodedTx(1, emitterSepolia, defaultSig);

    const proof1 = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proof2 = { root: ethers.keccak256(ethers.toUtf8Bytes("root2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: true }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(1n, 100n, enc1, proof1, cont);
    const q1 = await registry.computeQueryId(1n, 100n, proof1.root, proof1.siblings);

    await registry.admitEvidence(1n, 105n, enc2, proof2, cont);
    const q2 = await registry.computeQueryId(1n, 105n, proof2.root, proof2.siblings);

    expect(await guard.positionDecisionNonces(42n)).to.equal(0n);

    // Execute first evaluation tx
    await guard.evaluateGuardFromEvidence(
      42n,
      q1,
      q2,
      CausalWitnessBuilder.empty(),
      ActionPolicy.FailClosedHold
    );
    expect(await guard.positionDecisionNonces(42n)).to.equal(1n);

    // Execute second evaluation tx
    await guard.evaluateGuardFromEvidence(
      42n,
      q1,
      q2,
      CausalWitnessBuilder.empty(),
      ActionPolicy.FailClosedHold
    );
    expect(await guard.positionDecisionNonces(42n)).to.equal(2n);
  });
});
