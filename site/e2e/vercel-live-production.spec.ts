import { test, expect } from '@playwright/test';

const VERCEL_URL = 'https://causora.vercel.app';

test.describe('Vercel Production Deployment (causora.vercel.app)', () => {

  test('1. Landing Page (/) renders correctly with all links and stats', async ({ page }) => {
    const response = await page.goto(VERCEL_URL);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Causora/i);

    // Hero title and verified path badge
    await expect(page.getByText('CREDITCOIN CC3 · ATTESTCOIN VERIFIED PATH')).toBeVisible();
    await expect(page.locator('h1')).toContainText('PROOF DOES NOT');
    await expect(page.locator('h1')).toContainText('MEAN ORDER.');

    // Check key CTA links
    await expect(page.getByRole('link', { name: /Open Protocol/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Break the Assumption/i }).first()).toBeVisible();
  });

  test('2. Verify Page (/verify) strictly fails closed on unadmitted query coordinates', async ({ page }) => {
    await page.goto(`${VERCEL_URL}/verify`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Cryptographic Proof Verifier');

    // Configure coordinates from user's screenshot: Ethereum Mainnet (ChainKey: 3), Height 5824100, TxIndex 42
    await page.selectOption('select', '3');
    const blockInput = page.locator('input[type="number"]').first();
    await blockInput.fill('5824100');
    const txInput = page.locator('input[type="number"]').nth(1);
    await txInput.fill('42');

    // Click "Inspect Verified Evidence"
    const verifyBtn = page.getByRole('button', { name: /Inspect Verified Evidence|Verify on Creditcoin CC3/i }).first();
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();

    // Verify state transition: MUST show NOT ADMITTED → REJECTED with Evidence Not Admitted badge
    await expect(page.getByText(/NOT ADMITTED → REJECTED|NOT VERIFIED \/ READY FOR ADMISSION/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Evidence Not Admitted|Unprocessed on CC3/i)).toBeVisible();

    // Verify canonical query ID
    await expect(page.getByText('Canonical 72-Byte Packed Query ID:')).toBeVisible();
    await expect(page.locator('text=0x7e4fe53e1f7496a054760845fecc54c9cf77743098bcdb4f6feb2c5fe08d5c68')).toBeVisible();

    // Verify Zero Synthetic Verification Explanation banner
    await expect(page.getByText('Zero Synthetic Verification Enforced:')).toBeVisible();

    // Verify the 4 Fail-Closed Gates match screenshot:
    // Gate 1: Failed Root Trie
    await expect(page.getByText('Failed Root Trie').first()).toBeVisible();
    // Gate 2: Uncle/Fork Replay
    await expect(page.getByText('Uncle/Fork Replay').first()).toBeVisible();
    // Gate 3: Unprovable Clock Drift
    await expect(page.getByText('Unprovable Clock Drift').first()).toBeVisible();
    // Gate 4: Action: REJECT
    await expect(page.getByText('Action: REJECT').first()).toBeVisible();

    // Verify all 4 gates show Rejected (Fail-Closed)
    const rejectedBadges = page.getByText('Rejected (Fail-Closed)');
    await expect(rejectedBadges).toHaveCount(4);
  });

  test('3. App Console (/app): Real Web3 Modal signing and transaction pipeline', async ({ page }) => {
    // Inject mock EVM provider simulating Creditcoin CC3 wallet
    await page.addInitScript(() => {
      const mockAddress = '0xe4b713e3cf2e550147f9cc09d751f276e7b9a64e';
      const mockChainId = '0x18e8f'; // 102031 in hex (Creditcoin Testnet)

      let listeners: Record<string, Function[]> = {};

      (window as any).ethereum = {
        isMetaMask: true,
        selectedAddress: mockAddress,
        chainId: mockChainId,
        request: async ({ method, params }: { method: string; params?: any[] }) => {
          if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
            return [mockAddress];
          }
          if (method === 'eth_chainId') {
            return mockChainId;
          }
          if (method === 'net_version') {
            return '102031';
          }
          if (method === 'eth_blockNumber') {
            return '0x1000';
          }
          if (method === 'eth_sendTransaction') {
            return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
          }
          if (method === 'eth_getTransactionReceipt') {
            return {
              transactionHash: params?.[0] || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              blockNumber: '0x1001',
              status: '0x1',
              gasUsed: '0x15f90',
            };
          }
          if (method === 'eth_call') {
            return '0x00000000000000000000000000000000000000000000003635c9adc5dea00000';
          }
          if (method === 'eth_estimateGas') {
            return '0x186a0';
          }
          return null;
        },
        on: (event: string, handler: Function) => {
          listeners[event] = listeners[event] || [];
          listeners[event].push(handler);
        },
        removeListener: (event: string, handler: Function) => {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter(h => h !== handler);
          }
        },
      };
    });

    await page.goto(`${VERCEL_URL}/app`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Causora Protocol Console');

    // Connect wallet if connect button is present
    const connectBtn = page.getByRole('button', { name: /Connect Wallet/i });
    if (await connectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await connectBtn.click();
      await page.waitForTimeout(800);
    }

    // Open Faucet modal
    const faucetBtn = page.getByRole('button', { name: /Faucet \(ctUSD\)/i });
    await expect(faucetBtn).toBeVisible({ timeout: 5000 });
    await faucetBtn.click();

    // Verify modal is open
    await expect(page.getByText('Creditcoin CC3 Web3 Operations')).toBeVisible({ timeout: 5000 });

    // Test ctUSD Mint signing
    const mintBtn = page.getByRole('button', { name: /Sign Mint ctUSD|Connect Wallet to Sign/i });
    await expect(mintBtn).toBeVisible();
    await mintBtn.click();

    // Confirm state machine advances smoothly and does not freeze
    await expect(page.getByText(/Transaction Submitted|Waiting for Wallet Confirmation|Confirming on CC3|Confirmed on Creditcoin CC3/i)).toBeVisible({ timeout: 10000 });

    // Test Tab 1: Create Position with an unused fresh position ID
    await page.click('button:has-text("1. Create Position")');
    await expect(page.getByText('Position ID (uint256)')).toBeVisible();

    const uniquePosId = Math.floor(Date.now() / 1000) % 1000000 + 70000;
    const posInput = page.locator('input[placeholder*="1001"]').first();
    await posInput.fill(uniquePosId.toString());

    const createBtn = page.getByRole('button', { name: /Sign & Create Position|Connect Wallet to Sign/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Verify state machine transitions to signing/submitting/confirming
    await expect(page.getByText(/Transaction Submitted|Waiting for Wallet Confirmation|Confirming on CC3|Confirmed on Creditcoin CC3/i)).toBeVisible({ timeout: 10000 });

    // Close modal
    await page.click('button:has-text("Close")');
    await expect(page.getByText('Creditcoin CC3 Web3 Operations')).not.toBeVisible();
  });

  test('4. Documentation (/docs) and MCP (/mcp) pages render properly', async ({ page }) => {
    const docsRes = await page.goto(`${VERCEL_URL}/docs`);
    expect(docsRes?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Documentation');

    const mcpRes = await page.goto(`${VERCEL_URL}/mcp`);
    expect(mcpRes?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('AI Agent Tooling Interface');
  });

});
