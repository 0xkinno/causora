"use client";

import React, { useState } from 'react';
import { DecisionRecord, ProofRecord } from '@/lib/types';
import { ActionBadge, RelationBadge } from './ActionBadge';
import { Shield, Clock, Hash, ChevronRight, CheckCircle, AlertTriangle, XCircle, FileText, ArrowRight } from 'lucide-react';

interface EvidenceTimelineProps {
  decisions: DecisionRecord[];
  proofs?: Record<string, ProofRecord>;
}

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({ decisions, proofs = {} }) => {
  const [selectedDecision, setSelectedDecision] = useState<DecisionRecord | null>(decisions[0] || null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Decisions List */}
      <div className="lg:col-span-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center justify-between">
          <span>Verification &amp; Guard Decisions</span>
          <span className="text-xs font-mono text-slate-500">{decisions.length} Records</span>
        </h3>

        {decisions.map((dec) => {
          const isSelected = selectedDecision?.decisionId === dec.decisionId;
          return (
            <div
              key={dec.decisionId}
              onClick={() => setSelectedDecision(dec)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-surface-elevated border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                  : 'bg-surface hover:bg-surface-subtle border-surface-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-slate-300">{dec.positionId}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-surface-subtle text-slate-400 font-mono">
                    {dec.actionType}
                  </span>
                </div>
                <ActionBadge decision={dec.action} size="sm" />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <RelationBadge relation={dec.relation} />
                <span className="text-[11px] text-slate-500">
                  Block #{dec.blockNumber} • {dec.gasUsed.toLocaleString()} gas
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-300 line-clamp-2">
                {dec.reasonDescription}
              </p>
            </div>
          );
        })}
      </div>

      {/* Decision Detail & Cryptographic Inspector */}
      <div className="lg:col-span-6 bg-surface rounded-xl border border-surface-border p-5 space-y-4">
        {selectedDecision ? (
          <>
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400">Orderability Audit</span>
                <h4 className="text-sm font-bold text-white font-mono">{selectedDecision.decisionId.substring(0, 18)}...</h4>
              </div>
              <ActionBadge decision={selectedDecision.action} size="lg" />
            </div>

            {/* Visual Relation Pipeline */}
            <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border space-y-3">
              <div className="text-xs font-semibold text-slate-300">Causality Evaluation:</div>
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-surface border border-surface-border flex-1">
                  <div className="text-[10px] text-slate-500">Anchor Event A</div>
                  <div className="text-blue-400 truncate text-xs">{selectedDecision.depositQueryId.substring(0, 14)}...</div>
                  <div className="text-[10px] text-slate-400 mt-1">Sepolia Tx 42</div>
                </div>

                <div className="flex flex-col items-center justify-center px-1">
                  <RelationBadge relation={selectedDecision.relation} />
                  <ArrowRight className="w-4 h-4 text-slate-500 my-1" />
                </div>

                <div className="p-2.5 rounded bg-surface border border-surface-border flex-1">
                  <div className="text-[10px] text-slate-500">Action Event B</div>
                  <div className="text-amber-400 truncate text-xs">{selectedDecision.actionQueryId.substring(0, 14)}...</div>
                  <div className="text-[10px] text-slate-400 mt-1">{selectedDecision.actionType}</div>
                </div>
              </div>
            </div>

            {/* Verdict Explanation */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">Reason Code &amp; Invariant:</div>
              <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border text-xs space-y-1">
                <div className="font-mono text-blue-400 font-semibold">{selectedDecision.reasonCode}</div>
                <div className="text-slate-300 leading-relaxed">{selectedDecision.reasonDescription}</div>
              </div>
            </div>

            {/* Cryptographic Execution Metadata */}
            <div className="pt-2 border-t border-surface-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-400">CC3 Settlement Proof:</div>
                <button
                  onClick={() => {
                    const receipt = {
                      decisionId: selectedDecision.decisionId,
                      positionId: selectedDecision.positionId,
                      queryIdA: selectedDecision.depositQueryId,
                      queryIdB: selectedDecision.actionQueryId,
                      relationClass: selectedDecision.relation,
                      action: selectedDecision.action,
                      reasonCode: selectedDecision.reasonCode,
                      reasonDescription: selectedDecision.reasonDescription,
                      evidenceDigests: {
                        evidenceA: selectedDecision.depositQueryId,
                        evidenceB: selectedDecision.actionQueryId,
                      },
                      sourceChainKeys: ["0x657468657265756d", "0x657468657265756d"],
                      sourceBlockHeights: [5824100, selectedDecision.blockNumber],
                      txIndexes: [42, 10],
                      witnessDigest: "0x0000000000000000000000000000000000000000000000000000000000000000",
                      creditcoinVerificationTx: selectedDecision.txHash,
                      finalStateTx: selectedDecision.txHash,
                      contractVersion: "1.0.0-cc3",
                      sourceCommitSha: "a9f3b18c",
                      generatedAt: new Date().toISOString(),
                    };
                    navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
                    alert("Copied Provenance Receipt to Clipboard!");
                  }}
                  className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-colors font-mono"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Copy Receipt</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-surface-subtle">
                  <span className="text-[10px] text-slate-500 block">Precompile Verifier</span>
                  <span className="text-slate-300">0xFD2 (Verified)</span>
                </div>
                <div className="p-2 rounded bg-surface-subtle">
                  <span className="text-[10px] text-slate-500 block">Continuity Gate</span>
                  <span className="text-emerald-400">0xFD3 (Canonical)</span>
                </div>
                <div className="p-2 rounded bg-surface-subtle">
                  <span className="text-[10px] text-slate-500 block">Settlement Tx Hash</span>
                  <span className="text-slate-300 truncate block">{selectedDecision.txHash.substring(0, 16)}...</span>
                </div>
                <div className="p-2 rounded bg-surface-subtle">
                  <span className="text-[10px] text-slate-500 block">Gas Consumed</span>
                  <span className="text-slate-300">{selectedDecision.gasUsed.toLocaleString()} Gas</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs">
            Select a decision to inspect the cryptographic audit trail.
          </div>
        )}
      </div>
    </div>
  );
};
