/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Canonical Structural Model (CSM) Type Definitions
 * Vendor-neutral data representations for ETABS, ProtaStructure, and ETABS MATE.
 */

export type StructuralFormat = 'edb' | 'e2k' | 'mat' | 'prota' | 'ifc' | 'saf' | 'csv' | 'synthetic';

export type UnitSystem = 'metric_si' | 'us_customary';

export type ElementType = 'column' | 'beam' | 'brace' | 'shear_wall' | 'slab' | 'footing' | 'link';

export type MaterialType = 'concrete' | 'structural_steel' | 'rebar' | 'masonry' | 'composite';

export interface CsmNode {
  id: string;
  name: string;
  x: number; // in meters (SI)
  y: number;
  z: number;
  story: string;
  restraints: {
    ux: boolean;
    uy: boolean;
    uz: boolean;
    rx: boolean;
    ry: boolean;
    rz: boolean;
  };
}

export interface CsmMaterial {
  id: string;
  name: string;
  type: MaterialType;
  fc?: number; // Concrete compressive strength in MPa
  fy?: number; // Steel rebar yield strength in MPa
  fu?: number; // Ultimate strength in MPa
  elasticModulus: number; // E in GPa
  poissonsRatio: number;
  unitWeight: number; // kN/m³
}

export interface CsmSection {
  id: string;
  name: string;
  materialId: string;
  shape: 'rectangular' | 'circular' | 'i_section' | 'box' | 't_beam' | 'wall_panel';
  dimensions: {
    depth: number; // mm
    width: number; // mm
    flangeThickness?: number;
    webThickness?: number;
    wallThickness?: number;
  };
  area: number; // cm²
  i33: number; // Moment of Inertia cm⁴
  i22: number;
}

export interface CsmElement {
  id: string;
  name: string;
  type: ElementType;
  nodeIId: string;
  nodeJId: string;
  sectionId: string;
  story: string;
  length: number; // meters
  rotationAngle?: number; // degrees
  designResults?: {
    dcRatio: number; // Demand/Capacity ratio
    governingCombo: string;
    axialForce: number; // kN (+ tension, - compression)
    momentMajor: number; // kN.m
    momentMinor: number; // kN.m
    shearForce: number; // kN
    topRebarArea?: number; // mm²
    bottomRebarArea?: number; // mm²
    shearRebarSpacing?: number; // mm
    status: 'passed' | 'warning' | 'failed';
  };
}

export interface CsmStory {
  id: string;
  name: string;
  elevation: number; // meters
  height: number; // meters
  isSimilarTo?: string;
  isMasterStory?: boolean;
}

export interface CsmLoadCase {
  id: string;
  name: string;
  type: 'dead' | 'live' | 'roof_live' | 'earthquake_x' | 'earthquake_y' | 'wind_x' | 'wind_y';
  factor: number;
}

export interface CsmLoadCombination {
  id: string;
  name: string;
  formula: string; // e.g. "1.2D + 1.6L" or "1.2D + 1.0E + 1.0L"
  limitState: 'ultimate' | 'serviceability';
}

export interface CsmProject {
  id: string;
  name: string;
  description: string;
  sourceFormat: StructuralFormat;
  sourceFileName: string;
  version: string;
  unitSystem: UnitSystem;
  jurisdiction: string; // e.g., "ایران (مبحث ۹/۱۰ + ۲۸۰۰)", "USA (ACI 318 / ASCE 7)", "Eurocode"
  structuralSystem?: string;
  stories: CsmStory[];
  nodes: CsmNode[];
  materials: CsmMaterial[];
  sections: CsmSection[];
  elements: CsmElement[];
  loadCases: CsmLoadCase[];
  loadCombinations: CsmLoadCombination[];
  createdAt: string;
  updatedAt: string;
  stats: {
    totalWeightKn: number;
    baseShearXKn: number;
    baseShearYKn: number;
    maxStoryDrift: number;
    maxDcRatio: number;
    totalConcreteVolumeM3: number;
    totalRebarTonnageTon: number;
    totalStructuralSteelTon: number;
    fundamentalPeriodSec?: number;
  };
}

export interface CsmDiff {
  timestamp: string;
  addedElements: string[];
  modifiedElements: { id: string; field: string; before: unknown; after: unknown }[];
  removedElements: string[];
  maxDcChange: number;
}
