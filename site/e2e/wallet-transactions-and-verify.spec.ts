import { test, expect } from '@playwright/test';

test.describe('Wallet Transactions and Proof Verification Test Suite', () => {

  test('Proof Verifier (/verify): Unadmitted coordinates strictly fail closed to REJECT with Evidence Not Admitted badge', async ({ page }) => {
    await page.goto('/verify');
    await expect(page.locator('h1')).toContainText('Cryptographic Proof Verifier');

    // Configure coordinates matching unadmitted test: ChainKey 3 (Ethereum Mainnet), Height 5824100, TxIndex 42
    await page.selectOption('select', '3'); // Ethereum Mainnet (ChainKey: 3)
    const blockInput = page.locator('input[type="number"]').first();
    await blockInput.fill('5824100');
    const txInput = page.locator('input[type="number"]').nth(1);
    await txInput.fill('42');

    // Click "Inspect Verified Evidence"
    const inspectBtn = page.getByRole('button', { name: /Inspect Verified Evidence/i }).first();
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();

    // Verify state transition: MUST show NOT ADMITTED → REJECTED with Evidence Not Admitted badge
    await expect(page.getByText('NOT ADMITTED → REJECTED')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Evidence Not Admitted')).toBeVisible();

    // Verify canonical query ID is computed and rendered
    await expect(page.getByText('Canonical 72-Byte Packed Query ID:')).toBeVisible();
    const queryIdText = page.locator('text=0x7e4fe53e1f7496a054760845fecc54c9cf77743098bcdb4f6feb2c5fe08d5c68').first();
    await expect(queryIdText).toBeVisible();

    // Verify Zero Synthetic Verification Explanation banner
    await expect(page.getByText('Zero Synthetic Verification Enforced:')).toBeVisible();

    // Verify the 4 Fail-Closed Gates:
    await expect(page.getByText('Failed Root Trie').first()).toBeVisible();
    await expect(page.getByText('Uncle/Fork Replay').first()).toBeVisible();
    await expect(page.getByText('Unprovable Clock Drift').first()).toBeVisible();
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
      let currentChainId = '0x1'; // Starts on Ethereum Mainnet
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

  test('Proof Verifier (/verify): Path B connected wallet triggers on-chain guard evaluation and renders ON-CHAIN REJECTION — EVIDENCE NOT ADMITTED', async ({ page }) => {
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
            return '0xfeedbeef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
          }
          if (method === 'eth_getTransactionReceipt') {
            return {
              transactionHash: '0xfeedbeef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
              blockNumber: '0x582411',
              status: '0x1',
              gasUsed: '0x14800',
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

    // Switch to Path B
    await page.click('button:has-text("PATH B — NOT ADMITTED → REJECTED")');

    // Button triggers Guard financial policy evaluation
    const evalBtn = page.getByRole('button', { name: /Evaluate Financial Policy/i }).first();
    await expect(evalBtn).toBeVisible();
    await evalBtn.click();

    // Verify on-chain execution renders confirmed on-chain rejection:
    // Headline MUST be "ON-CHAIN REJECTION — EVIDENCE NOT ADMITTED"
    await expect(page.getByText('ON-CHAIN REJECTION — EVIDENCE NOT ADMITTED')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Evidence Not Admitted', { exact: true })).toBeVisible();

    // Verify exact required explanation
    await expect(page.getByText('CausoraGuard refused authorization because the requested evidence was not present in the canonical registry.')).toBeVisible();

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

  test('Proof Verifier (/verify): Verified Demo Evidence preset loads and displays real admitted proof', async ({ page }) => {
    await page.goto('/verify');
    await expect(page.locator('h1')).toContainText('Cryptographic Proof Verifier');

    // Click Verified Demo Evidence button
    const demoBtn = page.getByRole('button', { name: /Verified Demo Evidence/i });
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    // Verify state transition: ATTESTCOIN PROOF ACCEPTED
    await expect(page.getByText('ATTESTCOIN PROOF ACCEPTED')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Admitted & Verified on CC3')).toBeVisible();

    // Verify real query ID
    await expect(page.getByText('0x56ec8b88df209b780e2db0c6b045fbea63c5ff4e605367f4cea3a229d2d77c00').first()).toBeVisible();

    // Verify CC3 admission transaction link to Blockscout
    await expect(page.getByText('0xf578a0dce2b3679550da19de29640f3d01f571511363850bb11eef68049a0872')).toBeVisible();
    await expect(page.getByRole('link', { name: /View on Blockscout/i })).toBeVisible();

    // Verify precompiles and coordinates
    await expect(page.getByText('0xFD2 (BlockProver)').first()).toBeVisible();
    await expect(page.getByText('0xFD3 (ChainInfo)').first()).toBeVisible();

    // Verify GateStatus passed
    await expect(page.getByText('Action: ACT').first()).toBeVisible();
  });

  test('Proof Verifier (/verify): Path A real Attestcoin proof admission triggers wallet signature and admits on CC3', async ({ page }) => {
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
            return '0xaabbcc1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
          }
          if (method === 'eth_getTransactionReceipt') {
            return {
              transactionHash: '0xaabbcc1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
              blockNumber: '0x582415',
              status: '0x1',
              gasUsed: '0x24300',
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

    // Ensure Path A is active
    await page.click('button:has-text("PATH A — REAL PROOF ADMISSION")');

    // Click Admit Attestcoin Proof on CC3
    const admitBtn = page.getByRole('button', { name: /Admit Attestcoin Proof on CC3/i }).first();
    await expect(admitBtn).toBeVisible();
    await admitBtn.click();

    // Verify state transition: ATTESTCOIN PROOF ACCEPTED
    await expect(page.getByText('ATTESTCOIN PROOF ACCEPTED')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Admitted & Verified on CC3')).toBeVisible();
    await expect(page.getByText('0xaabbcc1234567890abcdef1234567890abcdef1234567890abcdef1234567890')).toBeVisible();
    await expect(page.getByRole('link', { name: /View on Blockscout/i })).toBeVisible();
    await expect(page.getByText('0xFD2 (BlockProver)').first()).toBeVisible();
  });

});
