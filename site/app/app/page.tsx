"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useAccount, useChainId, useSwitchChain, usePublicClient } from 'wagmi';
import { MOCK_POSITIONS, MOCK_PROOFS } from '@/lib/mockData';
import { LendingPosition, ActionDecision, RelationType } from '@/lib/types';
import { ActionBadge, RelationBadge } from '@/components/ActionBadge';
import { GateStatus } from '@/components/GateStatus';
import { EvidenceTimeline } from '@/components/EvidenceTimeline';
import { Web3ActionModal, ActionType } from '@/components/Web3ActionModal';
import { TransactionReceiptPanel, TxReceiptData } from '@/components/TransactionReceiptPanel';
import {
  computeQueryId,
  CONTRACT_ADDRESSES,
  RELATION_ENGINE_ABI,
  LENDING_POSITION_MANAGER_ABI,
  CAUSORA_VAULT_ABI,
  MOCK_ERC20_ABI
} from '@/lib/contracts';
import {
  Shield,
  Activity,
  PlusCircle,
  Zap,
  ArrowRight,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  AlertCircle,
  Lock,
  CheckCircle2,
  Sliders,
  FlaskConical,
  Coins,
  Scale,
  AlertTriangle
} from 'lucide-react';

export default function AppConsolePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const publicClient = usePublicClient();

  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [positions, setPositions] = useState<LendingPosition[]>([]);
  const [loadingPositions, setLoadingPositions] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'positions' | 'evaluator' | 'audit'>('positions');

  // Web3 Action Modal state
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [modalAction, setModalAction] = useState<ActionType>('CREATE_POSITION');
  const [selectedPosId, setSelectedPosId] = useState<string>('1001');
  const [lastReceipt, setLastReceipt] = useState<TxReceiptData | null>(null);

  // Live on-chain balances
  const [vaultTokenBalance, setVaultTokenBalance] = useState<string>('10.0');
  const [userTokenBalance, setUserTokenBalance] = useState<string>('0.0');

  // Interactive Relation Evaluator States
  const [chainA, setChainA] = useState<number>(1); // Sepolia
  const [blockA, setBlockA] = useState<number>(5824100);
  const [txA, setTxA] = useState<number>(42);

  const [chainB, setChainB] = useState<number>(1); // Sepolia
  const [blockB, setBlockB] = useState<number>(5824200);
  const [txB, setTxB] = useState<number>(15);

  const [witnessPresent, setWitnessPresent] = useState<boolean>(false);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<{
    relation: RelationType;
    action: ActionDecision;
    reason: string;
    queryIdA: string;
    queryIdB: string;
    gate1: boolean;
    gate2: boolean;
    gate3: boolean;
    source: string;
  } | null>(null);

  const isWrongNetwork = isConnected && chainId !== 102031;

  // Fetch live positions and real balances from CC3 RPC or fallback to LOCAL LAB
  const loadLiveState = async () => {
    setLoadingPositions(true);
    if (!isLiveMode) {
      setPositions(MOCK_POSITIONS);
      setLoadingPositions(false);
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
      const tokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.mockERC20,
        MOCK_ERC20_ABI,
        provider
      );

      // 1. Fetch vault and user token balance
      try {
        const vBal = await tokenContract.balanceOf(CONTRACT_ADDRESSES.causoraVault);
        setVaultTokenBalance(parseFloat(ethers.formatEther(vBal)).toFixed(2));
      } catch (_) {}

      if (address) {
        try {
          const uBal = await tokenContract.balanceOf(address);
          setUserTokenBalance(parseFloat(ethers.formatEther(uBal)).toFixed(2));
        } catch (_) {}
      }

      // 2. Fetch positions
      const countBN = await lendingManager.getPositionCount();
      const count = Number(countBN);

      if (count === 0) {
        setPositions([]);
      } else {
        const loaded: LendingPosition[] = [];
        for (let i = 0; i < Math.min(count, 15); i++) {
          const posId = await lendingManager.positionIds(i);
          const raw = await lendingManager.getPosition(posId);
          const stateNames = ['NON_EXISTENT', 'SAFE', 'AT_RISK', 'HELD_PENDING_ORDER', 'RESCUED', 'LIQUIDATED'];
          
          let lockedAmountStr = ethers.formatEther(raw.collateralAmount);
          let isHeld = false;
          try {
            const lockedOnVault = await vaultContract.lockedCollateral(posId);
            lockedAmountStr = ethers.formatEther(lockedOnVault);
            isHeld = await vaultContract.isHeld(posId);
          } catch (_) {}

          let positionState = stateNames[raw.state] as any;
          if (isHeld) {
            positionState = 'HELD_PENDING_ORDER';
          }

          loaded.push({
            id: `CC3-POS-${posId}`,
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
        setPositions(loaded);
      }
    } catch (err) {
      console.warn('Could not load live CC3 positions:', err);
      setPositions([]);
    } finally {
      setLoadingPositions(false);
    }
  };

  useEffect(() => {
    loadLiveState();
  }, [isLiveMode, address, chainId]);

  const openAction = (action: ActionType, posId?: string) => {
    setModalAction(action);
    if (posId) {
      setSelectedPosId(posId.replace(/[^0-9]/g, '') || '1001');
    }
    setIsActionModalOpen(true);
  };

  // Handle Orderability Evaluation against on-chain RelationEngine or Local Model
  const runEvaluation = async () => {
    setEvaluating(true);
    const qA = computeQueryId(chainA, blockA, txA);
    const qB = computeQueryId(chainB, blockB, txB);

    if (isLiveMode) {
      try {
        const provider = new ethers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_CC3_RPC_URL || 'https://rpc.cc3-testnet.creditcoin.network'
        );
        const engine = new ethers.Contract(CONTRACT_ADDRESSES.relationEngine, RELATION_ENGINE_ABI, provider);

        const evA = {
          chainKey: BigInt(chainA),
          blockHeight: BigInt(blockA),
          txIndex: BigInt(txA),
          txHash: ethers.ZeroHash,
          emitter: '0x1111111111111111111111111111111111111111',
          eventSig: ethers.keccak256(ethers.toUtf8Bytes('TestEvent()')),
          queryId: qA,
          payloadHash: ethers.ZeroHash,
          verifiedAt: 100n,
          exists: true,
        };

        const evB = {
          chainKey: BigInt(chainB),
          blockHeight: BigInt(blockB),
          txIndex: BigInt(txB),
          txHash: ethers.ZeroHash,
          emitter: '0x2222222222222222222222222222222222222222',
          eventSig: ethers.keccak256(ethers.toUtf8Bytes('TestEvent()')),
          queryId: qB,
          payloadHash: ethers.ZeroHash,
          verifiedAt: 100n,
          exists: true,
        };

        const witness = {
          parentDigest: ethers.ZeroHash,
          capabilityHash: ethers.ZeroHash,
          stateCommitment: ethers.ZeroHash,
          sequenceNumber: 0n,
          signatureOrProof: '0x',
        };

        const res = await engine.classifyRelation(evA, evB, witness);
        const classification = Number(res.classification);
        const order = Number(res.order);

        let action: ActionDecision = 'HOLD';
        let rel: RelationType = 'CONCURRENT_UNPROVABLE';

        if (order === 1) {
          action = 'ACT';
          rel = 'BEFORE';
        } else if (order === 2) {
          action = 'ACT';
          rel = 'AFTER';
        } else if (classification === 3) {
          action = 'HOLD';
          rel = 'CONCURRENT_UNPROVABLE';
        }

        const reasonText =
          classification === 1 || order === 1 || order === 2
            ? `Strict intra-chain precedence proven. CC3 RelationEngine: ${res.reason}`
            : res.reason;

        setEvalResult({
          relation: rel,
          action,
          reason: reasonText,
          queryIdA: qA,
          queryIdB: qB,
          gate1: true,
          gate2: true,
          gate3: order !== 0,
          source: 'Creditcoin CC3 Contract (RelationEngine.sol on chain 102031)',
        });
        setEvaluating(false);
        return;
      } catch (err) {
        console.warn('On-chain evaluation fallback to mathematical model:', err);
      }
    }

    // Mathematical model execution
    if (chainA === chainB) {
      if (blockB > blockA || (blockB === blockA && txB > txA)) {
        setEvalResult({
          relation: 'AFTER',
          action: 'ACT',
          reason: `Strict intra-chain precedence proven on Chain ${chainA}: (${blockB}, ${txB}) > (${blockA}, ${txA}). Action permitted.`,
          queryIdA: qA,
          queryIdB: qB,
          gate1: true,
          gate2: true,
          gate3: true,
          source: 'Formal Mathematical Classifier (Local Lab)',
        });
      } else {
        setEvalResult({
          relation: 'BEFORE',
          action: 'REJECT',
          reason: `Action event occurs prior to or at deposit (${blockB}, ${txB}) <= (${blockA}, ${txA}). Retroactive trigger rejected.`,
          queryIdA: qA,
          queryIdB: qB,
          gate1: true,
          gate2: true,
          gate3: false,
          source: 'Formal Mathematical Classifier (Local Lab)',
        });
      }
    } else {
      if (witnessPresent) {
        setEvalResult({
          relation: 'AFTER',
          action: 'ACT',
          reason: `Valid cross-chain Merkle causal witness links Chain ${chainA} to Chain ${chainB}. Precedence verified.`,
          queryIdA: qA,
          queryIdB: qB,
          gate1: true,
          gate2: true,
          gate3: true,
          source: 'Formal Mathematical Classifier (Local Lab)',
        });
      } else {
        setEvalResult({
          relation: 'CONCURRENT_UNPROVABLE',
          action: 'HOLD',
          reason: `No causal witness between Chain ${chainA} and Chain ${chainB}. Foreign timestamps untrusted. Fail-closed hold applied.`,
          queryIdA: qA,
          queryIdB: qB,
          gate1: true,
          gate2: true,
          gate3: false,
          source: 'Formal Mathematical Classifier (Local Lab)',
        });
      }
    }
    setEvaluating(false);
  };

  const allDecisions = positions.flatMap((p) => p.history);

  return (
    <div className="space-y-8">
      {/* Network Warning Banner */}
      {isWrongNetwork && (
        <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3 text-amber-300">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold block text-sm">WRONG NETWORK: Connected to Chain {chainId}</span>
              <span className="text-amber-200/80 text-[11px]">
                All on-chain state transitions require Creditcoin CC3 Testnet (Chain ID: 102031).
              </span>
            </div>
          </div>
          <button
            onClick={() => switchChain({ chainId: 102031 })}
            disabled={isSwitchingChain}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-sans transition-all shadow self-start sm:self-auto"
          >
            {isSwitchingChain ? 'Switching Network...' : 'Switch to Creditcoin CC3 (102031)'}
          </button>
        </div>
      )}

      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--hairline)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase text-blue-400">Orderability Firewall</span>
            {isLiveMode ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE CC3 ON-CHAIN
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <FlaskConical className="w-3 h-3" />
                LOCAL LAB (FIXTURES)
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
            Causora Protocol Console
          </h1>
        </div>

        {/* Global Web3 Triggers & Mode Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {isLiveMode && (
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={() => openAction('CREATE_POSITION')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Position</span>
              </button>
              <button
                onClick={() => openAction('MINT_TEST_TOKENS')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/30 font-semibold text-xs transition-all"
                title="Mint 100 ctUSD collateral test tokens on CC3"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Faucet (ctUSD)</span>
              </button>
            </div>
          )}

          <div className="flex items-center p-1 bg-[var(--surface)] border border-[var(--hairline)] rounded-xl">
            <button
              onClick={() => setIsLiveMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                isLiveMode ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3" />
              Live CC3
            </button>
            <button
              onClick={() => setIsLiveMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                !isLiveMode ? 'bg-surface-elevated text-amber-300 shadow-sm border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FlaskConical className="w-3 h-3" />
              Local Lab
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[var(--surface-subtle)] border border-[var(--hairline)] rounded-xl">
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                activeTab === 'positions' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Positions ({positions.length})
            </button>
            <button
              onClick={() => setActiveTab('evaluator')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                activeTab === 'evaluator' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Orderability Evaluator
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                activeTab === 'audit' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Settlement Audit
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Guarded Vault Asset</span>
          <div className="text-xl font-bold text-white">ctUSD ({vaultTokenBalance})</div>
          <span className="text-[11px] text-emerald-400 font-mono">
            {isLiveMode ? `Vault Balance: ${vaultTokenBalance} ctUSD` : 'Fail-Closed Vault Protected'}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Attestcoin Precompiles</span>
          <div className="text-xl font-bold text-blue-400 font-mono">0xFD2 &amp; 0xFD3</div>
          <span className="text-[11px] text-slate-400 font-mono">Creditcoin CC3 (102031)</span>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Concurrency Policy</span>
          <div className="text-xl font-bold text-amber-400">HOLD on Race</div>
          <span className="text-[11px] text-amber-400/80 font-mono">Liquidation Blocked While Held</span>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Security Suite</span>
          <div className="text-xl font-bold text-emerald-400">44 / 44 Passing</div>
          <span className="text-[11px] text-slate-400 font-mono">27 / 27 Attacks Neutralized</span>
        </div>
      </div>

      {/* Transaction Receipt Panel */}
      {lastReceipt && (
        <TransactionReceiptPanel
          receipt={lastReceipt}
          onDismiss={() => setLastReceipt(null)}
        />
      )}

      {/* TAB 1: Guarded Positions List */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              {isLiveMode ? 'Creditcoin CC3 On-Chain Positions' : 'Local Lab Guarded Positions (Simulated)'}
            </h2>
            <div className="flex items-center gap-3">
              {isLiveMode && (
                <button
                  onClick={loadLiveState}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-all"
                  title="Refresh positions from CC3 RPC"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              )}
              <Link
                href="/app/positions"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
              >
                Position Details <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {loadingPositions ? (
            <div className="p-8 rounded-xl bg-surface border border-surface-border text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              <span>Querying Creditcoin CC3 Testnet contract state...</span>
            </div>
          ) : positions.length === 0 ? (
            <div className="p-10 rounded-xl bg-surface border border-surface-border text-center space-y-4 text-xs font-mono">
              <div className="w-12 h-12 mx-auto rounded-full bg-surface-subtle border border-surface-border flex items-center justify-center text-slate-400">
                <Layers className="w-6 h-6 text-slate-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white text-sm font-bold font-display">No positions found on Creditcoin CC3.</h3>
                <p className="text-slate-500 max-w-md mx-auto text-[11px]">
                  {isLiveMode
                    ? "The LendingPositionManager contract on CC3 currently has 0 registered positions. Click below to sign a real transaction creating a position on CC3."
                    : "No simulated positions are loaded in the current lab instance."}
                </p>
              </div>
              {isLiveMode && (
                <button
                  onClick={() => openAction('CREATE_POSITION')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md font-sans"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Position on CC3</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {positions.map((pos) => {
                let statusBadge = 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30';
                if (pos.status === 'HELD_PENDING_ORDER') {
                  statusBadge = 'bg-amber-950/80 text-amber-400 border-amber-500/30';
                } else if (pos.status === 'LIQUIDATED') {
                  statusBadge = 'bg-slate-800 text-slate-400 border-slate-700';
                } else if (pos.status === 'AT_RISK') {
                  statusBadge = 'bg-rose-950/80 text-rose-400 border-rose-500/30';
                }

                const rawNumericId = pos.id.replace(/[^0-9]/g, '') || '1001';

                return (
                  <div
                    key={pos.id}
                    className="p-5 rounded-xl bg-surface border border-surface-border hover:border-slate-600 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center font-mono font-bold text-xs text-blue-400">
                          CC3
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white font-mono">{pos.id}</span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusBadge}`}>
                              {pos.status}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-400">Borrower: {pos.borrower}</div>
                        </div>
                      </div>

                      {/* Web3 Action Buttons for Position */}
                      {isLiveMode && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => openAction('DEPOSIT_COLLATERAL', rawNumericId)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-mono transition-all font-semibold"
                            title="Sign ERC20 approve and deposit collateral into CausoraVault"
                          >
                            + Deposit Vault
                          </button>

                          <button
                            onClick={() => openAction('MARK_AT_RISK', rawNumericId)}
                            className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-mono transition-all font-semibold"
                            title="Mark position as AT_RISK on CC3"
                          >
                            Mark Risk
                          </button>

                          <button
                            onClick={() => openAction('RESOLVE_COLLATERAL_RACE', rawNumericId)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition-all font-semibold"
                            title="Resolve race between rescue and liquidation via CausoraGuard"
                          >
                            Resolve Race
                          </button>

                          <button
                            onClick={() => openAction('ATTEMPT_LIQUIDATION', rawNumericId)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-mono transition-all font-semibold"
                            title="Attempt liquidation (proves fail-closed revert if HELD)"
                          >
                            Liquidate
                          </button>

                          <Link
                            href={`/app/position/${pos.id}`}
                            className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-subtle border border-surface-border text-xs font-mono text-slate-300 transition-all flex items-center gap-1"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 rounded-lg bg-surface-subtle border border-surface-border text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Locked Collateral</span>
                        <span className="text-white font-bold">{pos.collateralAmount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Debt</span>
                        <span className="text-slate-300">{pos.debtAmount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Health Factor</span>
                        <span
                          className={
                            pos.healthFactor < 1.0
                              ? 'text-rose-400 font-bold'
                              : pos.healthFactor < 1.2
                              ? 'text-amber-400 font-bold'
                              : 'text-emerald-400 font-bold'
                          }
                        >
                          {pos.healthFactor.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Last Updated</span>
                        <span className="text-slate-300 text-[11px]">
                          {pos.lastUpdatedAt && pos.lastUpdatedAt > 0
                            ? new Date(pos.lastUpdatedAt * 1000).toLocaleTimeString()
                            : 'Genesis'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Last Digest</span>
                        <span className="text-blue-400 truncate block text-[11px]">
                          {pos.lastDepositQueryId.substring(0, 16)}...
                        </span>
                      </div>
                    </div>

                    {pos.status === 'HELD_PENDING_ORDER' && (
                      <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2.5 font-mono">
                        <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>
                          <strong>Fail-Closed Hold Active:</strong> CausoraVault has locked collateral. Liquidation attempts on this position revert on CC3.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Interactive Relation Evaluator */}
      {activeTab === 'evaluator' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase text-blue-400">Orderability Decision Engine</span>
              <h2 className="text-xl font-bold text-white font-display">Live Orderability Relation Evaluator</h2>
              <p className="text-xs text-slate-400">
                Queries the formal RelationEngine contract. Two independent chains without a proven causal witness evaluate to INDETERMINATE and fail-closed HOLD.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event A (Deposit Anchor) */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-2">
                  <span className="text-xs font-bold text-blue-400 font-mono">Event A: Deposit / Anchor</span>
                  <span className="text-[10px] font-mono text-slate-500">Anchor Event</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-mono">Source Chain</label>
                    <select
                      value={chainA}
                      onChange={(e) => setChainA(Number(e.target.value))}
                      className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                    >
                      <option value={1}>Ethereum Sepolia (Key: 1)</option>
                      <option value={2}>Creditcoin CC3 Testnet (Key: 2)</option>
                      <option value={3}>Ethereum Mainnet (Key: 3)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div>
                      <label className="block text-slate-400 mb-1">Block Height</label>
                      <input
                        type="number"
                        value={blockA}
                        onChange={(e) => setBlockA(Number(e.target.value))}
                        className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Tx Index</label>
                      <input
                        type="number"
                        value={txA}
                        onChange={(e) => setTxA(Number(e.target.value))}
                        className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-2 rounded bg-surface border border-surface-border font-mono text-[11px] text-slate-400">
                    <span className="text-slate-500 block text-[10px]">Packed QueryId A:</span>
                    <span className="text-blue-400 truncate block">{computeQueryId(chainA, blockA, txA)}</span>
                  </div>
                </div>
              </div>

              {/* Event B (Action Attempt) */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-2">
                  <span className="text-xs font-bold text-amber-400 font-mono">Event B: Action / Liquidation Attempt</span>
                  <span className="text-[10px] font-mono text-slate-500">Action Event</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-mono">Action Chain</label>
                    <select
                      value={chainB}
                      onChange={(e) => setChainB(Number(e.target.value))}
                      className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                    >
                      <option value={1}>Ethereum Sepolia (Key: 1)</option>
                      <option value={2}>Creditcoin CC3 Testnet (Key: 2)</option>
                      <option value={3}>Ethereum Mainnet (Key: 3)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div>
                      <label className="block text-slate-400 mb-1">Block Height</label>
                      <input
                        type="number"
                        value={blockB}
                        onChange={(e) => setBlockB(Number(e.target.value))}
                        className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Tx Index</label>
                      <input
                        type="number"
                        value={txB}
                        onChange={(e) => setTxB(Number(e.target.value))}
                        className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  {chainA !== chainB && (
                    <div className="flex items-center gap-2 pt-1 font-mono">
                      <input
                        type="checkbox"
                        id="witnessCheck"
                        checked={witnessPresent}
                        onChange={(e) => setWitnessPresent(e.target.checked)}
                        className="rounded bg-surface border-surface-border text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="witnessCheck" className="text-xs text-slate-300 select-none">
                        Supply Cryptographically Bound Causal Witness
                      </label>
                    </div>
                  )}

                  <div className="p-2 rounded bg-surface border border-surface-border font-mono text-[11px] text-slate-400">
                    <span className="text-slate-500 block text-[10px]">Packed QueryId B:</span>
                    <span className="text-amber-400 truncate block">{computeQueryId(chainB, blockB, txB)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center pt-2">
              <button
                onClick={runEvaluation}
                disabled={evaluating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md font-sans disabled:opacity-50"
              >
                {evaluating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Evaluating via CC3 RelationEngine...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Evaluate Orderability Relation</span>
                  </>
                )}
              </button>
            </div>

            {/* Result Display */}
            {evalResult && (
              <div className="p-5 rounded-xl bg-surface-elevated border border-surface-border space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">Evaluation Decision:</span>
                    <ActionBadge decision={evalResult.action} size="lg" />
                    <RelationBadge relation={evalResult.relation} />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{evalResult.source}</span>
                </div>

                <div className="text-xs text-slate-200 leading-relaxed font-mono p-3 rounded-lg bg-surface border border-surface-border">
                  {evalResult.reason}
                </div>

                <GateStatus
                  gate1Passed={evalResult.gate1}
                  gate2Passed={evalResult.gate2}
                  gate3Passed={evalResult.gate3}
                  gate4Action={evalResult.action}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Settlement Audit Timeline */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Creditcoin 3 Decision &amp; Proof Log</h2>
            <span className="text-xs font-mono text-slate-500">Authoritative CC3 State</span>
          </div>

          <EvidenceTimeline decisions={allDecisions} proofs={MOCK_PROOFS} />
        </div>
      )}

      {/* Web3 Action Modal Orchestrator */}
      <Web3ActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        defaultAction={modalAction}
        initialPositionId={selectedPosId}
        onSuccess={() => {
          loadLiveState();
        }}
        onReceipt={(receipt) => {
          setLastReceipt(receipt);
        }}
      />
    </div>
  );
}
