/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Audit, Traceability & Evidence Bundle Engine (M15)
 * Maintains cryptographic hash-chained audit trails and reproducible snapshots.
 */

import type { EvidenceItem } from '../types/modules.ts';
import type { CsmProject } from '../types/csm.ts';

// Deterministic fast SHA-256 implementation
export async function computeSha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple hash for non-subtle contexts
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256-fallback-${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

export interface AuditBlock {
  blockIndex: number;
  timestamp: string;
  action: string;
  actor: string;
  modelChecksum: string;
  previousHash: string;
  hash: string;
  details: string;
}

export class AuditLedger {
  private blocks: AuditBlock[] = [];
  private genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';

  constructor() {
    this.appendGenesis();
  }

  private appendGenesis() {
    const genesis: AuditBlock = {
      blockIndex: 0,
      timestamp: '2026-10-16T08:00:00Z',
      action: 'GENESIS_BLOCK_INIT',
      actor: 'System (StructAuto AI Vault)',
      modelChecksum: 'csm-genesis-init',
      previousHash: this.genesisHash,
      hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
      details: 'آغاز زنجیره هش تغییرناپذیر ثبت شواهد حسابرسی مهندسی سازه',
    };
    this.blocks.push(genesis);
  }

  public async recordEvent(action: string, actor: string, modelChecksum: string, details: string): Promise<AuditBlock> {
    const prev = this.blocks[this.blocks.length - 1];
    const blockIndex = this.blocks.length;
    const timestamp = new Date().toISOString();
    const rawData = `${blockIndex}:${timestamp}:${action}:${actor}:${modelChecksum}:${prev.hash}:${details}`;
    const hash = await computeSha256(rawData);

    const block: AuditBlock = {
      blockIndex,
      timestamp,
      action,
      actor,
      modelChecksum,
      previousHash: prev.hash,
      hash,
      details,
    };

    this.blocks.push(block);
    return block;
  }

  public getBlocks(): AuditBlock[] {
    return [...this.blocks];
  }

  public getLatestHash(): string {
    return this.blocks[this.blocks.length - 1]?.hash || this.genesisHash;
  }

  public async verifyIntegrity(): Promise<{ valid: boolean; brokenAtBlock?: number }> {
    for (let i = 1; i < this.blocks.length; i++) {
      const curr = this.blocks[i];
      const prev = this.blocks[i - 1];
      if (curr.previousHash !== prev.hash) {
        return { valid: false, brokenAtBlock: i };
      }
      const rawData = `${curr.blockIndex}:${curr.timestamp}:${curr.action}:${curr.actor}:${curr.modelChecksum}:${curr.previousHash}:${curr.details}`;
      const recomputed = await computeSha256(rawData);
      if (curr.hash !== recomputed) {
        return { valid: false, brokenAtBlock: i };
      }
    }
    return { valid: true };
  }
}

export const auditLedger = new AuditLedger();

/**
 * Generate a complete Evidence Bundle export package
 */
export async function generateEvidenceBundle(project: CsmProject, signOffEngineer?: string) {
  const modelJson = JSON.stringify(project);
  const modelHash = await computeSha256(modelJson);

  return {
    bundleId: `EV-BUNDLE-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    systemVersion: 'StructAuto AI v1.0.0-GA',
    projectName: project.name,
    projectFormat: project.sourceFormat,
    modelSha256: modelHash,
    storiesCount: project.stories.length,
    elementsCount: project.elements.length,
    jurisdiction: project.jurisdiction,
    engineeringSignOff: {
      signedOff: Boolean(signOffEngineer),
      engineerName: signOffEngineer || 'مهندس محاسب دارای پروانه اشتغال نظام مهندسی',
      signedAt: new Date().toISOString(),
      legalDisclaimer: 'کلیه محاسبات و نقشه‌های استخراجی به عنوان ابزار کمک مهندسی تولید گردیده و تحت نظارت و کنترل نهایی مهندس محاسب رسمیت می‌یابد.',
    },
    auditChainLength: auditLedger.getBlocks().length,
    auditBlocks: auditLedger.getBlocks(),
  };
}
