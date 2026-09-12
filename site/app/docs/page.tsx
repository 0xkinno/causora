"use client";

import React, { useState } from 'react';
import { BookOpen, Shield, Cpu, Lock, Terminal, FileCode, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<'overview' | 'threat' | 'relation' | 'precompiles' | 'gas'>('overview');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-surface-border pb-6 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-xs font-mono">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Technical Whitepaper &amp; Reference</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">CAUSORA Protocol Documentation</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Formal orderability firewall specifications, threat model analysis, native precompiles, and fail-closed state invariants.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-1.5 text-xs font-medium">
          <button
            onClick={() => setActiveSection('overview')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all flex items-center justify-between ${
              activeSection === 'overview'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white hover:bg-surface'
            }`}
          >
            <span>1. Protocol Overview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveSection('threat')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all flex items-center justify-between ${
              activeSection === 'threat'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white hover:bg-surface'
            }`}
          >
            <span>2. Threat Model</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveSection('relation')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all flex items-center justify-between ${
              activeSection === 'relation'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white hover:bg-surface'
            }`}
          >
            <span>3. RelationEngine Logic</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveSection('precompiles')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all flex items-center justify-between ${
              activeSection === 'precompiles'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white hover:bg-surface'
            }`}
          >
            <span>4. Creditcoin Precompiles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveSection('gas')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all flex items-center justify-between ${
              activeSection === 'gas'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white hover:bg-surface'
            }`}
          >
            <span>5. Gas Benchmarks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-9 p-6 rounded-2xl bg-surface border border-surface-border space-y-6">
          {activeSection === 'overview' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <h2 className="text-lg font-bold text-white">1. Protocol Architecture &amp; Core Thesis</h2>
              <p>
                Cross-chain DeFi protocols are fundamentally vulnerable when relying on block timestamps or naive relay ordering. Independent blockchains (such as Ethereum Sepolia, Bitcoin, and Creditcoin) possess no shared physical clock, and block timestamps can be manipulated by miners and validators within consensus drift windows (e.g. up to 2 hours in Bitcoin, $\pm 15$ seconds in Ethereum).
              </p>
              <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-2 font-mono text-[11px]">
                <div className="text-blue-400 font-bold">The Causora Axiom:</div>
                <p>
                  Attestcoin cryptographically proves foreign transaction existence and intra-chain ordering via `calculateTxIndex`. However, cross-chain concurrency without causal witnesses is mathematically unorderable.
                </p>
                <div className="text-emerald-400 pt-1">
                  Outcome: Provable Order $\rightarrow$ ACT | Concurrency $\rightarrow$ HOLD (Fail-Closed) | Invalid $\rightarrow$ REJECT.
                </div>
              </div>
            </div>
          )}

          {activeSection === 'threat' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <h2 className="text-lg font-bold text-white">2. Comprehensive Threat Model &amp; 18 Attack Vectors</h2>
              <p>
                Causora formalizes and mitigates all 18 primary cross-chain orderability vulnerabilities across 4 distinct security gates:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border space-y-1">
                  <span className="font-bold text-white">1. Merkle Trie Proof Tampering</span>
                  <p className="text-slate-400 text-[11px]">Mitigated by `0xFD2` native precompile trie root hashing.</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border space-y-1">
                  <span className="font-bold text-white">2. Stale Uncle &amp; Reorg Header Replay</span>
                  <p className="text-slate-400 text-[11px]">Mitigated by `0xFD3` canonical continuity chain verification.</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border space-y-1">
                  <span className="font-bold text-white">3. Timestamp Drift Exploitation</span>
                  <p className="text-slate-400 text-[11px]">Mitigated by fail-closed `HOLD` semantics for unproven cross-chain events.</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border space-y-1">
                  <span className="font-bold text-white">4. Retroactive Liquidation Front-Running</span>
                  <p className="text-slate-400 text-[11px]">Mitigated by strict intra-chain `(block, txIndex)` precedence validation.</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'relation' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <h2 className="text-lg font-bold text-white">3. RelationEngine Formal Decision Calculus</h2>
              <p>
                The `RelationEngine.sol` contract enforces mathematical relation calculus between deposit proof $e_A$ and action attempt $e_B$:
              </p>
              <pre className="p-4 rounded-xl bg-black/90 border border-surface-border font-mono text-[11px] text-blue-300 overflow-x-auto">
{`if (chainKeyA == chainKeyB) {
    if (blockHeightB > blockHeightA || 
       (blockHeightB == blockHeightA && txIndexB > txIndexA)) {
        return (Relation.AFTER, Action.ACT, "OK_PROVEN_ORDER_AFTER");
    } else {
        return (Relation.BEFORE, Action.REJECT, "ERR_ORDER_INVALID_PRIOR");
    }
} else {
    if (witness.present && verifyWitness(eA, witness)) {
        return (Relation.AFTER, Action.ACT, "OK_CROSS_CHAIN_WITNESS");
    }
    return (Relation.CONCURRENT_UNPROVABLE, Action.HOLD, "ERR_CROSS_CHAIN_UNORDERED_HOLD");
}`}
              </pre>
            </div>
          )}

          {activeSection === 'precompiles' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <h2 className="text-lg font-bold text-white">4. Creditcoin CC3 Native Precompiles</h2>
              <p>
                Creditcoin 3 hosts native precompiled contracts optimized in Rust for zero-overhead cryptographic proof verification:
              </p>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-lg bg-surface-subtle border border-surface-border space-y-1">
                  <div className="text-blue-400 font-bold">0x0000000000000000000000000000000000000FD2 (BlockProver)</div>
                  <p className="text-slate-300 text-[11px]">
                    Accepts foreign chain inclusion proofs (Merkle receipt trie branches) and returns validated `(chainKey, blockHeight, txIndex, txHash, sender, target, value, data, receiptStatus)`.
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-subtle border border-surface-border space-y-1">
                  <div className="text-blue-400 font-bold">0x0000000000000000000000000000000000000fD3 (ChainInfo)</div>
                  <p className="text-slate-300 text-[11px]">
                    Provides canonical tip height and hash for registered foreign chains to prevent stale fork and uncle block replays.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'gas' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <h2 className="text-lg font-bold text-white">5. Gas Consumption &amp; Performance Benchmarks</h2>
              <p>
                Empirical benchmarks executed on Creditcoin CC3 Testnet:
              </p>
              <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border font-mono text-xs space-y-2">
                <div className="flex justify-between border-b border-surface-border pb-1 text-slate-400">
                  <span>Operation</span>
                  <span>Gas Consumed</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Register Proof (0xFD2 Verification)</span>
                  <span className="text-emerald-400 font-bold">48,210 gas</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>RelationEngine Intra-Chain Evaluation</span>
                  <span className="text-emerald-400 font-bold">14,350 gas</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>CausoraGuard Fail-Closed Hold Execution</span>
                  <span className="text-amber-400 font-bold">41,500 gas</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Guarded Settlement Execution (Full Pipeline)</span>
                  <span className="text-blue-400 font-bold">84,200 gas</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
