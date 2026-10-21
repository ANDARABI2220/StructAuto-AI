/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * M01 to M20 Catalog and System State Types
 */

export interface SystemModule {
  id: string; // M01 .. M20
  code: string;
  nameFa: string;
  nameEn: string;
  category: 'core' | 'ai' | 'standards' | 'drawings' | 'qa' | 'security';
  phase: string; // P1..P6
  status: 'active' | 'ready' | 'simulated' | 'in_progress';
  descriptionFa: string;
  raci: {
    responsible: string;
    accountable: string;
    consulted: string;
    informed: string;
  };
  metrics: {
    name: string;
    target: string;
    current: string;
    isPass: boolean;
  };
}

export interface TurnMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  stage?: 'plan' | 'act' | 'verify' | 'recover' | 'complete';
  content: string;
  toolCall?: {
    toolName: string;
    args: Record<string, unknown>;
    result?: unknown;
    status: 'pending' | 'approved' | 'executed' | 'rejected';
  };
  timestamp: string;
}

export interface BenchmarkTask {
  id: string;
  taskName: string;
  category: string;
  tManualMedianSec: number;
  tAutoMedianSec: number;
  tAutoP95Sec: number;
  speedupFactor: number;
  targetSpeedup: number;
  passed: boolean;
}

export interface VerificationCheck {
  id: string;
  titleFa: string;
  category: 'equilibrium' | 'drift' | 'rebar_cover' | 'dc_ratio' | 'cross_check';
  description: string;
  standardClause: string;
  status: 'pass' | 'warning' | 'fail';
  measuredValue: number | string;
  allowableValue: number | string;
  deltaPercent: number;
  isSilentCheck: boolean;
}

export interface EvidenceItem {
  id: string;
  timestamp: string;
  eventType: string;
  actor: string;
  modelHash: string;
  previousHash: string;
  currentHash: string;
  details: string;
  verified: boolean;
}
