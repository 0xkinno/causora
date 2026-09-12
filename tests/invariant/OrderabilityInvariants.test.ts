import { setupPrecompiles } from "../setupPrecompiles";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  CausoraRegistry,
  RelationEngine,
  CausoraGuard,
  LendingPositionManager,
  MockBlockProver
} from "../../typechain-types";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";

describe("Orderability Invariants Suite", function () {
  let mockProver: MockBlockProver;
  let registry: CausoraRegistry;
  let relationEngine: RelationEngine;
  let guard: CausoraGuard;
  let lending: LendingPositionManager;
  let owner: any;
  let borrower: any;
  let liquidator: any;
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const emitterSepolia = "0x1111111111111111111111111111111111111111";

  beforeEach(async function () {
    await setupPrecompiles();
    [owner, borrower, liquidator] = await ethers.getSigners();

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

    const lendFactory = await ethers.getContractFactory("LendingPositionManager");
    lending = await lendFactory.deploy(
      await registry.getAddress(),
      await relationEngine.getAddress(),
      await guard.getAddress()
    );
    await lending.waitForDeployment();

    await registry.registerSource(1n, emitterSepolia, 1, "Sepolia Collateral");
  });

  it("Invariant 1: State preservation - position capital is never liquidated on INDETERMINATE", async function () {
    const posId = 777n;
    const initialCollateral = ethers.parseEther("100");
    await lending.createPosition(posId, borrower.address, initialCollateral, ethers.parseEther("50000"));
    await lending.markAtRisk(posId);

    // Create fake indeterminate query evidence
    const commonChunk = abiCoder.encode(
      ["uint64", "uint64", "address", "bool", "address", "uint256", "bytes"],
      [1n, 21000n, borrower.address, false, emitterSepolia, 0n, "0x"]
    );
    const receiptChunk = abiCoder.encode(
      ["uint8", "uint64", "tuple(address address_, bytes32[] topics, bytes data)[]", "bytes"],
      [1, 21000n, [{ address_: emitterSepolia, topics: [ethers.keccak256(ethers.toUtf8Bytes("Event()"))], data: "0x" }], "0x"]
    );
    const encTx = abiCoder.encode(["uint8", "bytes[]"], [2, [commonChunk, receiptChunk]]);
    const proof1 = { root: ethers.keccak256(ethers.toUtf8Bytes("r1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const proof2 = { root: ethers.keccak256(ethers.toUtf8Bytes("r2")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(1n, 100n, encTx, proof1, cont);
    await registry.registerSource(3n, emitterSepolia, 2, "Mainnet");
    await registry.admitEvidence(3n, 100n, encTx, proof2, cont);

    const q1 = await registry.computeQueryId(1n, 100n, proof1.root, proof1.siblings);
    const q2 = await registry.computeQueryId(3n, 100n, proof2.root, proof2.siblings);

    await lending.resolveCollateralRace(
      posId,
      q1,
      q2,
      CausalWitnessBuilder.empty(),
      ethers.parseEther("10"),
      liquidator.address
    );

    const pos = await lending.getPosition(posId);
    expect(pos.state).to.equal(3); // HELD (Protected)
    expect(pos.collateralAmount).to.equal(initialCollateral); // Collateral untouched!
  });

  it("Invariant 2: Deterministic replay protection - queryId can only be consumed once", async function () {
    const commonChunk = abiCoder.encode(
      ["uint64", "uint64", "address", "bool", "address", "uint256", "bytes"],
      [1n, 21000n, borrower.address, false, emitterSepolia, 0n, "0x"]
    );
    const receiptChunk = abiCoder.encode(
      ["uint8", "uint64", "tuple(address address_, bytes32[] topics, bytes data)[]", "bytes"],
      [1, 21000n, [{ address_: emitterSepolia, topics: [ethers.keccak256(ethers.toUtf8Bytes("Event()"))], data: "0x" }], "0x"]
    );
    const encTx = abiCoder.encode(["uint8", "bytes[]"], [2, [commonChunk, receiptChunk]]);
    const proof = { root: ethers.keccak256(ethers.toUtf8Bytes("r1")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(1n, 100n, encTx, proof, cont);
    const q = await registry.computeQueryId(1n, 100n, proof.root, proof.siblings);
    expect(await registry.hasProcessedQuery(q)).to.be.true;

    await expect(registry.admitEvidence(1n, 100n, encTx, proof, cont)).to.be.revertedWithCustomError(
      registry,
      "QueryAlreadyProcessed"
    );
  });
});
