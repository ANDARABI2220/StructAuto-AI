/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Comprehensive BoQ PDF and CSV Exporter (M10 / M11)
 */

import { jsPDF } from 'jspdf';
import { CsmProject } from '../types/csm.ts';
import { BoqSummary } from '../core/boqEngine.ts';
import { auditLedger } from '../core/auditEngine.ts';

/**
 * Generate formatted PDF for Bill of Quantities (BoQ) & Material Take-Off (MTO)
 */
export function generateBoqPdf(project: CsmProject, boq: BoqSummary): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, pageWidth - 2 * margin, 26, 'F');

  // Emerald Accent Line
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(margin, y + 25, pageWidth - 2 * margin, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('STRUCTAUTO AI — BILL OF QUANTITIES & MATERIAL TAKE-OFF', margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Comprehensive Cost Estimation & Reinforcement Schedule • Module M11', margin + 6, y + 16);

  const reportDate = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  doc.text(`Generated: ${reportDate} | Model: ${project.name}`, margin + 6, y + 21);

  y += 34;

  // Key Quantities KPI Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  const colW = (pageWidth - 2 * margin) / 4;
  doc.text('Concrete Volume', margin + 6, y + 8);
  doc.setFontSize(11);
  doc.setTextColor(6, 182, 212); // cyan-600
  doc.text(`${(boq.totalConcreteVolumeM3 || 0).toLocaleString()} m3`, margin + 6, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Rebar Tonnage', margin + colW + 6, y + 8);
  doc.setFontSize(11);
  doc.setTextColor(245, 158, 11); // amber-600
  doc.text(`${(boq.totalRebarWeightTon || 0).toLocaleString()} Ton`, margin + colW + 6, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Formwork Area', margin + colW * 2 + 6, y + 8);
  doc.setFontSize(11);
  doc.setTextColor(99, 102, 241); // indigo-600
  doc.text(`${(boq.totalFormworkAreaM2 || 0).toLocaleString()} m2`, margin + colW * 2 + 6, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Est. Budget Total', margin + colW * 3 + 6, y + 8);
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(`${boq.totalEstimatedCostIrrBillion} B IRR`, margin + colW * 3 + 6, y + 16);

  y += 32;

  // Rebar Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('BAR REINFORCEMENT SCHEDULE BY DIAMETER', margin, y);
  y += 4;

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Bar Diameter', margin + 6, y + 5);
  doc.text('Usage Application', margin + 50, y + 5);
  doc.text('Calculated Weight (Ton)', margin + 110, y + 5);
  doc.text('Percentage of Total (%)', margin + 155, y + 5);
  y += 7;

  boq.rebarBreakdownByDiameter.forEach((rb: { diameter: string; weightTon: number; percentage: number }, idx: number) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, pageWidth - 2 * margin, 6.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 6.5, pageWidth - margin, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    doc.text(rb.diameter, margin + 6, y + 4.5);
    doc.text(
      rb.diameter.includes('10')
        ? 'Stirrups & Ties'
        : rb.diameter.includes('16') || rb.diameter.includes('20')
        ? 'Beam Longitudinal Bars'
        : 'Heavy Column Bars',
      margin + 50,
      y + 4.5
    );
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6);
    doc.text(`${rb.weightTon} Ton`, margin + 110, y + 4.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${rb.percentage}%`, margin + 155, y + 4.5);

    y += 6.5;
  });

  y += 10;

  // BoQ Spreadsheet Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('DETAILED BILL OF QUANTITIES (MTO LINE ITEMS)', margin, y);
  y += 4;

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('#', margin + 4, y + 5);
  doc.text('Work Item Description', margin + 14, y + 5);
  doc.text('Unit', margin + 110, y + 5);
  doc.text('Quantity', margin + 130, y + 5);
  doc.text('Total Cost (M IRR)', margin + 158, y + 5);
  y += 7;

  boq.items.forEach((item, idx: number) => {
    if (y > pageHeight - 25) {
      doc.addPage();
      y = 15;
    }

    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 7, pageWidth - margin, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${idx + 1}`, margin + 4, y + 5);

    doc.setTextColor(15, 23, 42);
    doc.text(item.descriptionFa, margin + 14, y + 5);

    doc.setTextColor(100, 116, 139);
    doc.text(item.unit, margin + 110, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 182, 212);
    doc.text(item.quantity.toLocaleString(), margin + 130, y + 5);

    doc.setTextColor(16, 185, 129);
    doc.text(item.totalCostEstimateIrr.toLocaleString(), margin + 158, y + 5);

    y += 7;
  });

  // Footer & Provenance
  const auditHash = auditLedger.getLatestHash();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Cryptographic Verification Hash: ${auditHash} | StructAuto AI BoQ Engine (M11)`,
    margin,
    pageHeight - 8
  );
  doc.text(`Page ${doc.getNumberOfPages()} of ${doc.getNumberOfPages()}`, pageWidth - margin - 20, pageHeight - 8);

  const safeName = (project.name || 'Structural_Model').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`StructAuto_BoQ_Report_${safeName}.pdf`);
}

/**
 * Export Bill of Quantities data as a CSV spreadsheet
 */
export function exportBoqToCsv(project: CsmProject, boq: BoqSummary): void {
  const headers = ['Row Number', 'Item Code', 'Description', 'Unit', 'Quantity', 'Unit Rate (M IRR)', 'Total Cost (M IRR)'];
  const rows = boq.items.map((item, idx: number) => [
    idx + 1,
    `"${item.id}"`,
    `"${item.descriptionFa.replace(/"/g, '""')}"`,
    `"${item.unit}"`,
    item.quantity,
    item.unitRateEstimateIrr,
    item.totalCostEstimateIrr,
  ]);

  // Rebar breakdown section
  const rebarRows = boq.rebarBreakdownByDiameter.map((rb, idx: number) => [
    `REBAR-${idx + 1}`,
    `"REBAR-${rb.diameter}"`,
    `"میلگرد ${rb.diameter}"`,
    `"تن (Ton)"`,
    rb.weightTon,
    '-',
    '-',
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for proper Persian/Excel display
    [
      `"StructAuto AI - Bill of Quantities (BoQ) Export"`,
      `"Project: ${project.name}"`,
      `"Generated: ${new Date().toISOString()}"`,
      `"Concrete Volume: ${boq.totalConcreteVolumeM3} m3"`,
      `"Rebar Tonnage: ${boq.totalRebarWeightTon} Ton"`,
      `"Estimated Total: ${boq.totalEstimatedCostIrrBillion} Billion IRR"`,
      '',
      headers.join(','),
      ...rows.map((r: (string | number)[]) => r.join(',')),
      '',
      `"--- جدول تفکیک آرماتور بر اساس سایز میلگرد ---"`,
      rebarRows.map((r: (string | number)[]) => r.join(',')).join('\n'),
    ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeName = (project.name || 'Structural_Model').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('download', `StructAuto_BoQ_${safeName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
