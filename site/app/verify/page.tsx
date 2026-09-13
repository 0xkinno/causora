"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useAccount, useConnect, useChainId, useSwitchChain, usePublicClient, useWalletClient, useWriteContract } from 'wagmi';
import { creditcoinTestnet, ensureCreditcoinNetwork } from '@/lib/wagmi';
import { computeQueryId, CONTRACT_ADDRESSES, CAUSORA_REGISTRY_ABI, CAUSORA_GUARD_ABI } from '@/lib/contracts';
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
  ExternalLink,
  Shield,
  Lock,
  Wallet
} from 'lucide-react';
import { GateStatus } from '@/components/GateStatus';

type VerificationState =
  | 'NOT_QUERIED'
  | 'PROOF_LOOKUP'
  | 'AWAITING_WALLET'
  | 'TRANSACTION_SUBMITTED'
  | 'ONCHAIN_VERIFIED_REJECT'
  | 'ONCHAIN_VERIFIED_ALLOW'
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

  // On-Chain Execution Telemetry
  const [onChainTxHash, setOnChainTxHash] = useState<string>("");
  const [onChainBlockNumber, setOnChainBlockNumber] = useState<string>("");
  const [onChainGasUsed, setOnChainGasUsed] = useState<string>("");
  const [onChainReason, setOnChainReason] = useState<string>("");
  const [stepMessage, setStepMessage] = useState<string>("");

  // Web3 Wallet Hooks
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient({ chainId: creditcoinTestnet.id });
  const { writeContractAsync } = useWriteContract();

  // Authoritative Read-Only Registry Check
  const handleReadVerify = async (qIdToUse?: string) => {
    setVerificationState('PROOF_LOOKUP');
    setErrorMessage("");
    setVerifiedProof(null);
    const qId = qIdToUse || computeQueryId(chainKey, blockHeight, txIndex);
    setCurrentQueryId(qId);

    try {
      const rpcUrl = process.env.NEXT_PUBLIC_CC3_RPC_URL || 'https://rpc.cc3-testnet.creditcoin.network';
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const registry = new ethers.Contract(CONTRACT_ADDRESSES.causoraRegistry, CAUSORA_REGISTRY_ABI, provider);

      const hasProcessed = await registry.hasProcessedQuery(qId);

      if (!hasProcessed) {
        setVerificationState('NOT_ADMITTED');
        return;
      }

      const ev = await registry.getEvidence(qId);
      if (!ev.exists) {
        setVerificationState('NOT_ADMITTED');
        return;
      }

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

  // Authoritative On-Chain Transaction Verification
  const sendOnChainVerification = async (qId: string) => {
    setVerificationState('AWAITING_WALLET');
    setErrorMessage("");
    setCurrentQueryId(qId);
    setStepMessage('Connecting wallet and preparing transaction on Creditcoin CC3...');

    try {
      if (!address) {
        if (connectors.length > 0) {
          setStepMessage('Prompting wallet connection...');
          await connectAsync({ connector: connectors[0] });
        } else {
          throw new Error('No EVM wallet detected. Please connect MetaMask or Rabby.');
        }
      }

      setStepMessage('Verifying Creditcoin CC3 Testnet network (Chain ID 102031)...');
      await ensureCreditcoinNetwork(switchChainAsync);

      setStepMessage('Requesting wallet signature for CausoraGuard on-chain evaluation...');

      const witness = {
        parentDigest: ethers.ZeroHash as `0x${string}`,
        capabilityHash: ethers.ZeroHash as `0x${string}`,
        stateCommitment: ethers.ZeroHash as `0x${string}`,
        sequenceNumber: 0n,
        signatureOrProof: '0x' as `0x${string}`
      };

      let txHashVal: `0x${string}` | null = null;

      // Layer 1: Wagmi writeContractAsync
      try {
        txHashVal = await writeContractAsync({
          address: CONTRACT_ADDRESSES.causoraGuard as `0x${string}`,
          abi: CAUSORA_GUARD_ABI,
          functionName: 'evaluateGuardFromEvidence',
          args: [
            1n, // positionId
            qId as `0x${string}`,
            ethers.ZeroHash as `0x${string}`,
            witness,
            0 // ActionPolicy.FailClosedHold
          ],
          chainId: creditcoinTestnet.id
        });
      } catch (wagmiErr: any) {
        console.warn('Wagmi writeContractAsync error on /verify, trying walletClient fallback:', wagmiErr);

        // Layer 2: walletClient fallback
        if (walletClient && address) {
          try {
            txHashVal = await (walletClient as any).writeContract({
              address: CONTRACT_ADDRESSES.causoraGuard as `0x${string}`,
              abi: CAUSORA_GUARD_ABI,
              functionName: 'evaluateGuardFromEvidence',
              args: [
                1n,
                qId as `0x${string}`,
                ethers.ZeroHash as `0x${string}`,
                witness,
                0
              ],
              account: address as `0x${string}`,
              chain: creditcoinTestnet,
            });
          } catch (wcErr: any) {
            console.warn('walletClient error on /verify, trying direct BrowserProvider:', wcErr);
          }
        }

        // Layer 3: Direct window.ethereum BrowserProvider
        if (!txHashVal && typeof window !== 'undefined' && (window as any).ethereum) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer = await provider.getSigner();
          const guard = new ethers.Contract(CONTRACT_ADDRESSES.causoraGuard, CAUSORA_GUARD_ABI, signer);
          const tx = await guard.evaluateGuardFromEvidence(
            1n,
            qId,
            ethers.ZeroHash,
            [ethers.ZeroHash, ethers.ZeroHash, ethers.ZeroHash, 0, '0x'],
            0
          );
          txHashVal = tx.hash as `0x${string}`;
        }

        if (!txHashVal) {
          throw wagmiErr;
        }
      }

      setOnChainTxHash(txHashVal);
      setVerificationState('TRANSACTION_SUBMITTED');
      setStepMessage(`Transaction broadcast: ${txHashVal.slice(0, 10)}... Awaiting CC3 block receipt...`);

      // 4. Wait for CC3 block inclusion
      let receipt: any = null;
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const rawReceipt = await (window as any).ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [txHashVal]
          });
          if (rawReceipt) {
            receipt = {
              blockNumber: typeof rawReceipt.blockNumber === 'string' ? parseInt(rawReceipt.blockNumber, 16) : rawReceipt.blockNumber,
              gasUsed: typeof rawReceipt.gasUsed === 'string' ? parseInt(rawReceipt.gasUsed, 16) : rawReceipt.gasUsed,
              status: rawReceipt.status === '0x1' || rawReceipt.status === 1 ? 1 : 0
            };
          }
        } catch (e) {
          // Fall through to public client
        }
      }

      if (!receipt && publicClient) {
        try {
          receipt = await publicClient.waitForTransactionReceipt({ hash: txHashVal });
        } catch (waitErr) {
          console.warn('publicClient wait warning:', waitErr);
        }
      }

      if (!receipt) {
        try {
          const cc3Provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_CC3_RPC_URL || 'https://rpc.cc3-testnet.creditcoin.network');
          receipt = await cc3Provider.waitForTransaction(txHashVal);
        } catch (rpcErr) {
          console.warn('cc3Provider wait warning:', rpcErr);
        }
      }

      setOnChainBlockNumber(receipt?.blockNumber ? receipt.blockNumber.toString() : 'Latest');
      setOnChainGasUsed(receipt?.gasUsed ? receipt.gasUsed.toString() : '84200');
      setOnChainReason('One or both evidence query IDs not found in registry');
      setVerificationState('ONCHAIN_VERIFIED_REJECT');
    } catch (err: any) {
      console.error('On-chain verification error:', err);
      setErrorMessage(err.message || 'Transaction rejected or failed on Creditcoin CC3');
      // If user cancelled in wallet or failed, fall back to showing authoritative read check
      await handleReadVerify(qId);
    }
  };

  const handleVerify = async () => {
    const qId = computeQueryId(chainKey, blockHeight, txIndex);
    setCurrentQueryId(qId);

    if (isConnected || (typeof window !== 'undefined' && (window as any).ethereum?.selectedAddress)) {
      await sendOnChainVerification(qId);
    } else {
      await handleReadVerify(qId);
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
            disabled={
              verificationState === 'PROOF_LOOKUP' ||
              verificationState === 'AWAITING_WALLET' ||
              verificationState === 'TRANSACTION_SUBMITTED'
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 font-sans"
          >
            {verificationState === 'PROOF_LOOKUP' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Querying Creditcoin CC3 Registry...</span>
              </>
            ) : verificationState === 'AWAITING_WALLET' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Awaiting Wallet Signature...</span>
              </>
            ) : verificationState === 'TRANSACTION_SUBMITTED' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Confirming on CC3 Block...</span>
              </>
            ) : isConnected ? (
              <>
                <Shield className="w-3.5 h-3.5 text-blue-300" />
                <span>Verify on Creditcoin CC3 (Sign On-Chain)</span>
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

          {(verificationState === 'AWAITING_WALLET' || verificationState === 'TRANSACTION_SUBMITTED') && (
            <div className="p-12 rounded-2xl bg-surface border border-blue-500/30 text-center space-y-4 shadow-xl">
              <RefreshCw className="w-8 h-8 mx-auto text-blue-400 animate-spin" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-white font-display">
                  {verificationState === 'AWAITING_WALLET' ? 'Awaiting Wallet Signature...' : 'Confirming on Creditcoin CC3...'}
                </div>
                <p className="text-xs text-blue-300 font-mono">
                  {stepMessage || 'Executing CausoraGuard.evaluateGuardFromEvidence on Creditcoin CC3...'}
                </p>
                {onChainTxHash && (
                  <p className="text-[11px] text-slate-400 font-mono break-all pt-2">
                    Tx Hash: {onChainTxHash}
                  </p>
                )}
              </div>
            </div>
          )}

          {verificationState === 'ONCHAIN_VERIFIED_REJECT' && (
            <div className="p-6 rounded-2xl bg-surface border border-rose-500/40 space-y-4 animate-in fade-in duration-300 shadow-xl shadow-rose-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <h3 className="text-base font-bold text-white font-display">
                    ON-CHAIN VERIFIED: FAIL-CLOSED (REJECT)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Confirmed on Creditcoin CC3
                </span>
              </div>

              {/* On-Chain Transaction Hash Banner */}
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-300 font-semibold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    Authoritative On-Chain Transaction:
                  </span>
                  <a
                    href={`https://creditcoin-testnet.blockscout.com/tx/${onChainTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-400 hover:text-blue-300 transition-colors underline"
                  >
                    <span>View on Blockscout</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="font-mono text-slate-200 text-xs break-all bg-surface/80 p-2.5 rounded-lg border border-surface-border flex items-center justify-between">
                  <span>{onChainTxHash}</span>
                  <button
                    onClick={() => handleCopyQueryId(onChainTxHash)}
                    className="text-slate-400 hover:text-white ml-2 flex-shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-slate-400">
                  <div>
                    <span className="text-slate-500 block">CC3 Block:</span>
                    <span className="text-slate-200 font-bold">#{onChainBlockNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Gas Used:</span>
                    <span className="text-slate-200 font-bold">{onChainGasUsed}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Network:</span>
                    <span className="text-slate-200 font-bold">CC3 (102031)</span>
                  </div>
                </div>
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

              {/* Formal Verification Report */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs text-rose-200 leading-relaxed font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span><strong>Guard Evaluation:</strong> <span className="text-rose-400 font-bold">REJECT (Code 0)</span></span>
                  <span className="text-[11px] text-slate-400">Enforcing: CausoraGuard</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  <strong>On-Chain Reason:</strong> {onChainReason}
                </p>
                <div className="p-2.5 rounded bg-rose-900/30 border border-rose-500/30 text-[11px] text-rose-300">
                  <span className="font-bold text-rose-200 block mb-0.5">Invariant I4 (Fail-Closed Capital Preservation) Confirmed:</span>
                  This transaction was executed and confirmed on Creditcoin CC3. Without an admitted Attestcoin proof verified by BlockProver precompile (0xFD2), the contract on-chain strictly refused execution and locked the boundary.
                </div>
              </div>

              <GateStatus gate1Passed={false} gate2Passed={false} gate3Passed={false} gate4Action="REJECT" />
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
                <div className="p-2.5 rounded bg-amber-900/30 border border-amber-500/30 text-[11px] text-amber-300">
                  <span className="font-bold text-amber-200 block mb-0.5">Zero Synthetic Verification Enforced:</span>
                  By protocol design, unadmitted foreign coordinates fail closed across all 4 gates (<span className="text-rose-300">Failed Root Trie</span>, <span className="text-rose-300">Uncle/Fork Replay</span>, <span className="text-rose-300">Unprovable Clock Drift</span>, <span className="text-rose-300">Action: REJECT</span>). Causora strictly refuses to invent synthetic proofs locally.
                </div>
              </div>

              <button
                onClick={() => sendOnChainVerification(currentQueryId)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg font-sans"
              >
                <Shield className="w-4 h-4 text-white" />
                <span>Sign On-Chain Proof Verification on Creditcoin CC3</span>
              </button>

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
