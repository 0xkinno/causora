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

describe("LendingPositionManager & CausoraVault Integration", function () {
  let mockProver: MockBlockProver;
  let registry: CausoraRegistry;
  let relationEngine: RelationEngine;
  let guard: CausoraGuard;
  let vault: CausoraVault;
  let ctUSD: MockERC20;
  let lending: LendingPositionManager;
  let owner: any;
  let borrower: any;
  let liquidator: any;
  let attacker: any;

  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const emitterSepolia = "0x1111111111111111111111111111111111111111";
  const emitterMainnet = "0x2222222222222222222222222222222222222222";
  const sigDeposit = ethers.keccak256(ethers.toUtf8Bytes("CollateralDeposited(uint256,address,uint256,uint64)"));
  const sigLiquidation = ethers.keccak256(ethers.toUtf8Bytes("LiquidationTriggered(uint256,address,uint256,bytes32)"));

  beforeEach(async function () {
    await setupPrecompiles();
    [owner, borrower, liquidator, attacker] = await ethers.getSigners();

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

    // Register sources with authentic event signatures
    await registry.registerSource(1n, emitterSepolia, 1, sigDeposit, "Sepolia Collateral");
    await registry.registerSource(3n, emitterMainnet, 2, sigLiquidation, "Mainnet Liquidation");
  });

  function makeSepoliaProof(positionId: bigint, amount: bigint) {
    const commonChunk = abiCoder.encode(
      ["uint64", "uint64", "address", "bool", "address", "uint256", "bytes"],
      [1n, 21000n, borrower.address, false, emitterSepolia, 0n, "0x"]
    );
    const receiptChunk = abiCoder.encode(
      ["uint8", "uint64", "tuple(address address_, bytes32[] topics, bytes data)[]", "bytes"],
      [
        1,
        21000n,
        [{ address_: emitterSepolia, topics: [sigDeposit], data: abiCoder.encode(["uint256"], [amount]) }],
        "0x"
      ]
    );
    const encodedTx = abiCoder.encode(["uint8", "bytes[]"], [2, [commonChunk, receiptChunk]]);
    const merkleProof = { root: ethers.keccak256(ethers.toUtf8Bytes("rootA" + positionId)), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s1")), isLeft: false }] };
    const continuityProof = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };
    return { encodedTx, merkleProof, continuityProof };
  }

  function makeMainnetProof(positionId: bigint, amount: bigint) {
    const commonChunk = abiCoder.encode(
      ["uint64", "uint64", "address", "bool", "address", "uint256", "bytes"],
      [3n, 21000n, liquidator.address, false, emitterMainnet, 0n, "0x"]
    );
    const receiptChunk = abiCoder.encode(
      ["uint8", "uint64", "tuple(address address_, bytes32[] topics, bytes data)[]", "bytes"],
      [
        1,
        21000n,
        [{ address_: emitterMainnet, topics: [sigLiquidation], data: abiCoder.encode(["uint256"], [amount]) }],
        "0x"
      ]
    );
    const encodedTx = abiCoder.encode(["uint8", "bytes[]"], [2, [commonChunk, receiptChunk]]);
    const merkleProof = { root: ethers.keccak256(ethers.toUtf8Bytes("rootB" + positionId)), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("s2")), isLeft: true }] };
    const continuityProof = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };
    return { encodedTx, merkleProof, continuityProof };
  }

  it("creates and retrieves a lending position with authorization checks", async function () {
    // Borrower creates own position
    await lending.connect(borrower).createPosition(101n, borrower.address, ethers.parseEther("10"), ethers.parseEther("5000"));
    const pos = await lending.getPosition(101n);
    expect(pos.positionId).to.equal(101n);
    expect(pos.borrower).to.equal(borrower.address);
    expect(pos.collateralAmount).to.equal(ethers.parseEther("10"));
    expect(pos.state).to.equal(1); // SAFE

    // Unauthorized non-borrower cannot create position on another's behalf
    await expect(
      lending.connect(attacker).createPosition(102n, borrower.address, ethers.parseEther("5"), ethers.parseEther("1000"))
    ).to.be.revertedWithCustomError(lending, "UnauthorizedCaller");
  });

  it("transitions position to HELD and locks CausoraVault on cross-chain race", async function () {
    const posId = 202n;
    const collateralAmt = ethers.parseEther("10");

    // Mint test collateral to borrower and deposit into vault
    await ctUSD.mint(borrower.address, collateralAmt);
    await ctUSD.connect(borrower).approve(await vault.getAddress(), collateralAmt);
    await vault.connect(borrower).depositCollateral(posId, collateralAmt);
    expect(await vault.lockedCollateral(posId)).to.equal(collateralAmt);
    expect(await vault.isHeld(posId)).to.equal(false);

    // Borrower creates position and evaluator marks at risk
    await lending.connect(borrower).createPosition(posId, borrower.address, collateralAmt, ethers.parseEther("8000"));
    await lending.markAtRisk(posId);

    // Admit proofs
    const pA = makeSepoliaProof(posId, ethers.parseEther("2"));
    await registry.admitEvidence(1n, 100n, pA.encodedTx, pA.merkleProof, pA.continuityProof);
    const qA = await registry.computeQueryId(1n, 100n, pA.merkleProof.root, pA.merkleProof.siblings);

    const pB = makeMainnetProof(posId, ethers.parseEther("8000"));
    await registry.admitEvidence(3n, 20000000n, pB.encodedTx, pB.merkleProof, pB.continuityProof);
    const qB = await registry.computeQueryId(3n, 20000000n, pB.merkleProof.root, pB.merkleProof.siblings);

    // Resolve race without causal witness -> fail-closed HOLD
    await lending.resolveCollateralRace(
      posId,
      qA,
      qB,
      CausalWitnessBuilder.empty(),
      ethers.parseEther("2"),
      liquidator.address
    );

    // Protocol state must be HELD
    const updatedPos = await lending.getPosition(posId);
    expect(updatedPos.state).to.equal(3); // HELD

    // Vault state must be held
    expect(await vault.isHeld(posId)).to.equal(true);

    // Direct call to vault must revert with UnauthorizedCaller
    await expect(
      vault.executeProtectedTransition(
        posId,
        2, // ALLOW_B
        liquidator.address,
        borrower.address,
        collateralAmt
      )
    ).to.be.revertedWithCustomError(vault, "UnauthorizedCaller");

    // Later liquidation call from positionManager on held position reverts with PositionIsHeld
    const lendingSigner = await ethers.getImpersonatedSigner(await lending.getAddress());
    await ethers.provider.send("hardhat_setBalance", [
      await lending.getAddress(),
      "0x1000000000000000000",
    ]);
    await expect(
      vault.connect(lendingSigner).executeProtectedTransition(
        posId,
        2, // ALLOW_B
        liquidator.address,
        borrower.address,
        collateralAmt
      )
    ).to.be.revertedWithCustomError(vault, "PositionIsHeld");
  });

  it("enforces multi-dimensional business-level replay protection", async function () {
    const posId = 303n;
    await lending.connect(borrower).createPosition(posId, borrower.address, ethers.parseEther("5"), ethers.parseEther("2000"));
    await lending.markAtRisk(posId);

    const pA = makeSepoliaProof(posId, ethers.parseEther("1"));
    await registry.admitEvidence(1n, 100n, pA.encodedTx, pA.merkleProof, pA.continuityProof);
    const qA = await registry.computeQueryId(1n, 100n, pA.merkleProof.root, pA.merkleProof.siblings);

    const pB = makeMainnetProof(posId, ethers.parseEther("2000"));
    await registry.admitEvidence(3n, 20000000n, pB.encodedTx, pB.merkleProof, pB.continuityProof);
    const qB = await registry.computeQueryId(3n, 20000000n, pB.merkleProof.root, pB.merkleProof.siblings);

    // First execution succeeds -> transitions to HELD
    await lending.resolveCollateralRace(
      posId,
      qA,
      qB,
      CausalWitnessBuilder.empty(),
      ethers.parseEther("1"),
      liquidator.address
    );

    // Dimension 1: Same position, same evidence -> BusinessActionAlreadyConsumed
    await expect(
      lending.resolveCollateralRace(
        posId,
        qA,
        qB,
        CausalWitnessBuilder.empty(),
        ethers.parseEther("1"),
        liquidator.address
      )
    ).to.be.revertedWithCustomError(lending, "BusinessActionAlreadyConsumed");

    // Dimension 2: Cross-position evidence binding reuse
    const posId2 = 304n;
    await lending.connect(borrower).createPosition(posId2, borrower.address, ethers.parseEther("5"), ethers.parseEther("2000"));
    await lending.markAtRisk(posId2);

    // Reusing qA on another position MUST revert with EvidenceBoundToOtherPosition
    await expect(
      lending.resolveCollateralRace(
        posId2,
        qA,
        qB,
        CausalWitnessBuilder.empty(),
        ethers.parseEther("1"),
        liquidator.address
      )
    ).to.be.revertedWithCustomError(lending, "EvidenceBoundToOtherPosition");
  });

  it("ALLOW_B produces real ERC20 transfer to liquidator and updates Vault accounting", async function () {
    const posId = 404n;
    const collateralAmt = ethers.parseEther("10");

    // Deposit collateral into vault
    await ctUSD.mint(borrower.address, collateralAmt);
    await ctUSD.connect(borrower).approve(await vault.getAddress(), collateralAmt);
    await vault.connect(borrower).depositCollateral(posId, collateralAmt);

    expect(await vault.lockedCollateral(posId)).to.equal(collateralAmt);
    expect(await ctUSD.balanceOf(await vault.getAddress())).to.equal(collateralAmt);

    // Position on same chain where liquidation event is PROVABLY earlier
    await lending.connect(borrower).createPosition(posId, borrower.address, collateralAmt, ethers.parseEther("5000"));
    await lending.markAtRisk(posId);

    // Sepolia event at height 200
    const pRescue = makeSepoliaProof(posId, ethers.parseEther("1"));
    await registry.admitEvidence(1n, 200n, pRescue.encodedTx, pRescue.merkleProof, pRescue.continuityProof);
    const qRescue = await registry.computeQueryId(1n, 200n, pRescue.merkleProof.root, pRescue.merkleProof.siblings);

    // Sepolia liquidation event at height 100 (EARLIER on same chain!)
    const commonChunk = abiCoder.encode(
      ["uint64", "uint64", "address", "bool", "address", "uint256", "bytes"],
      [1n, 21000n, liquidator.address, false, emitterSepolia, 0n, "0x"]
    );
    const receiptChunk = abiCoder.encode(
      ["uint8", "uint64", "tuple(address address_, bytes32[] topics, bytes data)[]", "bytes"],
      [
        1,
        21000n,
        [{ address_: emitterSepolia, topics: [sigDeposit], data: abiCoder.encode(["uint256"], [ethers.parseEther("5000")]) }],
        "0x"
      ]
    );
    const encLiq = abiCoder.encode(["uint8", "bytes[]"], [2, [commonChunk, receiptChunk]]);
    const proofLiq = { root: ethers.keccak256(ethers.toUtf8Bytes("rootLiqEarly")), siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sLiq")), isLeft: true }] };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await registry.admitEvidence(1n, 100n, encLiq, proofLiq, cont);
    const qLiq = await registry.computeQueryId(1n, 100n, proofLiq.root, proofLiq.siblings);

    const initialLiquidatorBalance = await ctUSD.balanceOf(liquidator.address);
    const initialVaultBalance = await ctUSD.balanceOf(await vault.getAddress());

    // Resolve race: Rescue (height 200) vs Liq (height 100) -> ALLOW_B (provably first B)
    const tx = await lending.resolveCollateralRace(
      posId,
      qRescue,
      qLiq,
      CausalWitnessBuilder.empty(),
      ethers.parseEther("1"),
      liquidator.address
    );

    await expect(tx)
      .to.emit(vault, "VaultCollateralReleased")
      .withArgs(posId, liquidator.address, collateralAmt);

    const finalLiquidatorBalance = await ctUSD.balanceOf(liquidator.address);
    const finalVaultBalance = await ctUSD.balanceOf(await vault.getAddress());

    expect(finalLiquidatorBalance - initialLiquidatorBalance).to.equal(collateralAmt);
    expect(initialVaultBalance - finalVaultBalance).to.equal(collateralAmt);
    expect(await vault.lockedCollateral(posId)).to.equal(0n);

    const pos = await lending.getPosition(posId);
    expect(pos.state).to.equal(5); // LIQUIDATED
  });
});
