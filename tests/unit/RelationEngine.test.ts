import { expect } from "chai";
import { ethers } from "hardhat";
import { RelationEngine } from "../../typechain-types";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";

describe("RelationEngine", function () {
  let relationEngine: RelationEngine;

  beforeEach(async function () {
    const factory = await ethers.getContractFactory("RelationEngine");
    relationEngine = await factory.deploy();
    await relationEngine.waitForDeployment();
  });

  it("classifies same-chain events by block height (PROVABLY_FIRST_A)", async function () {
    const evidenceA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 5n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: "0x1111111111111111111111111111111111111111",
      eventSig: ethers.keccak256(ethers.toUtf8Bytes("EventA()")),
      queryId: ethers.keccak256(ethers.toUtf8Bytes("queryA")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("payloadA")),
      verifiedAt: 1000n,
      exists: true,
    };

    const evidenceB = {
      ...evidenceA,
      blockHeight: 105n,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("queryB")),
    };

    const emptyWitness = CausalWitnessBuilder.empty();
    const result = await relationEngine.classifyRelation(evidenceA, evidenceB, emptyWitness);

    expect(result.classification).to.equal(1); // SAME_CHAIN_ORDER
    expect(result.order).to.equal(1); // PROVABLY_FIRST_A
  });

  it("classifies same-chain events in the same block by txIndex (PROVABLY_FIRST_B)", async function () {
    const evidenceA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 12n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: "0x1111111111111111111111111111111111111111",
      eventSig: ethers.keccak256(ethers.toUtf8Bytes("EventA()")),
      queryId: ethers.keccak256(ethers.toUtf8Bytes("queryA")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("payloadA")),
      verifiedAt: 1000n,
      exists: true,
    };

    const evidenceB = {
      ...evidenceA,
      txIndex: 4n,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("queryB")),
    };

    const emptyWitness = CausalWitnessBuilder.empty();
    const result = await relationEngine.classifyRelation(evidenceA, evidenceB, emptyWitness);

    expect(result.classification).to.equal(1); // SAME_CHAIN_ORDER
    expect(result.order).to.equal(2); // PROVABLY_FIRST_B
  });

  it("returns CROSS_CHAIN_INDETERMINATE when independent chains lack a causal witness", async function () {
    const evidenceA = {
      chainKey: 1n, // Sepolia
      blockHeight: 100n,
      txIndex: 1n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: "0x1111111111111111111111111111111111111111",
      eventSig: ethers.keccak256(ethers.toUtf8Bytes("Collateral()")),
      queryId: ethers.keccak256(ethers.toUtf8Bytes("queryA")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("payloadA")),
      verifiedAt: 1000n,
      exists: true,
    };

    const evidenceB = {
      chainKey: 3n, // Mainnet
      blockHeight: 20000000n,
      txIndex: 10n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txB")),
      emitter: "0x2222222222222222222222222222222222222222",
      eventSig: ethers.keccak256(ethers.toUtf8Bytes("Liquidation()")),
      queryId: ethers.keccak256(ethers.toUtf8Bytes("queryB")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("payloadB")),
      verifiedAt: 1000n,
      exists: true,
    };

    const emptyWitness = CausalWitnessBuilder.empty();
    const result = await relationEngine.classifyRelation(evidenceA, evidenceB, emptyWitness);

    expect(result.classification).to.equal(3); // CROSS_CHAIN_INDETERMINATE
    expect(result.order).to.equal(0); // UNPROVABLE
    expect(result.reason).to.include("unprovable");
  });

  it("classifies as CROSS_CHAIN_CAUSAL when Event B cryptographically commits to Event A witness", async function () {
    const payloadA = ethers.keccak256(ethers.toUtf8Bytes("depositData"));
    const queryA = ethers.keccak256(ethers.toUtf8Bytes("queryA"));

    const evidenceA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 1n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: "0x1111111111111111111111111111111111111111",
      eventSig: ethers.keccak256(ethers.toUtf8Bytes("Collateral()")),
      queryId: queryA,
      payloadHash: payloadA,
      verifiedAt: 1000n,
      exists: true,
    };

    const witness = CausalWitnessBuilder.createWitness(1, 100, queryA, payloadA, 1);
    const consumption = CausalWitnessBuilder.createConsumptionPayload(witness);

    const evidenceB = {
      chainKey: 3n,
      blockHeight: 20000000n,
      txIndex: 10n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txB")),
      emitter: "0x2222222222222222222222222222222222222222",
      eventSig: consumption.eventSig,
      queryId: ethers.keccak256(ethers.toUtf8Bytes("queryB")),
      payloadHash: consumption.payloadHash,
      verifiedAt: 1000n,
      exists: true,
    };

    const result = await relationEngine.classifyRelation(evidenceA, evidenceB, witness);

    expect(result.classification).to.equal(2); // CROSS_CHAIN_CAUSAL
    expect(result.order).to.equal(1); // PROVABLY_FIRST_A
  });

  it("fails-closed to CROSS_CHAIN_INDETERMINATE if Event B payload does not commit to witness", async function () {
    const payloadA = ethers.keccak256(ethers.toUtf8Bytes("depositData"));
    const queryA = ethers.keccak256(ethers.toUtf8Bytes("queryA"));

    const evidenceA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 1n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txA")),
      emitter: "0x1111111111111111111111111111111111111111",
      eventSig: ethers.keccak256(ethers.toUtf8Bytes("Collateral()")),
      queryId: queryA,
      payloadHash: payloadA,
      verifiedAt: 1000n,
      exists: true,
    };

    const witness = CausalWitnessBuilder.createWitness(1, 100, queryA, payloadA, 1);

    // Event B has unrelated payload
    const evidenceB = {
      chainKey: 3n,
      blockHeight: 20000000n,
      txIndex: 10n,
      txHash: ethers.keccak256(ethers.toUtf8Bytes("txB")),
      emitter: "0x2222222222222222222222222222222222222222",
      eventSig: ethers.keccak256(ethers.toUtf8Bytes("CausalityConsumed(bytes32,bytes32,uint64,bytes32)")),
      queryId: ethers.keccak256(ethers.toUtf8Bytes("queryB")),
      payloadHash: ethers.keccak256(ethers.toUtf8Bytes("unrelatedPayload")),
      verifiedAt: 1000n,
      exists: true,
    };

    const result = await relationEngine.classifyRelation(evidenceA, evidenceB, witness);

    expect(result.classification).to.equal(3); // CROSS_CHAIN_INDETERMINATE
    expect(result.order).to.equal(0); // UNPROVABLE
  });

  it("returns INVALID when an evidence record does not exist", async function () {
    const evidenceA = {
      chainKey: 1n,
      blockHeight: 100n,
      txIndex: 1n,
      txHash: ethers.ZeroHash,
      emitter: ethers.ZeroAddress,
      eventSig: ethers.ZeroHash,
      queryId: ethers.ZeroHash,
      payloadHash: ethers.ZeroHash,
      verifiedAt: 0n,
      exists: false,
    };

    const evidenceB = { ...evidenceA, exists: true };
    const emptyWitness = CausalWitnessBuilder.empty();
    const result = await relationEngine.classifyRelation(evidenceA, evidenceB, emptyWitness);

    expect(result.classification).to.equal(0); // INVALID
  });
});
