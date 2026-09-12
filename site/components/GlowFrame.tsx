'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface GlowFrameProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'graphite';
  onClick?: () => void;
  interactive?: boolean;
}

export const GlowFrame: React.FC<GlowFrameProps> = ({
  children,
  className = '',
  glowColor = 'blue',
  onClick,
  interactive = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !interactive) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const glowRgb = {
    blue: '59, 130, 246',
    emerald: '16, 185, 129',
    amber: '245, 158, 11',
    rose: '239, 68, 68',
    graphite: '148, 163, 184',
  }[glowColor];

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      initial={false}
      whileHover={interactive && !shouldReduceMotion ? { y: -3 } : {}}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-xl overflow-hidden border transition-colors duration-300 ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isHovered
          ? 'border-[var(--hairline-strong)] bg-[var(--surface-elevated)]'
          : 'border-[var(--hairline)] bg-[var(--surface)]'
      } ${className}`}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Dynamic Radial Glow Follower */}
      {interactive && isHovered && (
        <div
          className="pointer-events-none absolute -inset-px opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(${glowRgb}, 0.12), transparent 80%)`,
          }}
        />
      )}

      {/* 1px Inner Subtle Border Glow */}
      {interactive && isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-xl border opacity-70 transition-opacity duration-300"
          style={{
            borderColor: `rgba(${glowRgb}, 0.35)`,
          }}
        />
      )}

      {/* Content Container */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
