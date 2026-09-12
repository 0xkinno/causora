import React from 'react';
import Link from 'next/link';
import { Shield, ExternalLink, GitBranch, Terminal } from 'lucide-react';
import { CREDITCOIN_CC3_TESTNET, ETHEREUM_SEPOLIA } from '@/lib/chains';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-surface-border bg-surface-subtle mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">CAUSORA</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cryptographically verified cross-chain causality firewall. Prevents retroactive liquidation front-running and cross-chain clock drift exploits on Creditcoin 3.
            </p>
            <div className="text-[11px] font-mono text-slate-500">
              CC3 Testnet Chain ID: 102031
            </div>
          </div>

          {/* Architecture Precompiles */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase">Native Precompiles</h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 rounded bg-surface border border-surface-border">
                <span className="text-slate-400">BlockProver (0xFD2):</span>
                <p className="text-blue-400 text-[11px] truncate">0x0000000000000000000000000000000000000FD2</p>
              </div>
              <div className="p-2 rounded bg-surface border border-surface-border">
                <span className="text-slate-400">ChainInfo (0xFD3):</span>
                <p className="text-blue-400 text-[11px] truncate">0x0000000000000000000000000000000000000fD3</p>
              </div>
            </div>
          </div>

          {/* Core Contracts */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase">Protocol Contracts</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center justify-between">
                <span>CausoraRegistry:</span>
                <span className="font-mono text-slate-300">0x1111...1101</span>
              </li>
              <li className="flex items-center justify-between">
                <span>RelationEngine:</span>
                <span className="font-mono text-slate-300">0x2222...2202</span>
              </li>
              <li className="flex items-center justify-between">
                <span>CausoraGuard:</span>
                <span className="font-mono text-slate-300">0x3333...3303</span>
              </li>
              <li className="flex items-center justify-between">
                <span>LendingPositionMgr:</span>
                <span className="font-mono text-slate-300">0x4444...4404</span>
              </li>
            </ul>
          </div>

          {/* Verification & Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase">Resources</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/docs" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  Documentation & Threat Model
                </Link>
              </li>
              <li>
                <Link href="/break-it" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  18 Adversarial Attack Test Suite
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  Live Proof Inspector
                </Link>
              </li>
              <li>
                <Link href="/mcp" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                  AI Agent Tooling (MCP)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 Causora Protocol. Built for Creditcoin 3 &amp; Attestcoin.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono">
            <span>Fail-Closed Formal Invariants</span>
            <span>•</span>
            <span className="text-emerald-500">100% On-Chain Verifiable</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
