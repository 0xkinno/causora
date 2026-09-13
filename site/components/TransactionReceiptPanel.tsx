"use client";

import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, XCircle, Copy, Check, Hash, Layers, Shield } from 'lucide-react';

export interface TxReceiptData {
  action: string;
  contractName: string;
  contractAddress: string;
  network: string;
  txHash: string;
  blockNumber: number | string;
  status: 'CONFIRMED' | 'REVERTED' | 'PENDING';
  gasUsed?: string;
  details?: string;
  revertReason?: string;
}

export function TransactionReceiptPanel({
  receipt,
  onDismiss
}: {
  receipt: TxReceiptData | null;
  onDismiss?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!receipt) return null;

  const isConfirmed = receipt.status === 'CONFIRMED';
  const explorerUrl = `https://creditcoin-testnet.blockscout.com/tx/${receipt.txHash}`;

  const copyHash = () => {
    navigator.clipboard.writeText(receipt.txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isConfirmed
        ? 'bg-surface border-emerald-500/40 shadow-lg shadow-emerald-950/20'
        : 'bg-surface border-rose-500/40 shadow-lg shadow-rose-950/20'
    }`}>
      <div className="flex items-center justify-between pb-3 border-b border-surface-border">
        <div className="flex items-center gap-2">
          {isConfirmed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400" />
          )}
          <span className="text-sm font-bold text-white font-display">
            On-Chain Execution {receipt.status}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-subtle text-slate-400 border border-surface-border">
            {receipt.action}
          </span>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-slate-500 hover:text-white font-mono"
          >
            ✕ Dismiss
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 py-4 text-xs font-mono">
        <div className="space-y-1 p-2.5 rounded-lg bg-surface-subtle border border-surface-border">
          <span className="text-[10px] text-slate-500 block uppercase">Network</span>
          <span className="text-white font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {receipt.network}
          </span>
        </div>

        <div className="space-y-1 p-2.5 rounded-lg bg-surface-subtle border border-surface-border">
          <span className="text-[10px] text-slate-500 block uppercase">Contract</span>
          <span className="text-blue-400 font-semibold truncate block" title={receipt.contractAddress}>
            {receipt.contractName}
          </span>
          <span className="text-[9px] text-slate-500 font-mono truncate block">
            {receipt.contractAddress.slice(0, 8)}...{receipt.contractAddress.slice(-6)}
          </span>
        </div>

        <div className="space-y-1 p-2.5 rounded-lg bg-surface-subtle border border-surface-border">
          <span className="text-[10px] text-slate-500 block uppercase">Block Number</span>
          <span className="text-white font-bold">
            #{receipt.blockNumber}
          </span>
          {receipt.gasUsed && (
            <span className="text-[9px] text-slate-400 block">
              Gas: {receipt.gasUsed}
            </span>
          )}
        </div>

        <div className="space-y-1 p-2.5 rounded-lg bg-surface-subtle border border-surface-border">
          <span className="text-[10px] text-slate-500 block uppercase">Status</span>
          <span className={`font-bold block ${isConfirmed ? 'text-emerald-400' : 'text-rose-400'}`}>
            {receipt.status}
          </span>
          <span className="text-[9px] text-slate-500 block">
            {isConfirmed ? 'State Committed on CC3' : 'Failed Closed / Reverted'}
          </span>
        </div>
      </div>

      {receipt.revertReason && (
        <div className="p-3 mb-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs font-mono text-rose-300">
          <span className="font-bold block text-rose-400 mb-0.5">Revert Reason (On-Chain Proof):</span>
          {receipt.revertReason}
        </div>
      )}

      {receipt.details && (
        <div className="p-3 mb-3 rounded-lg bg-surface-subtle border border-surface-border text-xs font-mono text-slate-300">
          {receipt.details}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Hash className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-300 font-semibold">Tx:</span>
          <span className="text-slate-400 truncate max-w-[200px] sm:max-w-[340px]">
            {receipt.txHash && receipt.txHash.startsWith('0x') && receipt.txHash.length === 66
              ? receipt.txHash
              : 'Simulation Proof (Preflight Check — No Broadcast)'}
          </span>
          {receipt.txHash && receipt.txHash.startsWith('0x') && receipt.txHash.length === 66 && (
            <button
              onClick={copyHash}
              className="p-1 rounded hover:bg-surface-elevated text-slate-400 hover:text-white transition-all"
              title="Copy transaction hash"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {receipt.txHash && receipt.txHash.startsWith('0x') && receipt.txHash.length === 66 ? (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-mono font-semibold transition-all"
          >
            <span>View on CC3 Blockscout</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="px-3 py-1.5 rounded-lg bg-surface-subtle text-slate-400 border border-surface-border text-xs font-mono">
            CC3 Static Pre-flight Proof
          </span>
        )}
      </div>
    </div>
  );
}
