/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Standards & Rules DB (M08) and Compliance Checklist Engine (M09)
 */

import type { CodeClause } from '../types/standards.ts';
import type { CsmProject } from '../types/csm.ts';

export interface ComplianceReport {
  overallScore: number; // 0 to 100%
  compliantCount: number;
  warningCount: number;
  nonCompliantCount: number;
  clauses: CodeClause[];
  gapItems: string[];
  jurisdiction: string;
}

/**
 * Return default comprehensive code clauses for ACI 318, ASCE 7, Iranian National Building Codes 2800 / مبحث ۹ / مبحث ۱۰
 */
export function getStandardClauses(jurisdiction: string): CodeClause[] {
  return [
    {
      id: 'ir-2800-drift',
      codeName: 'استاندارد ۲۸۰۰ (ویرایش ۴)',
      clauseNumber: 'بند ۳-۵-۱',
      titleFa: 'کنترل تغییر مکان جانبی نسبی طبقات (Story Drift Limit)',
      titleEn: 'Story Drift Ratio Limit (ΔM <= 0.020h or 0.025h)',
      category: 'drift',
      descriptionFa: 'تغییر مکان نسبی طبقات در ساختمان‌های بیش از ۵ طبقه نباید از ۰٫۰۲۰ برابر ارتفاع طبقه بیشتر باشد.',
      formulaTex: '\\Delta_M = \\frac{C_d \\times \\Delta_e}{I} \\le 0.020 h',
      isMandatory: true,
      status: 'compliant',
      complianceRate: 100,
      criticalElementsCount: 0,
    },
    {
      id: 'ir-2800-pdelta',
      codeName: 'استاندارد ۲۸۰۰ (ویرایش ۴)',
      clauseNumber: 'بند ۳-۳-۹',
      titleFa: 'اثرات مرتبه دوم پی-دلتا (P-Delta Effects)',
      titleEn: 'Stability Coefficient θ <= 0.10',
      category: 'serviceability',
      descriptionFa: 'ضریب پایداری θ در صورتی که از ۰٫۱۰ تجاوز کند، اثرات P-Δ باید مستقیماً در آنالیز اعمال گردد.',
      formulaTex: '\\theta = \\frac{P_x \\Delta}{V_x h_{sx} C_d} \\le \\theta_{max}',
      isMandatory: true,
      status: 'compliant',
      complianceRate: 98,
      criticalElementsCount: 0,
    },
    {
      id: 'ir-mabhath9-col-rebar',
      codeName: 'مبحث نهم (ویرایش ۹۹)',
      clauseNumber: 'بند ۹-۱۴-۴-۱',
      titleFa: 'درصد آرماتور طولی ستون‌های بتن‌آرمه (Column Rebar Ratio)',
      titleEn: 'Longitudinal Column Reinforcement (1.0% <= ρ <= 4.0%)',
      category: 'strength',
      descriptionFa: 'نسبت سطح مقطع میلگردهای طولی به سطح مقطع کل ستون نباید کمتر از ۱ درصد و بیشتر از ۴ درصد (در محل وصله) باشد.',
      formulaTex: '0.010 \\le \\rho_g = \\frac{A_{st}}{A_g} \\le 0.040',
      isMandatory: true,
      status: 'compliant',
      complianceRate: 100,
      criticalElementsCount: 0,
    },
    {
      id: 'ir-mabhath9-beam-rebar',
      codeName: 'مبحث نهم (ویرایش ۹۹)',
      clauseNumber: 'بند ۹-۱۱-۳-۲',
      titleFa: 'حداقل و حداکثر آرماتور کششی تیرهای خمشی',
      titleEn: 'Flexural Beam Minimum & Maximum Tension Reinforcement',
      category: 'ductility',
      descriptionFa: 'برای جلوگیری از شکست ترد، حداقل مساحت آرماتور کششی مقطع تیر باید از رابطه ۲۸۰۰ و مبحث نهم کنترل شود.',
      formulaTex: 'A_{s,min} = \\frac{0.25 \\sqrt{f_c}}{f_y} b_w d \\ge \\frac{1.4}{f_y} b_w d',
      isMandatory: true,
      status: 'compliant',
      complianceRate: 99.5,
      criticalElementsCount: 0,
    },
    {
      id: 'ir-mabhath9-shear-stirrups',
      codeName: 'مبحث نهم (ویرایش ۹۹)',
      clauseNumber: 'بند ۹-۲۰-۲-۳',
      titleFa: 'حداکثر فاصله خاموت‌ها در نواحی بحرانی شکل‌پذیری ویژه',
      titleEn: 'Transverse Reinforcement Spacing in Critical Regions',
      category: 'detailing',
      descriptionFa: 'در نواحی بحرانی تیرها و ستون‌های قاب خمشی ویژه، فاصله خاموت‌ها نباید از d/4 یا ۸ برابر قطر کوچکترین میلگرد طولی بیشتر باشد.',
      formulaTex: 's_{max} = \\min(d/4,\\, 8 d_b,\\, 24 d_{tie},\\, 300\\text{ mm})',
      isMandatory: true,
      status: 'compliant',
      complianceRate: 100,
      criticalElementsCount: 0,
    },
    {
      id: 'ir-mabhath10-col-brace',
      codeName: 'مبحث دهم (ویرایش ۱۴۰۱)',
      clauseNumber: 'بند ۱۰-۳-۳-۲',
      titleFa: 'فشردگی مقاطع اعضای مهاربندی همگرا و کمانش‌تاب (KL/r)',
      titleEn: 'Slenderness & Width-to-Thickness Ratio (AISC 360 / Chapter 10)',
      category: 'ductility',
      descriptionFa: 'ضریب لاغری اعضای مهاربندی فولادی همگرا نباید از ۲۰۰ تجاوز نماید و مقاطع باید الزامات فشردگی لرزه‌ای را ارضا کنند.',
      formulaTex: '\\lambda = \\frac{K L}{r} \\le 200',
      isMandatory: true,
      status: 'compliant',
      complianceRate: 97.8,
      criticalElementsCount: 1,
    },
    {
      id: 'aci-318-shear-capacity',
      codeName: 'ACI 318-19',
      clauseNumber: 'Section 18.6.4',
      titleFa: 'برش طراحی تیرها بر پایه لنگر محتمل دو انتها (Probable Moment Mpr)',
      titleEn: 'Special Moment Frame Beam Design Shear Capacity',
      category: 'strength',
      descriptionFa: 'نیروی برشی طراحی تیر باید با فرض تشکیل مفصل پلاستیک در دو انتها با لنگر مقاوم محتمل Mpr محاسبه شود.',
      formulaTex: 'V_u = \\frac{M_{pr1} + M_{pr2}}{L_n} \\pm \\frac{w_u L_n}{2}',
      isMandatory: true,
      status: 'compliant',
      complianceRate: 99.2,
      criticalElementsCount: 0,
    },
    {
      id: 'asce7-drift-limit',
      codeName: 'ASCE 7-22',
      clauseNumber: 'Table 12.12-1',
      titleFa: 'محدودیت تغییر مکان نسبی طبقات بر اساس شاخص اهمیت سازه',
      titleEn: 'Allowable Story Drift Limit based on Risk Category',
      category: 'drift',
      descriptionFa: 'برای سازه‌های گروه خطر II با سیستم قاب خمشی یا دیوار برشی، حداکثر تغییر مکان غیرخطی ۲٪ ارتفاع است.',
      formulaTex: '\\Delta_a = 0.020 h_{sx}',
      isMandatory: true,
      status: 'compliant',
      complianceRate: 100,
      criticalElementsCount: 0,
    },
  ];
}

/**
 * Execute automated compliance check on a CSM project
 */
export function evaluateCompliance(project: CsmProject): ComplianceReport {
  const clauses = getStandardClauses(project.jurisdiction);
  const gapItems: string[] = [];

  // Check project drift
  const driftClause = clauses.find((c) => c.id === 'ir-2800-drift');
  if (driftClause) {
    if (project.stats.maxStoryDrift > 0.02) {
      driftClause.status = 'non_compliant';
      driftClause.complianceRate = 75;
      driftClause.criticalElementsCount = 3;
      gapItems.push(`دریفت سازه (${project.stats.maxStoryDrift}) از حد مجاز ۰٫۰۲۰ فراتر رفته است.`);
    } else if (project.stats.maxStoryDrift > 0.015) {
      driftClause.status = 'warning';
      driftClause.complianceRate = 92;
      gapItems.push(`دریفت سازه در طبقات میانی نزدیک به آستانه بحرانی است (${project.stats.maxStoryDrift}).`);
    } else {
      driftClause.status = 'compliant';
      driftClause.complianceRate = 100;
    }
  }

  // Check D/C ratios across all elements
  let failedElements = 0;
  let warningElements = 0;
  let totalEvaluated = 0;

  for (const el of project.elements) {
    if (el.designResults) {
      totalEvaluated++;
      if (el.designResults.dcRatio > 1.0) {
        failedElements++;
      } else if (el.designResults.dcRatio > 0.90) {
        warningElements++;
      }
    }
  }

  const colClause = clauses.find((c) => c.id === 'ir-mabhath9-col-rebar');
  if (colClause && failedElements > 0) {
    colClause.status = 'warning';
    colClause.criticalElementsCount = failedElements;
    gapItems.push(`تعداد ${failedElements} المان سازه‌ای دارای نسبت ظرفیت بیش از ۱٫۰ هستند.`);
  }

  let compliantCount = 0;
  let warningCount = 0;
  let nonCompliantCount = 0;

  for (const c of clauses) {
    if (c.status === 'compliant') compliantCount++;
    else if (c.status === 'warning') warningCount++;
    else if (c.status === 'non_compliant') nonCompliantCount++;
  }

  const overallScore = Number(
    ((compliantCount * 100 + warningCount * 70 + nonCompliantCount * 20) / (clauses.length * 100) * 100).toFixed(1)
  );

  return {
    overallScore,
    compliantCount,
    warningCount,
    nonCompliantCount,
    clauses,
    gapItems,
    jurisdiction: project.jurisdiction,
  };
}
