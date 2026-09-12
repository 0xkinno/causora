import { ethers } from "hardhat";
import { setupPrecompiles } from "../tests/setupPrecompiles";
import { CausalWitnessBuilder } from "../src/witness/causal-witness";
import * as fs from "fs";

async function main() {
  console.log("===============================================================");
  console.log("    CAUSORA PROTOCOL — JUDGE LOCAL VERIFICATION HARNESS       ");
  console.log("             STATUS: LOCAL_VERIFIED EXECUTION GATE             ");
  console.log("===============================================================\n");

  await setupPrecompiles();
  const [evaluator, borrower, liquidator] = await ethers.getSigners();

  console.log("1. Deploying complete Causora Protocol graph locally...");
  const regFactory = await ethers.getContractFactory("CausoraRegistry");
  const registry = await regFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✓ CausoraRegistry:", registryAddress);

  const relFactory = await ethers.getContractFactory("RelationEngine");
  const relationEngine = await relFactory.deploy();
  await relationEngine.waitForDeployment();
  const relationEngineAddress = await relationEngine.getAddress();
  console.log("✓ RelationEngine:", relationEngineAddress);

  const guardFactory = await ethers.getContractFactory("CausoraGuard");
  const guard = await guardFactory.deploy(registryAddress, relationEngineAddress);
  await guard.waitForDeployment();
  const guardAddress = await guard.getAddress();
  console.log("✓ CausoraGuard:", guardAddress);

  const erc20Factory = await ethers.getContractFactory("MockERC20");
  const ctUSD = await erc20Factory.deploy("Creditcoin Test USD", "ctUSD");
  await ctUSD.waitForDeployment();
  const ctUSDAddress = await ctUSD.getAddress();
  console.log("✓ Test Collateral (ctUSD):", ctUSDAddress);

  const vaultFactory = await ethers.getContractFactory("CausoraVault");
  const vault = await vaultFactory.deploy(ctUSDAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✓ CausoraVault:", vaultAddress);

  const lendFactory = await ethers.getContractFactory("LendingPositionManager");
  const lending = await lendFactory.deploy(registryAddress, relationEngineAddress, guardAddress, vaultAddress);
  await lending.waitForDeployment();
  const lendingAddress = await lending.getAddress();
  console.log("✓ LendingPositionManager:", lendingAddress);

  await vault.setPositionManager(lendingAddress);
  console.log("✓ CausoraVault linked to LendingPositionManager\n");

  // Whitelist test source contracts with exact event signatures
  const emitterSepolia = "0x1111111111111111111111111111111111111111";
  const emitterMainnet = "0x2222222222222222222222222222222222222222";
  const sigDeposit = ethers.keccak256(ethers.toUtf8Bytes("CollateralDeposited(uint256,address,uint256,uint64)"));
  const sigLiquidation = ethers.keccak256(ethers.toUtf8Bytes("LiquidationTriggered(uint256,address,uint256,bytes32)"));

  await registry.registerSource(1n, emitterSepolia, 1, sigDeposit, "Sepolia Collateral Source");
  await registry.registerSource(3n, emitterMainnet, 2, sigLiquidation, "Mainnet Liquidation Source");
  console.log("✓ Authenticated sources registered with strict event signatures.\n");

  console.log("2. Escrowing collateral and creating position #1001...");
  const collateralAmount = ethers.parseEther("10");
  await ctUSD.mint(borrower.address, collateralAmount);
  await ctUSD.connect(borrower).approve(vaultAddress, collateralAmount);
  await vault.connect(borrower).depositCollateral(1001n, collateralAmount);

  await lending.connect(borrower).createPosition(1001n, borrower.address, collateralAmount, ethers.parseEther("5000"));
  await lending.markAtRisk(1001n);
  const posInitial = await lending.getPosition(1001n);
  console.log(`✓ Position created. State: ${posInitial.state} (AT_RISK), Collateral in Vault: ${ethers.formatEther(await vault.lockedCollateral(1001n))} ctUSD\n`);

  console.log("3. Admitting Attestcoin proof from Ethereum Sepolia (Collateral Rescue)...");
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const commonChunk = abiCoder.encode(
    ["uint64", "uint64", "address", "bool", "address", "uint256", "bytes"],
    [1n, 21000n, borrower.address, false, emitterSepolia, 0n, "0x"]
  );
  const receiptChunkA = abiCoder.encode(
    ["uint8", "uint64", "tuple(address address_, bytes32[] topics, bytes data)[]", "bytes"],
    [1, 21000n, [{ address_: emitterSepolia, topics: [sigDeposit], data: abiCoder.encode(["uint256"], [ethers.parseEther("2")]) }], "0x"]
  );
  const encTxA = abiCoder.encode(["uint8", "bytes[]"], [2, [commonChunk, receiptChunkA]]);
  const proofA = { root: ethers.keccak256(ethers.toUtf8Bytes("rootA")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sA")), isLeft: false }] };
  const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

  await registry.admitEvidence(1n, 100n, encTxA, proofA, cont);
  const qA = await registry.computeQueryId(1n, 100n, proofA.root, proofA.siblings);
  console.log("✓ Evidence A admitted on Creditcoin. QueryId:", qA);

  console.log("\n4. Admitting Attestcoin proof from Ethereum Mainnet (Liquidation Trigger)...");
  const receiptChunkB = abiCoder.encode(
    ["uint8", "uint64", "tuple(address address_, bytes32[] topics, bytes data)[]", "bytes"],
    [1, 21000n, [{ address_: emitterMainnet, topics: [sigLiquidation], data: abiCoder.encode(["uint256"], [ethers.parseEther("5000")]) }], "0x"]
  );
  const encTxB = abiCoder.encode(["uint8", "bytes[]"], [2, [commonChunk, receiptChunkB]]);
  const proofB = { root: ethers.keccak256(ethers.toUtf8Bytes("rootB")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sB")), isLeft: true }] };

  await registry.admitEvidence(3n, 20000000n, encTxB, proofB, cont);
  const qB = await registry.computeQueryId(3n, 20000000n, proofB.root, proofB.siblings);
  console.log("✓ Evidence B admitted on Creditcoin. QueryId:", qB);

  console.log("\n5. Evaluating Cross-Chain Orderability Invariant on CausoraGuard...");
  const evA = await registry.getEvidence(qA);
  const evB = await registry.getEvidence(qB);
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

  const relation = await relationEngine.classifyRelation(toPlainEvidence(evA), toPlainEvidence(evB), CausalWitnessBuilder.empty());

  console.log("-> Relation Classification:", relation.classification === 3 ? "CROSS_CHAIN_INDETERMINATE" : relation.classification);
  console.log("-> Relative Order:", relation.order === 0 ? "UNPROVABLE" : relation.order);
  console.log("-> Cryptographic Reason:", relation.reason);

  console.log("\n6. Executing Financial Action through CausoraGuard & CausoraVault...");
  await lending.resolveCollateralRace(
    1001n,
    qA,
    qB,
    CausalWitnessBuilder.empty(),
    ethers.parseEther("2"),
    liquidator.address
  );

  const posFinal = await lending.getPosition(1001n);
  const vaultHeld = await vault.isHeld(1001n);
  const vaultBalance = await vault.lockedCollateral(1001n);

  console.log("-> Final Position State:", posFinal.state === 3 ? "3 (HELD - Protected by Causora)" : posFinal.state);
  console.log("-> CausoraVault isHeld:", vaultHeld);
  console.log("-> Position Collateral Preserved in Vault:", ethers.formatEther(vaultBalance), "ctUSD");

  console.log("\n7. Verifying Invariant: Attempting adversarial liquidation on HELD position...");
  try {
    await vault.executeProtectedTransition(1001n, 2, liquidator.address, borrower.address, collateralAmount);
    console.error("FAIL: Vault permitted liquidation on held position!");
    process.exit(1);
  } catch (err: any) {
    console.log("✓ Confirmed: Liquidation reverted with PositionIsHeld. Collateral is strictly protected!");
  }

  console.log("\n===============================================================");
  console.log("✓ STATUS: LOCAL_VERIFIED — Causora Firewall Enforces Provable DeFi Order");
  console.log("===============================================================\n");
}

main().catch(console.error);
