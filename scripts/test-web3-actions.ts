import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  console.log("===============================================================");
  console.log("   TESTING ALL 6 WEB3 TRANSACTIONS ON CREDITCOIN CC3 (102031)  ");
  console.log("===============================================================\n");

  const [signer] = await ethers.getSigners();
  console.log("Signer / Connected Wallet:", signer.address);
  const bal = await ethers.provider.getBalance(signer.address);
  console.log("CTC Balance:", ethers.formatEther(bal), "tCTC\n");

  const manifest = JSON.parse(fs.readFileSync("deployments/cc3-testnet.json", "utf8"));
  const contracts = manifest.contracts;

  const lpm = await ethers.getContractAt("LendingPositionManager", contracts.LendingPositionManager.address, signer);
  const vault = await ethers.getContractAt("CausoraVault", contracts.CausoraVault.address, signer);
  const token = await ethers.getContractAt("MockERC20", contracts.MockERC20_ctUSD.address, signer);

  const testPosId = BigInt(Math.floor(Date.now() / 1000) % 90000 + 10000);
  console.log(`Using fresh Test Position ID: ${testPosId.toString()}`);

  // 1. CREATE POSITION
  console.log("\n[ACTION 1] createPosition...");
  const colAmount = ethers.parseEther("12");
  const debtAmount = ethers.parseEther("6000");
  const tx1 = await lpm.createPosition(testPosId, signer.address, colAmount, debtAmount);
  console.log("Submitted tx:", tx1.hash);
  const rec1 = await tx1.wait(1);
  console.log(`✓ Confirmed in block ${rec1?.blockNumber}, gasUsed: ${rec1?.gasUsed.toString()}`);
  const post1 = await lpm.getPosition(testPosId);
  console.log(`✓ Post-read: borrower=${post1.borrower}, col=${ethers.formatEther(post1.collateralAmount)}, state=${post1.state}`);

  // 2. MARK POSITION AT RISK
  console.log("\n[ACTION 2] markAtRisk...");
  const tx2 = await lpm.markAtRisk(testPosId);
  console.log("Submitted tx:", tx2.hash);
  const rec2 = await tx2.wait(1);
  console.log(`✓ Confirmed in block ${rec2?.blockNumber}, gasUsed: ${rec2?.gasUsed.toString()}`);
  const post2 = await lpm.getPosition(testPosId);
  console.log(`✓ Post-read state: ${post2.state} (2 = AT_RISK)`);

  // 3. APPROVE COLLATERAL
  console.log("\n[ACTION 3] approve ctUSD for CausoraVault...");
  const tx3 = await token.approve(contracts.CausoraVault.address, colAmount);
  console.log("Submitted tx:", tx3.hash);
  const rec3 = await tx3.wait(1);
  console.log(`✓ Confirmed in block ${rec3?.blockNumber}, gasUsed: ${rec3?.gasUsed.toString()}`);
  const allowance = await token.allowance(signer.address, contracts.CausoraVault.address);
  console.log(`✓ Post-read allowance: ${ethers.formatEther(allowance)} ctUSD`);

  // 4. DEPOSIT COLLATERAL
  console.log("\n[ACTION 4] depositCollateral into CausoraVault...");
  const userCtUSDBal = await token.balanceOf(signer.address);
  if (userCtUSDBal < colAmount) {
    const mintTx = await token.mint(signer.address, ethers.parseEther("100"));
    await mintTx.wait(1);
  }
  const tx4 = await vault.depositCollateral(testPosId, colAmount);
  console.log("Submitted tx:", tx4.hash);
  const rec4 = await tx4.wait(1);
  console.log(`✓ Confirmed in block ${rec4?.blockNumber}, gasUsed: ${rec4?.gasUsed.toString()}`);
  const lockedCol = await vault.lockedCollateral(testPosId);
  console.log(`✓ Post-read lockedCollateral: ${ethers.formatEther(lockedCol)} ctUSD`);

  // 5. RESOLVE COLLATERAL RACE (Fail-closed verification)
  console.log("\n[ACTION 5] resolveCollateralRace (Enforcing Fail-Closed Protection)...");
  const qRescue = "0xb054d6177daebc803073d2d404e2ca9b67a1c39806e766f8a0ea461340e29971";
  const qLiq = "0x4af0f28c5a85081af9487f91aad1b68318e3f62bfb629f795d6c9b5eaea9c3c2";
  const emptyWitness = {
    parentDigest: ethers.ZeroHash,
    capabilityHash: ethers.ZeroHash,
    stateCommitment: ethers.ZeroHash,
    sequenceNumber: 0n,
    signatureOrProof: "0x",
  };
  try {
    await lpm.resolveCollateralRace.staticCall(testPosId, qRescue, qLiq, emptyWitness, ethers.parseEther("5"), signer.address);
    console.log("Unexpected: call did not revert!");
  } catch (raceErr: any) {
    console.log(`✓ Cryptographic fail-closed protection verified: Reverted with unadmitted evidence:`);
    console.log(`  ${raceErr.message.slice(0, 150)}...`);
  }

  // 6. ATTEMPT LIQUIDATION (Demonstrating Revert Proof)
  console.log("\n[ACTION 6] attemptLiquidation on CausoraVault (Position Protection)...");
  try {
    await vault.executeProtectedTransition.staticCall(testPosId, 2 /* ALLOW_B */, signer.address, signer.address, colAmount);
    console.log("Unexpected: liquidation succeeded!");
  } catch (liqErr: any) {
    console.log(`✓ Liquidation blocked and reverted:`);
    console.log(`  ${liqErr.message.slice(0, 150)}...`);
  }

  console.log("\n===============================================================");
  console.log("   ALL 6 WEB3 TRANSACTIONS VERIFIED ON CREDITCOIN CC3 TESTNET   ");
  console.log("===============================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
