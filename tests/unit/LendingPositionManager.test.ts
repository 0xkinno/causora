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

describe("LendingPositionManager", function () {
  let mockProver: MockBlockProver;
  let registry: CausoraRegistry;
  let relationEngine: RelationEngine;
  let guard: CausoraGuard;
  let lending: LendingPositionManager;
  let owner: any;
  let borrower: any;
  let liquidator: any;

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
  });

  it("creates and retrieves a lending position", async function () {
    await lending.createPosition(101n, borrower.address, ethers.parseEther("10"), ethers.parseEther("5000"));
    const pos = await lending.getPosition(101n);
    expect(pos.positionId).to.equal(101n);
    expect(pos.borrower).to.equal(borrower.address);
    expect(pos.collateralAmount).to.equal(ethers.parseEther("10"));
    expect(pos.state).to.equal(1); // SAFE
  });

  it("transitions position to HELD on unprovable cross-chain race", async function () {
    await lending.createPosition(202n, borrower.address, ethers.parseEther("10"), ethers.parseEther("8000"));
    await lending.markAtRisk(202n);

    // Register test sources
    const emitterA = "0x1111111111111111111111111111111111111111";
    const emitterB = "0x2222222222222222222222222222222222222222";
    await registry.registerSource(1n, emitterA, 1, "Sepolia Collateral");
    await registry.registerSource(3n, emitterB, 2, "Mainnet Liquidation");

    // Admit Evidence A (Sepolia Rescue)
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const commonChunk = abiCoder.encode(
      ["uint64", "uint64", "address", "bool", "address", "uint256", "bytes"],
      [1n, 21000n, borrower.address, false, emitterA, 0n, "0x"]
    );
    const receiptChunkA = abiCoder.encode(
      ["uint8", "uint64", "tuple(address address_, bytes32[] topics, bytes data)[]", "bytes"],
      [
        1,
        21000n,
        [{ address_: emitterA, topics: [ethers.keccak256(ethers.toUtf8Bytes("CollateralDeposited(uint256,address,uint256,uint64)"))], data: abiCoder.encode(["uint256"], [ethers.parseEther("2")]) }],
        "0x"
      ]
    );
    const encodedTxA = abiCoder.encode(["uint8", "bytes[]"], [2, [commonChunk, receiptChunkA]]);
    const merkleProofA = { root: ethers.keccak256(ethers.toUtf8Bytes("rootA")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sib1")), isLeft: false }] };
    const continuityProofA = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    const txA = await registry.admitEvidence(1n, 100n, encodedTxA, merkleProofA, continuityProofA);
    const rcA = await txA.wait();
    const queryIdA = await registry.computeQueryId(1n, 100n, merkleProofA.root, merkleProofA.siblings);

    // Admit Evidence B (Mainnet Liquidation)
    const receiptChunkB = abiCoder.encode(
      ["uint8", "uint64", "tuple(address address_, bytes32[] topics, bytes data)[]", "bytes"],
      [
        1,
        21000n,
        [{ address_: emitterB, topics: [ethers.keccak256(ethers.toUtf8Bytes("LiquidationTriggered(uint256,address,uint256,bytes32)"))], data: abiCoder.encode(["uint256"], [ethers.parseEther("8000")]) }],
        "0x"
      ]
    );
    const encodedTxB = abiCoder.encode(["uint8", "bytes[]"], [2, [commonChunk, receiptChunkB]]);
    const merkleProofB = { root: ethers.keccak256(ethers.toUtf8Bytes("rootB")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sib2")), isLeft: true }] };
    const continuityProofB = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(3n, 20000000n, encodedTxB, merkleProofB, continuityProofB);
    const queryIdB = await registry.computeQueryId(3n, 20000000n, merkleProofB.root, merkleProofB.siblings);

    // Execute race resolution with empty causal witness -> Expect HELD
    const emptyWitness = CausalWitnessBuilder.empty();
    await lending.resolveCollateralRace(
      202n,
      queryIdA,
      queryIdB,
      emptyWitness,
      ethers.parseEther("2"),
      liquidator.address
    );

    const updatedPos = await lending.getPosition(202n);
    expect(updatedPos.state).to.equal(3); // HELD state!
  });
});
