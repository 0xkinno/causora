"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  ShieldAlert,
  FileSearch,
  BookOpen,
  Bot,
  Activity,
  CheckCircle2,
  Power,
  AlertTriangle,
  Sun,
  Moon,
  Menu,
  X,
  Scale
} from 'lucide-react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { creditcoinTestnet, ensureCreditcoinNetwork } from '@/lib/wagmi';
import { useTheme } from '@/components/ThemeProvider';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, switchChainAsync } = useSwitchChain();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isWrongNetwork = isConnected && chainId !== creditcoinTestnet.id;

  // Automatically request switch to Creditcoin CC3 if connected on wrong network (e.g. Ethereum Mainnet)
  useEffect(() => {
    if (mounted && isConnected && chainId !== creditcoinTestnet.id) {
      ensureCreditcoinNetwork(switchChainAsync).catch((err) => {
        console.warn('Auto-switch to Creditcoin CC3 prompt error or dismissed:', err);
      });
    }
  }, [mounted, isConnected, chainId]);

  const navLinks = [
    { href: '/app', label: 'Protocol', icon: Activity },
    { href: '/app#evaluator', label: 'Resolve', icon: Scale },
    { href: '/verify', label: 'Evidence', icon: FileSearch },
    { href: '/break-it', label: 'Attack', icon: ShieldAlert },
    { href: '/docs', label: 'Docs', icon: BookOpen },
  ];

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = async () => {
    const connector = connectors[0];
    if (connector) {
      try {
        await connect({ connector });
      } catch (err) {
        console.warn('Connect error:', err);
      }
    }
    // Proactively prompt switch/add Creditcoin CC3 Testnet
    try {
      await ensureCreditcoinNetwork(switchChainAsync);
    } catch (_) {}
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--hairline)] bg-[var(--background)]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Protocol Descriptor */}
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-500 group-hover:bg-blue-600/20 group-hover:border-blue-400 transition-colors">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-[var(--foreground)] flex items-center gap-1.5 font-display">
                CAUSORA
                <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-blue-950/40 text-blue-400 border border-blue-800/30">CC3</span>
              </span>
              <span className="text-[10px] opacity-60 font-mono tracking-tight">Cross-Chain Orderability Firewall</span>
            </div>
          </Link>
        </div>

        {/* Center: Architectural Status Rail */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono opacity-80 px-3 py-1 rounded bg-[var(--surface-subtle)] border border-[var(--hairline)]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> SOURCE
          </span>
          <span className="opacity-40">➔</span>
          <span className="flex items-center gap-1 text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span> PROOF (0xFD2)
          </span>
          <span className="opacity-40">➔</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> DECISION
          </span>
        </div>

        {/* Center Navigation Links (Squared Capsules) */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && !link.href.includes('#') && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/40 shadow-sm'
                    : 'text-[var(--foreground)] opacity-70 hover:opacity-100 hover:bg-[var(--surface-subtle)] border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls: Theme Toggle, Network, Wallet, Disconnect */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Toggle Button */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded border border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--foreground)] opacity-80 hover:opacity-100 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            </button>
          )}

          {/* Network Indicator */}
          {mounted && isConnected && (
            isWrongNetwork ? (
              <button
                onClick={() => ensureCreditcoinNetwork(switchChainAsync)}
                className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-amber-950/80 border border-amber-600/50 text-amber-300 hover:bg-amber-900 transition-colors animate-pulse"
                title="Click to switch to Creditcoin CC3 Testnet"
              >
                <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Switch to CC3</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--hairline)] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>CC3: 102031</span>
              </div>
            )
          )}

          {/* Wallet Address Capsule & Disconnect */}
          {mounted && isConnected && address ? (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono bg-[var(--surface-elevated)] text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{formatAddress(address)}</span>
              </div>
              <button
                onClick={() => disconnect()}
                className="p-1.5 rounded text-slate-400 hover:text-red-400 bg-[var(--surface)] hover:bg-red-950/30 border border-[var(--hairline)] hover:border-red-600/30 transition-colors"
                title="Disconnect Wallet"
                aria-label="Disconnect Wallet"
              >
                <Power className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-sm disabled:opacity-50 transition-all font-sans"
            >
              <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded text-[var(--foreground)] opacity-80 hover:opacity-100 bg-[var(--surface)] border border-[var(--hairline)]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--hairline)] bg-[var(--surface-elevated)] px-4 py-3 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-mono ${
                  isActive ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-[var(--foreground)] opacity-70 hover:opacity-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
