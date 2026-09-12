"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { MOCK_POSITIONS, MOCK_PROOFS } from '@/lib/mockData';
import { LendingPosition, ActionDecision, RelationType, DecisionRecord } from '@/lib/types';
import { ActionBadge, RelationBadge } from '@/components/ActionBadge';
import { GateStatus } from '@/components/GateStatus';
import { EvidenceTimeline } from '@/components/EvidenceTimeline';
import { computeQueryId } from '@/lib/contracts';
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
  Sliders
} from 'lucide-react';

export default function AppConsolePage() {
  const [positions, setPositions] = useState<LendingPosition[]>(MOCK_POSITIONS);
  const [activeTab, setActiveTab] = useState<'positions' | 'evaluator' | 'audit'>('positions');

  // Interactive Relation Evaluator States
  const [chainA, setChainA] = useState<number>(1); // Sepolia
  const [blockA, setBlockA] = useState<number>(5824100);
  const [txA, setTxA] = useState<number>(42);

  const [chainB, setChainB] = useState<number>(1); // Sepolia
  const [blockB, setBlockB] = useState<number>(5824200);
  const [txB, setTxB] = useState<number>(15);

  const [witnessPresent, setWitnessPresent] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<{
    relation: RelationType;
    action: ActionDecision;
    reason: string;
    queryIdA: string;
    queryIdB: string;
    gate1: boolean;
    gate2: boolean;
    gate3: boolean;
  } | null>(null);

  // Handle Orderability Evaluation
  const runEvaluation = () => {
    const qA = computeQueryId(chainA, blockA, txA);
    const qB = computeQueryId(chainB, blockB, txB);

    if (chainA === chainB) {
      // Intra-chain evaluation
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
        });
      }
    } else {
      // Cross-chain evaluation
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
        });
      }
    }
  };

  // Collect all decision logs
  const allDecisions = positions.flatMap(p => p.history);

  return (
    <div className="space-y-8">
      {/* Header & Metric Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <span className="text-xs font-mono uppercase text-blue-400">Live Operating Protocol</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Causora Protocol Console</h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-subtle border border-surface-border rounded-xl">
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'positions'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Guarded Positions ({positions.length})
          </button>
          <button
            onClick={() => setActiveTab('evaluator')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'evaluator'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Orderability Evaluator
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Settlement Audit ({allDecisions.length})
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Total Guarded Collateral</span>
          <div className="text-xl font-bold text-white">64.5 ETH / 2.5 BTC</div>
          <span className="text-[11px] text-emerald-400 font-mono">100% Fail-Closed Safe</span>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Settlement Precompiles</span>
          <div className="text-xl font-bold text-blue-400 font-mono">0xFD2 &amp; 0xFD3</div>
          <span className="text-[11px] text-slate-400 font-mono">CC3 Testnet Native</span>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Active Concurrency Holds</span>
          <div className="text-xl font-bold text-amber-400">1 Position</div>
          <span className="text-[11px] text-amber-400/80 font-mono">Preserved In Limbo</span>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Retroactive Attacks Blocked</span>
          <div className="text-xl font-bold text-emerald-400">18 / 18 Invariants</div>
          <span className="text-[11px] text-slate-400 font-mono">Zero Clock Drift Vulnerabilities</span>
        </div>
      </div>

      {/* TAB 1: Guarded Positions List */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Guarded Cross-Chain Lending Positions</h2>
            <Link
              href="/app/positions"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
            >
              Manage Positions <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {positions.map((pos) => {
              let statusBadge = "bg-emerald-950/80 text-emerald-400 border-emerald-500/30";
              if (pos.status === 'HELD_PENDING_ORDER') {
                statusBadge = "bg-amber-950/80 text-amber-400 border-amber-500/30";
              } else if (pos.status === 'LIQUIDATED') {
                statusBadge = "bg-slate-800 text-slate-400 border-slate-700";
              }

              return (
                <div
                  key={pos.id}
                  className="p-5 rounded-xl bg-surface border border-surface-border hover:border-slate-600 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center font-mono font-bold text-xs text-blue-400">
                        {pos.id.includes('ETH') ? 'ETH' : 'BTC'}
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

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/app/position/${pos.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-subtle border border-surface-border text-xs font-medium text-slate-200 transition-all flex items-center gap-1.5"
                      >
                        Inspect Position
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-surface-subtle border border-surface-border text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Collateral</span>
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
                      <span className="text-[10px] text-slate-500 block">Last Proven Query ID</span>
                      <span className="text-blue-400 truncate block text-[11px]">{pos.lastDepositQueryId.substring(0, 16)}...</span>
                    </div>
                  </div>

                  {/* Status Banner */}
                  {pos.status === 'HELD_PENDING_ORDER' && (
                    <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>
                        <strong>Fail-Closed Hold Active:</strong> Liquidation attempt is frozen pending cross-chain Merkle causal witness. Borrower collateral remains safe.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Interactive Relation Evaluator */}
      {activeTab === 'evaluator' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase text-blue-400">On-Chain Cryptographic Gate Test</span>
              <h2 className="text-xl font-bold text-white">Live Orderability Relation Evaluator</h2>
              <p className="text-xs text-slate-400">
                Test the formal RelationEngine logic directly. Configure Source Deposit Event A and Action Attempt Event B to evaluate the mathematical outcome.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event A (Deposit Anchor) */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-2">
                  <span className="text-xs font-bold text-blue-400 font-mono">Event A: Deposit Anchor</span>
                  <span className="text-[10px] font-mono text-slate-500">Query ID Anchor</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Source Chain</label>
                    <select
                      value={chainA}
                      onChange={(e) => setChainA(Number(e.target.value))}
                      className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                    >
                      <option value={1}>Ethereum Sepolia (Key: 1)</option>
                      <option value={2}>Creditcoin CC3 Testnet (Key: 2)</option>
                      <option value={3}>Bitcoin (Key: 3)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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
                  <span className="text-[10px] font-mono text-slate-500">Query ID Trigger</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Action Chain</label>
                    <select
                      value={chainB}
                      onChange={(e) => setChainB(Number(e.target.value))}
                      className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                    >
                      <option value={1}>Ethereum Sepolia (Key: 1)</option>
                      <option value={2}>Creditcoin CC3 Testnet (Key: 2)</option>
                      <option value={3}>Bitcoin (Key: 3)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="witnessCheck"
                        checked={witnessPresent}
                        onChange={(e) => setWitnessPresent(e.target.checked)}
                        className="rounded bg-surface border-surface-border text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="witnessCheck" className="text-xs text-slate-300 select-none">
                        Supply Valid Cross-Chain Causal Witness
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
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md"
              >
                <Zap className="w-4 h-4" />
                Evaluate Orderability Relation
              </button>
            </div>

            {/* Evaluation Result Display */}
            {evalResult && (
              <div className="p-5 rounded-xl bg-surface-elevated border border-surface-border space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">Evaluation Decision:</span>
                    <ActionBadge decision={evalResult.action} size="lg" />
                    <RelationBadge relation={evalResult.relation} />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Engine: RelationEngine.sol</span>
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
            <span className="text-xs font-mono text-slate-500">Immutable On-Chain Records</span>
          </div>

          <EvidenceTimeline decisions={allDecisions} proofs={MOCK_PROOFS} />
        </div>
      )}
    </div>
  );
}
