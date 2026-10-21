/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 72-Week Development Roadmap & Gantt Timeline Types
 */

export interface RoadmapPhase {
  id: string; // P0 .. P8, OPS
  titleFa: string;
  titleEn: string;
  startDate: string;
  endDate: string;
  milestone: string;
  milestoneName: string;
  color: string;
  fte: number;
  criticalPath: boolean;
  status: 'completed' | 'current' | 'upcoming';
  descriptionFa: string;
}

export interface RoadmapTask {
  id: string; // P0-T01, etc.
  phaseId: string;
  nameFa: string;
  nameEn: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  isCritical: boolean;
  isMilestone?: boolean;
  ownerRole: string;
  status: 'passed' | 'in_progress' | 'pending';
}
