/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Report & BoQ Generator (M11)
 * Calculates material take-offs, reinforcement weights, concrete volumes, and structural steel tonnage.
 */

import type { CsmProject } from '../types/csm.ts';

export interface BoqItem {
  id: string;
  category: 'concrete' | 'rebar' | 'structural_steel' | 'formwork';
  descriptionFa: string;
  unit: string;
  quantity: number;
  unitRateEstimateIrr: number; // in Millions IRR or generic units
  totalCostEstimateIrr: number;
}

export interface BoqSummary {
  items: BoqItem[];
  totalConcreteVolumeM3: number;
  totalRebarWeightTon: number;
  totalSteelSectionsWeightTon: number;
  totalFormworkAreaM2: number;
  rebarBreakdownByDiameter: { diameter: string; weightTon: number; percentage: number }[];
  elementBreakdown: { type: string; concreteM3: number; rebarTon: number }[];
  totalEstimatedCostIrrBillion: number;
}

export function calculateBoq(project: CsmProject): BoqSummary {
  let concreteColumns = 0;
  let concreteBeams = 0;
  let concreteWalls = 0;
  let concreteSlabs = 0;

  let rebarColumns = 0;
  let rebarBeams = 0;
  let rebarWalls = 0;

  let totalStructuralSteel = 0;
  let formworkArea = 0;

  for (const el of project.elements) {
    if (el.type === 'column') {
      const section = project.sections.find((s) => s.id === el.sectionId);
      if (section?.shape === 'box' || section?.shape === 'i_section') {
        // Steel column
        const weightKg = (section.area / 10000) * el.length * 7850;
        totalStructuralSteel += weightKg / 1000;
      } else {
        // Concrete column
        const areaM2 = (section?.area || 3600) / 10000;
        const vol = areaM2 * el.length;
        concreteColumns += vol;
        // Rebar approx 120 kg/m³
        rebarColumns += (vol * 135) / 1000;
        // Formwork: perimeter * height
        const perimeter = ((section?.dimensions.depth || 600) * 2 + (section?.dimensions.width || 600) * 2) / 1000;
        formworkArea += perimeter * el.length;
      }
    } else if (el.type === 'beam') {
      const section = project.sections.find((s) => s.id === el.sectionId);
      if (section?.shape === 'i_section' || section?.shape === 'box') {
        const weightKg = (section.area / 10000) * el.length * 7850;
        totalStructuralSteel += weightKg / 1000;
      } else {
        const areaM2 = (section?.area || 2000) / 10000;
        const vol = areaM2 * el.length;
        concreteBeams += vol;
        // Rebar approx 110 kg/m³
        rebarBeams += (vol * 120) / 1000;
        // Formwork: bottom + 2 sides
        const formPerim = ((section?.dimensions.depth || 500) * 2 + (section?.dimensions.width || 400)) / 1000;
        formworkArea += formPerim * el.length;
      }
    } else if (el.type === 'shear_wall') {
      const areaM2 = 0.25 * 3.0; // 0.25m thickness * 3m length
      const vol = areaM2 * el.length;
      concreteWalls += vol;
      rebarWalls += (vol * 95) / 1000;
      formworkArea += 3.0 * 2 * el.length;
    } else if (el.type === 'brace') {
      const section = project.sections.find((s) => s.id === el.sectionId);
      const weightKg = ((section?.area || 48) / 10000) * el.length * 7850;
      totalStructuralSteel += weightKg / 1000;
    }
  }

  // Estimate floor slab volumes (stories * area * thickness 0.15m)
  const floorAreaM2 = 5.5 * 3 * (6.0 * 3); // bayX*3 * bayY*3
  concreteSlabs = project.stories.length * floorAreaM2 * 0.15;
  const rebarSlabs = (concreteSlabs * 70) / 1000;
  formworkArea += project.stories.length * floorAreaM2;

  const totalConcrete = Number((concreteColumns + concreteBeams + concreteWalls + concreteSlabs).toFixed(1));
  const totalRebar = Number((rebarColumns + rebarBeams + rebarWalls + rebarSlabs).toFixed(1));
  const totalSteel = Number(totalStructuralSteel.toFixed(1));
  const totalFormwork = Number(formworkArea.toFixed(1));

  // Rebar breakdown by diameter
  const rebarBreakdown = [
    { diameter: 'Φ28 - میلگرد طولی ستون‌ها (AIII / S400)', weightTon: Number((totalRebar * 0.32).toFixed(1)), percentage: 32 },
    { diameter: 'Φ25 - میلگرد اصلی تیرهای تحت لنگر شدید', weightTon: Number((totalRebar * 0.28).toFixed(1)), percentage: 28 },
    { diameter: 'Φ20 - آرماتور طولی تیرها و شبکه دیوار برشی', weightTon: Number((totalRebar * 0.20).toFixed(1)), percentage: 20 },
    { diameter: 'Φ16 - میلگردهای مونتاژ و دال سقف', weightTon: Number((totalRebar * 0.12).toFixed(1)), percentage: 12 },
    { diameter: 'Φ10 / Φ12 - خاموت‌های ویژه و سنجاقی‌ها', weightTon: Number((totalRebar * 0.08).toFixed(1)), percentage: 8 },
  ];

  const items: BoqItem[] = [
    {
      id: 'boq-conc-c35',
      category: 'concrete',
      descriptionFa: 'بتن آماده عیار ۴۰۰ رده C35/45 پمپی شامل حمل و ویبره',
      unit: 'متر مکعب (m³)',
      quantity: totalConcrete,
      unitRateEstimateIrr: 28, // 28 Million IRR per m3
      totalCostEstimateIrr: totalConcrete * 28,
    },
    {
      id: 'boq-rebar-a3',
      category: 'rebar',
      descriptionFa: 'میلگرد آجدار استاندارد AIII (S400) شامل برش، خم و آرماتوربندی',
      unit: 'تن (Ton)',
      quantity: totalRebar,
      unitRateEstimateIrr: 390, // 390 Million IRR per ton
      totalCostEstimateIrr: totalRebar * 390,
    },
    {
      id: 'boq-formwork',
      category: 'formwork',
      descriptionFa: 'قالب‌بندی مدولار فلزی ستون‌ها، تیرها و دیوارهای برشی',
      unit: 'متر مربع (m²)',
      quantity: totalFormwork,
      unitRateEstimateIrr: 2.2, // 2.2 Million IRR per m2
      totalCostEstimateIrr: totalFormwork * 2.2,
    },
  ];

  if (totalSteel > 0) {
    items.push({
      id: 'boq-steel-sections',
      category: 'structural_steel',
      descriptionFa: 'تهیه، ساخت و نصب اسکلت فولادی رده ST52/A992 شامل جوشکاری و اتصالات',
      unit: 'تن (Ton)',
      quantity: totalSteel,
      unitRateEstimateIrr: 620,
      totalCostEstimateIrr: totalSteel * 620,
    });
  }

  const totalCost = items.reduce((acc, curr) => acc + curr.totalCostEstimateIrr, 0);

  return {
    items,
    totalConcreteVolumeM3: totalConcrete,
    totalRebarWeightTon: totalRebar,
    totalSteelSectionsWeightTon: totalSteel,
    totalFormworkAreaM2: totalFormwork,
    rebarBreakdownByDiameter: rebarBreakdown,
    elementBreakdown: [
      { type: 'ستون‌ها (Columns)', concreteM3: Number(concreteColumns.toFixed(1)), rebarTon: Number(rebarColumns.toFixed(1)) },
      { type: 'تیرها (Beams)', concreteM3: Number(concreteBeams.toFixed(1)), rebarTon: Number(rebarBeams.toFixed(1)) },
      { type: 'دیوارهای برشی (Shear Walls)', concreteM3: Number(concreteWalls.toFixed(1)), rebarTon: Number(rebarWalls.toFixed(1)) },
      { type: 'دال سقف‌ها (Slabs)', concreteM3: Number(concreteSlabs.toFixed(1)), rebarTon: Number(rebarSlabs.toFixed(1)) },
    ],
    totalEstimatedCostIrrBillion: Number((totalCost / 1000).toFixed(2)),
  };
}
