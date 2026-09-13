import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, LENDING_POSITION_MANAGER_ABI } from '@/lib/contracts';

export async function POST(req: Request) {
  try {
    const { address } = await req.json();

    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 });
    }

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Operator key not configured on server. Owner must set risk evaluator.' },
        { status: 503 }
      );
    }

    const rpcUrl = process.env.NEXT_PUBLIC_CC3_RPC_URL || 'https://rpc.cc3-testnet.creditcoin.network';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const lendingManager = new ethers.Contract(
      CONTRACT_ADDRESSES.lendingPositionManager,
      LENDING_POSITION_MANAGER_ABI,
      wallet
    );

    // Check if already approved
    const isApproved = await lendingManager.riskEvaluators(address);
    if (isApproved) {
      return NextResponse.json({
        success: true,
        alreadyApproved: true,
        message: `Address ${address} is already an authorized risk evaluator.`
      });
    }

    // Call setRiskEvaluator
    const tx = await lendingManager.setRiskEvaluator(address, true);
    const receipt = await tx.wait(1);

    return NextResponse.json({
      success: true,
      alreadyApproved: false,
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber,
      message: `Address ${address} successfully authorized as risk evaluator on Creditcoin CC3.`
    });
  } catch (err: any) {
    console.error('Error in /api/risk-evaluator:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to authorize risk evaluator on CC3' },
      { status: 500 }
    );
  }
}
