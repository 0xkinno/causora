import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  console.log("=== DEPLOYING CAUSORA PROTOCOL TO CREDITCOIN CC3 TESTNET ===");
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from account:", deployer.address);

  // 1. Deploy CausoraRegistry
  console.log("1. Deploying CausoraRegistry...");
  const regFactory = await ethers.getContractFactory("CausoraRegistry");
  const registry = await regFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✓ CausoraRegistry deployed to:", registryAddress);

  // 2. Deploy RelationEngine
  console.log("2. Deploying RelationEngine...");
  const relFactory = await ethers.getContractFactory("RelationEngine");
  const relationEngine = await relFactory.deploy();
  await relationEngine.waitForDeployment();
  const relationEngineAddress = await relationEngine.getAddress();
  console.log("✓ RelationEngine deployed to:", relationEngineAddress);

  // 3. Deploy CausoraGuard
  console.log("3. Deploying CausoraGuard...");
  const guardFactory = await ethers.getContractFactory("CausoraGuard");
  const guard = await guardFactory.deploy(registryAddress, relationEngineAddress);
  await guard.waitForDeployment();
  const guardAddress = await guard.getAddress();
  console.log("✓ CausoraGuard deployed to:", guardAddress);

  // 4. Deploy LendingPositionManager
  console.log("4. Deploying LendingPositionManager...");
  const lendFactory = await ethers.getContractFactory("LendingPositionManager");
  const lending = await lendFactory.deploy(registryAddress, relationEngineAddress, guardAddress);
  await lending.waitForDeployment();
  const lendingAddress = await lending.getAddress();
  console.log("✓ LendingPositionManager deployed to:", lendingAddress);

  // 5. Deploy MockERC20 (Creditcoin Test USD) & CausoraVault (Real CC3 Collateral Vault)
  console.log("5. Deploying Test Collateral Asset (ctUSD) & CausoraVault...");
  const erc20Factory = await ethers.getContractFactory("MockERC20");
  const ctUSD = await erc20Factory.deploy("Creditcoin Test USD", "ctUSD");
  await ctUSD.waitForDeployment();
  const ctUSDAddress = await ctUSD.getAddress();
  console.log("✓ MockERC20 (ctUSD) deployed to:", ctUSDAddress);

  const vaultFactory = await ethers.getContractFactory("CausoraVault");
  const vault = await vaultFactory.deploy(ctUSDAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✓ CausoraVault deployed to:", vaultAddress);

  await vault.setPositionManager(lendingAddress);
  console.log("✓ CausoraVault positionManager linked to LendingPositionManager");

  // 6. Whitelist Sepolia and Mainnet source contracts in registry
  const SEPOLIA_COLLATERAL_SOURCE = ethers.getAddress("0x4b70C8885b54E4e3A16A99E57A779C64005bFc98".toLowerCase());
  const MAINNET_LIQUIDATION_SOURCE = ethers.getAddress("0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2".toLowerCase()); // Real Aave V3 Pool on Ethereum Mainnet
  
  console.log("Whitelisting standard source contracts...");
  await registry.registerSource(1n, SEPOLIA_COLLATERAL_SOURCE, 1, "Sepolia Collateral Source");
  await registry.registerSource(3n, MAINNET_LIQUIDATION_SOURCE, 2, "Aave V3 Liquidation Source");
  console.log("✓ Sources registered.");

  // Write deployment manifest
  const deploymentManifest = {
    network: "Creditcoin CC3 Testnet",
    chainId: 102031,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    commitSha: "a9f3b18c",
    explorerUrl: "https://creditcoin-testnet.blockscout.com",
    contracts: {
      CausoraRegistry: registryAddress,
      RelationEngine: relationEngineAddress,
      CausoraGuard: guardAddress,
      LendingPositionManager: lendingAddress,
      CausoraVault: vaultAddress,
      MockERC20_ctUSD: ctUSDAddress,
      BlockProverPrecompile: "0x0000000000000000000000000000000000000FD2",
      ChainInfoPrecompile: "0x0000000000000000000000000000000000000FD3"
    },
    whitelistedSources: [
      { chainKey: 1, emitter: SEPOLIA_COLLATERAL_SOURCE, kind: "CollateralVault", chainName: "Ethereum Sepolia" },
      { chainKey: 3, emitter: MAINNET_LIQUIDATION_SOURCE, kind: "LiquidationEngine", chainName: "Ethereum Mainnet" }
    ]
  };

  fs.mkdirSync("evidence/deployment", { recursive: true });
  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync("evidence/deployment/cc3-testnet.json", JSON.stringify(deploymentManifest, null, 2), "utf8");
  fs.writeFileSync("deployments/cc3-testnet.json", JSON.stringify(deploymentManifest, null, 2), "utf8");
  console.log("✓ Saved deployment manifest to evidence/deployment/cc3-testnet.json and deployments/cc3-testnet.json");
}

main().catch(console.error);
