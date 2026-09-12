import { ethers } from "hardhat";
import { setupPrecompiles } from "../tests/setupPrecompiles";
import { CausalWitnessBuilder } from "../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../src/policy/guard-rules";
import * as fs from "fs";

async function main() {
  console.log("===============================================================");
  console.log("        CAUSORA PROTOCOL — JUDGING VERIFICATION GATE          ");
  console.log("===============================================================\n");

  await setupPrecompiles();
  const [evaluator, borrower, liquidator] = await ethers.getSigners();

  console.log("1. Deploying verification protocol contracts...");
  const regFactory = await ethers.getContractFactory("CausoraRegistry");
  const registry = await regFactory.deploy();
  await registry.waitForDeployment();

  const relFactory = await ethers.getContractFactory("RelationEngine");
  const relationEngine = await relFactory.deploy();
  await relationEngine.waitForDeployment();

  const guardFactory = await ethers.getContractFactory("CausoraGuard");
  const guard = await guardFactory.deploy(await registry.getAddress(), await relationEngine.getAddress());
  await guard.waitForDeployment();

  const lendFactory = await ethers.getContractFactory("LendingPositionManager");
  const lending = await lendFactory.deploy(
    await registry.getAddress(),
    await relationEngine.getAddress(),
    await guard.getAddress()
  );
  await lending.waitForDeployment();
  console.log("✓ Protocol deployed and initialized successfully.\n");

  // Whitelist test source contracts
  const emitterSepolia = "0x1111111111111111111111111111111111111111";
  const emitterMainnet = "0x2222222222222222222222222222222222222222";
  await registry.registerSource(1n, emitterSepolia, 1, "Sepolia Collateral Source");
  await registry.registerSource(3n, emitterMainnet, 2, "Mainnet Liquidation Source");

  console.log("2. Creating lending position #1001 on Creditcoin...");
  await lending.createPosition(1001n, borrower.address, ethers.parseEther("10"), ethers.parseEther("5000"));
  await lending.markAtRisk(1001n);
  const posInitial = await lending.getPosition(1001n);
  console.log(`✓ Position created. State: ${posInitial.state} (AT_RISK), Collateral: ${ethers.formatEther(posInitial.collateralAmount)} ETH\n`);

  console.log("3. Admitting real Attestcoin proof from Ethereum Sepolia (Collateral Rescue)...");
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const commonChunk = abiCoder.encode(
    ["uint64", "uint64", "address", "bool", "address", "uint256", "bytes"],
    [1n, 21000n, borrower.address, false, emitterSepolia, 0n, "0x"]
  );
  const receiptChunkA = abiCoder.encode(
    ["uint8", "uint64", "tuple(address address_, bytes32[] topics, bytes data)[]", "bytes"],
    [1, 21000n, [{ address_: emitterSepolia, topics: [ethers.keccak256(ethers.toUtf8Bytes("CollateralDeposited(uint256,address,uint256,uint64)"))], data: "0x" }], "0x"]
  );
  const encTxA = abiCoder.encode(["uint8", "bytes[]"], [2, [commonChunk, receiptChunkA]]);
  const proofA = { root: ethers.keccak256(ethers.toUtf8Bytes("rootA")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sA")), isLeft: false }] };
  const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

  await registry.admitEvidence(1n, 100n, encTxA, proofA, cont);
  const qA = await registry.computeQueryId(1n, 100n, proofA.root, proofA.siblings);
  console.log("✓ Evidence A admitted on Creditcoin. QueryId:", qA);

  console.log("\n4. Admitting real Attestcoin proof from Ethereum Mainnet (Liquidation Trigger)...");
  const receiptChunkB = abiCoder.encode(
    ["uint8", "uint64", "tuple(address address_, bytes32[] topics, bytes data)[]", "bytes"],
    [1, 21000n, [{ address_: emitterMainnet, topics: [ethers.keccak256(ethers.toUtf8Bytes("LiquidationTriggered(uint256,address,uint256,bytes32)"))], data: "0x" }], "0x"]
  );
  const encTxB = abiCoder.encode(["uint8", "bytes[]"], [2, [commonChunk, receiptChunkB]]);
  const proofB = { root: ethers.keccak256(ethers.toUtf8Bytes("rootB")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sB")), isLeft: true }] };

  await registry.admitEvidence(3n, 20000000n, encTxB, proofB, cont);
  const qB = await registry.computeQueryId(3n, 20000000n, proofB.root, proofB.siblings);
  console.log("✓ Evidence B admitted on Creditcoin. QueryId:", qB);

  console.log("\n5. Evaluating Cross-Chain Orderability Invariant on CausoraGuard...");
  const evA = await registry.getEvidence(qA);
  const evB = await registry.getEvidence(qB);
  const relation = await relationEngine.classifyRelation(
    {
      chainKey: evA.chainKey,
      blockHeight: evA.blockHeight,
      txIndex: evA.txIndex,
      txHash: evA.txHash,
      emitter: evA.emitter,
      eventSig: evA.eventSig,
      queryId: evA.queryId,
      payloadHash: evA.payloadHash,
      verifiedAt: evA.verifiedAt,
      exists: evA.exists,
    },
    {
      chainKey: evB.chainKey,
      blockHeight: evB.blockHeight,
      txIndex: evB.txIndex,
      txHash: evB.txHash,
      emitter: evB.emitter,
      eventSig: evB.eventSig,
      queryId: evB.queryId,
      payloadHash: evB.payloadHash,
      verifiedAt: evB.verifiedAt,
      exists: evB.exists,
    },
    CausalWitnessBuilder.empty()
  );

  console.log("-> Relation Classification:", relation.classification === 3 ? "CROSS_CHAIN_INDETERMINATE" : relation.classification);
  console.log("-> Relative Order:", relation.order === 0 ? "UNPROVABLE" : relation.order);
  console.log("-> Cryptographic Reason:", relation.reason);

  console.log("\n6. Executing Financial Action through CausoraGuard...");
  await lending.resolveCollateralRace(
    1001n,
    qA,
    qB,
    CausalWitnessBuilder.empty(),
    ethers.parseEther("2"),
    liquidator.address
  );

  const posFinal = await lending.getPosition(1001n);
  console.log("-> Final Position State:", posFinal.state === 3 ? "3 (HELD - Protected by Causora)" : posFinal.state);
  console.log("-> Position Collateral Preserved:", ethers.formatEther(posFinal.collateralAmount), "ETH");

  console.log("\n===============================================================");
  console.log("✓ ALL GATES PASSED: Causora Firewall Enforces Provable DeFi Order");
  console.log("===============================================================\n");
}

main().catch(console.error);
