import { ethers } from 'ethers';

export interface DecodedReceiptFields {
  receiptStatus: number;
  receiptGasUsed: bigint;
  receiptLogs: Array<{
    address: string;
    topics: string[];
    data: string;
  }>;
  receiptLogsBloom: string;
}

export interface DecodedCommonTxFields {
  nonce: bigint;
  gasLimit: bigint;
  from: string;
  toIsNull: boolean;
  to: string;
  value: bigint;
  data: string;
}

export class EvmV1DecoderTs {
  static getTransactionType(encodedTx: string): number {
    const bytes = ethers.getBytes(encodedTx);
    if (bytes.length < 32) throw new Error('Encoded TX too short');
    return bytes[31];
  }

  static isValidTransactionType(txType: number): boolean {
    return txType <= 4;
  }

  static decodeReceipt(encodedTx: string): DecodedReceiptFields {
    const coder = ethers.AbiCoder.defaultAbiCoder();
    const [, chunks] = coder.decode(['uint8', 'bytes[]'], encodedTx);
    if (!chunks || chunks.length < 2) throw new Error('Insufficient chunks for receipt fields');

    const receiptChunk = chunks[chunks.length - 1];
    const [receiptStatus, receiptGasUsed, receiptLogs, receiptLogsBloom] = coder.decode(
      ['uint8', 'uint64', 'tuple(address,bytes32[],bytes)[]', 'bytes'],
      receiptChunk
    );

    return {
      receiptStatus: Number(receiptStatus),
      receiptGasUsed: BigInt(receiptGasUsed),
      receiptLogs: receiptLogs.map((log: any) => ({
        address: log[0],
        topics: log[1],
        data: log[2]
      })),
      receiptLogsBloom
    };
  }
}
