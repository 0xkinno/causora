const fs = require('fs');
const path = require('path');

const attacksDir = path.join(__dirname, '..', 'tests', 'attacks');

// Remove existing AdversarialAttacks.test.ts if present
const oldFile = path.join(attacksDir, 'AdversarialAttacks.test.ts');
if (fs.existsSync(oldFile)) {
  fs.unlinkSync(oldFile);
}

const template = (attackNum, attackTitle, testBody) => `import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Attack Vector ${attackNum}: ${attackTitle}", function () {
  let f: AttackFixture;
  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("${attackTitle}", async function () {
${testBody}
  });
});
`;

const attacks = [
  {
    num: "01",
    file: "01_SubmissionOrder.test.ts",
    title: "Submission order does NOT manipulate derived block/index order",
    body: `    const encEarly = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const encLate = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const proofEarly = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proofLate = { root: ethers.keccak256(ethers.toUtf8Bytes("root2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: true }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await f.registry.admitEvidence(1n, 105n, encLate, proofLate, cont);
    const qLate = await f.registry.computeQueryId(1n, 105n, proofLate.root, proofLate.siblings);

    await f.registry.admitEvidence(1n, 100n, encEarly, proofEarly, cont);
    const qEarly = await f.registry.computeQueryId(1n, 100n, proofEarly.root, proofEarly.siblings);

    const evEarly = await f.registry.getEvidence(qEarly);
    const evLate = await f.registry.getEvidence(qLate);

    const result = await f.relationEngine.classifyRelation(f.toPlainEvidence(evEarly), f.toPlainEvidence(evLate), CausalWitnessBuilder.empty());
    expect(result.order).to.equal(1);`
  },
  {
    num: "02",
    file: "02_DelayedProof.test.ts",
    title: "Delayed proof cannot manufacture artificial precedence over provably earlier event",
    body: `    const enc1 = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const enc2 = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const proof1 = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proof2 = { root: ethers.keccak256(ethers.toUtf8Bytes("root2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await f.registry.admitEvidence(1n, 50n, enc1, proof1, cont);
    await f.registry.admitEvidence(1n, 80n, enc2, proof2, cont);

    const q1 = await f.registry.computeQueryId(1n, 50n, proof1.root, proof1.siblings);
    const q2 = await f.registry.computeQueryId(1n, 80n, proof2.root, proof2.siblings);

    const ev1 = await f.registry.getEvidence(q1);
    const ev2 = await f.registry.getEvidence(q2);

    const result = await f.relationEngine.classifyRelation(f.toPlainEvidence(ev2), f.toPlainEvidence(ev1), CausalWitnessBuilder.empty());
    expect(result.order).to.equal(2);`
  },
  {
    num: "03",
    file: "03_WrongChainReplay.test.ts",
    title: "Wrong-chain replay is prevented by chainKey binding in queryId",
    body: `    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const qSepolia = await f.registry.computeQueryId(1n, 100n, proof.root, proof.siblings);
    const qMainnet = await f.registry.computeQueryId(3n, 100n, proof.root, proof.siblings);
    expect(qSepolia).to.not.equal(qMainnet);`
  },
  {
    num: "04",
    file: "04_UnauthorizedEmitter.test.ts",
    title: "Rejects un-whitelisted emitter contracts and mismatched signatures",
    body: `    const unapprovedEmitter = "0x9999999999999999999999999999999999999999";
    const sig = ethers.keccak256(ethers.toUtf8Bytes("FakeEvent()"));
    const enc = f.makeEncodedTx(1, unapprovedEmitter, sig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      f.registry.admitEvidence(1n, 100n, enc, proof, cont)
    ).to.be.revertedWithCustomError(f.registry, "SourceNotRegistered");`
  },
  {
    num: "05",
    file: "05_FailedTxIngest.test.ts",
    title: "Rejects reverted source transactions (receiptStatus == 0)",
    body: `    const encReverted = f.makeEncodedTx(0, f.emitterSepolia, f.defaultSig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      f.registry.admitEvidence(1n, 100n, encReverted, proof, cont)
    ).to.be.revertedWithCustomError(f.registry, "SourceTransactionReverted");`
  },
  {
    num: "06",
    file: "06_EncodedTxTampering.test.ts",
    title: "Tampered encoded transaction type is rejected",
    body: `    const badEnc = f.abiCoder.encode(["uint8", "bytes[]"], [99, []]);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      f.registry.admitEvidence(1n, 100n, badEnc, proof, cont)
    ).to.be.revertedWithCustomError(f.registry, "UnsupportedTransactionType");`
  },
  {
    num: "07",
    file: "07_TamperedMerkleProof.test.ts",
    title: "Tampered Merkle proof root reverts in BlockProver",
    body: `    const enc = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const badProof = { root: ethers.ZeroHash, siblings: [] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      f.registry.admitEvidence(1n, 100n, enc, badProof, cont)
    ).to.be.revertedWith("BlockProver: empty root");`
  },
  {
    num: "08",
    file: "08_BrokenContinuity.test.ts",
    title: "BlockProver rejection on broken continuity",
    body: `    const verifierAtFd2 = await ethers.getContractAt("MockBlockProver", "0x0000000000000000000000000000000000000FD2");
    await verifierAtFd2.setShouldFail(true);
    const enc = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      f.registry.admitEvidence(1n, 100n, enc, proof, cont)
    ).to.be.revertedWith("BlockProver: verification failed");
    await verifierAtFd2.setShouldFail(false);`
  },
  {
    num: "09",
    file: "09_StaleProofReuse.test.ts",
    title: "Prevents replaying an already admitted proof (Replay Guard)",
    body: `    const enc = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await f.registry.admitEvidence(1n, 100n, enc, proof, cont);

    await expect(
      f.registry.admitEvidence(1n, 100n, enc, proof, cont)
    ).to.be.revertedWithCustomError(f.registry, "QueryAlreadyProcessed");`
  },
  {
    num: "10",
    file: "10_DuplicatedEvidence.test.ts",
    title: "Duplicated evidence is prevented by permanent query registration",
    body: `    const enc = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root10")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s10")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await f.registry.admitEvidence(1n, 100n, enc, proof, cont);
    const q = await f.registry.computeQueryId(1n, 100n, proof.root, proof.siblings);
    expect(await f.registry.hasProcessedQuery(q)).to.be.true;`
  },
  {
    num: "11",
    file: "11_FrontRunningManipulation.test.ts",
    title: "Front-runner on independent chain cannot force precedence",
    body: `    const encA = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const encB = f.makeEncodedTx(1, f.emitterMainnet, f.defaultSig);
    const proofA = { root: ethers.keccak256(ethers.toUtf8Bytes("rootA")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sA")), isLeft: false }] };
    const proofB = { root: ethers.keccak256(ethers.toUtf8Bytes("rootB")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sB")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await f.registry.admitEvidence(1n, 100n, encA, proofA, cont);
    await f.registry.admitEvidence(3n, 50000n, encB, proofB, cont);

    const qA = await f.registry.computeQueryId(1n, 100n, proofA.root, proofA.siblings);
    const qB = await f.registry.computeQueryId(3n, 50000n, proofB.root, proofB.siblings);

    const evA = await f.registry.getEvidence(qA);
    const evB = await f.registry.getEvidence(qB);

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), CausalWitnessBuilder.empty());
    expect(res.classification).to.equal(3);
    expect(res.order).to.equal(0);`
  },
  {
    num: "12",
    file: "12_ArgumentSubstitution.test.ts",
    title: "Event payload tampering changes evidence digest",
    body: `    const ev1 = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 1n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("q1")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("legitPayload")),
      verifiedAt: 100n,
      exists: true
    };
    const evSubstituted = { ...ev1, payloadHash: ethers.keccak256(ethers.toUtf8Bytes("tamperedPayload")) };

    const res1 = await f.relationEngine.classifyRelation(ev1, ev1, CausalWitnessBuilder.empty());
    const res2 = await f.relationEngine.classifyRelation(evSubstituted, ev1, CausalWitnessBuilder.empty());

    expect(res1.evidenceDigestA).to.not.equal(res2.evidenceDigestA);`
  },
  {
    num: "13",
    file: "13_TxIndexManipulation.test.ts",
    title: "Ordinal txIndex strictly respected inside same block",
    body: `    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA")),
      verifiedAt: 100n,
      exists: true
    };
    const evB = { ...evA, txIndex: 1n, queryId: ethers.keccak256(ethers.toUtf8Bytes("qB")) };

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), CausalWitnessBuilder.empty());
    expect(res.order).to.equal(1);`
  },
  {
    num: "14",
    file: "14_SameBlockRaceConfusion.test.ts",
    title: "Same-block race condition resolves by txIndex",
    body: `    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 5n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA14")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA14")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA14")),
      verifiedAt: 100n,
      exists: true
    };
    const evB = { ...evA, txIndex: 2n, queryId: ethers.keccak256(ethers.toUtf8Bytes("qB14")) };

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), CausalWitnessBuilder.empty());
    expect(res.order).to.equal(2);`
  },
  {
    num: "15",
    file: "15_TimestampClockSpoofing.test.ts",
    title: "Rejects timestamps as evidence of cross-chain order",
    body: `    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA")),
      verifiedAt: 100n,
      exists: true
    };
    const evB = { ...evA, chainKey: 3n, blockHeight: 50n };

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), CausalWitnessBuilder.empty());
    expect(res.classification).to.equal(3);`
  },
  {
    num: "16",
    file: "16_MalformedCausalWitness.test.ts",
    title: "Rejects malformed causal witness with mismatched parent digest",
    body: `    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
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

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), badWitness);
    expect(res.classification).to.equal(3);`
  },
  {
    num: "17",
    file: "17_CapabilityReuse.test.ts",
    title: "Witness requires Event B payload to cryptographically commit to consumption",
    body: `    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("qA")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("pA")),
      verifiedAt: 100n,
      exists: true
    };
    const evB = {
      ...evA,
      chainKey: 3n,
      blockHeight: 50n,
      eventSig: ethers.keccak256(ethers.toUtf8Bytes("CausalityConsumed(bytes32,bytes32,uint64,bytes32)")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("uncommittedPayload"))
    };

    const validWitness = CausalWitnessBuilder.createWitness(1, 100, evA.queryId, evA.payloadHash, 1);
    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), validWitness);
    expect(res.classification).to.equal(3);`
  },
  {
    num: "18",
    file: "18_ActionOnIndeterminate.test.ts",
    title: "Financial action MUST fail closed to HOLD when relation is INDETERMINATE",
    body: `    const encSepolia = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const encMainnet = f.makeEncodedTx(1, f.emitterMainnet, f.defaultSig);
    const proof1 = { root: ethers.keccak256(ethers.toUtf8Bytes("root1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proof2 = { root: ethers.keccak256(ethers.toUtf8Bytes("root2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: true }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await f.registry.admitEvidence(1n, 100n, encSepolia, proof1, cont);
    const q1 = await f.registry.computeQueryId(1n, 100n, proof1.root, proof1.siblings);

    await f.registry.admitEvidence(3n, 20000000n, encMainnet, proof2, cont);
    const q2 = await f.registry.computeQueryId(3n, 20000000n, proof2.root, proof2.siblings);

    const [decision] = await f.guard.evaluateGuardFromEvidence.staticCall(
      999n,
      q1,
      q2,
      CausalWitnessBuilder.empty(),
      ActionPolicy.FailClosedHold
    );
    expect(decision).to.equal(GuardDecision.HOLD);`
  },
  {
    num: "19",
    file: "19_ForgedCausalWitness.test.ts",
    title: "Forged Causal Witness with random capability returns CROSS_CHAIN_INDETERMINATE",
    body: `    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA19")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
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

    const forgedWitness = {
      ...validWitness,
      capabilityHash: ethers.keccak256(ethers.toUtf8Bytes("forged-capability"))
    };

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), forgedWitness);
    expect(res.classification).to.equal(3);`
  },
  {
    num: "20",
    file: "20_WitnessParentDigestMismatch.test.ts",
    title: "Causal Witness with wrong parentDigest is rejected as INDETERMINATE",
    body: `    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA20")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
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

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), badParentWitness);
    expect(res.classification).to.equal(3);`
  },
  {
    num: "21",
    file: "21_ZeroInvalidSequenceNumber.test.ts",
    title: "Causal Witness with zero/invalid sequence is rejected as INDETERMINATE",
    body: `    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA21")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
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
      sequenceNumber: 0n
    };

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), badSeqWitness);
    expect(res.classification).to.equal(3);`
  },
  {
    num: "22",
    file: "22_StateCommitmentTampering.test.ts",
    title: "Causal Witness with wrong stateCommitment is rejected as INDETERMINATE",
    body: `    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA22")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
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

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), badCommitWitness);
    expect(res.classification).to.equal(3);`
  },
  {
    num: "23",
    file: "23_CrossPositionWitnessReplay.test.ts",
    title: "Reusing evidence/witness across different positions is rejected by LendingPositionManager",
    body: `    const posId1 = 501n;
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
    ).to.be.revertedWithCustomError(f.lending, "EvidenceBoundToOtherPosition");`
  },
  {
    num: "24",
    file: "24_MissingWitnessInEventB.test.ts",
    title: "Event B payload missing causal witness reference is rejected as INDETERMINATE",
    body: `    const evA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 0n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA24")),
      emitter: f.emitterSepolia,
      eventSig: f.defaultSig,
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

    const res = await f.relationEngine.classifyRelation(f.toPlainEvidence(evA), f.toPlainEvidence(evB), validWitness);
    expect(res.classification).to.equal(3);`
  },
  {
    num: "25",
    file: "25_UnregisteredEmitterAdmission.test.ts",
    title: "Unregistered emitter attempting evidence admission is rejected",
    body: `    const unapprovedEmitter = "0x9999999999999999999999999999999999999999";
    const encUnapproved = f.makeEncodedTx(1, unapprovedEmitter, f.defaultSig);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("root25")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s25")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await expect(
      f.registry.admitEvidence(1n, 100n, encUnapproved, proof, cont)
    ).to.be.revertedWithCustomError(f.registry, "SourceNotRegistered");`
  },
  {
    num: "26",
    file: "26_GuardDirectBypassAttack.test.ts",
    title: "Guard direct call with fabricated RelationResult is rejected because evaluateGuard is not public",
    body: `    expect((f.guard as any).evaluateGuard).to.be.undefined;

    const fakeSelector = ethers.id("evaluateGuard(uint256,(uint8,uint8,uint64,uint64,uint64,uint64,bytes32,bytes32,string),uint8)").slice(0, 10);
    const dummyCalldata = fakeSelector + "00".repeat(64);
    await expect(
      f.owner.sendTransaction({
        to: await f.guard.getAddress(),
        data: dummyCalldata
      })
    ).to.be.reverted;`
  },
  {
    num: "27",
    file: "27_VaultOwnerBypassAttack.test.ts",
    title: "Vault direct call to executeProtectedTransition by owner reverts with UnauthorizedCaller",
    body: `    await expect(
      f.vault.connect(f.owner).executeProtectedTransition(
        1001n,
        2,
        f.attacker.address,
        f.victim.address,
        ethers.parseEther("1")
      )
    ).to.be.revertedWithCustomError(f.vault, "UnauthorizedCaller");`
  }
];

attacks.forEach(att => {
  const filePath = path.join(attacksDir, att.file);
  const content = template(att.num, att.title, att.body);
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log("Successfully generated " + attacks.length + " attack vector test files in tests/attacks/");
