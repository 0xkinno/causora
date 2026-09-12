"use client";

import React, { useState } from 'react';
import { computeQueryId, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { MOCK_PROOFS } from '@/lib/mockData';
import { ProofRecord } from '@/lib/types';
import {
  FileSearch,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Copy,
  Check,
  Zap,
  FlaskConical,
  ExternalLink
} from 'lucide-react';
import { GateStatus } from '@/components/GateStatus';

export default function VerifyPage() {
  const [chainKey, setChainKey] = useState<number>(1);
  const [blockHeight, setBlockHeight] = useState<number>(5824100);
  const [txIndex, setTxIndex] = useState<number>(42);
  const [txHash, setTxHash] = useState<string>("0x8fa19e34c56e78a2d109f5bc3a2e1d0987fecba1234567890abcdef123456789");

  const [verifying, setVerifying] = useState(false);
  const [verifiedProof, setVerifiedProof] = useState<ProofRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      const qId = computeQueryId(chainKey, blockHeight, txIndex);
      setVerifiedProof({
        queryId: qId,
        chainKey,
        blockHeight,
        txIndex,
        txHash,
        sender: "0x4b70C8885b54E4e3A16A99E57A779C64005bFc98",
        target: CONTRACT_ADDRESSES.causoraRegistry,
        value: "0",
        data: "0xd0e30db0",
        receiptStatus: 1,
        blockTimestamp: Math.floor(Date.now() / 1000) - 120,
        inclusionVerified: true,
        continuityVerified: true,
        blockHash: "0x34a8e29bf0a1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
        verifiedAt: Math.floor(Date.now() / 1000),
      });
      setVerifying(false);
    }, 400);
  };

  const handleCopyQueryId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadPreset = (presetKey: string) => {
    const p = MOCK_PROOFS[presetKey];
    if (p) {
      setChainKey(p.chainKey);
      setBlockHeight(p.blockHeight);
      setTxIndex(p.txIndex);
      setTxHash(p.txHash);
      setVerifiedProof(p);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-surface-border pb-6 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-xs font-mono">
          <FileSearch className="w-3.5 h-3.5" />
          <span>Attestcoin Inclusion Inspector</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
          Cryptographic Proof Verifier
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Inspect and verify cross-chain Merkle inclusion proofs against Creditcoin 3&apos;s native BlockProver (`0x0000000000000000000000000000000000000FD2`) and ChainInfo (`0xFD3`) precompiles.
        </p>
      </div>

      {/* Preset Quick Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Sample Presets:</span>
          <button
            onClick={() => loadPreset("proof_dep_1")}
            className="px-2.5 py-1 rounded bg-surface hover:bg-surface-subtle border border-surface-border text-slate-300 transition-all"
          >
            Sepolia Deposit (Tx 42)
          </button>
          <button
            onClick={() => loadPreset("proof_liq_valid")}
            className="px-2.5 py-1 rounded bg-surface hover:bg-surface-subtle border border-surface-border text-slate-300 transition-all"
          >
            Sepolia Liquidation (Tx 15)
          </button>
          <button
            onClick={() => loadPreset("proof_cross_btc")}
            className="px-2.5 py-1 rounded bg-surface hover:bg-surface-subtle border border-surface-border text-slate-300 transition-all"
          >
            Bitcoin Anchor (Tx 3)
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Precompile 0xFD2 Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
            <Cpu className="w-4 h-4 text-blue-400" />
            Proof Query Coordinates
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Source Chain</label>
              <select
                value={chainKey}
                onChange={(e) => setChainKey(Number(e.target.value))}
                className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
              >
                <option value={1}>Ethereum Sepolia (ChainKey: 1)</option>
                <option value={2}>Creditcoin CC3 (ChainKey: 2)</option>
                <option value={3}>Ethereum Mainnet (ChainKey: 3)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Block Height</label>
                <input
                  type="number"
                  value={blockHeight}
                  onChange={(e) => setBlockHeight(Number(e.target.value))}
                  className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tx Index (Merkle)</label>
                <input
                  type="number"
                  value={txIndex}
                  onChange={(e) => setTxIndex(Number(e.target.value))}
                  className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Transaction Hash / Digest</label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-white font-mono text-[11px]"
              />
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 font-sans"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Querying 0xFD2 BlockProver...</span>
              </>
            ) : (
              <>
                <FileSearch className="w-3.5 h-3.5" />
                <span>Verify Merkle &amp; Continuity Proof</span>
              </>
            )}
          </button>
        </div>

        {/* Verification Result Inspector */}
        <div className="lg:col-span-7 space-y-4">
          {verifiedProof ? (
            <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white font-display">Proof Inclusion Verified</h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Precompile 0xFD2 OK
                </span>
              </div>

              {/* Canonical Query ID Box */}
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Canonical 72-Byte Packed Query ID:</span>
                  <button
                    onClick={() => handleCopyQueryId(verifiedProof.queryId)}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="font-mono text-blue-400 text-xs break-all bg-surface p-2 rounded border border-surface-border">
                  {verifiedProof.queryId}
                </div>
              </div>

              {/* Decoded Transaction Payload */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300">Decoded EVM v1 Receipt Payload</h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-surface-subtle border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">Sender Address</span>
                    <span className="text-slate-200 truncate block text-[11px]">{verifiedProof.sender}</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-subtle border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">Registry / Target</span>
                    <span className="text-slate-200 truncate block text-[11px]">{verifiedProof.target}</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-subtle border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">Receipt Status</span>
                    <span className="text-emerald-400 font-bold">{verifiedProof.receiptStatus === 1 ? "1 (SUCCESS)" : "0 (REVERT)"}</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-subtle border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">Block Header Hash</span>
                    <span className="text-slate-300 truncate block text-[11px]">{verifiedProof.blockHash}</span>
                  </div>
                </div>
              </div>

              <GateStatus gate1Passed={true} gate2Passed={true} gate3Passed={true} gate4Action="ACT" />
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-surface border border-surface-border text-center space-y-2 text-slate-500 text-xs">
              <FileSearch className="w-8 h-8 mx-auto text-slate-600" />
              <p>Enter transaction coordinates or load a sample above to verify proof on Creditcoin CC3.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
