import { setupPrecompiles } from "./setupPrecompiles";
import { ethers } from "hardhat";
import {
  CausoraRegistry,
  RelationEngine,
  CausoraGuard,
  LendingPositionManager,
  CausoraVault,
  MockERC20,
  MockBlockProver
} from "../typechain-types";

export interface AttackFixture {
  mockProver: MockBlockProver;
  registry: CausoraRegistry;
  relationEngine: RelationEngine;
  guard: CausoraGuard;
  vault: CausoraVault;
  ctUSD: MockERC20;
  lending: LendingPositionManager;
  owner: any;
  attacker: any;
  victim: any;
  emitterSepolia: string;
  emitterMainnet: string;
  defaultSig: string;
  abiCoder: ethers.AbiCoder;
  toPlainEvidence: (ev: any) => any;
  makeEncodedTx: (status: number, emitter: string, logSig: string, data?: string) => string;
}

export async function setupAttackFixture(): Promise<AttackFixture> {
  await setupPrecompiles();
  const [owner, attacker, victim] = await ethers.getSigners();
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const emitterSepolia = "0x1111111111111111111111111111111111111111";
  const emitterMainnet = "0x2222222222222222222222222222222222222222";
  const defaultSig = ethers.keccak256(ethers.toUtf8Bytes("TestEvent()"));

  const proverFactory = await ethers.getContractFactory("MockBlockProver");
  const mockProver = await proverFactory.deploy();
  await mockProver.waitForDeployment();

  const regFactory = await ethers.getContractFactory("CausoraRegistry");
  const registry = await regFactory.deploy();
  await registry.waitForDeployment();

  const relFactory = await ethers.getContractFactory("RelationEngine");
  const relationEngine = await relFactory.deploy();
  await relationEngine.waitForDeployment();

  const guardFactory = await ethers.getContractFactory("CausoraGuard");
  const guard = await guardFactory.deploy(await registry.getAddress(), await relationEngine.getAddress());
  await guard.waitForDeployment();

  const erc20Factory = await ethers.getContractFactory("MockERC20");
  const ctUSD = await erc20Factory.deploy("Creditcoin Test USD", "ctUSD");
  await ctUSD.waitForDeployment();

  const vaultFactory = await ethers.getContractFactory("CausoraVault");
  const vault = await vaultFactory.deploy(await ctUSD.getAddress());
  await vault.waitForDeployment();

  const lendFactory = await ethers.getContractFactory("LendingPositionManager");
  const lending = await lendFactory.deploy(
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

  return {
    mockProver,
    registry,
    relationEngine,
    guard,
    vault,
    ctUSD,
    lending,
    owner,
    attacker,
    victim,
    emitterSepolia,
    emitterMainnet,
    defaultSig,
    abiCoder,
    toPlainEvidence,
    makeEncodedTx,
  };
}
