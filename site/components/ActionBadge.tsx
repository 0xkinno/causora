import React from 'react';
import { ActionDecision, RelationType } from '@/lib/types';
import { CheckCircle2, PauseCircle, XCircle, Sparkles } from 'lucide-react';

interface ActionBadgeProps {
  decision: ActionDecision;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const ActionBadge: React.FC<ActionBadgeProps> = ({
  decision,
  size = 'md',
  showIcon = true
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  if (decision === 'ACT') {
    return (
      <span className={`inline-flex items-center rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 ${sizeClasses[size]}`}>
        {showIcon && <CheckCircle2 className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
        ACT
      </span>
    );
  }

  if (decision === 'HOLD') {
    return (
      <span className={`inline-flex items-center rounded-full bg-amber-950/80 text-amber-400 border border-amber-500/30 ${sizeClasses[size]}`}>
        {showIcon && <PauseCircle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
        HOLD
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/30 ${sizeClasses[size]}`}>
      {showIcon && <XCircle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      REJECT
    </span>
  );
};

export const RelationBadge: React.FC<{ relation: RelationType }> = ({ relation }) => {
  switch (relation) {
    case 'BEFORE':
      return (
        <span className="text-xs px-2 py-0.5 rounded font-mono bg-blue-950 text-blue-300 border border-blue-800/40">
          BEFORE (a &lt; b)
        </span>
      );
    case 'AFTER':
      return (
        <span className="text-xs px-2 py-0.5 rounded font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/40">
          AFTER (a &gt; b)
        </span>
      );
    case 'CONCURRENT_UNPROVABLE':
      return (
        <span className="text-xs px-2 py-0.5 rounded font-mono bg-amber-950 text-amber-300 border border-amber-800/40">
          UNORDERABLE (a || b)
        </span>
      );
    case 'INVALID':
      return (
        <span className="text-xs px-2 py-0.5 rounded font-mono bg-rose-950 text-rose-300 border border-rose-800/40">
          INVALID
        </span>
      );
  }
};
