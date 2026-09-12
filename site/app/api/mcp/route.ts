import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;
    const payload = body.payload;

    if (action === 'explain_receipt') {
      const receipt = payload && payload.receipt;
      const explanation = {
        title: 'Cryptographic Orderability Audit Explanation',
        decisionSummary: receipt && receipt.action === 'HOLD'
          ? 'The protocol classified this multi-chain event race as CROSS_CHAIN_INDETERMINATE because independent chain blocks lack an authentic cryptographic causal witness. To safeguard capital against predatory liquidation, CausoraGuard enforced a fail-closed HOLD, keeping collateral frozen in the CC3 vault.'
          : receipt && receipt.action === 'ACT'
          ? 'Precedence was cryptographically proven on-chain. CausoraGuard authorized execution on Creditcoin CC3.'
          : 'Evidence failed verification against precompile 0xFD2/0xFD3. Action rejected.',
        invariantPreserved: 'Capital Safety Invariant: Collateral cannot be liquidated on unprovable cross-chain timing.',
        authorityNote: 'This AI summary is advisory only. Protocol state is authoritatively determined by Creditcoin CC3 smart contracts (CausoraGuard.sol & CausoraRegistry.sol).'
      };
      return NextResponse.json({ success: true, explanation });
    }

    return NextResponse.json({
      success: true,
      message: 'Causora MCP Advisory API ready.',
      authorityRule: 'Attestcoin -> Creditcoin Precompiles (0xFD2/0xFD3) -> CausoraGuard'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
