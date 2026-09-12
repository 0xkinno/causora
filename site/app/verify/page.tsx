"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { computeQueryId, CONTRACT_ADDRESSES, CAUSORA_REGISTRY_ABI } from '@/lib/contracts';
import { MOCK_PROOFS } from '@/lib/mockData';
import { ProofRecord } from '@/lib/types';
import {
  FileSearch,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Copy,
  Check,
  AlertTriangle,
  AlertCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { GateStatus } from '@/components/GateStatus';

type VerificationState =
  | 'NOT_QUERIED'
  | 'PROOF_LOOKUP'
  | 'NOT_ADMITTED'
  | 'CC3_UNAVAILABLE'
  | 'CC3_ADMITTED';

export default function VerifyPage() {
  const [chainKey, setChainKey] = useState<number>(1);
  const [blockHeight, setBlockHeight] = useState<number>(5824100);
  const [txIndex, setTxIndex] = useState<number>(42);
  const [txHash, setTxHash] = useState<string>("0x56ec8b88df209b780e2db0c6b045fbea63c5ff4e605367f4cea3a229d2d77c00");

  const [verificationState, setVerificationState] = useState<VerificationState>('NOT_QUERIED');
  const [currentQueryId, setCurrentQueryId] = useState<string>("");
  const [verifiedProof, setVerifiedProof] = useState<ProofRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleVerify = async () => {
    setVerificationState('PROOF_LOOKUP');
    setErrorMessage("");
    setVerifiedProof(null);
    const qId = computeQueryId(chainKey, blockHeight, txIndex);
    setCurrentQueryId(qId);

    try {
      // 1. Authoritative check on Creditcoin CC3 Registry
      const rpcUrl = process.env.NEXT_PUBLIC_CC3_RPC_URL || 'https://rpc.cc3-testnet.creditcoin.network';
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const registry = new ethers.Contract(CONTRACT_ADDRESSES.causoraRegistry, CAUSORA_REGISTRY_ABI, provider);

      const hasProcessed = await registry.hasProcessedQuery(qId);

      if (!hasProcessed) {
        // Query computed canonically; NOT admitted to CC3 registry -> NOT VERIFIED
        setVerificationState('NOT_ADMITTED');
        return;
      }

      const ev = await registry.getEvidence(qId);
      if (!ev.exists) {
        setVerificationState('NOT_ADMITTED');
        return;
      }

      // 2. Real on-chain proof record from CC3 registry
      setVerifiedProof({
        queryId: qId,
        chainKey: Number(ev.chainKey),
        blockHeight: Number(ev.blockHeight),
        txIndex: Number(ev.txIndex),
        txHash: ev.txHash,
        sender: ev.emitter,
        target: CONTRACT_ADDRESSES.causoraRegistry,
        value: "0",
        data: ev.payloadHash,
        receiptStatus: 1,
        blockTimestamp: Number(ev.verifiedAt),
        inclusionVerified: true,
        continuityVerified: true,
        blockHash: ev.txHash,
        verifiedAt: Number(ev.verifiedAt),
      });
      setVerificationState('CC3_ADMITTED');
    } catch (err: any) {
      console.error("CC3 RPC verification failure:", err);
      setErrorMessage(err.message || "Failed to connect to Creditcoin CC3 Testnet RPC");
      setVerificationState('CC3_UNAVAILABLE');
    }
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
      setVerificationState('NOT_QUERIED');
      setVerifiedProof(null);
      setCurrentQueryId(computeQueryId(p.chainKey, p.blockHeight, p.txIndex));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-surface-border pb-6 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-xs font-mono">
          <FileSearch className="w-3.5 h-3.5" />
          <span>Attestcoin Proof Inspector</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
          Cryptographic Proof Verifier
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Inspect foreign transaction coordinates and verify inclusion proofs against Creditcoin 3&apos;s authoritative on-chain Registry (`{CONTRACT_ADDRESSES.causoraRegistry}`) and native BlockProver (`0x0000000000000000000000000000000000000FD2`) precompile.
        </p>
      </div>

      {/* Preset Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Sample Coordinates:</span>
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
            Mainnet Liquidation (Height 20M)
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>CC3 BlockProver 0xFD2 &amp; ChainInfo 0xFD3</span>
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
                onChange={(e) => {
                  setChainKey(Number(e.target.value));
                  setVerificationState('NOT_QUERIED');
                }}
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
                  onChange={(e) => {
                    setBlockHeight(Number(e.target.value));
                    setVerificationState('NOT_QUERIED');
                  }}
                  className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tx Index (Merkle)</label>
                <input
                  type="number"
                  value={txIndex}
                  onChange={(e) => {
                    setTxIndex(Number(e.target.value));
                    setVerificationState('NOT_QUERIED');
                  }}
                  className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Transaction Hash / Digest</label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => {
                  setTxHash(e.target.value);
                  setVerificationState('NOT_QUERIED');
                }}
                className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-white font-mono text-[11px]"
              />
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={verificationState === 'PROOF_LOOKUP'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 font-sans"
          >
            {verificationState === 'PROOF_LOOKUP' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Querying Creditcoin CC3 Registry...</span>
              </>
            ) : (
              <>
                <FileSearch className="w-3.5 h-3.5" />
                <span>Verify on Creditcoin CC3</span>
              </>
            )}
          </button>
        </div>

        {/* Verification Result Inspector */}
        <div className="lg:col-span-7 space-y-4">
          {verificationState === 'PROOF_LOOKUP' && (
            <div className="p-12 rounded-2xl bg-surface border border-surface-border text-center space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-blue-400 animate-spin" />
              <div className="text-sm font-bold text-white font-display">Querying Creditcoin CC3...</div>
              <p className="text-xs text-slate-400 font-mono">
                Checking CausoraRegistry on-chain state for queryId: {currentQueryId || computeQueryId(chainKey, blockHeight, txIndex)}
              </p>
            </div>
          )}

          {verificationState === 'CC3_UNAVAILABLE' && (
            <div className="p-6 rounded-2xl bg-surface border border-rose-500/30 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-rose-400">
                <XCircle className="w-5 h-5" />
                <h3 className="text-base font-bold font-display">CC3 UNAVAILABLE</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Could not connect to Creditcoin CC3 Testnet RPC (`https://rpc.cc3-testnet.creditcoin.network`).
              </p>
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/20 text-xs font-mono text-rose-300 break-all">
                  {errorMessage}
                </div>
              )}
              <p className="text-[11px] text-slate-400 font-mono">
                Verification failed closed. The protocol never assumes validity when RPC connectivity is unavailable.
              </p>
            </div>
          )}

          {verificationState === 'NOT_ADMITTED' && (
            <div className="p-6 rounded-2xl bg-surface border border-amber-500/30 space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white font-display">NOT VERIFIED / READY FOR ADMISSION</h3>
                </div>
                <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Unprocessed on CC3
                </span>
              </div>

              {/* Canonical Query ID Box */}
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Canonical 72-Byte Packed Query ID:</span>
                  <button
                    onClick={() => handleCopyQueryId(currentQueryId)}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="font-mono text-blue-400 text-xs break-all bg-surface p-2 rounded border border-surface-border">
                  {currentQueryId}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200 leading-relaxed font-mono space-y-2">
                <p>
                  <strong>On-Chain Verification Status:</strong> Not found in CausoraRegistry on CC3.
                </p>
                <p className="text-slate-400 text-[11px]">
                  This query coordinate has not been admitted via <code>admitEvidence</code> on Creditcoin CC3. Without an admitted Attestcoin proof and BlockProver verification, the protocol treats this event as unverified and unprovable.
                </p>
              </div>

              <GateStatus gate1Passed={false} gate2Passed={false} gate3Passed={false} gate4Action="REJECT" />
            </div>
          )}

          {verificationState === 'CC3_ADMITTED' && verifiedProof && (
            <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white font-display">Proof Admitted &amp; Verified</h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Creditcoin CC3 On-Chain Registry
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

              {/* Status on CC3 */}
              <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Creditcoin CC3 Registry Status:</span>
                <span className="text-emerald-400 font-bold">
                  ADMITTED &amp; VERIFIED ON CC3
                </span>
              </div>

              {/* Decoded Transaction Payload */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300">Authoritative On-Chain Evidence</h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-surface-subtle border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">Emitter Address</span>
                    <span className="text-slate-200 truncate block text-[11px]">{verifiedProof.sender}</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-subtle border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">Registry Target</span>
                    <span className="text-slate-200 truncate block text-[11px]">{verifiedProof.target}</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-subtle border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">Evidence Payload Hash</span>
                    <span className="text-slate-300 truncate block text-[11px]">{verifiedProof.data}</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-subtle border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">Verified Block Height</span>
                    <span className="text-emerald-400 font-bold">{verifiedProof.blockHeight}</span>
                  </div>
                </div>
              </div>

              <GateStatus gate1Passed={true} gate2Passed={true} gate3Passed={true} gate4Action="ACT" />
            </div>
          )}

          {verificationState === 'NOT_QUERIED' && (
            <div className="p-12 rounded-2xl bg-surface border border-surface-border text-center space-y-2 text-slate-500 text-xs font-mono">
              <FileSearch className="w-8 h-8 mx-auto text-slate-600" />
              <p>Enter foreign transaction coordinates above and click &quot;Verify on Creditcoin CC3&quot; to inspect authoritative on-chain state.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
