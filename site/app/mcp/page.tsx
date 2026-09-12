"use client";

import React, { useState } from 'react';
import { Bot, Play, CheckCircle2, Code, Terminal, Sparkles, Copy, Check } from 'lucide-react';
import { computeQueryId } from '@/lib/contracts';

export default function MCPPage() {
  const [selectedTool, setSelectedTool] = useState<string>("evaluate_orderability");
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const tools = [
    {
      name: "evaluate_orderability",
      description: "Evaluate causality relation between two cross-chain events via Causora RelationEngine",
      inputSchema: {
        chainA: 1,
        blockA: 5824100,
        txA: 42,
        chainB: 1,
        blockB: 5824200,
        txB: 15,
        witness: null
      }
    },
    {
      name: "verify_proof",
      description: "Verify foreign transaction inclusion against CC3 0xFD2 precompile",
      inputSchema: {
        chainKey: 1,
        blockHeight: 5824100,
        txIndex: 42,
        txHash: "0x8fa19e34c56e78a2d109f5bc3a2e1d0987fecba1234567890abcdef123456789"
      }
    },
    {
      name: "guard_liquidation",
      description: "Submit a guarded liquidation request to CausoraGuard fail-closed firewall",
      inputSchema: {
        positionId: "POS-001-ETH-SEP",
        liquidationBlock: 5824250,
        liquidationTxIndex: 10
      }
    }
  ];

  const handleExecute = () => {
    setExecuting(true);
    setTimeout(() => {
      if (selectedTool === 'evaluate_orderability') {
        const qA = computeQueryId(1, 5824100, 42);
        const qB = computeQueryId(1, 5824200, 15);
        setOutput(JSON.stringify({
          success: true,
          relation: "AFTER",
          action: "ACT",
          reason: "Strict intra-chain precedence proven on Chain 1 (Sepolia): (5824200, 15) > (5824100, 42).",
          queryIdA: qA,
          queryIdB: qB,
          guardApproval: true
        }, null, 2));
      } else if (selectedTool === 'verify_proof') {
        setOutput(JSON.stringify({
          success: true,
          queryId: computeQueryId(1, 5824100, 42),
          inclusionVerified: true,
          continuityVerified: true,
          precompile: "0x0000000000000000000000000000000000000FD2",
          gasCost: 48210
        }, null, 2));
      } else {
        setOutput(JSON.stringify({
          success: true,
          positionId: "POS-001-ETH-SEP",
          action: "ACT",
          decisionId: "0xdec9483759283746152435465748392019283746",
          status: "LIQUIDATED",
          executionTxHash: "0x789abc1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
        }, null, 2));
      }
      setExecuting(false);
    }, 450);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeToolObj = tools.find(t => t.name === selectedTool) || tools[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-surface-border pb-6 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-400 text-xs font-mono">
          <Bot className="w-3.5 h-3.5" />
          <span>Model Context Protocol (MCP) Server</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">AI Agent Tooling Interface</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Equip LLM agents and autonomous bots to query Causora&apos;s cryptographic verification pipeline, evaluate cross-chain orderability, and simulate guarded actions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tools Selector */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase font-mono text-slate-400">Available MCP Tools</h3>
          {tools.map((t) => {
            const isSelected = selectedTool === t.name;
            return (
              <div
                key={t.name}
                onClick={() => {
                  setSelectedTool(t.name);
                  setOutput(null);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-surface-elevated border-violet-500/50 shadow-md ring-1 ring-violet-500/30'
                    : 'bg-surface hover:bg-surface-subtle border-surface-border'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-white">{t.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-subtle text-violet-400 border border-violet-500/20">
                    MCP
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Tool Playground & JSON Schema */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <span className="text-xs font-mono text-violet-400 font-bold">Tool: {activeToolObj.name}()</span>
              <button
                onClick={handleExecute}
                disabled={executing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{executing ? "Invoking MCP Tool..." : "Invoke Tool"}</span>
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">Tool Input Arguments (JSON):</span>
              <pre className="p-3.5 rounded-xl bg-black/90 border border-surface-border font-mono text-xs text-slate-300 overflow-x-auto">
                {JSON.stringify(activeToolObj.inputSchema, null, 2)}
              </pre>
            </div>

            {output && (
              <div className="space-y-2 pt-2 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Tool Execution Result:
                  </span>
                  <button
                    onClick={() => handleCopy(output)}
                    className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-black/90 border border-emerald-500/30 font-mono text-xs text-emerald-300 overflow-x-auto">
                  {output}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
