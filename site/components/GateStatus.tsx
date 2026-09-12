import React from 'react';
import { Shield, CheckCircle2, Lock, GitCommit, AlertTriangle } from 'lucide-react';

interface GateStatusProps {
  gate1Passed?: boolean;
  gate2Passed?: boolean;
  gate3Passed?: boolean;
  gate4Action?: 'ACT' | 'HOLD' | 'REJECT';
}

export const GateStatus: React.FC<GateStatusProps> = ({
  gate1Passed = true,
  gate2Passed = true,
  gate3Passed = true,
  gate4Action = 'ACT'
}) => {
  const gates = [
    {
      num: 1,
      name: "Gate 1: Merkle Inclusion",
      desc: "Precompile 0xFD2 proves receipt trie & tx existence",
      passed: gate1Passed,
      statusText: gate1Passed ? "Verified (0xFD2)" : "Failed Root Trie"
    },
    {
      num: 2,
      name: "Gate 2: Continuity Chain",
      desc: "Precompile 0xFD3 proves canonical chain continuity",
      passed: gate2Passed,
      statusText: gate2Passed ? "Canonical Tip" : "Uncle/Fork Replay"
    },
    {
      num: 3,
      name: "Gate 3: Causality Engine",
      desc: "Evaluates intra-chain txIndex or cross-chain witness",
      passed: gate3Passed,
      statusText: gate3Passed ? "Strictly Proven" : "Unprovable Clock Drift"
    },
    {
      num: 4,
      name: "Gate 4: Fail-Closed Guard",
      desc: "Enforces ACT on proven order, HOLD on concurrency",
      passed: gate4Action === 'ACT',
      action: gate4Action,
      statusText: `Action: ${gate4Action}`
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {gates.map((g) => {
        let borderColor = "border-surface-border";
        let bgColor = "bg-surface";
        let statusBadge = "bg-emerald-950/80 text-emerald-400 border-emerald-500/30";

        if (!g.passed) {
          if (g.action === 'HOLD') {
            borderColor = "border-amber-500/40";
            bgColor = "bg-amber-950/20";
            statusBadge = "bg-amber-950/80 text-amber-400 border-amber-500/30";
          } else {
            borderColor = "border-rose-500/40";
            bgColor = "bg-rose-950/20";
            statusBadge = "bg-rose-950/80 text-rose-400 border-rose-500/30";
          }
        }

        return (
          <div
            key={g.num}
            className={`p-4 rounded-xl border ${borderColor} ${bgColor} flex flex-col justify-between transition-all`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400">0{g.num}</span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${statusBadge}`}>
                  {g.statusText}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white mb-1">{g.name}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{g.desc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-surface-border flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
              {g.passed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Invariant Satisfied</span>
                </>
              ) : g.action === 'HOLD' ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">Position Held (Safe)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400">Rejected (Fail-Closed)</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
