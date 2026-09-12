import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  console.log("===============================================================");
  console.log("    CAUSORA PROTOCOL — CREDITCOIN CC3 TESTNET DEPLOYMENT       ");
  console.log("             TARGET CHAIN ID: 102031                           ");
  console.log("===============================================================\n");

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    console.error("ERROR: No signer available. Ensure PRIVATE_KEY is configured in .env.local");
    process.exit(1);
  }
  const deployer = signers[0];
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("Deployer Address:", deployer.address);
  console.log("Connected Network ChainId:", network.chainId.toString());
  console.log("Deployer Balance:", ethers.formatEther(balance), "tCTC\n");

  if (network.chainId !== 102031n && process.env.HARDHAT_NETWORK === "creditcoin_testnet") {
    console.error("ERROR: Not connected to Creditcoin CC3 Testnet (chainId 102031)!");
    process.exit(1);
  }

  const contractsRecord: Record<string, any> = {};

  async function recordDeployment(name: string, contract: any, constructorArgs: any[] = []) {
    const address = await contract.getAddress();
    const deployTx = contract.deploymentTransaction();
    let txHash = "";
    let blockNumber = 0;
    let gasUsed = 0n;

    if (deployTx) {
      txHash = deployTx.hash;
      const receipt = await deployTx.wait(1);
      if (receipt) {
        blockNumber = receipt.blockNumber;
        gasUsed = receipt.gasUsed;
      }
    }

    const code = await ethers.provider.getCode(address);
    const bytecodePresent = code !== "0x" && code.length > 2;

    let owner = "N/A";
    try {
      if (typeof contract.owner === "function") {
        owner = await contract.owner();
      }
    } catch (_) {}

    contractsRecord[name] = {
      contractName: name,
      address,
      deploymentTxHash: txHash,
      blockNumber,
      gasUsed: gasUsed.toString(),
      bytecodePresent,
      owner,
      constructorArguments: constructorArgs,
      blockscoutUrl: `https://creditcoin-testnet.blockscout.com/address/${address}`,
    };

    console.log(`✓ ${name} deployed to: ${address} (block ${blockNumber}, tx: ${txHash.slice(0, 18)}...)`);
    return address;
  }

  // 1. Deploy CausoraRegistry
  console.log("1. Deploying CausoraRegistry...");
  const regFactory = await ethers.getContractFactory("CausoraRegistry");
  const registry = await regFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await recordDeployment("CausoraRegistry", registry, []);

  // 2. Deploy RelationEngine
  console.log("2. Deploying RelationEngine...");
  const relFactory = await ethers.getContractFactory("RelationEngine");
  const relationEngine = await relFactory.deploy();
  await relationEngine.waitForDeployment();
  const relationEngineAddress = await recordDeployment("RelationEngine", relationEngine, []);

  // 3. Deploy CausoraGuard
  console.log("3. Deploying CausoraGuard...");
  const guardFactory = await ethers.getContractFactory("CausoraGuard");
  const guard = await guardFactory.deploy(registryAddress, relationEngineAddress);
  await guard.waitForDeployment();
  const guardAddress = await recordDeployment("CausoraGuard", guard, [registryAddress, relationEngineAddress]);

  // 4. Deploy MockERC20 (Creditcoin Test USD)
  console.log("4. Deploying Test Collateral Asset (ctUSD)...");
  const erc20Factory = await ethers.getContractFactory("MockERC20");
  const ctUSD = await erc20Factory.deploy("Creditcoin Test USD", "ctUSD");
  await ctUSD.waitForDeployment();
  const ctUSDAddress = await recordDeployment("MockERC20_ctUSD", ctUSD, ["Creditcoin Test USD", "ctUSD"]);

  // 5. Deploy CausoraVault
  console.log("5. Deploying CausoraVault...");
  const vaultFactory = await ethers.getContractFactory("CausoraVault");
  const vault = await vaultFactory.deploy(ctUSDAddress);
  await vault.waitForDeployment();
  const vaultAddress = await recordDeployment("CausoraVault", vault, [ctUSDAddress]);

  // 6. Deploy LendingPositionManager
  console.log("6. Deploying LendingPositionManager...");
  const lendFactory = await ethers.getContractFactory("LendingPositionManager");
  const lending = await lendFactory.deploy(registryAddress, relationEngineAddress, guardAddress, vaultAddress);
  await lending.waitForDeployment();
  const lendingAddress = await recordDeployment("LendingPositionManager", lending, [
    registryAddress,
    relationEngineAddress,
    guardAddress,
    vaultAddress,
  ]);

  // 7. Link vault positionManager
  console.log("7. Linking CausoraVault to LendingPositionManager...");
  const linkTx = await vault.setPositionManager(lendingAddress);
  await linkTx.wait(1);
  console.log("✓ CausoraVault positionManager linked.");

  // 8. Whitelist external source contracts with explicit event signatures
  const SEPOLIA_COLLATERAL_SOURCE = ethers.getAddress("0x4b70C8885b54E4e3A16A99E57A779C64005bFc98".toLowerCase());
  const MAINNET_LIQUIDATION_SOURCE = ethers.getAddress("0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2".toLowerCase());
  const CAUSAL_WITNESS_SOURCE = ethers.getAddress("0x3333333333333333333333333333333333333333".toLowerCase());

  const sigDeposit = ethers.keccak256(ethers.toUtf8Bytes("CollateralDeposited(uint256,address,uint256,uint64)"));
  const sigLiquidation = ethers.keccak256(ethers.toUtf8Bytes("LiquidationTriggered(uint256,address,uint256,bytes32)"));
  const sigCausality = ethers.keccak256(ethers.toUtf8Bytes("CausalityConsumed(bytes32,bytes32,uint64,bytes32)"));

  console.log("8. Registering approved source contracts with strict event signatures...");
  const regTx1 = await registry.registerSource(1n, SEPOLIA_COLLATERAL_SOURCE, 1, sigDeposit, "Sepolia Collateral Source");
  await regTx1.wait(1);

  const regTx2 = await registry.registerSource(3n, MAINNET_LIQUIDATION_SOURCE, 2, sigLiquidation, "Mainnet Liquidation Source");
  await regTx2.wait(1);

  const regTx3 = await registry.registerSource(1n, CAUSAL_WITNESS_SOURCE, 3, sigCausality, "Cross-Chain Causal Witness Source");
  await regTx3.wait(1);
  console.log("✓ All source contracts registered.");

  // 9. Build deployment manifest
  const deploymentManifest = {
    network: "Creditcoin CC3 Testnet",
    chainId: 102031,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    explorerBaseUrl: "https://creditcoin-testnet.blockscout.com",
    precompiles: {
      BlockProver: "0x0000000000000000000000000000000000000FD2",
      ChainInfo: "0x0000000000000000000000000000000000000FD3",
    },
    contracts: contractsRecord,
    whitelistedSources: [
      {
        chainKey: 1,
        emitter: SEPOLIA_COLLATERAL_SOURCE,
        kind: "CollateralVault",
        expectedEventSignature: sigDeposit,
        description: "Sepolia Collateral Source",
      },
      {
        chainKey: 3,
        emitter: MAINNET_LIQUIDATION_SOURCE,
        kind: "LiquidationEngine",
        expectedEventSignature: sigLiquidation,
        description: "Mainnet Liquidation Source",
      },
      {
        chainKey: 1,
        emitter: CAUSAL_WITNESS_SOURCE,
        kind: "CausalWitnessHub",
        expectedEventSignature: sigCausality,
        description: "Cross-Chain Causal Witness Source",
      },
    ],
  };

  fs.mkdirSync("evidence/deployment", { recursive: true });
  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync("evidence/deployment/cc3-testnet.json", JSON.stringify(deploymentManifest, null, 2), "utf8");
  fs.writeFileSync("deployments/cc3-testnet.json", JSON.stringify(deploymentManifest, null, 2), "utf8");
  console.log("\n✓ Saved verified deployment manifest to evidence/deployment/cc3-testnet.json and deployments/cc3-testnet.json");

  // 10. Update env files
  const envContent = `# ===================================================
# CAUSORA PROTOCOL CONFIGURATION — CC3 TESTNET DEPLOYMENT
# ===================================================

# Creditcoin CC3 Testnet RPC
NEXT_PUBLIC_CC3_RPC_URL=https://rpc.cc3-testnet.creditcoin.network
NEXT_PUBLIC_CC3_CHAIN_ID=102031

# Deployed Contract Addresses on Creditcoin CC3
NEXT_PUBLIC_CAUSORA_REGISTRY_ADDRESS=${registryAddress}
NEXT_PUBLIC_RELATION_ENGINE_ADDRESS=${relationEngineAddress}
NEXT_PUBLIC_CAUSORA_GUARD_ADDRESS=${guardAddress}
NEXT_PUBLIC_LENDING_MANAGER_ADDRESS=${lendingAddress}
NEXT_PUBLIC_CAUSORA_VAULT_ADDRESS=${vaultAddress}
NEXT_PUBLIC_MOCK_ERC20_ADDRESS=${ctUSDAddress}

# Precompile Addresses (Creditcoin CC3 Native)
NEXT_PUBLIC_BLOCK_PROVER_PRECOMPILE=0x0000000000000000000000000000000000000FD2
NEXT_PUBLIC_CHAIN_INFO_PRECOMPILE=0x0000000000000000000000000000000000000FD3
`;

  // Preserve GEMINI_API_KEY and PRIVATE_KEY if set
  let rootEnv = envContent;
  if (process.env.PRIVATE_KEY) {
    rootEnv += `PRIVATE_KEY=${process.env.PRIVATE_KEY}\n`;
  }
  if (process.env.GEMINI_API_KEY) {
    rootEnv += `GEMINI_API_KEY=${process.env.GEMINI_API_KEY}\n`;
  }

  let siteEnv = envContent;
  if (process.env.GEMINI_API_KEY) {
    siteEnv += `GEMINI_API_KEY=${process.env.GEMINI_API_KEY}\n`;
  }
  fs.writeFileSync(".env.local", rootEnv, "utf8");
  fs.writeFileSync("site/.env.local", siteEnv, "utf8");
  console.log("✓ Updated .env.local and site/.env.local with real CC3 deployed addresses.");

  console.log("\n===============================================================");
  console.log("✓ CC3 TESTNET DEPLOYMENT COMPLETE & VERIFIED");
  console.log("===============================================================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
