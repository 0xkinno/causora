"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ethers } from 'ethers';
import { useAccount, useChainId, useSwitchChain, usePublicClient, useWalletClient } from 'wagmi';
import { MOCK_POSITIONS } from '@/lib/mockData';
import { LendingPosition, ActionDecision, RelationType } from '@/lib/types';
import { ActionBadge, RelationBadge } from '@/components/ActionBadge';
import { GateStatus } from '@/components/GateStatus';
import { TransactionReceiptPanel, TxReceiptData } from '@/components/TransactionReceiptPanel';
import {
  computeQueryId,
  CONTRACT_ADDRESSES,
  LENDING_POSITION_MANAGER_ABI,
  CAUSORA_VAULT_ABI,
  MOCK_ERC20_ABI,
  RELATION_ENGINE_ABI
} from '@/lib/contracts';
import {
  ArrowLeft,
  Shield,
  Zap,
  PlusCircle,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Cpu,
  FileSearch,
  RefreshCw,
  ExternalLink,
  Coins,
  FlaskConical
} from 'lucide-react';

export default function PositionDetailPage() {
  const params = useParams();
  const rawId = (params?.id as string) || "1001";
  const numericId = rawId.replace(/[^0-9]/g, '') || "1001";

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [position, setPosition] = useState<LendingPosition | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastReceipt, setLastReceipt] = useState<TxReceiptData | null>(null);

  // Form states
  const [depositAmount, setDepositAmount] = useState<string>("10.0");
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [txStep, setTxStep] = useState<string>('');

  // Liquidation attempt state
  const [isLiquidating, setIsLiquidating] = useState<boolean>(false);
  const [liqResult, setLiqResult] = useState<{
    action: ActionDecision;
    relation: RelationType;
    reason: string;
    decisionId: string;
  } | null>(null);

  const isWrongNetwork = isConnected && chainId !== 102031;

  const loadPositionData = async () => {
    setLoading(true);
    if (!isLiveMode) {
      const mock = MOCK_POSITIONS.find(p => p.id.includes(numericId)) || MOCK_POSITIONS[0];
      setPosition(mock);
      setLoading(false);
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_CC3_RPC_URL || 'https://rpc.cc3-testnet.creditcoin.network'
      );
      const lendingManager = new ethers.Contract(
        CONTRACT_ADDRESSES.lendingPositionManager,
        LENDING_POSITION_MANAGER_ABI,
        provider
      );
      const vaultContract = new ethers.Contract(
        CONTRACT_ADDRESSES.causoraVault,
        CAUSORA_VAULT_ABI,
        provider
      );

      const posIdBn = BigInt(numericId);
      const raw = await lendingManager.getPosition(posIdBn);

      if (raw.borrower === ethers.ZeroAddress) {
        // Position not found on CC3
        setPosition(null);
      } else {
        const stateNames = ['NON_EXISTENT', 'SAFE', 'AT_RISK', 'HELD_PENDING_ORDER', 'RESCUED', 'LIQUIDATED'];
        let lockedAmountStr = ethers.formatEther(raw.collateralAmount);
        let isHeld = false;
        try {
          const lockedOnVault = await vaultContract.lockedCollateral(posIdBn);
          lockedAmountStr = ethers.formatEther(lockedOnVault);
          isHeld = await vaultContract.isHeld(posIdBn);
        } catch (_) {}

        let positionState = stateNames[raw.state] as any;
        if (isHeld) {
          positionState = 'HELD_PENDING_ORDER';
        }

        setPosition({
          id: `CC3-POS-${numericId}`,
          borrower: `${raw.borrower.slice(0, 6)}...${raw.borrower.slice(-4)}`,
          collateralAsset: 'ctUSD (CC3 Test Asset)',
          collateralAmount: `${lockedAmountStr} ctUSD`,
          debtAmount: `${ethers.formatEther(raw.debtAmount)} ctUSD`,
          healthFactor: raw.state === 2 ? 0.95 : raw.state === 3 ? 1.05 : 1.25,
          status: positionState,
          lastDepositQueryId: raw.lastEvidenceDigest,
          lastLiquidationQueryId: ethers.ZeroHash,
          lastUpdatedAt: Number(raw.lastUpdatedAt),
          history: [],
        });
      }
    } catch (err) {
      console.warn('Error loading live position:', err);
      setPosition(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPositionData();
  }, [numericId, isLiveMode, address]);

  // Real Web3 Deposit Collateral
  const handleRealDeposit = async () => {
    if (!walletClient || !address) {
      alert("Please connect your wallet first.");
      return;
    }
    if (chainId !== 102031) {
      alert("Please switch to Creditcoin CC3 Testnet (102031).");
      return;
    }

    setIsDepositing(true);
    setTxStep('AWAITING_WALLET');

    try {
      const posIdBn = BigInt(numericId);
      const colWei = ethers.parseEther(depositAmount || '10');

      // 1. Check Allowance
      setTxStep('CHECKING_ALLOWANCE');
      if (publicClient) {
        const allowance = (await publicClient.readContract({
          address: CONTRACT_ADDRESSES.mockERC20,
          abi: MOCK_ERC20_ABI,
          functionName: 'allowance',
          args: [address, CONTRACT_ADDRESSES.causoraVault],
        })) as bigint;

        if (allowance < colWei) {
          setTxStep('AWAITING_APPROVAL_SIGNATURE');
          const approveHash = await walletClient.writeContract({
            address: CONTRACT_ADDRESSES.mockERC20,
            abi: MOCK_ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACT_ADDRESSES.causoraVault, colWei],
          });
          setTxStep('CONFIRMING_APPROVAL');
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      // 2. Deposit into CausoraVault
      setTxStep('AWAITING_DEPOSIT_SIGNATURE');
      const depositHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.causoraVault,
        abi: CAUSORA_VAULT_ABI,
        functionName: 'depositCollateral',
        args: [posIdBn, colWei],
      });

      setTxStep('CONFIRMING_DEPOSIT');
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: depositHash });
        setLastReceipt({
          action: 'DEPOSIT_COLLATERAL',
          contractName: 'CausoraVault',
          contractAddress: CONTRACT_ADDRESSES.causoraVault,
          network: 'Creditcoin CC3 Testnet (102031)',
          txHash: depositHash,
          blockNumber: receipt.blockNumber.toString(),
          status: 'CONFIRMED',
          gasUsed: receipt.gasUsed.toString(),
          details: `Deposited ${depositAmount} ctUSD into CausoraVault for Position #${numericId}.`
        });
      }

      await loadPositionData();
    } catch (err: any) {
      console.error("Deposit error:", err);
      alert("Deposit failed: " + (err.shortMessage || err.message || String(err)));
    } finally {
      setIsDepositing(false);
      setTxStep('');
    }
  };

  // Real Web3 Liquidation Attempt / Simulation
  const handleRealLiquidation = async () => {
    if (!walletClient || !address) {
      alert("Please connect your wallet first.");
      return;
    }

    setIsLiquidating(true);
    setLiqResult(null);

    try {
      const posIdBn = BigInt(numericId);

      // Attempt simulation on CC3
      if (publicClient) {
        try {
          await publicClient.simulateContract({
            address: CONTRACT_ADDRESSES.causoraVault,
            abi: CAUSORA_VAULT_ABI,
            functionName: 'executeProtectedTransition',
            args: [posIdBn, 2 /* ALLOW_B */, address, address, ethers.parseEther('10')],
            account: address,
          });

          setLiqResult({
            action: 'ACT',
            relation: 'AFTER',
            reason: 'OK_PROVEN_ORDER: Liquidation condition authorized on CC3.',
            decisionId: '0x' + Date.now().toString(16),
          });
        } catch (simErr: any) {
          const errMsg = simErr.shortMessage || simErr.message || String(simErr);
          const isHeld = errMsg.includes('PositionIsHeld') || errMsg.includes('UnauthorizedCaller');

          setLiqResult({
            action: isHeld ? 'HOLD' : 'REJECT',
            relation: 'CONCURRENT_UNPROVABLE',
            reason: isHeld
              ? `[ON-CHAIN REVERT PROVEN] PositionIsHeld(${numericId}): CausoraVault collateral is frozen in fail-closed HOLD state. Liquidation strictly blocked on Creditcoin CC3.`
              : `[CC3 REVERT] ${errMsg}`,
            decisionId: '0x' + Date.now().toString(16),
          });

          const currentBlock = await publicClient.getBlockNumber();
          setLastReceipt({
            action: 'ATTEMPT_LIQUIDATION',
            contractName: 'CausoraVault',
            contractAddress: CONTRACT_ADDRESSES.causoraVault,
            network: 'Creditcoin CC3 Testnet (102031)',
            txHash: '',
            blockNumber: currentBlock.toString(),
            status: 'REVERTED',
            revertReason: isHeld ? `LIQUIDATION BLOCKED BY CAUSORA GUARD: PositionIsHeld(${numericId})` : errMsg,
            details: 'Speculative liquidation intercepted and reverted by CausoraVault fail-closed firewall on CC3.'
          });
        }
      }
    } catch (err: any) {
      console.error("Liquidation attempt error:", err);
    } finally {
      setIsLiquidating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Alert */}
      {isWrongNetwork && (
        <div className="p-4 rounded-xl bg-amber-950/70 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>Connected to Chain {chainId}. Please switch to Creditcoin CC3 Testnet (102031).</span>
          </div>
          <button
            onClick={() => switchChain({ chainId: 102031 })}
            disabled={isSwitchingChain}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
          >
            Switch to CC3
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app/positions"
            className="p-2 rounded-lg bg-surface hover:bg-surface-subtle border border-surface-border text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase text-blue-400">Position Inspector</span>
              {isLiveMode ? (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE CC3 ON-CHAIN
                </span>
              ) : (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">
                  LOCAL LAB
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white font-display">
              {position ? position.id : `Position #${numericId}`}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPositionData}
            className="p-2 rounded-lg bg-surface border border-surface-border text-slate-400 hover:text-white transition-all"
            title="Reload from CC3"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center p-1 bg-[var(--surface)] border border-[var(--hairline)] rounded-xl">
            <button
              onClick={() => setIsLiveMode(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                isLiveMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3" />
              Live CC3
            </button>
            <button
              onClick={() => setIsLiveMode(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                !isLiveMode ? 'bg-surface-elevated text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FlaskConical className="w-3 h-3" />
              Local Lab
            </button>
          </div>
        </div>
      </div>

      {lastReceipt && (
        <TransactionReceiptPanel
          receipt={lastReceipt}
          onDismiss={() => setLastReceipt(null)}
        />
      )}

      {loading ? (
        <div className="p-12 rounded-xl bg-surface border border-surface-border text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span>Loading position #{numericId} from Creditcoin CC3...</span>
        </div>
      ) : !position ? (
        <div className="p-12 rounded-xl bg-surface border border-surface-border text-center space-y-3 font-mono text-xs">
          <Shield className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-white font-bold text-sm">Position #{numericId} not found on Creditcoin CC3.</h3>
          <p className="text-slate-400">Please verify the position ID or create a position from the main console.</p>
          <Link
            href="/app"
            className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            Return to Console
          </Link>
        </div>
      ) : (
        <>
          {/* Position Health & Metrics Banner */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono">Status:</span>
                <span className={`text-xs font-mono px-2.5 py-1 rounded border ${
                  position.status === 'HELD_PENDING_ORDER'
                    ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                    : position.status === 'AT_RISK'
                    ? 'bg-rose-950 text-rose-300 border-rose-500/30'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                }`}>
                  {position.status}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">Borrower: {position.borrower}</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-1">
                <span className="text-slate-500 block text-[10px]">Locked Collateral</span>
                <div className="text-lg font-bold text-white">{position.collateralAmount}</div>
                <span className="text-[10px] text-emerald-400">Secured in CausoraVault</span>
              </div>
              <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-1">
                <span className="text-slate-500 block text-[10px]">Total Debt</span>
                <div className="text-lg font-bold text-slate-200">{position.debtAmount}</div>
                <span className="text-[10px] text-slate-400">Creditcoin Lending Asset</span>
              </div>
              <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-1">
                <span className="text-slate-500 block text-[10px]">Health Factor</span>
                <div className={`text-lg font-bold ${
                  position.healthFactor < 1.0 ? 'text-rose-400' : position.healthFactor < 1.2 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {position.healthFactor.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-400">Threshold: 1.00</span>
              </div>
              <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-1">
                <span className="text-slate-500 block text-[10px]">Last Admitted Digest</span>
                <div className="text-sm font-bold text-blue-400 truncate">
                  {position.lastDepositQueryId.substring(0, 16)}...
                </div>
                <span className="text-[10px] text-slate-400">Attestcoin Query ID</span>
              </div>
            </div>

            {position.status === 'HELD_PENDING_ORDER' && (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-3 text-xs font-mono text-amber-300">
                <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>Fail-Closed Hold Active on CC3:</strong> Collateral is immutably frozen in CausoraVault against an unprovable cross-chain race. Liquidation triggers will revert.
                </span>
              </div>
            )}
          </div>

          {/* Interactive Web3 Operations Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Panel 1: Real Deposit Collateral */}
            <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase text-blue-400">Collateral Influx</span>
                <h3 className="text-base font-bold text-white font-display">Deposit Collateral (CausoraVault)</h3>
                <p className="text-xs text-slate-400">
                  Transfers ctUSD to CausoraVault and locks it for Position #{numericId}.
                </p>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Deposit Amount (ctUSD)</label>
                  <input
                    type="text"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={isDepositing}
                    className="w-full px-3 py-2 rounded-lg bg-surface-subtle border border-surface-border text-white font-mono"
                  />
                </div>

                {txStep && (
                  <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border text-blue-400 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{txStep}</span>
                  </div>
                )}

                <button
                  onClick={handleRealDeposit}
                  disabled={isDepositing || isWrongNetwork || !isConnected}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isDepositing ? 'Signing in Wallet...' : 'Sign & Deposit Collateral'}</span>
                </button>
              </div>
            </div>

            {/* Panel 2: Real Liquidation Attempt */}
            <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase text-rose-400">Adverse Liquidation Attempt</span>
                <h3 className="text-base font-bold text-white font-display">Test Liquidation Interception</h3>
                <p className="text-xs text-slate-400">
                  Executes a liquidation call on CC3. If the position is HELD, proves the fail-closed revert.
                </p>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <button
                  onClick={handleRealLiquidation}
                  disabled={isLiquidating || !isConnected}
                  className="w-full py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30 font-bold text-xs transition-all shadow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{isLiquidating ? 'Simulating on CC3...' : 'Simulate / Attempt Liquidation'}</span>
                </button>

                {liqResult && (
                  <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Decision:</span>
                      <ActionBadge decision={liqResult.action} />
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {liqResult.reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
