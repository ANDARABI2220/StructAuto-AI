/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Realistic sample structural models across 5 building types.
 */

import type { CsmProject, CsmStory, CsmNode, CsmMaterial, CsmSection, CsmElement, CsmLoadCase, CsmLoadCombination } from '../types/csm.ts';

/**
 * 1. 10-Story Residential RC Tower with Shear Walls (برج مسکونی بتن‌آرمه ۱۰ طبقه با دیوارهای برشی)
 */
export function createTenStoryRcBuilding(): CsmProject {
  const storyCount = 10;
  const storyHeight = 3.2; // meters
  const bayX = 5.5; // meters
  const bayY = 6.0; // meters
  const nx = 4; // grid lines X (3 bays)
  const ny = 4; // grid lines Y (3 bays)

  const stories: CsmStory[] = [];
  for (let s = 1; s <= storyCount; s++) {
    stories.push({
      id: `story-${s}`,
      name: `طبقه ${s}`,
      elevation: Number((s * storyHeight).toFixed(2)),
      height: storyHeight,
      isMasterStory: s === 1 || s === 5,
    });
  }

  // Materials
  const materials: CsmMaterial[] = [
    {
      id: 'mat-c35',
      name: 'بتن C35/45',
      type: 'concrete',
      fc: 35,
      elasticModulus: 32.5,
      poissonsRatio: 0.2,
      unitWeight: 25.0,
    },
    {
      id: 'mat-s400',
      name: 'آرماتور AIII / S400',
      type: 'rebar',
      fy: 400,
      fu: 600,
      elasticModulus: 200,
      poissonsRatio: 0.3,
      unitWeight: 78.5,
    },
  ];

  // Sections
  const sections: CsmSection[] = [
    {
      id: 'sec-col-lower',
      name: 'C60x60 (طبقات ۱ تا ۵)',
      materialId: 'mat-c35',
      shape: 'rectangular',
      dimensions: { depth: 600, width: 600 },
      area: 3600,
      i33: 1080000,
      i22: 1080000,
    },
    {
      id: 'sec-col-upper',
      name: 'C50x50 (طبقات ۶ تا ۱۰)',
      materialId: 'mat-c35',
      shape: 'rectangular',
      dimensions: { depth: 500, width: 500 },
      area: 2500,
      i33: 520833,
      i22: 520833,
    },
    {
      id: 'sec-beam-main',
      name: 'B40x50 (تیرهای اصلی)',
      materialId: 'mat-c35',
      shape: 'rectangular',
      dimensions: { depth: 500, width: 400 },
      area: 2000,
      i33: 416666,
      i22: 266666,
    },
    {
      id: 'sec-wall-25',
      name: 'W25 (دیوار برشی هسته مرکزی)',
      materialId: 'mat-c35',
      shape: 'wall_panel',
      dimensions: { depth: 250, width: 3000, wallThickness: 250 },
      area: 7500,
      i33: 56250000,
      i22: 390625,
    },
  ];

  // Generate nodes
  const nodes: CsmNode[] = [];
  // Base nodes at z=0
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      nodes.push({
        id: `node-base-${i}-${j}`,
        name: `N-0-${i}-${j}`,
        x: Number((i * bayX).toFixed(2)),
        y: Number((j * bayY).toFixed(2)),
        z: 0,
        story: 'Base',
        restraints: { ux: true, uy: true, uz: true, rx: true, ry: true, rz: true },
      });
    }
  }

  // Story nodes
  for (let s = 1; s <= storyCount; s++) {
    const z = Number((s * storyHeight).toFixed(2));
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        nodes.push({
          id: `node-s${s}-${i}-${j}`,
          name: `N-${s}-${i}-${j}`,
          x: Number((i * bayX).toFixed(2)),
          y: Number((j * bayY).toFixed(2)),
          z: z,
          story: `story-${s}`,
          restraints: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
        });
      }
    }
  }

  // Generate elements (Columns and Beams)
  const elements: CsmElement[] = [];
  let elemCounter = 1;

  for (let s = 1; s <= storyCount; s++) {
    const colSecId = s <= 5 ? 'sec-col-lower' : 'sec-col-upper';

    // Columns
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const bottomNodeId = s === 1 ? `node-base-${i}-${j}` : `node-s${s - 1}-${i}-${j}`;
        const topNodeId = `node-s${s}-${i}-${j}`;
        const dc = Number((0.45 + (storyCount - s) * 0.045 + Math.sin(i + j) * 0.05).toFixed(3));
        const status = dc > 0.95 ? 'warning' : 'passed';

        elements.push({
          id: `col-${s}-${i}-${j}`,
          name: `C${elemCounter++}`,
          type: 'column',
          nodeIId: bottomNodeId,
          nodeJId: topNodeId,
          sectionId: colSecId,
          story: `story-${s}`,
          length: storyHeight,
          designResults: {
            dcRatio: dc,
            governingCombo: '1.2D + 1.0E + 1.0L',
            axialForce: Number((-250 * (storyCount - s + 1) - i * 40).toFixed(1)),
            momentMajor: Number((35 + (storyCount - s) * 8).toFixed(1)),
            momentMinor: Number((25 + (storyCount - s) * 5).toFixed(1)),
            shearForce: Number((45 + (storyCount - s) * 6).toFixed(1)),
            topRebarArea: s <= 5 ? 3600 : 2500,
            bottomRebarArea: s <= 5 ? 3600 : 2500,
            shearRebarSpacing: 100,
            status: status,
          },
        });
      }
    }

    // Beams in X direction
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const nI = `node-s${s}-${i}-${j}`;
        const nJ = `node-s${s}-${i + 1}-${j}`;
        const dc = Number((0.55 + (storyCount - s) * 0.03 + Math.cos(j) * 0.04).toFixed(3));
        elements.push({
          id: `beam-x-${s}-${i}-${j}`,
          name: `B${elemCounter++}`,
          type: 'beam',
          nodeIId: nI,
          nodeJId: nJ,
          sectionId: 'sec-beam-main',
          story: `story-${s}`,
          length: bayX,
          designResults: {
            dcRatio: dc,
            governingCombo: '1.2D + 1.6L',
            axialForce: -12.5,
            momentMajor: Number((120 + (storyCount - s) * 8).toFixed(1)),
            momentMinor: 4.2,
            shearForce: Number((85 + (storyCount - s) * 5).toFixed(1)),
            topRebarArea: 1420,
            bottomRebarArea: 980,
            shearRebarSpacing: 150,
            status: dc > 0.95 ? 'warning' : 'passed',
          },
        });
      }
    }

    // Beams in Y direction
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny - 1; j++) {
        const nI = `node-s${s}-${i}-${j}`;
        const nJ = `node-s${s}-${i}-${j + 1}`;
        const dc = Number((0.52 + (storyCount - s) * 0.03 + Math.sin(i) * 0.03).toFixed(3));
        elements.push({
          id: `beam-y-${s}-${i}-${j}`,
          name: `B${elemCounter++}`,
          type: 'beam',
          nodeIId: nI,
          nodeJId: nJ,
          sectionId: 'sec-beam-main',
          story: `story-${s}`,
          length: bayY,
          designResults: {
            dcRatio: dc,
            governingCombo: '1.2D + 1.6L',
            axialForce: -15.0,
            momentMajor: Number((135 + (storyCount - s) * 9).toFixed(1)),
            momentMinor: 5.1,
            shearForce: Number((92 + (storyCount - s) * 6).toFixed(1)),
            topRebarArea: 1580,
            bottomRebarArea: 1050,
            shearRebarSpacing: 150,
            status: 'passed',
          },
        });
      }
    }

    // Shear walls in central bays
    if (s <= storyCount) {
      const bottomNodeW = s === 1 ? 'node-base-1-1' : `node-s${s - 1}-1-1`;
      const topNodeW = `node-s${s}-1-1`;
      elements.push({
        id: `wall-${s}-c`,
        name: `SW${s}`,
        type: 'shear_wall',
        nodeIId: bottomNodeW,
        nodeJId: topNodeW,
        sectionId: 'sec-wall-25',
        story: `story-${s}`,
        length: storyHeight,
        designResults: {
          dcRatio: Number((0.68 + (storyCount - s) * 0.025).toFixed(3)),
          governingCombo: '0.9D + 1.0E',
          axialForce: -1250,
          momentMajor: 890,
          momentMinor: 120,
          shearForce: 340,
          topRebarArea: 4500,
          bottomRebarArea: 4500,
          shearRebarSpacing: 100,
          status: 'passed',
        },
      });
    }
  }

  const loadCases: CsmLoadCase[] = [
    { id: 'lc-dead', name: 'Dead (بار مرده)', type: 'dead', factor: 1.0 },
    { id: 'lc-live', name: 'Live (بار زنده)', type: 'live', factor: 1.0 },
    { id: 'lc-ex', name: 'EX (زلزله افقی در راستای X)', type: 'earthquake_x', factor: 1.0 },
    { id: 'lc-ey', name: 'EY (زلزله افقی در راستای Y)', type: 'earthquake_y', factor: 1.0 },
  ];

  const loadCombinations: CsmLoadCombination[] = [
    { id: 'combo-1', name: 'COMB1', formula: '1.4 Dead', limitState: 'ultimate' },
    { id: 'combo-2', name: 'COMB2', formula: '1.2 Dead + 1.6 Live', limitState: 'ultimate' },
    { id: 'combo-3', name: 'COMB3 (Seismic X)', formula: '1.2 Dead + 1.0 Live + 1.0 EX', limitState: 'ultimate' },
    { id: 'combo-4', name: 'COMB4 (Seismic Y)', formula: '1.2 Dead + 1.0 Live + 1.0 EY', limitState: 'ultimate' },
    { id: 'combo-5', name: 'COMB5 (Uplift)', formula: '0.9 Dead + 1.0 EX', limitState: 'ultimate' },
  ];

  return {
    id: 'proj-rc-tower-10',
    name: 'برج مسکونی ۱۰ طبقه بتن‌آرمه (الگوی مرجع ETABS 22)',
    description: 'سیستم دوگانه قاب خمشی ویژه و دیوار برشی در دو جهت، طراحی شده بر اساس مبحث نهم ویرایش ۱۳۹۹ و استاندارد ۲۸۰۰ ویرایش ۴',
    sourceFormat: 'e2k',
    sourceFileName: 'Tower_10Story_DualSystem.e2k',
    version: '2.4.1',
    unitSystem: 'metric_si',
    jurisdiction: 'ایران (مبحث ۹ و ۱۰ مقررات ملی + استاندارد ۲۸۰۰ ویرایش ۴)',
    stories,
    nodes,
    materials,
    sections,
    elements,
    loadCases,
    loadCombinations,
    createdAt: '2026-10-15T09:30:00Z',
    updatedAt: '2026-10-16T12:00:00Z',
    stats: {
      totalWeightKn: 38500,
      baseShearXKn: 2450,
      baseShearYKn: 2680,
      maxStoryDrift: 0.0084, // Limit 0.02
      maxDcRatio: 0.942,
      totalConcreteVolumeM3: 1540,
      totalRebarTonnageTon: 185,
      totalStructuralSteelTon: 0,
    },
  };
}

/**
 * 2. 6-Story Braced Steel Frame (اسکلت فولادی ۶ طبقه با مهاربند ضربدری)
 */
export function createSixStorySteelBuilding(): CsmProject {
  const storyCount = 6;
  const storyHeight = 3.6;
  const bayX = 6.0;
  const bayY = 6.0;
  const nx = 4;
  const ny = 3;

  const stories: CsmStory[] = [];
  for (let s = 1; s <= storyCount; s++) {
    stories.push({
      id: `steel-story-${s}`,
      name: `طبقه ${s}`,
      elevation: Number((s * storyHeight).toFixed(2)),
      height: storyHeight,
      isMasterStory: s === 1,
    });
  }

  const materials: CsmMaterial[] = [
    {
      id: 'mat-st52',
      name: 'فولاد ساختمانی ST52 / A992',
      type: 'structural_steel',
      fy: 355,
      fu: 510,
      elasticModulus: 210,
      poissonsRatio: 0.3,
      unitWeight: 78.5,
    },
  ];

  const sections: CsmSection[] = [
    {
      id: 'sec-steel-col',
      name: 'BOX 400x400x20',
      materialId: 'mat-st52',
      shape: 'box',
      dimensions: { depth: 400, width: 400, flangeThickness: 20, webThickness: 20 },
      area: 304,
      i33: 74200,
      i22: 74200,
    },
    {
      id: 'sec-steel-beam',
      name: 'IPE 360',
      materialId: 'mat-st52',
      shape: 'i_section',
      dimensions: { depth: 360, width: 170, flangeThickness: 12.7, webThickness: 8 },
      area: 72.7,
      i33: 16270,
      i22: 1043,
    },
    {
      id: 'sec-steel-brace',
      name: '2UNP 160',
      materialId: 'mat-st52',
      shape: 'box',
      dimensions: { depth: 160, width: 130, flangeThickness: 10, webThickness: 7.5 },
      area: 48,
      i33: 1840,
      i22: 1520,
    },
  ];

  const nodes: CsmNode[] = [];
  // Base
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      nodes.push({
        id: `node-st-base-${i}-${j}`,
        name: `SN-0-${i}-${j}`,
        x: Number((i * bayX).toFixed(2)),
        y: Number((j * bayY).toFixed(2)),
        z: 0,
        story: 'Base',
        restraints: { ux: true, uy: true, uz: true, rx: true, ry: true, rz: true },
      });
    }
  }

  // Floors
  for (let s = 1; s <= storyCount; s++) {
    const z = Number((s * storyHeight).toFixed(2));
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        nodes.push({
          id: `node-st-s${s}-${i}-${j}`,
          name: `SN-${s}-${i}-${j}`,
          x: Number((i * bayX).toFixed(2)),
          y: Number((j * bayY).toFixed(2)),
          z: z,
          story: `steel-story-${s}`,
          restraints: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
        });
      }
    }
  }

  const elements: CsmElement[] = [];
  let eIdx = 1;

  for (let s = 1; s <= storyCount; s++) {
    // Columns
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const bId = s === 1 ? `node-st-base-${i}-${j}` : `node-st-s${s - 1}-${i}-${j}`;
        const tId = `node-st-s${s}-${i}-${j}`;
        const dc = Number((0.50 + (storyCount - s) * 0.05).toFixed(3));
        elements.push({
          id: `st-col-${s}-${i}-${j}`,
          name: `SC${eIdx++}`,
          type: 'column',
          nodeIId: bId,
          nodeJId: tId,
          sectionId: 'sec-steel-col',
          story: `steel-story-${s}`,
          length: storyHeight,
          designResults: {
            dcRatio: dc,
            governingCombo: '1.2D + 1.0E + 1.0L',
            axialForce: Number((-180 * (storyCount - s + 1)).toFixed(1)),
            momentMajor: 45,
            momentMinor: 30,
            shearForce: 52,
            status: 'passed',
          },
        });
      }
    }

    // Beams X
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx - 1; i++) {
        elements.push({
          id: `st-bm-x-${s}-${i}-${j}`,
          name: `SB${eIdx++}`,
          type: 'beam',
          nodeIId: `node-st-s${s}-${i}-${j}`,
          nodeJId: `node-st-s${s}-${i + 1}-${j}`,
          sectionId: 'sec-steel-beam',
          story: `steel-story-${s}`,
          length: bayX,
          designResults: {
            dcRatio: Number((0.62 + (storyCount - s) * 0.02).toFixed(3)),
            governingCombo: '1.2D + 1.6L',
            axialForce: -5,
            momentMajor: 165,
            momentMinor: 2,
            shearForce: 95,
            status: 'passed',
          },
        });
      }
    }

    // Braces in middle bays
    const bNodeBottom = s === 1 ? 'node-st-base-1-0' : `node-st-s${s - 1}-1-0`;
    const bNodeTop = `node-st-s${s}-2-0`;
    elements.push({
      id: `st-br-${s}-1`,
      name: `BR${s}-1`,
      type: 'brace',
      nodeIId: bNodeBottom,
      nodeJId: bNodeTop,
      sectionId: 'sec-steel-brace',
      story: `steel-story-${s}`,
      length: Math.sqrt(bayX * bayX + storyHeight * storyHeight),
      designResults: {
        dcRatio: Number((0.71 + (storyCount - s) * 0.03).toFixed(3)),
        governingCombo: '1.2D + 1.0EX',
        axialForce: 320,
        momentMajor: 2,
        momentMinor: 1,
        shearForce: 4,
        status: 'passed',
      },
    });
  }

  return {
    id: 'proj-steel-braced-6',
    name: 'اسکلت فولادی ۶ طبقه با مهاربندی همگرا (CBF)',
    description: 'ساختمان فولادی اداری با قاب‌های مهاربندی شده ضربدری، طراحی بر اساس مبحث ۱۰ مقررات ملی و استاندارد ۲۸۰۰ ویرایش ۴',
    sourceFormat: 'edb',
    sourceFileName: 'Office_6Story_BracedFrame.edb',
    version: '22.0.0',
    unitSystem: 'metric_si',
    jurisdiction: 'ایران (مبحث دهم مقررات ملی ساختمان + ۲۸۰۰)',
    stories,
    nodes,
    materials,
    sections,
    elements,
    loadCases: [
      { id: 'lc-d', name: 'Dead', type: 'dead', factor: 1.0 },
      { id: 'lc-l', name: 'Live', type: 'live', factor: 1.0 },
      { id: 'lc-ex', name: 'Seismic X', type: 'earthquake_x', factor: 1.0 },
      { id: 'lc-ey', name: 'Seismic Y', type: 'earthquake_y', factor: 1.0 },
    ],
    loadCombinations: [
      { id: 'sc-1', name: '1.4D', formula: '1.4D', limitState: 'ultimate' },
      { id: 'sc-2', name: '1.2D+1.6L', formula: '1.2D + 1.6L', limitState: 'ultimate' },
      { id: 'sc-3', name: '1.2D+1.0L+1.0E', formula: '1.2D + 1.0L + 1.0E', limitState: 'ultimate' },
    ],
    createdAt: '2026-10-14T11:00:00Z',
    updatedAt: '2026-10-16T10:15:00Z',
    stats: {
      totalWeightKn: 19800,
      baseShearXKn: 1720,
      baseShearYKn: 1580,
      maxStoryDrift: 0.0091,
      maxDcRatio: 0.895,
      totalConcreteVolumeM3: 320,
      totalRebarTonnageTon: 28,
      totalStructuralSteelTon: 142,
    },
  };
}

export const PRESET_MODELS: Record<string, () => CsmProject> = {
  'rc_tower_10': createTenStoryRcBuilding,
  'steel_braced_6': createSixStorySteelBuilding,
};
