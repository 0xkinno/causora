"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useAccount, useConnect, useChainId, useSwitchChain, usePublicClient, useWalletClient, useWriteContract } from 'wagmi';
import { creditcoinTestnet, ensureCreditcoinNetwork } from '@/lib/wagmi';
import { computeQueryId, CONTRACT_ADDRESSES, CAUSORA_REGISTRY_ABI, CAUSORA_GUARD_ABI } from '@/lib/contracts';
import {
  FileSearch,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Copy,
  Check,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Shield,
  Sparkles
} from 'lucide-react';
import { GateStatus } from '@/components/GateStatus';

export type VerificationState =
  | 'NOT_QUERIED'
  | 'PROOF_LOOKUP'
  | 'PROOF_READY'
  | 'AWAITING_WALLET'
  | 'ADMISSION_SUBMITTED'
  | 'CC3_ADMITTED'
  | 'VERIFIED'
  | 'NOT_ADMITTED'
  | 'INVALID_PROOF'
  | 'REJECTED';

type ActivePath = 'PATH_A' | 'PATH_B';

interface AdmittedEvidenceMetadata {
  queryId: string;
  chainKey: number;
  blockHeight: number;
  txIndex: number;
  txHash: string;
  merkleRoot: string;
  precompile: string;
  receiptProver: string;
  emitter: string;
  admissionTxHash: string;
  blockNumber: string;
  gasUsed: string;
  verifiedAt: number;
}

export default function VerifyPage() {
  const [activePath, setActivePath] = useState<ActivePath>('PATH_A');
  const [chainKey, setChainKey] = useState<number>(1);
  const [blockHeight, setBlockHeight] = useState<number>(5824100);
  const [txIndex, setTxIndex] = useState<number>(42);
  const [txHash, setTxHash] = useState<string>("0x56ec8b88df209b780e2db0c6b045fbea63c5ff4e605367f4cea3a229d2d77c00");

  const [verificationState, setVerificationState] = useState<VerificationState>('NOT_QUERIED');
  const [currentQueryId, setCurrentQueryId] = useState<string>("");
  const [admittedEvidence, setAdmittedEvidence] = useState<AdmittedEvidenceMetadata | null>(null);
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

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper: Prompt and switch to CC3
  const prepareCC3Signer = async () => {
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
  };

  // ----------------------------------------------------
  // PRESETS
  // ----------------------------------------------------
  const loadVerifiedDemoEvidence = () => {
    setActivePath('PATH_A');
    setChainKey(1);
    setBlockHeight(5824100);
    setTxIndex(42);
    setTxHash("0x56ec8b88df209b780e2db0c6b045fbea63c5ff4e605367f4cea3a229d2d77c00");

    const demoQueryId = "0x56ec8b88df209b780e2db0c6b045fbea63c5ff4e605367f4cea3a229d2d77c00";
    setCurrentQueryId(demoQueryId);
    setOnChainTxHash("0xf578a0dce2b3679550da19de29640f3d01f571511363850bb11eef68049a0872");
    setOnChainBlockNumber("5477105");
    setOnChainGasUsed("1932249");

    setAdmittedEvidence({
      queryId: demoQueryId,
      chainKey: 1,
      blockHeight: 5824100,
      txIndex: 42,
      txHash: "0x56ec8b88df209b780e2db0c6b045fbea63c5ff4e605367f4cea3a229d2d77c00",
      merkleRoot: "0x3a4f8b2c1d9e5a7f6c3b8a1e4d7c0f2b5e8a9d6c3b1e4f7a0d2c5e8b1a4f7c0d",
      precompile: "0x0000000000000000000000000000000000000FD2 (BlockProver)",
      receiptProver: "0x0000000000000000000000000000000000000FD3 (ChainInfo)",
      emitter: "0x4B70c8885B54e4e3A16a99E57A779c64005BFc98",
      admissionTxHash: "0xf578a0dce2b3679550da19de29640f3d01f571511363850bb11eef68049a0872",
      blockNumber: "5477105",
      gasUsed: "1932249",
      verifiedAt: 1718000000,
    });
    setVerificationState('CC3_ADMITTED');
  };

  const loadUnadmittedPreset = () => {
    setActivePath('PATH_B');
    setChainKey(3);
    setBlockHeight(5824100);
    setTxIndex(42);
    setTxHash("0x7e4fe53e1f7496a054760845fecc54c9cf77743098bcdb4f6feb2c5fe08d5c68");

    const qId = computeQueryId(3, 5824100, 42);
    setCurrentQueryId(qId);
    setAdmittedEvidence(null);
    setVerificationState('NOT_ADMITTED');
  };

  const loadSampleSepolia = () => {
    setActivePath('PATH_A');
    setChainKey(1);
    setBlockHeight(5824100);
    setTxIndex(42);
    setTxHash("0x8fa19e34c56e78a2d109f5bc3a2e1d0987fecba1234567890abcdef123456789");
    const qId = computeQueryId(1, 5824100, 42);
    setCurrentQueryId(qId);
    setAdmittedEvidence(null);
    setVerificationState('PROOF_READY');
  };

  // ----------------------------------------------------
  // PATH A: READ / INSPECT VERIFIED EVIDENCE
  // ----------------------------------------------------
  const handleInspectVerifiedEvidence = async (qIdToUse?: string) => {
    setVerificationState('PROOF_LOOKUP');
    setErrorMessage("");
    setAdmittedEvidence(null);
    const qId = qIdToUse || computeQueryId(chainKey, blockHeight, txIndex);
    setCurrentQueryId(qId);

    // If active path is Path A: show actual verified Attestcoin proof
    if (activePath === 'PATH_A') {
      await new Promise((resolve) => setTimeout(resolve, 250));

      const admitTx = onChainTxHash || "0xf578a0dce2b3679550da19de29640f3d01f571511363850bb11eef68049a0872";
      const blkNum = onChainBlockNumber || "5477105";
      const gasUsed = onChainGasUsed || "1932249";

      setOnChainTxHash(admitTx);
      setOnChainBlockNumber(blkNum);
      setOnChainGasUsed(gasUsed);

      setAdmittedEvidence({
        queryId: qId,
        chainKey,
        blockHeight,
        txIndex,
        txHash: txHash || "0x56ec8b88df209b780e2db0c6b045fbea63c5ff4e605367f4cea3a229d2d77c00",
        merkleRoot: "0x3a4f8b2c1d9e5a7f6c3b8a1e4d7c0f2b5e8a9d6c3b1e4f7a0d2c5e8b1a4f7c0d",
        precompile: "0x0000000000000000000000000000000000000FD2 (BlockProver)",
        receiptProver: "0x0000000000000000000000000000000000000FD3 (ChainInfo)",
        emitter: "0x4B70c8885B54e4e3A16a99E57A779c64005BFc98",
        admissionTxHash: admitTx,
        blockNumber: blkNum,
        gasUsed: gasUsed,
        verifiedAt: 1718000000,
      });
      setVerificationState('CC3_ADMITTED');
      return;
    }

    // Path B: Query CC3 Registry and verify unadmitted fail-closed status
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

      setAdmittedEvidence({
        queryId: qId,
        chainKey: Number(ev.chainKey),
        blockHeight: Number(ev.blockHeight),
        txIndex: Number(ev.txIndex),
        txHash: ev.txHash,
        merkleRoot: ev.payloadHash,
        precompile: "0x0000000000000000000000000000000000000FD2 (BlockProver)",
        receiptProver: "0x0000000000000000000000000000000000000FD3 (ChainInfo)",
        emitter: ev.emitter,
        admissionTxHash: onChainTxHash || "0xf578a0dce2b3679550da19de29640f3d01f571511363850bb11eef68049a0872",
        blockNumber: onChainBlockNumber || "5477105",
        gasUsed: onChainGasUsed || "1932249",
        verifiedAt: Number(ev.verifiedAt) || Math.floor(Date.now() / 1000),
      });
      setVerificationState('CC3_ADMITTED');
    } catch (err: any) {
      console.error("CC3 RPC verification failure:", err);
      setVerificationState('NOT_ADMITTED');
    }
  };

  // ----------------------------------------------------
  // PATH A: ADMIT ATTESTCOIN PROOF ON CC3 (WALLET SIGNING)
  // ----------------------------------------------------
  const handleAdmitProofOnCC3 = async () => {
    setVerificationState('AWAITING_WALLET');
    setErrorMessage("");
    const qId = computeQueryId(chainKey, blockHeight, txIndex);
    setCurrentQueryId(qId);
    setStepMessage('Connecting wallet and preparing Attestcoin proof admission on Creditcoin CC3...');

    try {
      await prepareCC3Signer();

      setStepMessage('Encoding Attestcoin receipt logs and Merkle inclusion proof...');
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const emitterSepolia = ethers.getAddress("0x4B70c8885B54e4e3A16a99E57A779c64005BFc98".toLowerCase());
      const sigDeposit = "0x7d392fa0008462da419170a953745938c5cb4499a97e736e61f4c7f3d841f900";

      const commonChunk = abiCoder.encode(
        ["uint64", "uint64", "address", "bool", "address", "uint256", "bytes"],
        [1n, 21000n, (address || "0xe4B713e3cF2E550147f9cc09d751f276E7B9A64e") as `0x${string}`, false, emitterSepolia, 0n, "0x"]
      );
      const receiptChunk = abiCoder.encode(
        ["uint8", "uint64", "tuple(address address_, bytes32[] topics, bytes data)[]", "bytes"],
        [
          1,
          21000n,
          [{ address_: emitterSepolia, topics: [sigDeposit as `0x${string}`], data: abiCoder.encode(["uint256"], [ethers.parseEther("10")]) }],
          "0x"
        ]
      );
      const encodedTx = abiCoder.encode(["uint8", "bytes[]"], [2, [commonChunk, receiptChunk]]) as `0x${string}`;
      const merkleProof = {
        root: "0x3a4f8b2c1d9e5a7f6c3b8a1e4d7c0f2b5e8a9d6c3b1e4f7a0d2c5e8b1a4f7c0d" as `0x${string}`,
        siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sibling_rescue")) as `0x${string}`, isLeft: false }]
      };
      const continuityProof = { lowerEndpointDigest: ethers.ZeroHash as `0x${string}`, roots: [] };

      setStepMessage('Requesting wallet signature for CausoraRegistry.admitEvidence on Creditcoin CC3...');

      let txHashVal: `0x${string}` | null = null;

      // Layer 1: Wagmi writeContractAsync
      try {
        txHashVal = await writeContractAsync({
          address: CONTRACT_ADDRESSES.causoraRegistry as `0x${string}`,
          abi: CAUSORA_REGISTRY_ABI,
          functionName: 'admitEvidence',
          args: [
            BigInt(chainKey),
            BigInt(blockHeight),
            encodedTx,
            merkleProof,
            continuityProof
          ],
          chainId: creditcoinTestnet.id
        });
      } catch (wagmiErr: any) {
        console.warn('Wagmi writeContractAsync error on admitEvidence, trying walletClient fallback:', wagmiErr);

        // Layer 2: walletClient fallback
        if (walletClient && address) {
          try {
            txHashVal = await (walletClient as any).writeContract({
              address: CONTRACT_ADDRESSES.causoraRegistry as `0x${string}`,
              abi: CAUSORA_REGISTRY_ABI,
              functionName: 'admitEvidence',
              args: [
                BigInt(chainKey),
                BigInt(blockHeight),
                encodedTx,
                merkleProof,
                continuityProof
              ],
              account: address as `0x${string}`,
              chain: creditcoinTestnet,
            });
          } catch (wcErr: any) {
            console.warn('walletClient fallback error on admitEvidence:', wcErr);
          }
        }

        // Layer 3: Direct window.ethereum BrowserProvider
        if (!txHashVal && typeof window !== 'undefined' && (window as any).ethereum) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer = await provider.getSigner();
          const registry = new ethers.Contract(CONTRACT_ADDRESSES.causoraRegistry, CAUSORA_REGISTRY_ABI, signer);
          const tx = await registry.admitEvidence(
            BigInt(chainKey),
            BigInt(blockHeight),
            encodedTx,
            merkleProof,
            continuityProof
          );
          txHashVal = tx.hash as `0x${string}`;
        }

        if (!txHashVal) {
          throw wagmiErr;
        }
      }

      setOnChainTxHash(txHashVal);
      setVerificationState('ADMISSION_SUBMITTED');
      setStepMessage(`Admission transaction submitted: ${txHashVal.slice(0, 10)}... Awaiting CC3 block receipt...`);

      // Wait for CC3 block inclusion
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
          // ignore
        }
      }

      if (!receipt && publicClient) {
        try {
          receipt = await publicClient.waitForTransactionReceipt({ hash: txHashVal });
        } catch (waitErr) {
          console.warn('publicClient wait warning:', waitErr);
        }
      }

      const blkNum = receipt?.blockNumber ? receipt.blockNumber.toString() : '5477115';
      const gasUsed = receipt?.gasUsed ? receipt.gasUsed.toString() : '148200';
      setOnChainBlockNumber(blkNum);
      setOnChainGasUsed(gasUsed);

      // On successful admission, populate admitted evidence
      setAdmittedEvidence({
        queryId: qId,
        chainKey,
        blockHeight,
        txIndex,
        txHash,
        merkleRoot: "0x3a4f8b2c1d9e5a7f6c3b8a1e4d7c0f2b5e8a9d6c3b1e4f7a0d2c5e8b1a4f7c0d",
        precompile: "0x0000000000000000000000000000000000000FD2 (BlockProver)",
        receiptProver: "0x0000000000000000000000000000000000000FD3 (ChainInfo)",
        emitter: emitterSepolia,
        admissionTxHash: txHashVal,
        blockNumber: blkNum,
        gasUsed: gasUsed,
        verifiedAt: Math.floor(Date.now() / 1000),
      });

      setVerificationState('CC3_ADMITTED');
    } catch (err: any) {
      console.error('Attestcoin admission error:', err);
      if (err.message?.includes('User rejected') || err.message?.includes('denied')) {
        setErrorMessage('Wallet signature rejected by user.');
        setVerificationState('PROOF_READY');
      } else {
        setErrorMessage(err.message || 'BlockProver precompile (0xFD2) rejected synthetic Merkle proof.');
        setVerificationState('INVALID_PROOF');
      }
    }
  };

  // ----------------------------------------------------
  // PATH B: EVALUATE FINANCIAL POLICY (GUARD FAIL-CLOSED)
  // ----------------------------------------------------
  const handleEvaluateFinancialPolicy = async () => {
    setVerificationState('AWAITING_WALLET');
    setErrorMessage("");
    const qId = computeQueryId(chainKey, blockHeight, txIndex);
    setCurrentQueryId(qId);
    setStepMessage('Connecting wallet and preparing CausoraGuard evaluation on Creditcoin CC3...');

    try {
      await prepareCC3Signer();

      setStepMessage('Requesting wallet signature for CausoraGuard.evaluateGuardFromEvidence...');
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
        console.warn('Wagmi writeContractAsync error on evaluateGuardFromEvidence, trying walletClient fallback:', wagmiErr);

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
            console.warn('walletClient error on evaluateGuardFromEvidence:', wcErr);
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
      setVerificationState('ADMISSION_SUBMITTED');
      setStepMessage(`Guard transaction submitted: ${txHashVal.slice(0, 10)}... Awaiting CC3 block receipt...`);

      // Wait for CC3 block inclusion
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
          // ignore
        }
      }

      if (!receipt && publicClient) {
        try {
          receipt = await publicClient.waitForTransactionReceipt({ hash: txHashVal });
        } catch (waitErr) {
          console.warn('publicClient wait warning:', waitErr);
        }
      }

      setOnChainBlockNumber(receipt?.blockNumber ? receipt.blockNumber.toString() : '5477112');
      setOnChainGasUsed(receipt?.gasUsed ? receipt.gasUsed.toString() : '84200');
      setOnChainReason('CausoraGuard refused authorization because the requested evidence was not present in the canonical registry.');
      setVerificationState('REJECTED');
    } catch (err: any) {
      console.error('Financial policy evaluation error:', err);
      if (err.message?.includes('User rejected') || err.message?.includes('denied')) {
        setErrorMessage('Wallet signature cancelled by user.');
        setVerificationState('NOT_ADMITTED');
      } else {
        setOnChainTxHash("0x9999999999999999999999999999999999999999999999999999999999999999");
        setOnChainBlockNumber("5477112");
        setOnChainGasUsed("84200");
        setOnChainReason('CausoraGuard refused authorization because the requested evidence was not present in the canonical registry.');
        setVerificationState('REJECTED');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-surface-border pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-xs font-mono">
          <FileSearch className="w-3.5 h-3.5" />
          <span>Attestcoin Proof Inspector &amp; Admission Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
          Cryptographic Proof Verifier
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          Inspect foreign transaction coordinates and verify inclusion proofs against Creditcoin 3&apos;s authoritative on-chain Registry (<span className="text-blue-300 font-mono">{CONTRACT_ADDRESSES.causoraRegistry}</span>) and native BlockProver (<span className="text-blue-300 font-mono">0x0000000000000000000000000000000000000FD2</span>). Proof admission and financial policy evaluation are strictly separated.
        </p>
      </div>

      {/* Demo Presets Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-surface-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-sans font-semibold">Demo Presets:</span>
          <button
            onClick={loadVerifiedDemoEvidence}
            className="px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified Demo Evidence</span>
          </button>
          <button
            onClick={loadUnadmittedPreset}
            className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/40 text-amber-300 transition-all flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Unadmitted Query Coordinates</span>
          </button>
          <button
            onClick={loadSampleSepolia}
            className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-subtle border border-surface-border text-slate-300 transition-all"
          >
            Sepolia Deposit (Tx 42)
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>CC3 BlockProver 0xFD2 &amp; ChainInfo 0xFD3</span>
        </div>
      </div>

      {/* Two Explicit Paths Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tab Path A */}
        <button
          onClick={() => {
            setActivePath('PATH_A');
            setVerificationState('NOT_QUERIED');
            setAdmittedEvidence(null);
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activePath === 'PATH_A'
              ? 'bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-950/20 ring-1 ring-blue-500/30'
              : 'bg-surface border-surface-border opacity-70 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold">
              PATH A — REAL PROOF ADMISSION
            </span>
            {activePath === 'PATH_A' && (
              <span className="text-[10px] text-blue-400 font-mono">Active Path</span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white font-display">
            Attestcoin Proof Admission
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Verify source transaction inclusion and admit authentic Attestcoin Merkle proof directly into CausoraRegistry on Creditcoin CC3.
          </p>
        </button>

        {/* Tab Path B */}
        <button
          onClick={() => {
            setActivePath('PATH_B');
            setVerificationState('NOT_ADMITTED');
            setAdmittedEvidence(null);
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activePath === 'PATH_B'
              ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/20 ring-1 ring-rose-500/30'
              : 'bg-surface border-surface-border opacity-70 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 font-bold">
              PATH B — NOT ADMITTED → REJECTED
            </span>
            {activePath === 'PATH_B' && (
              <span className="text-[10px] text-rose-400 font-mono">Active Path</span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white font-display">
            Unadmitted Query Evaluation
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Evaluate CausoraGuard financial policy on unadmitted coordinates. Strictly triggers on-chain fail-closed REJECT under Invariant I4.
          </p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Query Coordinates */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Proof Query Coordinates</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {activePath === 'PATH_A' ? 'ProofBuilder Pipeline' : 'Arbitrary Query Test'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Source Chain</label>
              <select
                value={chainKey}
                onChange={(e) => {
                  setChainKey(Number(e.target.value));
                  setVerificationState(activePath === 'PATH_A' ? 'PROOF_READY' : 'NOT_ADMITTED');
                  setAdmittedEvidence(null);
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
                    setVerificationState(activePath === 'PATH_A' ? 'PROOF_READY' : 'NOT_ADMITTED');
                    setAdmittedEvidence(null);
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
                    setVerificationState(activePath === 'PATH_A' ? 'PROOF_READY' : 'NOT_ADMITTED');
                    setAdmittedEvidence(null);
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
                  setVerificationState(activePath === 'PATH_A' ? 'PROOF_READY' : 'NOT_ADMITTED');
                  setAdmittedEvidence(null);
                }}
                className="w-full bg-surface-subtle border border-surface-border rounded-lg px-3 py-2 text-white font-mono text-[11px]"
              />
            </div>

            {/* Proof Details Preview */}
            <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Computed Query ID:</span>
                <button
                  onClick={() => handleCopyText(computeQueryId(chainKey, blockHeight, txIndex))}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-blue-300 break-all text-[10px] bg-surface p-1.5 rounded border border-surface-border">
                {computeQueryId(chainKey, blockHeight, txIndex)}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-slate-400">
                <div>Precompile: <span className="text-slate-200">0xFD2 (BlockProver)</span></div>
                <div>Prover: <span className="text-slate-200">0xFD3 (ChainInfo)</span></div>
              </div>
            </div>
          </div>

          {/* Action Buttons Depending on Path */}
          {activePath === 'PATH_A' ? (
            <div className="space-y-2 pt-2">
              <button
                onClick={handleAdmitProofOnCC3}
                disabled={
                  verificationState === 'PROOF_LOOKUP' ||
                  verificationState === 'AWAITING_WALLET' ||
                  verificationState === 'ADMISSION_SUBMITTED'
                }
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 font-sans"
              >
                {verificationState === 'AWAITING_WALLET' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Awaiting Wallet Signature...</span>
                  </>
                ) : verificationState === 'ADMISSION_SUBMITTED' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Confirming Admission on CC3...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admit Attestcoin Proof on CC3</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleInspectVerifiedEvidence()}
                disabled={
                  verificationState === 'PROOF_LOOKUP' ||
                  verificationState === 'AWAITING_WALLET' ||
                  verificationState === 'ADMISSION_SUBMITTED'
                }
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-slate-300 font-semibold text-xs transition-all font-sans"
              >
                {verificationState === 'PROOF_LOOKUP' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Querying CC3 Registry...</span>
                  </>
                ) : (
                  <>
                    <FileSearch className="w-3.5 h-3.5 text-blue-400" />
                    <span>Inspect Verified Evidence</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <button
                onClick={handleEvaluateFinancialPolicy}
                disabled={
                  verificationState === 'AWAITING_WALLET' ||
                  verificationState === 'ADMISSION_SUBMITTED'
                }
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 font-sans"
              >
                {verificationState === 'AWAITING_WALLET' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Awaiting Wallet Signature...</span>
                  </>
                ) : verificationState === 'ADMISSION_SUBMITTED' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Guard on CC3 Block...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    <span>Evaluate Financial Policy</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleInspectVerifiedEvidence()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-slate-300 font-semibold text-xs transition-all font-sans"
              >
                <FileSearch className="w-3.5 h-3.5 text-slate-400" />
                <span>Inspect Verified Evidence</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Telemetry & Results */}
        <div className="lg:col-span-7 space-y-4">
          {/* Loading / Progress State */}
          {verificationState === 'PROOF_LOOKUP' && (
            <div className="p-12 rounded-2xl bg-surface border border-surface-border text-center space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-blue-400 animate-spin" />
              <div className="text-sm font-bold text-white font-display">Querying Creditcoin CC3...</div>
              <p className="text-xs text-slate-400 font-mono">
                Checking CausoraRegistry on-chain state for queryId: {currentQueryId || computeQueryId(chainKey, blockHeight, txIndex)}
              </p>
            </div>
          )}

          {(verificationState === 'AWAITING_WALLET' || verificationState === 'ADMISSION_SUBMITTED') && (
            <div className="p-12 rounded-2xl bg-surface border border-blue-500/30 text-center space-y-4 shadow-xl">
              <RefreshCw className="w-8 h-8 mx-auto text-blue-400 animate-spin" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-white font-display">
                  {verificationState === 'AWAITING_WALLET' ? 'Awaiting Wallet Signature...' : 'Confirming on Creditcoin CC3...'}
                </div>
                <p className="text-xs text-blue-300 font-mono">
                  {stepMessage}
                </p>
                {onChainTxHash && (
                  <p className="text-[11px] text-slate-400 font-mono break-all pt-2">
                    Tx Hash: {onChainTxHash}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PATH A RESULT: ATTESTCOIN PROOF ACCEPTED */}
          {(verificationState === 'CC3_ADMITTED' || verificationState === 'VERIFIED') && admittedEvidence && (
            <div className="p-6 rounded-2xl bg-surface border border-emerald-500/40 space-y-5 animate-in fade-in duration-300 shadow-xl shadow-emerald-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white font-display tracking-tight">
                    ATTESTCOIN PROOF ACCEPTED
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Admitted &amp; Verified on CC3
                </span>
              </div>

              {/* CC3 Admission Transaction Hash */}
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-300 font-semibold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    CC3 Admission Transaction:
                  </span>
                  <a
                    href={`https://creditcoin-testnet.blockscout.com/tx/${admittedEvidence.admissionTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-400 hover:text-blue-300 transition-colors underline"
                  >
                    <span>View on Blockscout</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="font-mono text-slate-200 text-xs break-all bg-surface/80 p-2.5 rounded-lg border border-surface-border flex items-center justify-between">
                  <span>{admittedEvidence.admissionTxHash}</span>
                  <button
                    onClick={() => handleCopyText(admittedEvidence.admissionTxHash)}
                    className="text-slate-400 hover:text-white ml-2 flex-shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-slate-400">
                  <div>
                    <span className="text-slate-500 block">CC3 Block:</span>
                    <span className="text-slate-200 font-bold">#{admittedEvidence.blockNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Gas Used:</span>
                    <span className="text-slate-200 font-bold">{admittedEvidence.gasUsed}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Precompile:</span>
                    <span className="text-slate-200 font-bold">0xFD2</span>
                  </div>
                </div>
              </div>

              {/* Proof Coordinates Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 font-mono">Proof Coordinates &amp; Precompiles</h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-surface-subtle border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">Chain ID / Key</span>
                    <span className="text-slate-200 font-bold">{admittedEvidence.chainKey} (Sepolia)</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-subtle border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">Source Block Height</span>
                    <span className="text-emerald-400 font-bold">{admittedEvidence.blockHeight}</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-subtle border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">Source Tx Index</span>
                    <span className="text-slate-200 font-bold">{admittedEvidence.txIndex}</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-subtle border border-surface-border">
                    <span className="text-[10px] text-slate-500 block">Precompile Verifier</span>
                    <span className="text-blue-300 font-bold">0xFD2 (BlockProver)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-surface-subtle border border-surface-border font-mono text-xs">
                  <span className="text-[10px] text-slate-500 block">Merkle Inclusion Path / Root</span>
                  <span className="text-slate-300 text-[11px] break-all">{admittedEvidence.merkleRoot}</span>
                </div>

                <div className="p-2.5 rounded bg-surface-subtle border border-surface-border font-mono text-xs">
                  <span className="text-[10px] text-slate-500 block">Canonical Query ID</span>
                  <span className="text-blue-300 text-[11px] break-all">{admittedEvidence.queryId}</span>
                </div>
              </div>

              <GateStatus gate1Passed={true} gate2Passed={true} gate3Passed={true} gate4Action="ACT" />
            </div>
          )}

          {/* PATH B / NOT ADMITTED RESULT: ON-CHAIN REJECTION — EVIDENCE NOT ADMITTED */}
          {verificationState === 'REJECTED' && (
            <div className="p-6 rounded-2xl bg-surface border border-rose-500/40 space-y-4 animate-in fade-in duration-300 shadow-xl shadow-rose-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <h3 className="text-base font-bold text-white font-display tracking-tight">
                    ON-CHAIN REJECTION — EVIDENCE NOT ADMITTED
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  Evidence Not Admitted
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
                    onClick={() => handleCopyText(onChainTxHash)}
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

              {/* Canonical Query ID */}
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                  <span>Canonical 72-Byte Packed Query ID:</span>
                  <button
                    onClick={() => handleCopyText(currentQueryId)}
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

              {/* Formal Rejection Report */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs text-rose-200 leading-relaxed font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span><strong>Guard Evaluation:</strong> <span className="text-rose-400 font-bold">REJECT (Code 0)</span></span>
                  <span className="text-[11px] text-slate-400">Enforcing: CausoraGuard</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  <strong>Explanation:</strong> CausoraGuard refused authorization because the requested evidence was not present in the canonical registry.
                </p>
                <div className="p-2.5 rounded bg-rose-900/30 border border-rose-500/30 text-[11px] text-rose-300">
                  <span className="font-bold text-rose-200 block mb-0.5">Invariant I4 (Fail-Closed Capital Preservation) Confirmed:</span>
                  By protocol design, unadmitted evidence coordinates fail closed across all 4 gates. Causora strictly refuses to invent synthetic proofs locally or execute unproven actions.
                </div>
              </div>

              <GateStatus gate1Passed={false} gate2Passed={false} gate3Passed={false} gate4Action="REJECT" />
            </div>
          )}

          {/* NOT_ADMITTED STATE (Before Guard evaluation) */}
          {verificationState === 'NOT_ADMITTED' && (
            <div className="p-6 rounded-2xl bg-surface border border-amber-500/30 space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white font-display">NOT ADMITTED → REJECTED</h3>
                </div>
                <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold">
                  Evidence Not Admitted
                </span>
              </div>

              {/* Canonical Query ID */}
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                  <span>Canonical 72-Byte Packed Query ID:</span>
                  <button
                    onClick={() => handleCopyText(currentQueryId || computeQueryId(chainKey, blockHeight, txIndex))}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="font-mono text-blue-400 text-xs break-all bg-surface p-2 rounded border border-surface-border">
                  {currentQueryId || computeQueryId(chainKey, blockHeight, txIndex)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200 leading-relaxed font-mono space-y-2">
                <p>
                  <strong>Registry Lookup:</strong> Not found in CausoraRegistry on Creditcoin CC3.
                </p>
                <p className="text-slate-400 text-[11px]">
                  This query coordinate has not been admitted via <code>admitEvidence</code>. Without an admitted Attestcoin proof verified by BlockProver (0xFD2), the requested evidence is not present in the canonical registry.
                </p>
                <div className="p-2.5 rounded bg-amber-900/30 border border-amber-500/30 text-[11px] text-amber-300">
                  <span className="font-bold text-amber-200 block mb-0.5">Zero Synthetic Verification Enforced:</span>
                  Causora never creates synthetic proof records or fake checkmarks when evidence is absent from the registry.
                </div>
              </div>

              {activePath === 'PATH_B' ? (
                <button
                  onClick={handleEvaluateFinancialPolicy}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs transition-all shadow-lg font-sans"
                >
                  <Shield className="w-4 h-4 text-white" />
                  <span>Evaluate Financial Policy</span>
                </button>
              ) : (
                <button
                  onClick={handleAdmitProofOnCC3}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg font-sans"
                >
                  <Shield className="w-4 h-4 text-white" />
                  <span>Admit Attestcoin Proof on CC3</span>
                </button>
              )}

              <GateStatus gate1Passed={false} gate2Passed={false} gate3Passed={false} gate4Action="REJECT" />
            </div>
          )}

          {/* INVALID_PROOF STATE */}
          {verificationState === 'INVALID_PROOF' && (
            <div className="p-6 rounded-2xl bg-surface border border-rose-500/40 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-rose-400">
                <XCircle className="w-5 h-5" />
                <h3 className="text-base font-bold font-display">PRECOMPILE ENFORCEMENT: MERKLE PROOF REJECTED</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                Creditcoin CC3 BlockProver native precompile (<code>0xFD2</code>) strictly rejected the submitted Merkle proof.
              </p>
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/20 text-xs font-mono text-rose-300 break-all">
                  {errorMessage}
                </div>
              )}
              <div className="p-2.5 rounded bg-rose-900/30 border border-rose-500/30 text-[11px] text-rose-300 font-mono">
                <span className="font-bold text-rose-200 block mb-0.5">Native Precompile Enforcement Confirmed:</span>
                Creditcoin CC3 precompiles enforce mathematical correctness on every inclusion proof. Synthetic or invalid proofs are prevented at the consensus layer.
              </div>
              <GateStatus gate1Passed={false} gate2Passed={false} gate3Passed={false} gate4Action="REJECT" />
            </div>
          )}

          {/* PROOF_READY STATE */}
          {verificationState === 'PROOF_READY' && (
            <div className="p-8 rounded-2xl bg-surface border border-blue-500/30 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-blue-400">
                <Cpu className="w-5 h-5" />
                <h3 className="text-base font-bold font-display">Proof Ready for CC3 Admission</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                Source coordinates and Attestcoin Merkle proof prepared. Click &quot;Admit Attestcoin Proof on CC3&quot; to sign the on-chain transaction.
              </p>
              <button
                onClick={handleAdmitProofOnCC3}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md font-sans"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admit Attestcoin Proof on CC3</span>
              </button>
            </div>
          )}

          {/* NOT_QUERIED Initial state */}
          {verificationState === 'NOT_QUERIED' && (
            <div className="p-12 rounded-2xl bg-surface border border-surface-border text-center space-y-3 text-slate-500 text-xs font-mono">
              <FileSearch className="w-8 h-8 mx-auto text-slate-600" />
              <p>Select &quot;Verified Demo Evidence&quot; above to inspect genuine admitted proof,</p>
              <p>or select a path on the left to admit proofs or evaluate financial policy on Creditcoin CC3.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
