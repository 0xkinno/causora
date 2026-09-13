"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { MOCK_POSITIONS } from '@/lib/mockData';
import { LendingPosition } from '@/lib/types';
import { ActionBadge } from '@/components/ActionBadge';
import { Web3ActionModal, ActionType } from '@/components/Web3ActionModal';
import { TransactionReceiptPanel, TxReceiptData } from '@/components/TransactionReceiptPanel';
import {
  CONTRACT_ADDRESSES,
  LENDING_POSITION_MANAGER_ABI,
  CAUSORA_VAULT_ABI
} from '@/lib/contracts';
import {
  ArrowLeft,
  ExternalLink,
  PlusCircle,
  Shield,
  CheckCircle2,
  Lock,
  RefreshCw,
  Zap,
  FlaskConical,
  Coins
} from 'lucide-react';

export default function PositionsListPage() {
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [positions, setPositions] = useState<LendingPosition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Web3 modal
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [modalAction, setModalAction] = useState<ActionType>('CREATE_POSITION');
  const [selectedPosId, setSelectedPosId] = useState<string>('1001');
  const [lastReceipt, setLastReceipt] = useState<TxReceiptData | null>(null);

  const loadPositions = async () => {
    setLoading(true);
    if (!isLiveMode) {
      setPositions(MOCK_POSITIONS);
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

      const countBN = await lendingManager.getPositionCount();
      const count = Number(countBN);

      if (count === 0) {
        setPositions([]);
      } else {
        const loaded: LendingPosition[] = [];
        for (let i = 0; i < Math.min(count, 20); i++) {
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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPositions();
  }, [isLiveMode]);

  const openAction = (action: ActionType, posId?: string) => {
    setModalAction(action);
    if (posId) {
      setSelectedPosId(posId.replace(/[^0-9]/g, '') || '1001');
    }
    setIsActionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="p-2 rounded-lg bg-surface hover:bg-surface-subtle border border-surface-border text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase text-blue-400">Position Portfolio</span>
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
            <h1 className="text-2xl font-bold text-white font-display">All Guarded Positions</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLiveMode && (
            <>
              <button
                onClick={() => openAction('CREATE_POSITION')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Position</span>
              </button>
              <button
                onClick={() => openAction('MINT_TEST_TOKENS')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/30 font-semibold text-xs transition-all"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Faucet</span>
              </button>
            </>
          )}

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
        <div className="p-8 rounded-xl bg-surface border border-surface-border text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span>Loading positions from Creditcoin CC3 contract...</span>
        </div>
      ) : positions.length === 0 ? (
        <div className="p-12 rounded-xl bg-surface border border-surface-border text-center space-y-3 font-mono text-xs">
          <Shield className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-400">No positions found on Creditcoin CC3 Testnet.</p>
          {isLiveMode && (
            <button
              onClick={() => openAction('CREATE_POSITION')}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500"
            >
              Create First CC3 Position
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {positions.map((pos) => {
            let statusBadge = "bg-emerald-950/80 text-emerald-400 border-emerald-500/30";
            if (pos.status === 'HELD_PENDING_ORDER') {
              statusBadge = "bg-amber-950/80 text-amber-400 border-amber-500/30";
            } else if (pos.status === 'LIQUIDATED') {
              statusBadge = "bg-slate-800 text-slate-400 border-slate-700";
            } else if (pos.status === 'AT_RISK') {
              statusBadge = "bg-rose-950/80 text-rose-400 border-rose-500/30";
            }

            const rawNumId = pos.id.replace(/[^0-9]/g, '') || '1001';

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

                  <div className="flex flex-wrap items-center gap-2">
                    {isLiveMode && (
                      <>
                        <button
                          onClick={() => openAction('DEPOSIT_COLLATERAL', rawNumId)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-mono transition-all font-semibold"
                        >
                          + Deposit
                        </button>
                        <button
                          onClick={() => openAction('MARK_AT_RISK', rawNumId)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-mono transition-all font-semibold"
                        >
                          Mark Risk
                        </button>
                        <button
                          onClick={() => openAction('RESOLVE_COLLATERAL_RACE', rawNumId)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition-all font-semibold"
                        >
                          Resolve
                        </button>
                      </>
                    )}

                    <Link
                      href={`/app/position/${pos.id}`}
                      className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-subtle border border-surface-border text-xs font-mono text-slate-200 transition-all flex items-center gap-1.5"
                    >
                      Audit
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-surface-subtle border border-surface-border text-xs font-mono">
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
                    <span className={pos.healthFactor < 1.0 ? "text-rose-400 font-bold" : pos.healthFactor < 1.2 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                      {pos.healthFactor.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Last Digest</span>
                    <span className="text-blue-400 truncate block text-[11px]">{pos.lastDepositQueryId.substring(0, 16)}...</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Web3 Modal */}
      <Web3ActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        defaultAction={modalAction}
        initialPositionId={selectedPosId}
        onSuccess={() => {
          loadPositions();
        }}
        onReceipt={(rec) => {
          setLastReceipt(rec);
        }}
      />
    </div>
  );
}
