import { TransactionMerkleProof, ContinuityProof } from './precompiles';

export interface AttestcoinProofResponse {
  success: boolean;
  data?: {
    chainKey: number;
    headerNumber: number;
    txBytes: string;
    merkleProof: TransactionMerkleProof;
    continuityProof: ContinuityProof;
  };
  error?: string;
}

export class ProofBuilderClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://prover.cc3-testnet.creditcoin.network') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getProof(chainKey: number, txHash: string): Promise<AttestcoinProofResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/proof/${chainKey}/${txHash}`);
      if (!response.ok) {
        throw new Error(`ProofBuilder API returned status ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return {
        success: true,
        data: {
          chainKey,
          headerNumber: data.headerNumber || data.height,
          txBytes: data.txBytes || data.encodedTransaction,
          merkleProof: data.merkleProof,
          continuityProof: data.continuityProof
        }
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to fetch proof from Attestcoin ProofBuilder'
      };
    }
  }
}
