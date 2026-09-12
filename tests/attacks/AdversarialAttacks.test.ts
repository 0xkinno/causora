import { setupPrecompiles } from "../setupPrecompiles";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  CausoraRegistry,
  RelationEngine,
  CausoraGuard,
  LendingPositionManager,
  CausoraVault,
  MockERC20,
  MockBlockProver
} from "../../typechain-types";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Adversarial Attack Suite (27 Vectors)", function () {
  let mockProver: MockBlockProver;
  let registry: CausoraRegistry;
  let relationEngine: RelationEngine;
  let guard: CausoraGuard;
  let vault: CausoraVault;
  let ctUSD: MockERC20;
  let lending: LendingPositionManager;
  let owner: any;
  let attacker: any;
  let victim: any;
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const emitterSepolia = "0x1111111111111111111111111111111111111111";
  const emitterMainnet = "0x2222222222222222222222222222222222222222";
  const defaultSig = ethers.keccak256(ethers.toUtf8Bytes("TestEvent()"));

  beforeEach(async function () {
    await setupPrecompiles();
    [owner, attacker, victim] = await ethers.getSigners();

    const proverFactory = await ethers.getContractFactory("MockBlockProver");
    mockProver = await proverFactory.deploy();
    await mockProver.waitForDeployment();

    const regFactory = await ethers.getContractFactory("CausoraRegistry");
    registry = await regFactory.deploy();
    await registry.waitForDeployment();

    const relFactory = await ethers.getContractFactory("RelationEngine");
    relationEngine = await relFactory.deploy();
    await relationEngine.waitForDeployment();

    const guardFactory = await ethers.getContractFactory("CausoraGuard");
    guard = await guardFactory.deploy(await registry.getAddress(), await relationEngine.getAddress());
    await guard.waitForDeployment();

    const erc20Factory = await ethers.getContractFactory("MockERC20");
    ctUSD = await erc20Factory.deploy("Creditcoin Test USD", "ctUSD");
    await ctUSD.waitForDeployment();

    const vaultFactory = await ethers.getContractFactory("CausoraVault");
    vault = await vaultFactory.deploy(await ctUSD.getAddress());
    await vault.waitForDeployment();

    const lendFactory = await ethers.getContractFactory("LendingPositionManager");
    lending = await lendFactory.deploy(
      await registry.getAddress(),
      await relationEngine.getAddress(),
      await guard.getAddress(),
      await vault.getAddress()
    );
    await lending.waitForDeployment();

    await vault.setPositionManager(await lending.getAddress());

    // Register approved sources with authentic event signature
    await registry.registerSource(1n, emitterSepolia, 1, defaultSig, "Sepolia Collateral");
    await registry.registerSource(3n, emitterMainnet, 2, defaultSig, "Mainnet Liquidation");
  });

  function toPlainEvidence(ev: any) {
    return {
      chainKey: ev.chainKey,
      blockHeight: ev.blockHeight,
      txIndex: ev.txIndex,
      txHash: ev.txHash,
      emitter: ev.emitter,
      eventSig: ev.eventSig,
      queryId: ev.queryId,
      payloadHash: ev.payloadHash,
      verifiedAt: ev.verifiedAt,
      exists: ev.exists,
    };
  }

  function makeEncodedTx(status: number, emitter: string, logSig: string, data: string = "0x") {
    const commonChunk = abiCoder.encode(
      ["uint64", "uint64", "address", "bool", "address", "uint256", "bytes"],
      [1n, 21000n, victim.address, false, emitter, 0n, "0x"]
    );
    const receiptChunk = abiCoder.encode(
      ["uint8", "uint64", "tuple(address address_, bytes32[] topics, bytes data)[]", "bytes"],
      [
        status,
        21000n,
        [{ address_: emitter, topics: [logSig], data: data }],
        "0x"
      ]
    );
    return abiCoder.encode(["uint8", "bytes[]"], [2, [commonChunk, receiptChunk]]);
  }

  // Attack 1: Submission-Order Attack
  it("Attack 1: Submission order does NOT manipulate derived block/index order", async function () {
    const encEarly = makeEncodedTx(1, emitterSepolia, defaultSig);
    const encLate = makeEncodedTx(1, emitterSepolia, defaultSig);

    const proofEarly = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proofLate = { root: ethers.keccak256(ethers.toUtf8Bytes("root2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: true }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    // Attacker submits the LATER event FIRST
    await registry.admitEvidence(1n, 105n, encLate, proofLate, cont);
    const qLate = await registry.computeQueryId(1n, 105n, proofLate.root, proofLate.siblings);

    // Then submits the EARLIER event
    await registry.admitEvidence(1n, 100n, encEarly, proofEarly, cont);
    const qEarly = await registry.computeQueryId(1n, 100n, proofEarly.root, proofEarly.siblings);

    const evEarly = await registry.getEvidence(qEarly);
    const evLate = await registry.getEvidence(qLate);

    const result = await relationEngine.classifyRelation(toPlainEvidence(evEarly), toPlainEvidence(evLate), CausalWitnessBuilder.empty());
    expect(result.order).to.equal(1); // PROVABLY_FIRST_A: True block height wins, not submission order!
  });

  // Attack 2: Proof-sniping / Delayed Proof Attack
  it("Attack 2: Delayed proof cannot manufacture artificial precedence over provably earlier event", async function () {
    const enc1 = makeEncodedTx(1, emitterSepolia, defaultSig);
    const enc2 = makeEncodedTx(1, emitterSepolia, defaultSig);

    const proof1 = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proof2 = { root: ethers.keccak256(ethers.toUtf8Bytes("root2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(1n, 50n, enc1, proof1, cont);
    await registry.admitEvidence(1n, 80n, enc2, proof2, cont);

    const q1 = await registry.computeQueryId(1n, 50n, proof1.root, proof1.siblings);
    const q2 = await registry.computeQueryId(1n, 80n, proof2.root, proof2.siblings);

    const ev1 = await registry.getEvidence(q1);
    const ev2 = await registry.getEvidence(q2);

    const result = await relationEngine.classifyRelation(toPlainEvidence(ev2), toPlainEvidence(ev1), CausalWitnessBuilder.empty());
    expect(result.order).to.equal(2); // PROVABLY_FIRST_B (ev1 is earlier)
  });

  // Attack 3: Wrong-chain replay
  it("Attack 3: Wrong-chain replay is prevented by chainKey binding in queryId", async function () {
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };

    const qSepolia = await registry.computeQueryId(1n, 100n, proof.root, proof.siblings);
    const qMainnet = await registry.computeQueryId(3n, 100n, proof.root, proof.siblings);

    expect(qSepolia).to.not.equal(qMainnet);
  });

  // Attack 4: Wrong-source-contract event
  it("Attack 4: Rejects un-whitelisted emitter contracts", async function () {
    const unapprovedEmitter = "0x9999999999999999999999999999999999999999";
    const sig = ethers.keccak256(ethers.toUtf8Bytes("FakeEvent()"));
    const enc = makeEncodedTx(1, unapprovedEmitter, sig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      registry.admitEvidence(1n, 100n, enc, proof, cont)
    ).to.be.revertedWithCustomError(registry, "SourceNotRegistered");
  });

  // Attack 4B (Priority 3 Hardening): Event signature mismatch on registered emitter
  it("Attack 4B: Rejects mismatched event signature on whitelisted emitter", async function () {
    const fakeSig = ethers.keccak256(ethers.toUtf8Bytes("UnregisteredLog()"));
    const enc = makeEncodedTx(1, emitterSepolia, fakeSig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("rootSigMismatch")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      registry.admitEvidence(1n, 100n, enc, proof, cont)
    ).to.be.revertedWithCustomError(registry, "ExpectedEventNotFound");
  });

  // Attack 5: Failed source transaction presented as successful
  it("Attack 5: Rejects reverted source transactions (receiptStatus == 0)", async function () {
    const encReverted = makeEncodedTx(0, emitterSepolia, defaultSig); // receiptStatus = 0
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      registry.admitEvidence(1n, 100n, encReverted, proof, cont)
    ).to.be.revertedWithCustomError(registry, "SourceTransactionReverted");
  });

  // Attack 6: Tampered encoded transaction
  it("Attack 6: Tampered encoded transaction type is rejected", async function () {
    const badEnc = abiCoder.encode(["uint8", "bytes[]"], [99, []]); // Invalid txType 99
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      registry.admitEvidence(1n, 100n, badEnc, proof, cont)
    ).to.be.revertedWithCustomError(registry, "UnsupportedTransactionType");
  });

  // Attack 7: Tampered Merkle proof
  it("Attack 7: Tampered Merkle proof root reverts in BlockProver", async function () {
    const enc = makeEncodedTx(1, emitterSepolia, defaultSig);
    const badProof = { root: ethers.ZeroHash, siblings: [] }; // Empty root
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      registry.admitEvidence(1n, 100n, enc, badProof, cont)
    ).to.be.revertedWith("BlockProver: empty root");
  });

  // Attack 8: Tampered continuity proof
  it("Attack 8: BlockProver rejection on broken continuity", async function () {
    const verifierAtFd2 = await ethers.getContractAt("MockBlockProver", "0x0000000000000000000000000000000000000FD2");
    await verifierAtFd2.setShouldFail(true);
    const enc = makeEncodedTx(1, emitterSepolia, defaultSig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      registry.admitEvidence(1n, 100n, enc, proof, cont)
    ).to.be.revertedWith("BlockProver: verification failed");
    await verifierAtFd2.setShouldFail(false);
  });

  // Attack 9 & 10: Stale/Expired/Duplicated proof reuse
  it("Attack 9 & 10: Prevents replaying an already admitted proof (Replay Guard)", async function () {
    const enc = makeEncodedTx(1, emitterSepolia, defaultSig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(1n, 100n, enc, proof, cont);

    // Replay attempt
    await expect(
      registry.admitEvidence(1n, 100n, enc, proof, cont)
    ).to.be.revertedWithCustomError(registry, "QueryAlreadyProcessed");
  });

  // Attack 11: Front-run / refutation manipulation
  it("Attack 11: Front-runner on independent chain cannot force precedence", async function () {
    const encA = makeEncodedTx(1, emitterSepolia, defaultSig);
    const encB = makeEncodedTx(1, emitterMainnet, defaultSig);

    const proofA = { root: ethers.keccak256(ethers.toUtf8Bytes("rootA")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sA")), isLeft: false }] };
    const proofB = { root: ethers.keccak256(ethers.toUtf8Bytes("rootB")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sB")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(1n, 100n, encA, proofA, cont);
    await registry.admitEvidence(3n, 50000n, encB, proofB, cont);

    const qA = await registry.computeQueryId(1n, 100n, proofA.root, proofA.siblings);
    const qB = await registry.computeQueryId(3n, 50000n, proofB.root, proofB.siblings);

    const evA = await registry.getEvidence(qA);
    const evB = await registry.getEvidence(qB);

    const res = await relationEngine.classifyRelation(toPlainEvidence(evA), toPlainEvidence(evB), CausalWitnessBuilder.empty());
    expect(res.classification).to.equal(3); // CROSS_CHAIN_INDETERMINATE
    expect(res.order).to.equal(0); // UNPROVABLE
  });

  // Attack 12: Event-argument substitution
  it("Attack 12: Event payload tampering changes evidence digest", async function () {
    const ev1 = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 1n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: emitterSepolia,
      eventSig: defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("q1")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("legitPayload")),
      verifiedAt: 100n,
      exists: true
    };
    const evSubstituted = { ...ev1, payloadHash: ethers.keccak256(ethers.toUtf8Bytes("tamperedPayload")) };

    const res1 = await relationEngine.classifyRelation(ev1, ev1, CausalWitnessBuilder.empty());
    const res2 = await relationEngine.classifyRelation(evSubstituted, ev1, CausalWitnessBuilder.empty());

    expect(res1.evidenceDigestA).to.not.equal(res2.evidenceDigestA);
  });

  // Attack 13 & 14: Transaction-index misuse and same-block ordering
  it("Attack 13 & 14: Ordinal txIndex strictly respected inside same block", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: emitterSepolia,
      eventSig: defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA")),
      verifiedAt: 100n,
      exists: true
    };
    const evB = { ...evA, txIndex: 1n, queryId: ethers.keccak256(ethers.toUtf8Bytes("qB")) };

    const res = await relationEngine.classifyRelation(toPlainEvidence(evA), toPlainEvidence(evB), CausalWitnessBuilder.empty());
    expect(res.order).to.equal(1); // PROVABLY_FIRST_A
  });

  // Attack 15: Unsupported cross-chain ordering claim
  it("Attack 15: Rejects timestamps as evidence of cross-chain order", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: emitterSepolia,
      eventSig: defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA")),
      verifiedAt: 100n,
      exists: true
    };
    const evB = { ...evA, chainKey: 3n, blockHeight: 50n };

    const res = await relationEngine.classifyRelation(toPlainEvidence(evA), toPlainEvidence(evB), CausalWitnessBuilder.empty());
    expect(res.classification).to.equal(3); // CROSS_CHAIN_INDETERMINATE
  });

  // Attack 16: Malformed witness
  it("Attack 16: Rejects malformed causal witness with mismatched parent digest", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: emitterSepolia,
      eventSig: defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA")),
      verifiedAt: 100n,
      exists: true
    };
    const evB = { ...evA, chainKey: 3n, blockHeight: 50n };

    const badWitness = {
      parentDigest: ethers.keccak256(ethers.toUtf8Bytes("wrongParent")),
      capabilityHash: ethers.keccak256(ethers.toUtf8Bytes("cap")),
      stateCommitment: ethers.keccak256(ethers.toUtf8Bytes("commit")),
      sequenceNumber: 1n,
      signatureOrProof: "0x"
    };

    const res = await relationEngine.classifyRelation(toPlainEvidence(evA), toPlainEvidence(evB), badWitness);
    expect(res.classification).to.equal(3); // CROSS_CHAIN_INDETERMINATE
  });

  // Attack 17: Witness without matching Event B payload
  it("Attack 17: Witness requires Event B payload to cryptographically commit to consumption", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: emitterSepolia,
      eventSig: defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA")),
      verifiedAt: 100n,
      exists: true
    };
    // Event B has uncommitted payload
    const evB = {
      ...evA,
      chainKey: 3n,
      blockHeight: 50n,
      eventSig: ethers.keccak256(ethers.toUtf8Bytes("CausalityConsumed(bytes32,bytes32,uint64,bytes32)")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("uncommittedPayload"))
    };

    const validWitness = CausalWitnessBuilder.createWitness(1, 100, evA.queryId, evA.payloadHash, 1);

    const res = await relationEngine.classifyRelation(toPlainEvidence(evA), toPlainEvidence(evB), validWitness);
    expect(res.classification).to.equal(3); // CROSS_CHAIN_INDETERMINATE
  });

  // Attack 18: Financial action attempted on INDETERMINATE (The core firewall test)
  it("Attack 18: Financial action MUST fail closed to HOLD when relation is INDETERMINATE", async function () {
    const encSepolia = makeEncodedTx(1, emitterSepolia, defaultSig);
    const encMainnet = makeEncodedTx(1, emitterMainnet, defaultSig);

    const proof1 = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proof2 = { root: ethers.keccak256(ethers.toUtf8Bytes("root2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: true }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(1n, 100n, encSepolia, proof1, cont);
    const q1 = await registry.computeQueryId(1n, 100n, proof1.root, proof1.siblings);

    await registry.admitEvidence(3n, 20000000n, encMainnet, proof2, cont);
    const q2 = await registry.computeQueryId(3n, 20000000n, proof2.root, proof2.siblings);

    const [decision] = await guard.evaluateGuardFromEvidence.staticCall(
      999n,
      q1,
      q2,
      CausalWitnessBuilder.empty(),
      ActionPolicy.FailClosedHold
    );

    // MUST NOT allow liquidation or arbitrary state change; MUST be HOLD
    expect(decision).to.equal(GuardDecision.HOLD);
  });

  // Attack 19: Forged Causal Witness — Random Signature / Capability
  it("Attack 19: Forged Causal Witness with random capability returns CROSS_CHAIN_INDETERMINATE", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA19")),
      emitter: emitterSepolia,
      eventSig: defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA19")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA19")),
      verifiedAt: 100n,
      exists: true
    };
    const validWitness = CausalWitnessBuilder.createWitness(1, 100, evA.queryId, evA.payloadHash, 1);
    const { payloadHash: payloadHashB, eventSig: sigB } = CausalWitnessBuilder.createConsumptionPayload(validWitness);
    const evB = {
      ...evA,
      chainKey: 3n,
      blockHeight: 50n,
      eventSig: sigB,
      payloadHash: payloadHashB
    };

    // Attacker fabricates random capability
    const forgedWitness = {
      ...validWitness,
      capabilityHash: ethers.keccak256(ethers.toUtf8Bytes("forged-capability"))
    };

    const res = await relationEngine.classifyRelation(toPlainEvidence(evA), toPlainEvidence(evB), forgedWitness);
    expect(res.classification).to.equal(3); // CROSS_CHAIN_INDETERMINATE
  });

  // Attack 20: Causal Witness with Wrong Parent Digest
  it("Attack 20: Causal Witness with wrong parentDigest is rejected as INDETERMINATE", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA20")),
      emitter: emitterSepolia,
      eventSig: defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA20")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA20")),
      verifiedAt: 100n,
      exists: true
    };
    const validWitness = CausalWitnessBuilder.createWitness(1, 100, evA.queryId, evA.payloadHash, 1);
    const { payloadHash: payloadHashB, eventSig: sigB } = CausalWitnessBuilder.createConsumptionPayload(validWitness);
    const evB = {
      ...evA,
      chainKey: 3n,
      blockHeight: 50n,
      eventSig: sigB,
      payloadHash: payloadHashB
    };

    const badParentWitness = {
      ...validWitness,
      parentDigest: ethers.keccak256(ethers.toUtf8Bytes("completely-wrong-parent"))
    };

    const res = await relationEngine.classifyRelation(toPlainEvidence(evA), toPlainEvidence(evB), badParentWitness);
    expect(res.classification).to.equal(3); // CROSS_CHAIN_INDETERMINATE
  });

  // Attack 21: Causal Witness with Wrong Sequence (sequence <= 0 or uninitialized)
  it("Attack 21: Causal Witness with zero/invalid sequence is rejected as INDETERMINATE", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA21")),
      emitter: emitterSepolia,
      eventSig: defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA21")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA21")),
      verifiedAt: 100n,
      exists: true
    };
    const validWitness = CausalWitnessBuilder.createWitness(1, 100, evA.queryId, evA.payloadHash, 1);
    const { payloadHash: payloadHashB, eventSig: sigB } = CausalWitnessBuilder.createConsumptionPayload(validWitness);
    const evB = {
      ...evA,
      chainKey: 3n,
      blockHeight: 50n,
      eventSig: sigB,
      payloadHash: payloadHashB
    };

    const badSeqWitness = {
      ...validWitness,
      sequenceNumber: 0n // Invalid non-positive sequence
    };

    const res = await relationEngine.classifyRelation(toPlainEvidence(evA), toPlainEvidence(evB), badSeqWitness);
    expect(res.classification).to.equal(3); // CROSS_CHAIN_INDETERMINATE
  });

  // Attack 22: Causal Witness with Wrong State Commitment
  it("Attack 22: Causal Witness with wrong stateCommitment is rejected as INDETERMINATE", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA22")),
      emitter: emitterSepolia,
      eventSig: defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA22")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA22")),
      verifiedAt: 100n,
      exists: true
    };
    const validWitness = CausalWitnessBuilder.createWitness(1, 100, evA.queryId, evA.payloadHash, 1);
    const { payloadHash: payloadHashB, eventSig: sigB } = CausalWitnessBuilder.createConsumptionPayload(validWitness);
    const evB = {
      ...evA,
      chainKey: 3n,
      blockHeight: 50n,
      eventSig: sigB,
      payloadHash: payloadHashB
    };

    const badCommitWitness = {
      ...validWitness,
      stateCommitment: ethers.keccak256(ethers.toUtf8Bytes("unmatched-state-commitment"))
    };

    const res = await relationEngine.classifyRelation(toPlainEvidence(evA), toPlainEvidence(evB), badCommitWitness);
    expect(res.classification).to.equal(3); // CROSS_CHAIN_INDETERMINATE
  });

  // Attack 23: Causal Witness Reused Across Different Positions
  it("Attack 23: Reusing evidence/witness across different positions is rejected by LendingPositionManager", async function () {
    const posId1 = 501n;
    const posId2 = 502n;

    await lending.connect(victim).createPosition(posId1, victim.address, ethers.parseEther("5"), ethers.parseEther("2000"));
    await lending.connect(victim).createPosition(posId2, victim.address, ethers.parseEther("5"), ethers.parseEther("2000"));
    await lending.markAtRisk(posId1);
    await lending.markAtRisk(posId2);

    const encSepolia = makeEncodedTx(1, emitterSepolia, defaultSig);
    const encMainnet = makeEncodedTx(1, emitterMainnet, defaultSig);
    const proof1 = { root: ethers.keccak256(ethers.toUtf8Bytes("root23a")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s23a")), isLeft: false }] };
    const proof2 = { root: ethers.keccak256(ethers.toUtf8Bytes("root23b")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s23b")), isLeft: true }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(1n, 100n, encSepolia, proof1, cont);
    const q1 = await registry.computeQueryId(1n, 100n, proof1.root, proof1.siblings);
    await registry.admitEvidence(3n, 20000000n, encMainnet, proof2, cont);
    const q2 = await registry.computeQueryId(3n, 20000000n, proof2.root, proof2.siblings);

    // Resolve for Position 1
    await lending.resolveCollateralRace(
      posId1,
      q1,
      q2,
      CausalWitnessBuilder.empty(),
      ethers.parseEther("1"),
      attacker.address
    );

    // Attempt to reuse the same evidence on Position 2 MUST revert with EvidenceBoundToOtherPosition
    await expect(
      lending.resolveCollateralRace(
        posId2,
        q1,
        q2,
        CausalWitnessBuilder.empty(),
        ethers.parseEther("1"),
        attacker.address
      )
    ).to.be.revertedWithCustomError(lending, "EvidenceBoundToOtherPosition");
  });

  // Attack 24: Event B Payload Does NOT Contain Causal Witness Reference
  it("Attack 24: Event B payload missing causal witness reference is rejected as INDETERMINATE", async function () {
    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA24")),
      emitter: emitterSepolia,
      eventSig: defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA24")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA24")),
      verifiedAt: 100n,
      exists: true
    };
    const validWitness = CausalWitnessBuilder.createWitness(1, 100, evA.queryId, evA.payloadHash, 1);
    const evB = {
      ...evA,
      chainKey: 3n,
      blockHeight: 50n,
      eventSig: ethers.keccak256(ethers.toUtf8Bytes("CausalityConsumed(bytes32,bytes32,uint64,bytes32)")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("completely-unrelated-payload-hash"))
    };

    const res = await relationEngine.classifyRelation(toPlainEvidence(evA), toPlainEvidence(evB), validWitness);
    expect(res.classification).to.equal(3); // CROSS_CHAIN_INDETERMINATE
  });

  // Attack 25: Event B Emitter is NOT Authorized Cross-Chain Counterparty
  it("Attack 25: Unregistered emitter attempting evidence admission is rejected", async function () {
    const unapprovedEmitter = "0x9999999999999999999999999999999999999999";
    const encUnapproved = makeEncodedTx(1, unapprovedEmitter, defaultSig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root25")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s25")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      registry.admitEvidence(1n, 100n, encUnapproved, proof, cont)
    ).to.be.revertedWithCustomError(registry, "SourceNotRegistered");
  });

  // Attack 26: Guard Direct Call with Fabricated RelationResult Reverts at Compile/Runtime
  it("Attack 26: Guard direct call with fabricated RelationResult is rejected because evaluateGuard is not public", async function () {
    expect((guard as any).evaluateGuard).to.be.undefined;

    // Direct low-level call with legacy evaluateGuard selector MUST fail
    const fakeSelector = ethers.id("evaluateGuard(uint256,(uint8,uint8,uint64,uint64,uint64,uint64,bytes32,bytes32,string),uint8)").slice(0, 10);
    const dummyCalldata = fakeSelector + "00".repeat(64);
    await expect(
      owner.sendTransaction({
        to: await guard.getAddress(),
        data: dummyCalldata
      })
    ).to.be.reverted;
  });

  // Attack 27: Vault Direct Call by Owner Reverts
  it("Attack 27: Vault direct call to executeProtectedTransition by owner reverts with UnauthorizedCaller", async function () {
    await expect(
      vault.connect(owner).executeProtectedTransition(
        1001n,
        2, // ALLOW_B
        attacker.address,
        victim.address,
        ethers.parseEther("1")
      )
    ).to.be.revertedWithCustomError(vault, "UnauthorizedCaller");
  });
});
