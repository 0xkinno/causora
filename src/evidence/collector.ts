import * as fs from 'fs';
import * as path from 'path';

export interface EvidenceRecord {
  timestamp: string;
  claim: string;
  chainKey: number;
  blockHeight: number;
  txHash: string;
  txIndex?: number;
  verificationGas?: number;
  proofLatencyMs?: number;
  result: string;
  details?: any;
}

export class EvidenceRecorder {
  static recordCase(record: EvidenceRecord, filePath: string = 'evidence/relation-cases.jsonl') {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const line = JSON.stringify(record) + '\n';
    fs.appendFileSync(filePath, line, 'utf8');
  }

  static writeJson(data: any, filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}
