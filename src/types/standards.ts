/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Standards & Building Code Types
 */

export interface CodeClause {
  id: string;
  codeName: 'ACI 318-19' | 'ASCE 7-22' | 'AISC 360-16' | 'مبحث نهم (ویرایش ۹۹)' | 'مبحث دهم (ویرایش ۱۴۰۱)' | 'استاندارد ۲۸۰۰ (ویرایش ۴)' | 'مبحث ششم' | string;
  clauseNumber: string;
  titleFa: string;
  titleEn: string;
  category: 'strength' | 'drift' | 'ductility' | 'detailing' | 'serviceability';
  descriptionFa: string;
  formulaTex?: string;
  isMandatory: boolean;
  status: 'compliant' | 'warning' | 'non_compliant' | 'exempt';
  complianceRate: number; // 0 to 100%
  criticalElementsCount: number;
}
