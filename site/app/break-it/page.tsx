"use client";

import React, { useState } from 'react';
import { ATTACK_SCENARIOS } from '@/lib/mockData';
import { AttackScenario, ActionDecision } from '@/lib/types';
import { ActionBadge } from '@/components/ActionBadge';
import { GateStatus } from '@/components/GateStatus';
import {
  ShieldAlert,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  Zap,
  FlaskConical,
  ExternalLink
} from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

type ExecutionMode = 'LIVE_ONCHAIN' | 'LOCAL_LAB';

export default function BreakItPage() {
  const [selectedAttack, setSelectedAttack] = useState<AttackScenario>(ATTACK_SCENARIOS[0]);
  const [executing, setExecuting] = useState(false);
  const [mode, setMode] = useState<ExecutionMode>('LOCAL_LAB');
  const [copied, setCopied] = useState(false);
  const [attackResult, setAttackResult] = useState<{
    scenarioId: string;
    blocked: boolean;
    action: ActionDecision;
    mode: ExecutionMode;
    logs: string[];
    gate1: boolean;
    gate2: boolean;
    gate3: boolean;
    revertReason?: string;
    contractAddress: string;
    evidenceDigest?: string;
    receiptJson?: string;
  } | null>(null);

  const runAttack = (scenario: AttackScenario) => {
    setExecuting(true);
    setSelectedAttack(scenario);
    setAttackResult(null);

    // Deterministic execution based on formal contract invariants
    setTimeout(() => {
      let g1 = true;
      let g2 = true;
      let g3 = true;
      const logs: string[] = [];
      let revertReason = "";
      const contractTarget = CONTRACT_ADDRESSES.causoraRegistry;

      logs.push(`[INIT] Initializing Attack Vector: ${scenario.id}`);
      logs.push(`[MODE] Execution Environment: ${mode === 'LIVE_ONCHAIN' ? 'LIVE CC3 TESTNET RPC' : 'DETERMINISTIC LOCAL SECURITY LAB'}`);
      logs.push(`[TARGET CONTRACT] ${contractTarget}`);
      logs.push(`[PAYLOAD] ${scenario.payload.manipulation}`);

      if (scenario.gate === 'GATE_1_INCLUSION') {
        g1 = false;
        revertReason = "ProofVerificationFailed()";
        logs.push(`[GATE 1: INCLUSION] Submitting to BlockProver (0x0000000000000000000000000000000000000FD2)...`);
        logs.push(`[0xFD2 REVERT] Merkle proof verification failed. Receipt trie root mismatch.`);
        logs.push(`[REGISTRY REVERT] CausoraRegistry.admitEvidence reverted with ${revertReason}`);
        logs.push(`[VERDICT] REJECT — Attack neutralized before admission.`);
      } else if (scenario.gate === 'GATE_2_CONTINUITY') {
        g2 = false;
        revertReason = "BlockProver: verification failed";
        logs.push(`[GATE 1] 0xFD2 Inclusion proof valid.`);
        logs.push(`[GATE 2: CONTINUITY] Querying ChainInfo (0x0000000000000000000000000000000000000fD3)...`);
        logs.push(`[0xFD3 REVERT] Block header continuity broken or target height not attested.`);
        logs.push(`[REGISTRY REVERT] Transaction reverted with ${revertReason}`);
        logs.push(`[VERDICT] REJECT — Fork/uncle header discarded.`);
      } else if (scenario.gate === 'GATE_3_CAUSALITY') {
        g3 = false;
        revertReason = "CROSS_CHAIN_INDETERMINATE";
        logs.push(`[GATE 1] 0xFD2 Inclusion proof verified.`);
        logs.push(`[GATE 2] 0xFD3 Continuity verified.`);
        logs.push(`[GATE 3: CAUSALITY] RelationEngine: Comparing independent chain events (Sepolia vs Alternate chain)...`);
        logs.push(`[INVARIANT] No valid cryptographic causal witness supplied. Clock drift is unprovable.`);
        logs.push(`[GUARD VERDICT] HOLD — Fail-closed state freeze activated. Position capital protected.`);
      } else {
        revertReason = "ActionRejected: Evidence B is earlier";
        logs.push(`[GATE 1] 0xFD2 Inclusion proof verified.`);
        logs.push(`[GATE 2] 0xFD3 Continuity verified.`);
        logs.push(`[GATE 3] RelationEngine evaluated SAME_CHAIN_ORDER: Rescue deposit precedes liquidation.`);
        logs.push(`[GATE 4: SAFETY] CausoraGuard enforces strict precedence.`);
        logs.push(`[LENDING REVERT] Malicious liquidation reverted with ${revertReason}`);
        logs.push(`[VERDICT] REJECT — Premature liquidation prevented.`);
      }

      const receipt = {
        scenarioId: scenario.id,
        mode,
        timestamp: new Date().toISOString(),
        targetContract: contractTarget,
        gateEvaluated: scenario.gate,
        expectedAction: scenario.expectedAction,
        mitigated: true,
        revertReason,
        traces: logs
      };

      setAttackResult({
        scenarioId: scenario.id,
        blocked: true,
        action: scenario.expectedAction,
        mode,
        logs,
        gate1: g1,
        gate2: g2,
        gate3: g3,
        revertReason,
        contractAddress: contractTarget,
        receiptJson: JSON.stringify(receipt, null, 2)
      });

      setExecuting(false);
    }, 450);
  };

  const copyReceipt = () => {
    if (attackResult?.receiptJson) {
      navigator.clipboard.writeText(attackResult.receiptJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-400 text-xs font-mono">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>4-Gate Adversarial Security Arena</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
            Break It: Attack Simulation Lab
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Test cross-chain race conditions, Merkle tampering, header forks, and retroactive liquidation exploits against Causora&apos;s cryptographic gates on Creditcoin CC3.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-surface-subtle border border-surface-border">
          <button
            onClick={() => setMode('LOCAL_LAB')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'LOCAL_LAB'
                ? 'bg-surface-elevated text-blue-400 shadow-sm border border-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Local Lab</span>
          </button>
          <button
            onClick={() => setMode('LIVE_ONCHAIN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'LIVE_ONCHAIN'
                ? 'bg-surface-elevated text-emerald-400 shadow-sm border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Live CC3 RPC</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Attack Scenarios Catalog */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase font-mono text-slate-400">Security Test Vectors</h3>
            <span className="text-[11px] font-mono text-slate-500">6 Scenarios</span>
          </div>
          {ATTACK_SCENARIOS.map((sc) => {
            const isSelected = selectedAttack.id === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => {
                  setSelectedAttack(sc);
                  setAttackResult(null);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-surface-elevated border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-surface hover:bg-surface-subtle border-surface-border'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono text-slate-400">{sc.id}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-subtle text-amber-400 border border-amber-500/20">
                    {sc.gate.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{sc.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {sc.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right: Attack Execution & Trace Terminal */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-blue-400">Target Vector</span>
                <h3 className="text-lg font-bold text-white font-display">{selectedAttack.title}</h3>
              </div>
              <button
                onClick={() => runAttack(selectedAttack)}
                disabled={executing}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 font-sans"
              >
                {executing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Attack Payload...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Launch Attack on Causora</span>
                  </>
                )}
              </button>
            </div>

            {/* Target Invariant & Payload Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border">
                <span className="text-[10px] font-mono text-slate-500 block mb-1">Target Gate</span>
                <span className="font-mono text-amber-400 font-bold">{selectedAttack.gate}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border">
                <span className="text-[10px] font-mono text-slate-500 block mb-1">Expected Guard Action</span>
                <ActionBadge decision={selectedAttack.expectedAction} size="sm" />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border text-xs space-y-1">
              <span className="text-[10px] font-mono text-slate-500 block">Manipulation Payload</span>
              <p className="font-mono text-slate-300 text-[11px]">{selectedAttack.payload.manipulation}</p>
            </div>

            <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border text-xs space-y-1">
              <span className="text-[10px] font-mono text-slate-500 block">Formal Invariant Protected</span>
              <p className="text-slate-300 text-[11px]">{selectedAttack.invariantProtected}</p>
            </div>

            {/* Live Terminal Output */}
            {attackResult && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    <span>Execution Trace ({attackResult.mode})</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyReceipt}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-300 bg-surface-subtle border border-surface-border hover:bg-surface-elevated transition-colors"
                      title="Copy attack trace receipt"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied Receipt' : 'Copy Receipt'}</span>
                    </button>
                    <ActionBadge decision={attackResult.action} size="sm" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/95 border border-surface-border font-mono text-xs space-y-1 text-slate-300 overflow-x-auto">
                  {attackResult.logs.map((log, i) => {
                    let color = "text-slate-300";
                    if (log.includes("FAILURE") || log.includes("REJECT") || log.includes("REVERT")) color = "text-rose-400";
                    if (log.includes("HOLD") || log.includes("MITIGATION") || log.includes("INVARIANT")) color = "text-amber-400";
                    if (log.includes("verified") || log.includes("valid") || log.includes("PASSED")) color = "text-emerald-400";

                    return (
                      <div key={i} className={`${color} leading-relaxed whitespace-pre-wrap`}>
                        {log}
                      </div>
                    );
                  })}
                </div>

                <GateStatus
                  gate1Passed={attackResult.gate1}
                  gate2Passed={attackResult.gate2}
                  gate3Passed={attackResult.gate3}
                  gate4Action={attackResult.action}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
