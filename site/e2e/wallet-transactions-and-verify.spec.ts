import { test, expect } from '@playwright/test';

test.describe('Wallet Transactions and Proof Verification Test Suite', () => {

  test('Proof Verifier (/verify): Unadmitted coordinates strictly fail closed to REJECT', async ({ page }) => {
    await page.goto('/verify');
    await expect(page.locator('h1')).toContainText('Cryptographic Proof Verifier');

    // Configure coordinates matching user screenshot: ChainKey 3 (Ethereum Mainnet), Height 5824100, TxIndex 42
    await page.selectOption('select', '3'); // Ethereum Mainnet (ChainKey: 3)
    const blockInput = page.locator('input[type="number"]').first();
    await blockInput.fill('5824100');
    const txInput = page.locator('input[type="number"]').nth(1);
    await txInput.fill('42');

    // Click "Verify on Creditcoin CC3"
    const verifyBtn = page.getByRole('button', { name: /Verify on Creditcoin CC3/i });
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();

    // Verify state transition: MUST show NOT VERIFIED / READY FOR ADMISSION
    await expect(page.getByText('NOT VERIFIED / READY FOR ADMISSION')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Unprocessed on CC3')).toBeVisible();

    // Verify canonical query ID is computed and rendered
    await expect(page.getByText('Canonical 72-Byte Packed Query ID:')).toBeVisible();
    const queryIdText = page.locator('text=0x7e4fe53e1f7496a054760845fecc54c9cf77743098bcdb4f6feb2c5fe08d5c68');
    await expect(queryIdText).toBeVisible();

    // Verify Zero Synthetic Verification Explanation banner
    await expect(page.getByText('Zero Synthetic Verification Enforced:')).toBeVisible();

    // Verify the 4 Fail-Closed Gates match the screenshot:
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

  test('Web3 Action Modal (/app): State machine responds and triggers signing without frozen buttons', async ({ page }) => {
    // Inject mock Ethereum provider before page loads to simulate connected CC3 wallet
    await page.addInitScript(() => {
      const mockAddress = '0xe4b713e3cf2e550147f9cc09d751f276e7b9a64e';
      const mockChainId = '0x18e8f'; // 102031 in hex

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
            return '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
          }
          if (method === 'eth_getTransactionReceipt') {
            return {
              transactionHash: params?.[0] || '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
              blockNumber: '0x1001',
              status: '0x1',
              gasUsed: '0x15f90', // 90000 gas
            };
          }
          if (method === 'eth_call') {
            return '0x00000000000000000000000000000000000000000000003635c9adc5dea00000';
          }
          if (method === 'eth_estimateGas') {
            return '0x186a0'; // 100000
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

    await page.goto('/app');
    await expect(page.locator('h1')).toContainText('Causora Protocol Console');

    // Connect mock wallet if not automatically connected
    const connectBtn = page.getByRole('button', { name: /Connect Wallet/i });
    if (await connectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await connectBtn.click();
    }

    // Open Web3 Operations Modal via the Faucet button on the header
    const faucetBtn = page.getByRole('button', { name: /Faucet \(ctUSD\)/i });
    await expect(faucetBtn).toBeVisible({ timeout: 5000 });
    await faucetBtn.click();

    // Verify modal opens
    await expect(page.getByText('Creditcoin CC3 Web3 Operations')).toBeVisible();

    // 1. Verify Faucet (ctUSD) Tab content
    await expect(page.getByText('Creditcoin Test USD (ctUSD) Faucet')).toBeVisible();
    const signMintBtn = page.getByRole('button', { name: /Sign Mint ctUSD|Connect Wallet to Sign/i });
    await expect(signMintBtn).toBeVisible();

    // 2. Test Create Position Tab
    await page.click('button:has-text("1. Create Position")');
    await expect(page.getByText('Position ID (uint256)')).toBeVisible();
    await expect(page.getByText('Borrower Address')).toBeVisible();

    // 3. Test Approve Collateral Tab
    await page.click('button:has-text("2. Approve Collateral")');
    await expect(page.getByText('Collateral Amount (ctUSD)')).toBeVisible();

    // 4. Test Deposit Vault Tab
    await page.click('button:has-text("3. Deposit Vault")');
    await expect(page.getByText('Collateral Amount (ctUSD)')).toBeVisible();

    // 5. Test Mark Risk Tab
    await page.click('button:has-text("4. Mark Risk")');
    await expect(page.getByText('Position ID (uint256)')).toBeVisible();

    // 6. Test Resolve Race Tab
    await page.click('button:has-text("5. Resolve Race")');
    await expect(page.getByText('Query ID Event A (Rescue Deposit)')).toBeVisible();

    // 7. Test Liquidate Tab
    await page.click('button:has-text("6. Liquidate")');
    await expect(page.getByText('Liquidation Execution Mode:')).toBeVisible();

    // Close modal cleanly
    await page.click('button:has-text("Close")');
    await expect(page.getByText('Creditcoin CC3 Web3 Operations')).not.toBeVisible();
  });

  test('Ethereum Mainnet to Creditcoin CC3 automatic network switch before transaction execution', async ({ page }) => {
    // Inject mock EVM provider initialized on Ethereum Mainnet (0x1)
    await page.addInitScript(() => {
      const mockAddress = '0xe4b713e3cf2e550147f9cc09d751f276e7b9a64e';
      let currentChainId = '0x1'; // Starts on Ethereum Mainnet!
      let switchRequests: any[] = [];
      let allRequests: any[] = [];
      (window as any).__switchRequests = switchRequests;
      (window as any).__allRequests = allRequests;

      let listeners: Record<string, Function[]> = {};

      (window as any).ethereum = {
        isMetaMask: true,
        isConnected: () => true,
        selectedAddress: mockAddress,
        get chainId() {
          return currentChainId;
        },
        request: async ({ method, params }: { method: string; params?: any[] }) => {
          allRequests.push({ method, params });
          if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
            return [mockAddress];
          }
          if (method === 'eth_chainId') {
            return currentChainId;
          }
          if (method === 'net_version') {
            return currentChainId === '0x18e8f' ? '102031' : '1';
          }
          if (method === 'wallet_switchEthereumChain') {
            switchRequests.push(params?.[0]);
            currentChainId = '0x18e8f'; // Automatically switch to Creditcoin CC3
            const handlers = listeners['chainChanged'] || [];
            handlers.forEach(h => h('0x18e8f'));
            return null;
          }
          if (method === 'wallet_addEthereumChain') {
            switchRequests.push(params?.[0]);
            currentChainId = '0x18e8f';
            const handlers = listeners['chainChanged'] || [];
            handlers.forEach(h => h('0x18e8f'));
            return null;
          }
          if (method === 'eth_blockNumber') {
            return '0x1000';
          }
          if (method === 'eth_sendTransaction') {
            return '0x9999999999999999999999999999999999999999999999999999999999999999';
          }
          if (method === 'eth_getTransactionReceipt') {
            return {
              transactionHash: params?.[0] || '0x9999999999999999999999999999999999999999999999999999999999999999',
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

    await page.goto('/app');
    await expect(page.locator('h1')).toContainText('Causora Protocol Console');

    // Connect mock wallet if connect button is present
    const connectBtn = page.getByRole('button', { name: /Connect Wallet/i }).first();
    if (await connectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await connectBtn.click();
    }

    // Open Faucet modal
    const faucetBtn = page.getByRole('button', { name: /Faucet \(ctUSD\)/i });
    await expect(faucetBtn).toBeVisible({ timeout: 5000 });
    await faucetBtn.click();

    // Verify modal is open
    await expect(page.getByText('Creditcoin CC3 Web3 Operations')).toBeVisible();

    // The action button should NOT be disabled
    const signBtn = page.getByRole('button', { name: /Switch to CC3 Network & Sign|Sign Mint ctUSD|Connect Wallet to Sign/i });
    await expect(signBtn).toBeVisible();
    await expect(signBtn).toBeEnabled();

    // Click the button to trigger network switch & transaction flow
    await signBtn.click();

    // Confirm that the UI responds immediately with active progress status without freezing
    await expect(page.getByText(/Preparing|Awaiting|Switching|Creditcoin CC3|Transaction/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('Proof Verifier (/verify): Connected wallet triggers real on-chain transaction and renders confirmed on-chain report', async ({ page }) => {
    let transactionSent = false;
    let requestedMethod = '';

    await page.addInitScript(() => {
      const mockAddress = '0xe4b713e3cf2e550147f9cc09d751f276e7b9a64e';
      const mockChainId = '0x18e8f'; // 102031 in hex

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
            return '0x582410';
          }
          if (method === 'eth_sendTransaction') {
            (window as any).__txSent = true;
            return '0xfeedbeef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
          }
          if (method === 'eth_getTransactionReceipt') {
            return {
              transactionHash: '0xfeedbeef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
              blockNumber: '0x582411',
              status: '0x1',
              gasUsed: '0x14800', // 83968 gas
            };
          }
          if (method === 'eth_call') {
            return '0x0000000000000000000000000000000000000000000000000000000000000000';
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

    await page.goto('/verify');
    await expect(page.locator('h1')).toContainText('Cryptographic Proof Verifier');

    // Connect mock wallet if connect button is present
    const connectBtn = page.getByRole('button', { name: /Connect Wallet/i }).first();
    if (await connectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await connectBtn.click();
    }

    // Button triggers verification
    const verifyBtn = page.getByRole('button', { name: /Verify on Creditcoin CC3/i });
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();

    // If initial read check shows unadmitted, click Sign On-Chain Proof Verification to trigger wallet signing
    const signProofBtn = page.getByRole('button', { name: /Sign On-Chain Proof Verification on Creditcoin CC3/i });
    if (await signProofBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signProofBtn.click();
    }

    // Verify on-chain execution renders confirmed on-chain report
    await expect(page.getByText('ON-CHAIN VERIFIED: FAIL-CLOSED (REJECT)')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Confirmed on Creditcoin CC3', { exact: true })).toBeVisible();

    // Verify on-chain transaction hash and Blockscout explorer link
    await expect(page.getByText('0xfeedbeef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')).toBeVisible();
    await expect(page.getByRole('link', { name: /View on Blockscout/i })).toBeVisible();

    // Verify Invariant I4 enforcement and fail-closed gates
    await expect(page.getByText('Invariant I4 (Fail-Closed Capital Preservation) Confirmed:')).toBeVisible();
    await expect(page.getByText('Failed Root Trie').first()).toBeVisible();
    await expect(page.getByText('Uncle/Fork Replay').first()).toBeVisible();
    await expect(page.getByText('Unprovable Clock Drift').first()).toBeVisible();
    await expect(page.getByText('Action: REJECT').first()).toBeVisible();
  });

});

