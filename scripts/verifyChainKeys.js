/**
 * Verify Causora's source-chain catalogue against Creditcoin's native ChainInfo precompile (0xFD3).
 *
 *   npx hardhat run scripts/verifyChainKeys.js --network creditcoin_testnet
 *
 * An incorrect chainKey fails silently in cross-chain proofs: proofs will never match
 * registered schemas, and evidence admission fails. This script verifies the live
 * configuration on Creditcoin CC3 and is executed automatically before deployment.
 */
const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const CHAIN_INFO_PRECOMPILE = "0x0000000000000000000000000000000000000fD3";

const IFACE = new ethers.Interface([
  "function get_supported_chains() view returns ((uint64 chainKey,uint64 chainId,string chainName,uint32 chainEncoding)[])",
  "function get_latest_attestation_height_and_hash(uint64) view returns ((uint64 height,bytes32 hash,bool isAttestation,bool exists))",
  "function get_latest_checkpoint_height_and_hash(uint64) view returns ((uint64 height,bytes32 hash,bool isAttestation,bool exists))"
]);

// Expected Causora Protocol Source Catalogue
const EXPECTED_CATALOGUE = [
  { chainKey: 1, evmChainId: 11155111, name: "Ethereum Sepolia" },
  { chainKey: 3, evmChainId: 1, name: "Ethereum Mainnet" }
];

async function verifyChainKeys(providerUrl) {
  const rpc = providerUrl || process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network";
  const provider = new ethers.JsonRpcProvider(rpc, 102031, { staticNetwork: true });

  console.log("=".repeat(75));
  console.log("  CAUSORA PROTOCOL — ATTESTCOIN CHAINKEY PRECOMPILE VERIFICATION (0xFD3)");
  console.log("=".repeat(75));

  try {
    const raw = await provider.call({
      to: CHAIN_INFO_PRECOMPILE,
      data: IFACE.encodeFunctionData("get_supported_chains")
    });

    if (!raw || raw === "0x") {
      console.log(`\n  [WARN] No ChainInfo precompile at ${CHAIN_INFO_PRECOMPILE} on this network.`);
      console.log("  Skipping precompile verification (expected on simulated local test networks).");
      return { ok: true, skipped: true };
    }

    const [chains] = IFACE.decodeFunctionResult("get_supported_chains", raw);
    const liveChains = chains.map(c => ({
      chainKey: Number(c.chainKey),
      chainId: Number(c.chainId),
      chainName: c.chainName,
      chainEncoding: Number(c.chainEncoding)
    }));

    console.log("\n  Live Registered Chains on Creditcoin CC3 (0xFD3):");
    console.log("    chainKey   chainId     encoding   name");
    for (const c of liveChains) {
      console.log(
        `    ${String(c.chainKey).padEnd(10)} ${String(c.chainId).padEnd(11)} ${String(c.chainEncoding).padEnd(10)} ${c.chainName}`
      );
      try {
        const rawAtt = await provider.call({
          to: CHAIN_INFO_PRECOMPILE,
          data: IFACE.encodeFunctionData("get_latest_attestation_height_and_hash", [c.chainKey])
        });
        const [att] = IFACE.decodeFunctionResult("get_latest_attestation_height_and_hash", rawAtt);
        console.log(`               latest attested height: ${att.height}`);
      } catch (_) {}
    }

    console.log("\n  Causora Protocol Catalogue Requirements:");
    const errors = [];
    for (const exp of EXPECTED_CATALOGUE) {
      const match = liveChains.find(c => c.chainKey === exp.chainKey);
      if (!match) {
        errors.push(`Missing chainKey ${exp.chainKey} for ${exp.name} (EVM ${exp.evmChainId})`);
      } else if (match.chainId !== exp.evmChainId) {
        errors.push(
          `chainKey ${exp.chainKey} maps to chainId ${match.chainId} ("${match.chainName}"), but Causora requires ${exp.evmChainId} (${exp.name})`
        );
      } else {
        console.log(`    ✓ Verified: chainKey ${exp.chainKey} == ${exp.name} (EVM ${exp.evmChainId})`);
      }
    }

    if (errors.length > 0) {
      console.error("\n  ❌ CHAINKEY MISMATCH DETECTED:");
      errors.forEach(e => console.error(`    - ${e}`));
      return { ok: false, errors };
    }

    console.log("\n  ✓ 100% OF CAUSORA SOURCE CHAINKEYS MATCH CC3 PRECOMPILE CONFIGURATION.\n");
    return { ok: true, liveChains };
  } catch (err) {
    console.error(`\n  ❌ Error querying 0xFD3 on ${rpc}:`, err.message);
    return { ok: false, error: err.message };
  }
}

if (require.main === module) {
  verifyChainKeys().then(res => {
    if (!res.ok) process.exit(1);
  });
}

module.exports = { verifyChainKeys };
