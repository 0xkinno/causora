"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { MOCK_POSITIONS } from '@/lib/mockData';
import { LendingPosition } from '@/lib/types';
import { ActionBadge } from '@/components/ActionBadge';
import { ArrowLeft, ExternalLink, PlusCircle, Shield, CheckCircle2, Lock } from 'lucide-react';

export default function PositionsListPage() {
  const [positions, setPositions] = useState<LendingPosition[]>(MOCK_POSITIONS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-surface-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="p-2 rounded-lg bg-surface hover:bg-surface-subtle border border-surface-border text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-xs font-mono uppercase text-blue-400">Position Portfolio</span>
            <h1 className="text-2xl font-bold text-white">All Guarded Positions</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {positions.map((pos) => {
          let statusBadge = "bg-emerald-950/80 text-emerald-400 border-emerald-500/30";
          if (pos.status === 'HELD_PENDING_ORDER') {
            statusBadge = "bg-amber-950/80 text-amber-400 border-amber-500/30";
          } else if (pos.status === 'LIQUIDATED') {
            statusBadge = "bg-slate-800 text-slate-400 border-slate-700";
          }

          return (
            <div
              key={pos.id}
              className="p-5 rounded-xl bg-surface border border-surface-border hover:border-slate-600 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center font-mono font-bold text-xs text-blue-400">
                    {pos.id.includes('ETH') ? 'ETH' : 'BTC'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">{pos.id}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusBadge}`}>
                        {pos.status}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400">Borrower: {pos.borrower}</div>
                  </div>
                </div>

                <Link
                  href={`/app/position/${pos.id}`}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
                >
                  Manage &amp; Audit
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-surface-subtle border border-surface-border text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Collateral</span>
                  <span className="text-white font-bold">{pos.collateralAmount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Debt</span>
                  <span className="text-slate-300">{pos.debtAmount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Health Factor</span>
                  <span className={pos.healthFactor < 1.0 ? "text-rose-400 font-bold" : pos.healthFactor < 1.2 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                    {pos.healthFactor.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Audit Decisions</span>
                  <span className="text-blue-400">{pos.history.length} On-Chain Records</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
