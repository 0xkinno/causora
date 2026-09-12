"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MOCK_POSITIONS, MOCK_PROOFS } from '@/lib/mockData';
import { LendingPosition, ActionDecision, RelationType, DecisionRecord } from '@/lib/types';
import { ActionBadge, RelationBadge } from '@/components/ActionBadge';
import { GateStatus } from '@/components/GateStatus';
import { EvidenceTimeline } from '@/components/EvidenceTimeline';
import { computeQueryId } from '@/lib/contracts';
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
  RefreshCw
} from 'lucide-react';

export default function PositionDetailPage() {
  const params = useParams();
  const positionId = (params?.id as string) || "POS-001-ETH-SEP";

  const initialPos = MOCK_POSITIONS.find(p => p.id === positionId) || MOCK_POSITIONS[0];
  const [position, setPosition] = useState<LendingPosition>(initialPos);

  // Deposit Top-Up Form State
  const [depositAmount, setDepositAmount] = useState<string>("10.0");
  const [depositBlock, setDepositBlock] = useState<number>(5824300);
  const [depositTxIndex, setDepositTxIndex] = useState<number>(5);
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);

  // Liquidation Attempt Form State
  const [liqBlock, setLiqBlock] = useState<number>(5824250);
  const [liqTxIndex, setLiqTxIndex] = useState<number>(10);
  const [liqWitness, setLiqWitness] = useState<boolean>(false);
  const [isLiquidating, setIsLiquidating] = useState<boolean>(false);
  const [liqResult, setLiqResult] = useState<{
    action: ActionDecision;
    relation: RelationType;
    reason: string;
    decisionId: string;
  } | null>(null);

  // Handle Simulated Cross-Chain Deposit
  const handleDeposit = () => {
    setIsDepositing(true);
    setTimeout(() => {
      const newQueryId = computeQueryId(1, depositBlock, depositTxIndex);
      const currentCollateralNum = parseFloat(position.collateralAmount);
      const addedCollateral = parseFloat(depositAmount) || 0;
      const newCollateral = `${(currentCollateralNum + addedCollateral).toFixed(1)} ETH`;

      setPosition(prev => ({
        ...prev,
        collateralAmount: newCollateral,
        healthFactor: prev.healthFactor + 0.35,
        lastDepositQueryId: newQueryId,
        lastDepositTimestamp: Math.floor(Date.now() / 1000),
      }));

      setIsDepositing(false);
      setDepositSuccess(`Successfully registered deposit proof for Query ID ${newQueryId.substring(0, 14)}... Collateral updated on CC3.`);
    }, 600);
  };

  // Handle Guarded Liquidation Attempt
  const handleLiquidation = () => {
    setIsLiquidating(true);
    setTimeout(() => {
      const actionQueryId = computeQueryId(1, liqBlock, liqTxIndex);
      const isSepolia = position.id.includes('ETH');

      let action: ActionDecision = 'REJECT';
      let relation: RelationType = 'BEFORE';
      let reason = '';

      if (isSepolia) {
        // Intra-chain check against last deposit (5824100, 42)
        if (liqBlock > 5824100 || (liqBlock === 5824100 && liqTxIndex > 42)) {
          action = 'ACT';
          relation = 'AFTER';
          reason = `OK_PROVEN_ORDER_AFTER: Liquidation trigger at Sepolia block ${liqBlock} strictly succeeded borrower deposit at 5824100. Liquidation executed.`;
        } else {
          action = 'REJECT';
          relation = 'BEFORE';
          reason = `ERR_ORDER_INVALID_PRIOR: Liquidation event at block ${liqBlock} occurred prior to borrower deposit at 5824100. Retroactive liquidation prevented.`;
        }
      } else {
        // Cross-chain (Bitcoin vs Sepolia)
        if (liqWitness) {
          action = 'ACT';
          relation = 'AFTER';
          reason = 'OK_CROSS_CHAIN_WITNESS: Valid Merkle causal witness verified by CausoraGuard. Order proven.';
        } else {
          action = 'HOLD';
          relation = 'CONCURRENT_UNPROVABLE';
          reason = 'ERR_CROSS_CHAIN_UNORDERED_HOLD: No cross-chain causal witness provided. Position held in limbo to protect collateral.';
        }
      }

      const newDecision: DecisionRecord = {
        decisionId: `0xdec${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
        positionId: position.id,
        depositQueryId: position.lastDepositQueryId,
        actionQueryId: actionQueryId,
        actionType: 'LIQUIDATION',
        relation: relation,
        action: action,
        reasonCode: action === 'ACT' ? 'OK_PROVEN_ORDER' : action === 'HOLD' ? 'ERR_UNORDERED_HOLD' : 'ERR_RETROACTIVE_REJECT',
        reasonDescription: reason,
        timestamp: Math.floor(Date.now() / 1000),
        txHash: `0x${Math.random().toString(16).substring(2, 34)}`,
        blockNumber: 10495,
        gasUsed: action === 'ACT' ? 84200 : 41500
      };

      setLiqResult({
        action,
        relation,
        reason,
        decisionId: newDecision.decisionId
      });

      setPosition(prev => ({
        ...prev,
        status: action === 'ACT' ? 'LIQUIDATED' : action === 'HOLD' ? 'HELD_PENDING_ORDER' : prev.status,
        history: [newDecision, ...prev.history]
      }));

      setIsLiquidating(false);
    }, 600);
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Position Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/app/positions"
            className="p-2 rounded-lg bg-surface hover:bg-surface-subtle border border-surface-border text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white font-mono">{position.id}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-subtle border border-surface-border text-slate-300 font-mono">
                {position.status}
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">Borrower: {position.borrower}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-surface border border-surface-border text-right font-mono">
            <span className="text-[10px] text-slate-500 block">Health Factor</span>
            <span className={`text-lg font-bold ${position.healthFactor < 1.0 ? "text-rose-400" : position.healthFactor < 1.2 ? "text-amber-400" : "text-emerald-400"}`}>
              {position.healthFactor.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Position Parameters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Guarded Collateral</span>
          <div className="text-xl font-bold text-white font-mono">{position.collateralAmount}</div>
          <span className="text-[11px] text-emerald-400 font-mono">Verified (0xFD2)</span>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Outstanding Debt</span>
          <div className="text-xl font-bold text-slate-200 font-mono">{position.debtAmount}</div>
          <span className="text-[11px] text-slate-400 font-mono">Creditcoin CC3 Asset</span>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Last Proven Anchor</span>
          <div className="text-xs font-bold text-blue-400 font-mono truncate">{position.lastDepositQueryId.substring(0, 16)}...</div>
          <span className="text-[11px] text-slate-400 font-mono">Packed 72-Byte Query</span>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Fail-Closed Status</span>
          <div className="text-base font-bold text-white">
            {position.status === 'HELD_PENDING_ORDER' ? (
              <span className="text-amber-400 flex items-center gap-1">
                <Lock className="w-4 h-4" /> Preserved In Limbo
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Active &amp; Guarded
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">CausoraGuard Active</span>
        </div>
      </div>

      {/* Interactive Actions Tabs: Top-up vs Attempt Liquidation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top-Up Collateral Simulator */}
        <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Top-Up Cross-Chain Collateral</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Source: Sepolia</span>
          </div>

          <p className="text-xs text-slate-300">
            Submit a deposit on Sepolia and generate an Attestcoin inclusion proof verified by Creditcoin `0xFD2` to increase collateral and health factor.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Deposit Amount (ETH)</label>
              <input
                type="text"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Sepolia Block</label>
                <input
                  type="number"
                  value={depositBlock}
                  onChange={(e) => setDepositBlock(Number(e.target.value))}
                  className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tx Index</label>
                <input
                  type="number"
                  value={depositTxIndex}
                  onChange={(e) => setDepositTxIndex(Number(e.target.value))}
                  className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={isDepositing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50"
          >
            {isDepositing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying Inclusion via 0xFD2...</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5" />
                <span>Deposit &amp; Prove Collateral</span>
              </>
            )}
          </button>

          {depositSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
              {depositSuccess}
            </div>
          )}
        </div>

        {/* Attempt Liquidation Simulator */}
        <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Attempt Guarded Liquidation</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Guard: CausoraGuard.sol</span>
          </div>

          <p className="text-xs text-slate-300">
            Submit a liquidation event. The RelationEngine compares the event against the borrower&apos;s last proven deposit before granting execution.
          </p>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Liquidation Block</label>
                <input
                  type="number"
                  value={liqBlock}
                  onChange={(e) => setLiqBlock(Number(e.target.value))}
                  className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tx Index</label>
                <input
                  type="number"
                  value={liqTxIndex}
                  onChange={(e) => setLiqTxIndex(Number(e.target.value))}
                  className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            {!position.id.includes('ETH') && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="liqWitnessCheck"
                  checked={liqWitness}
                  onChange={(e) => setLiqWitness(e.target.checked)}
                  className="rounded bg-surface border-surface-border text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="liqWitnessCheck" className="text-xs text-slate-300 select-none">
                  Provide Cross-Chain Merkle Causal Witness
                </label>
              </div>
            )}
          </div>

          <button
            onClick={handleLiquidation}
            disabled={isLiquidating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50"
          >
            {isLiquidating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating Orderability Engine...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Submit Liquidation to CausoraGuard</span>
              </>
            )}
          </button>

          {liqResult && (
            <div className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Verdict:</span>
                <ActionBadge decision={liqResult.action} size="md" />
              </div>
              <div className="text-slate-300 text-[11px] leading-relaxed">
                {liqResult.reason}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Trail for this Position */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">Immutable Settlement Audit Trail</h3>
        <EvidenceTimeline decisions={position.history} proofs={MOCK_PROOFS} />
      </div>
    </div>
  );
}
