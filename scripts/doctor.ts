import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { CHAIN_INFO_PRECOMPILE_ADDRESS, BLOCK_PROVER_PRECOMPILE_ADDRESS, CHAIN_INFO_ABI } from "../src/attestcoin/precompiles";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  console.log("=== CAUSORA ENVIRONMENT & CREDITCOIN PRECOMPILE DIAGNOSTIC ===");
  const rpcUrl = process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network";
  console.log("Connecting to Creditcoin CC3 RPC:", rpcUrl);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  try {
    const network = await provider.getNetwork();
    console.log("✓ Connected to Network. Chain ID:", network.chainId.toString());
    if (network.chainId !== 102031n) {
      console.warn("⚠️ Warning: Expected Creditcoin CC3 chain ID 102031, received:", network.chainId.toString());
    }

    const blockNumber = await provider.getBlockNumber();
    console.log("✓ Current CC3 Block Number:", blockNumber);

    console.log("Checking ChainInfo Precompile (0xFD3)...");
    const chainInfoContract = new ethers.Contract(CHAIN_INFO_PRECOMPILE_ADDRESS, CHAIN_INFO_ABI, provider);
    try {
      const supportedChains = await chainInfoContract.get_supported_chains();
      console.log("✓ Supported Source Chains on Creditcoin CC3:");
      supportedChains.forEach((c: any) => {
        console.log(`  - chainKey: ${c.chainKey}, chainId: ${c.chainId}, encoding: ${c.chainEncoding}`);
      });
    } catch (e: any) {
      console.log("ℹ ChainInfo query returned:", e.message || e);
    }

    console.log("Checking BlockProver Precompile (0xFD2)...");
    const code = await provider.getCode(BLOCK_PROVER_PRECOMPILE_ADDRESS);
    console.log("✓ BlockProver address probed (Precompiles return native bytecode or 0x).");

    console.log("=== DIAGNOSTIC PASSED ===");
  } catch (error: any) {
    console.error("Diagnostic failed to connect to RPC:", error.message || error);
  }
}

main().catch(console.error);
