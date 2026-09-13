import { test, expect } from '@playwright/test';

test.describe('CAUSORA E2E Suite', () => {

  test('Landing Page: Hero, Editorial Headlines, Pipeline, and Invariant Cards', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CAUSORA/);
    await expect(page.locator('h1')).toContainText('PROOF DOES NOT');
    await expect(page.locator('h1')).toContainText('MEAN ORDER');

    // Architecture & Credential badges
    await expect(page.getByText('CREDITCOIN CC3 · ATTESTCOIN VERIFIED PATH')).toBeVisible();
    await expect(page.getByText('Two chains can both be honest')).toBeVisible();

    // 4-Stage Machine
    await expect(page.getByText('PROVE').first()).toBeVisible();
    await expect(page.getByText('CLASSIFY').first()).toBeVisible();
    await expect(page.getByText('GATE').first()).toBeVisible();
    await expect(page.getByText('EXECUTE').first()).toBeVisible();

    // Tri-State Engine Cards
    await expect(page.getByText('The required ordering is proven.')).toBeVisible();
    await expect(page.getByText('The evidence is real, but the required cross-chain relation is not proven.')).toBeVisible();
    await expect(page.getByText('The evidence itself failed verification.')).toBeVisible();

    // Wallet button in Navbar
    await expect(page.getByRole('button', { name: /Connect Wallet/i })).toBeVisible();
  });

  test('Console (/app): Tab Switching & Live Orderability Evaluator', async ({ page }) => {
    await page.goto('/app');
    await expect(page.locator('h1')).toContainText('Causora Protocol Console');

    // Toggle Local Lab mode to verify test fixtures
    await page.click('button:has-text("Local Lab")');
    await expect(page.getByText('POS-001-ETH-SEP')).toBeVisible();
    await expect(page.getByText('POS-002-CROSS-BTC')).toBeVisible();

    // Switch to Evaluator Tab
    await page.click('button:has-text("Orderability Evaluator")');
    await expect(page.getByText('Live Orderability Relation Evaluator')).toBeVisible();

    // Run Orderability Evaluation
    await page.click('button:has-text("Evaluate Orderability Relation")');
    await expect(page.getByText('Strict intra-chain precedence proven')).toBeVisible();
    await expect(page.getByText('ACT').first()).toBeVisible();

    // Switch to Settlement Audit Tab
    await page.click('button:has-text("Settlement Audit")');
    await expect(page.getByText('Creditcoin 3 Decision & Proof Log')).toBeVisible();
  });

  test('Position Drilldown (/app/position/POS-001-ETH-SEP): Collateral Top-Up & Liquidation Check', async ({ page }) => {
    await page.goto('/app/position/POS-001-ETH-SEP');
    await expect(page.locator('h1')).toContainText('POS-001-ETH-SEP');

    // Toggle Local Lab mode to inspect test fixture
    await page.click('button:has-text("Local Lab")');

    // Verify Collateral Influx panel and deposit button
    await expect(page.getByText('Deposit Collateral (CausoraVault)')).toBeVisible();
    await expect(page.getByText('Sign & Deposit Collateral')).toBeVisible();

    // Verify Adverse Liquidation panel and simulation button
    await expect(page.getByText('Test Liquidation Interception')).toBeVisible();
    await expect(page.getByText('Simulate / Attempt Liquidation')).toBeVisible();
  });

  test('Break-It Attack Arena (/break-it): Adversarial Attack Mitigation', async ({ page }) => {
    await page.goto('/break-it');
    await expect(page.locator('h1')).toContainText('Break It: Attack Simulation Lab');

    // Check Mode Switcher
    await expect(page.getByText('Local Lab')).toBeVisible();
    await expect(page.getByText('Live CC3 RPC')).toBeVisible();

    // Click Launch Attack
    await page.click('button:has-text("Launch Attack on Causora")');
    await expect(page.getByText('Execution Trace')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('REJECT').first()).toBeVisible();
  });

  test('Proof Verifier (/verify): Preset Loading & Query ID Packing', async ({ page }) => {
    await page.goto('/verify');
    await expect(page.locator('h1')).toContainText('Cryptographic Proof Verifier');

    // Load Sepolia Deposit preset
    await page.click('button:has-text("Sepolia Deposit (Tx 42)")');
    await page.click('button:has-text("Inspect Verified Evidence")');
    await expect(page.getByText('Evidence Not Admitted')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Canonical 72-Byte Packed Query ID:')).toBeVisible();
  });

  test('AI Agent MCP Interface (/mcp): Tool Execution Sandbox', async ({ page }) => {
    await page.goto('/mcp');
    await expect(page.locator('h1')).toContainText('AI Agent Tooling Interface');

    // Invoke evaluate_orderability tool
    await page.click('button:has-text("Invoke Tool")');
    await expect(page.getByText('Tool Execution Result:')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('"guardApproval": true')).toBeVisible();
  });

  test('Documentation (/docs): Interactive Sections Navigation', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.locator('h1')).toContainText('CAUSORA Protocol Documentation');

    // Click Threat Model
    await page.click('button:has-text("2. Threat Model")');
    await expect(page.getByText('18 primary cross-chain orderability vulnerabilities')).toBeVisible();

    // Click Creditcoin Precompiles
    await page.click('button:has-text("4. Creditcoin Precompiles")');
    await expect(page.getByText('0x0000000000000000000000000000000000000FD2 (BlockProver)')).toBeVisible();
  });

});
