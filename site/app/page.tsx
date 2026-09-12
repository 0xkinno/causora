"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  ShieldAlert,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileSearch,
  Terminal,
  Zap,
  Layers,
  Scale,
  ExternalLink,
  Copy,
  Check,
  Play,
  RefreshCw
} from 'lucide-react';
import { GlowFrame } from '@/components/GlowFrame';
import { GateStatus } from '@/components/GateStatus';
import { ActionBadge } from '@/components/ActionBadge';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

export default function LandingPage() {
  const [activeAttack, setActiveAttack] = useState<'tampered' | 'replay' | 'unprovable'>('unprovable');
  const [copied, setCopied] = useState(false);

  const attackDetails = {
    tampered: {
      title: "Merkle Proof Bit-Flip Attack",
      description: "Attacker modifies 1 byte in the receipt inclusion proof to claim false collateral deposit.",
      gateHit: "0xFD2 BlockProver Precompile",
      decision: "REJECT",
      log: "[0xFD2 REVERT] Inclusion proof failed. Trie root mismatch. Zero state mutation.",
      revertReason: "ProofVerificationFailed()",
    },
    replay: {
      title: "Query ID Replay Attack",
      description: "Attacker attempts to resubmit a previously admitted proof to double-credit debt repayment.",
      gateHit: "CausoraRegistry.sol Replay Bitmap",
      decision: "REJECT",
      log: "[REPLAY DETECTED] QueryId already marked in processedQueries. Transaction reverted.",
      revertReason: "QueryAlreadyProcessed(0x56ec...)",
    },
    unprovable: {
      title: "Independent Cross-Chain Race (MEV Front-Run)",
      description: "Arbitrageur triggers liquidation on Bitcoin/Arbitrum concurrently with borrower deposit on Sepolia.",
      gateHit: "RelationEngine.sol Causal Gate",
      decision: "HOLD",
      log: "[CAUSALITY INVARIANT] No cryptographic causal witness linking chains. Foreign timestamp untrusted. FAIL-CLOSED HOLD active.",
      revertReason: "CROSS_CHAIN_INDETERMINATE (Fail-Closed Limbo)",
    },
  };

  const currentAttack = attackDetails[activeAttack];

  return (
    <div className="space-y-28 py-6">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[580px] flex items-center justify-between rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden px-6 sm:px-12 py-12">
        {/* Background Artwork Layer (Right-aligned, seamlessly blended) */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-3/5 pointer-events-none opacity-40 lg:opacity-85 select-none overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              src="/images/causora_hero.jpg"
              alt="CAUSORA Cryptographic Proof Sphere"
              fill
              className="object-cover object-right"
              priority
            />
            {/* Gradients to blend into background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)]/70 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent"></div>
          </div>
        </div>

        {/* Hero Copy (Left-aligned with strong negative space) */}
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[var(--surface-subtle)] border border-[var(--hairline)] text-xs font-mono text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            <span>CREDITCOIN CC3 · ATTESTCOIN VERIFIED PATH</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--foreground)] leading-[1.04] font-display">
            PROOF DOES NOT <br />
            <span className="gradient-brand">MEAN ORDER.</span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--foreground)] opacity-80 leading-relaxed max-w-xl font-sans">
            CAUSORA is a cross-chain DeFi authorization layer that acts only when the ordering a financial decision depends on is actually provable.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/app"
              className="flex items-center gap-2 px-5 py-2.5 rounded text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all font-sans"
            >
              Open Protocol
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/break-it"
              className="flex items-center gap-2 px-5 py-2.5 rounded text-xs sm:text-sm font-semibold bg-[var(--surface-elevated)] hover:bg-[var(--surface-subtle)] border border-[var(--hairline)] text-[var(--foreground)] transition-all font-sans"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Break the Assumption
            </Link>
          </div>
        </div>
      </section>

      {/* 2. SECTION 2: THE CONTRADICTION */}
      <section className="rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-8 sm:p-12 space-y-8">
        <div className="max-w-3xl space-y-3">
          <span className="label text-amber-400">The Fundamental Problem</span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[var(--foreground)] font-display leading-tight">
            Two chains can both be honest and still fail to tell you which event came first.
          </h2>
          <p className="text-sm opacity-80 leading-relaxed font-sans">
            Attestcoin can prove that Event A occurred on Ethereum Sepolia and Event B occurred on Arbitrum or Bitcoin. But without a causal dependency or a shared physical clock, timestamps drift and physical time is subjective across independent consensus networks.
          </p>
        </div>

        {/* Timeline Disconnect Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <GlowFrame glowColor="blue" className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-blue-400 font-bold">Timeline A: Ethereum Sepolia</span>
              <span className="text-[10px] font-mono opacity-60">ChainKey 1</span>
            </div>
            <div className="h-1.5 w-full bg-blue-950/40 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-3/4"></div>
            </div>
            <p className="text-xs opacity-75 font-mono">Block 5,824,100 • Tx 42: Collateral Top-Up Posted</p>
          </GlowFrame>

          <GlowFrame glowColor="amber" className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-amber-400 font-bold">Timeline B: Independent Foreign Chain</span>
              <span className="text-[10px] font-mono opacity-60">ChainKey 3</span>
            </div>
            <div className="h-1.5 w-full bg-amber-950/40 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-2/3"></div>
            </div>
            <p className="text-xs opacity-75 font-mono">Block 50,000 • Tx 10: Adverse Liquidation Trigger</p>
          </GlowFrame>
        </div>

        <div className="p-4 rounded border border-amber-500/30 bg-amber-950/20 text-xs text-amber-300 font-mono flex items-center gap-3">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Causora Invariant:</strong> In the absence of an explicit cryptographic causal witness, cross-chain order is deterministically indeterminate. The protocol must fail closed (HOLD) rather than guess.
          </span>
        </div>
      </section>

      {/* 3. SECTION 3: THE MACHINE */}
      <section className="space-y-6">
        <div className="space-y-1">
          <span className="label text-blue-400">The 4-Stage Protocol Machine</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] font-display">From Source Proof to Enforced State</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlowFrame glowColor="blue" className="p-6 space-y-3">
            <span className="label text-blue-400">Stage 01</span>
            <h3 className="text-lg font-bold text-[var(--foreground)] font-display">PROVE</h3>
            <p className="text-xs opacity-70 leading-relaxed font-sans">
              Attestcoin ProofBuilder compiles Merkle receipt inclusion and block continuity proofs from the source RPC.
            </p>
            <div className="text-[11px] font-mono opacity-50 pt-2 border-t border-[var(--hairline)]">
              0xFD2 BlockProver
            </div>
          </GlowFrame>

          <GlowFrame glowColor="blue" className="p-6 space-y-3">
            <span className="label text-blue-400">Stage 02</span>
            <h3 className="text-lg font-bold text-[var(--foreground)] font-display">CLASSIFY</h3>
            <p className="text-xs opacity-70 leading-relaxed font-sans">
              RelationEngine applies mathematical Lamport relation calculus across heights, transaction indices, and causal witnesses.
            </p>
            <div className="text-[11px] font-mono opacity-50 pt-2 border-t border-[var(--hairline)]">
              RelationEngine.sol
            </div>
          </GlowFrame>

          <GlowFrame glowColor="blue" className="p-6 space-y-3">
            <span className="label text-blue-400">Stage 03</span>
            <h3 className="text-lg font-bold text-[var(--foreground)] font-display">GATE</h3>
            <p className="text-xs opacity-70 leading-relaxed font-sans">
              CausoraGuard evaluates financial policies: strict precedence vs. fail-closed protection on indeterminate concurrency.
            </p>
            <div className="text-[11px] font-mono opacity-50 pt-2 border-t border-[var(--hairline)]">
              CausoraGuard.sol
            </div>
          </GlowFrame>

          <GlowFrame glowColor="emerald" className="p-6 space-y-3">
            <span className="label text-emerald-400">Stage 04</span>
            <h3 className="text-lg font-bold text-[var(--foreground)] font-display">EXECUTE</h3>
            <p className="text-xs opacity-80 leading-relaxed font-sans">
              LendingPositionManager mutates state to RESCUED, HELD, or LIQUIDATED, emitting a canonical Decision Receipt.
            </p>
            <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-[var(--hairline)] font-semibold">
              LendingPositionManager.sol
            </div>
          </GlowFrame>
        </div>
      </section>

      {/* 4. SECTION 4: THREE OUTCOMES */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="label text-blue-400">Triad Architecture</span>
            <h2 className="text-2xl font-bold text-[var(--foreground)] font-display">Three Deterministic Outcomes</h2>
          </div>
          <p className="text-xs opacity-60 max-w-md font-sans">
            The protocol eliminates heuristics. Every decision strictly maps to one of three cryptographic outputs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <GlowFrame glowColor="emerald" className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <ActionBadge decision="ACT" size="lg" />
              <span className="text-xs font-mono text-emerald-400">ALLOW</span>
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)] font-display">The required ordering is proven.</h3>
            <p className="text-xs opacity-75 leading-relaxed font-sans">
              Strict intra-chain precedence `(height, txIndex)` or explicit cryptographic causal witness confirmed. Action executes with full on-chain authority.
            </p>
          </GlowFrame>

          <GlowFrame glowColor="amber" className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <ActionBadge decision="HOLD" size="lg" />
              <span className="text-xs font-mono text-amber-400">FAIL-CLOSED</span>
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)] font-display">The evidence is real, but the required cross-chain relation is not proven.</h3>
            <p className="text-xs opacity-75 leading-relaxed font-sans">
              Events exist on independent chains without a causal link. Capital is held safely in limbo to prevent malicious front-running and MEV extraction.
            </p>
          </GlowFrame>

          <GlowFrame glowColor="rose" className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <ActionBadge decision="REJECT" size="lg" />
              <span className="text-xs font-mono text-rose-400">REVERT</span>
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)] font-display">The evidence itself failed verification.</h3>
            <p className="text-xs opacity-75 leading-relaxed font-sans">
              Merkle proof bit-flip, uncle header fork, unauthorized emitter, or retroactive trigger prior to deposit. Transaction immediately reverts.
            </p>
          </GlowFrame>
        </div>
      </section>

      {/* 5. SECTION 5: BREAK IT (Interactive Attack Strip) */}
      <section className="rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--hairline)] pb-4">
          <div className="space-y-1">
            <span className="label text-rose-400">Adversarial Resistance</span>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] font-display">
              WHAT HAPPENS WHEN THE EVIDENCE LIES?
            </h2>
          </div>
          <Link href="/break-it" className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Open Full Attack Arena <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Attack Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => setActiveAttack('unprovable')}
            className={`p-3 rounded text-left border transition-all ${
              activeAttack === 'unprovable'
                ? 'border-amber-500/50 bg-[var(--surface-elevated)] text-amber-300'
                : 'border-[var(--hairline)] bg-[var(--surface-subtle)] text-[var(--foreground)] opacity-70 hover:opacity-100'
            }`}
          >
            <span className="text-[10px] font-mono block opacity-60">Vector 01</span>
            <span className="text-xs font-bold font-mono">Unprovable Cross-Chain Order</span>
          </button>
          <button
            onClick={() => setActiveAttack('tampered')}
            className={`p-3 rounded text-left border transition-all ${
              activeAttack === 'tampered'
                ? 'border-rose-500/50 bg-[var(--surface-elevated)] text-rose-300'
                : 'border-[var(--hairline)] bg-[var(--surface-subtle)] text-[var(--foreground)] opacity-70 hover:opacity-100'
            }`}
          >
            <span className="text-[10px] font-mono block opacity-60">Vector 02</span>
            <span className="text-xs font-bold font-mono">Tampered Merkle Proof</span>
          </button>
          <button
            onClick={() => setActiveAttack('replay')}
            className={`p-3 rounded text-left border transition-all ${
              activeAttack === 'replay'
                ? 'border-rose-500/50 bg-[var(--surface-elevated)] text-rose-300'
                : 'border-[var(--hairline)] bg-[var(--surface-subtle)] text-[var(--foreground)] opacity-70 hover:opacity-100'
            }`}
          >
            <span className="text-[10px] font-mono block opacity-60">Vector 03</span>
            <span className="text-xs font-bold font-mono">Replayed Query ID</span>
          </button>
        </div>

        {/* Attack Result Display */}
        <div className="p-5 rounded bg-[var(--surface-subtle)] border border-[var(--hairline)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-[var(--foreground)] font-display">{currentAttack.title}</h4>
              <p className="text-xs opacity-70 font-sans">{currentAttack.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono opacity-60">Verdict:</span>
              <ActionBadge decision={currentAttack.decision as any} size="sm" />
            </div>
          </div>

          <div className="p-3 rounded bg-[var(--ink)] text-slate-300 font-mono text-xs space-y-1 overflow-x-auto">
            <div className="text-slate-500 text-[10px]">On-Chain Execution Trace:</div>
            <div className="text-emerald-400">{currentAttack.log}</div>
            <div className="text-amber-400">Revert Reason: {currentAttack.revertReason}</div>
          </div>
        </div>
      </section>

      {/* 6. SECTION 6: LIVE PROOF (Real CC3 Verification) */}
      <section className="rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
          <div className="space-y-1">
            <span className="label text-emerald-400">Live Testnet Settlement</span>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] font-display">
              Creditcoin CC3 Verification Parameters
            </h2>
          </div>
          <Link href="/verify" className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Open Verifier <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded bg-[var(--surface-subtle)] border border-[var(--hairline)]">
            <span className="text-[10px] opacity-60 block">Settlement Chain</span>
            <span className="text-[var(--foreground)] font-bold">Creditcoin CC3 (102031)</span>
          </div>
          <div className="p-3 rounded bg-[var(--surface-subtle)] border border-[var(--hairline)]">
            <span className="text-[10px] opacity-60 block">Inclusion Verifier</span>
            <span className="text-blue-400 font-bold truncate block">0x0000...0FD2</span>
          </div>
          <div className="p-3 rounded bg-[var(--surface-subtle)] border border-[var(--hairline)]">
            <span className="text-[10px] opacity-60 block">Chain Tip Prover</span>
            <span className="text-blue-400 font-bold truncate block">0x0000...0FD3</span>
          </div>
          <div className="p-3 rounded bg-[var(--surface-subtle)] border border-[var(--hairline)]">
            <span className="text-[10px] opacity-60 block">Master Registry</span>
            <span className="text-emerald-400 font-bold truncate block">{CONTRACT_ADDRESSES.causoraRegistry.substring(0, 12)}...</span>
          </div>
        </div>
      </section>

      {/* 7. SECTION 7: CTA */}
      <section className="p-8 sm:p-12 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--hairline-strong)] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] font-display">
            Don&apos;t trust the timeline. <br />
            Verify the relation.
          </h3>
          <p className="text-xs sm:text-sm opacity-75 max-w-xl font-sans">
            Experience cross-chain orderability with full cryptographic proof enforcement on Creditcoin CC3.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm font-sans"
          >
            Open Causora
          </Link>
          <Link
            href="/docs"
            className="px-6 py-3 rounded bg-[var(--surface)] hover:bg-[var(--surface-subtle)] border border-[var(--hairline)] text-[var(--foreground)] font-semibold text-xs sm:text-sm transition-all font-sans"
          >
            Documentation
          </Link>
        </div>
      </section>
    </div>
  );
}
