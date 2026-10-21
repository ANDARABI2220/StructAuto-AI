/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 72-Week Master Development Roadmap (M0..M8, P0..P8 + OPS)
 * Extracted and structured directly from 01_Roadmap.md and 06_Gantt.html.
 */

import { RoadmapPhase, RoadmapTask } from '../types/roadmap.ts';

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 'P0',
    titleFa: 'P0 — کشف و امکان‌سنجی (API Validation & Manual Baseline)',
    titleEn: 'Discovery & Feasibility',
    startDate: '2026-11-02',
    endDate: '2026-11-29',
    milestone: 'M0',
    milestoneName: 'اعتبارسنجی API + خط پایه دستی',
    color: '#39506f',
    fte: 3.75,
    criticalPath: true,
    status: 'completed',
    descriptionFa: 'استعلام رسمی API، استخراج مستندات CSI OAPI، بازبینی حقوقی EULA و تعریف پروتکل خط پایه دستی.',
  },
  {
    id: 'P1',
    titleFa: 'P1 — بنیان و هسته فنی (CSM, Bridge, Gateway & Vault)',
    titleEn: 'Foundations & Core Engine',
    startDate: '2026-11-30',
    endDate: '2027-01-24',
    milestone: 'M1',
    milestoneName: 'زنجیره سرتاسری CSM + Bridge + AI Gateway',
    color: '#1f5f8b',
    fte: 7.25,
    criticalPath: true,
    status: 'completed',
    descriptionFa: 'پیاده‌سازی آداپتورهای ورودی، مدل میانی CSM، پل ETABS، دروازه امن AI و کیف پول اعتبارنامه.',
  },
  {
    id: 'P2',
    titleFa: 'P2 — اتوماسیون تحلیل، طراحی و انطباق (MVP: Prompt -> Analysis -> Checklist)',
    titleEn: 'MVP: Analysis & Compliance Automation',
    startDate: '2027-01-25',
    endDate: '2027-04-04',
    milestone: 'M2',
    milestoneName: 'نسخه آلفای داخلی (Alpha)',
    color: '#0f7a7a',
    fte: 7.5,
    criticalPath: true,
    status: 'completed',
    descriptionFa: 'پایگاه‌داده آیین‌نامه‌ها، موتور چک‌لیست خودکار انطباق ۲۸۰۰ و مبحث ۹، پوسته کاربری دوزبانه.',
  },
  {
    id: 'P3',
    titleFa: 'P3 — ماژول‌های تخصصی (ETABS MATE / ProtaStructure / ProtaDetails)',
    titleEn: 'Specialized Detailer Bridges',
    startDate: '2027-04-05',
    endDate: '2027-06-27',
    milestone: 'M3',
    milestoneName: 'نسخه بتای محدود (Beta)',
    color: '#3d7a2f',
    fte: 8.0,
    criticalPath: true,
    status: 'completed',
    descriptionFa: 'اتصال به MATE و ProtaStructure، تولید نقشه، جداول آرماتور و شیت‌بندی خودکار، متره و برآورد BoQ.',
  },
  {
    id: 'P4',
    titleFa: 'P4 — بهینه‌ساز پرامپت و حلقه یادگیری مهندسی',
    titleEn: 'Prompt Optimizer & Learning Loop',
    startDate: '2027-06-28',
    endDate: '2027-08-22',
    milestone: 'M4',
    milestoneName: 'بهینه‌ساز پرامپت v1 + حافظه کاربر',
    color: '#8a6d1f',
    fte: 7.5,
    criticalPath: true,
    status: 'completed',
    descriptionFa: 'کتابخانه قالب‌های دستور مهندسی، امتیازدهی خروجی، تست A/B و کش معنایی جهت کاهش هزینه توکن.',
  },
  {
    id: 'P5',
    titleFa: 'P5 — اعتبارسنجی مهندسی، اثبات کارایی ۱۰۰۰× و گسترش استانداردها',
    titleEn: 'Engineering Verification & 1000x Speedup',
    startDate: '2027-08-23',
    endDate: '2027-10-17',
    milestone: 'M5',
    milestoneName: 'بسته کارایی ۱۰۰۰× + ۵ حوزه استاندارد',
    color: '#8a4a1f',
    fte: 7.0,
    criticalPath: true,
    status: 'completed',
    descriptionFa: 'موتور کنترل مستقل تعادل، تطبیق متقابل دو موتور، اثبات ضریب تسریع حداقل ۱۰۰۰ برابر بر پایه ۳۰ تسک.',
  },
  {
    id: 'P6',
    titleFa: 'P6 — یکپارچه‌سازی، سخت‌سازی امنیتی، UX/i18n و SDK',
    titleEn: 'Hardening & Release Candidate',
    startDate: '2027-10-18',
    endDate: '2027-11-28',
    milestone: 'M6',
    milestoneName: 'کاندیدای انتشار (Release Candidate)',
    color: '#6a3f8f',
    fte: 7.25,
    criticalPath: false,
    status: 'completed',
    descriptionFa: 'لایسنسینگ، آپدیت امضاشده دیجیتالی، بسته شواهد Evidence Bundle و سندباکس جداسازی پروسه‌ها.',
  },
  {
    id: 'P7',
    titleFa: 'P7 — آزمون‌های جامع چهارلایه و تأییدیه رسمی مهندس محاسب',
    titleEn: 'Final Testing & Engineering Sign-Off',
    startDate: '2027-11-29',
    endDate: '2028-02-20',
    milestone: 'M7',
    milestoneName: 'گزارش نهایی تأیید انتشار',
    color: '#8f2f4f',
    fte: 7.0,
    criticalPath: true,
    status: 'completed',
    descriptionFa: '۷۸ آزمون کارکردی، تست بار ۲۰ کار همزمان، تست سازگاری ماتریس ۲۳۰۴ سلولی و امضای مهندس دارای پروانه.',
  },
  {
    id: 'P8',
    titleFa: 'P8 — انتشار عمومی (GA v1.0.0) و پایش پایداری',
    titleEn: 'General Availability (GA v1.0.0)',
    startDate: '2028-02-21',
    endDate: '2028-03-19',
    milestone: 'M8',
    milestoneName: 'انتشار عمومی نسخه ۱٫۰٫۰',
    color: '#1d4ed8',
    fte: 6.0,
    criticalPath: true,
    status: 'current',
    descriptionFa: 'انتشار بسته با گواهی دیجیتال، پایش پایداری ۳۰ روزه و دسترس‌پذیری ۹۹٫۵ درصدی.',
  },
  {
    id: 'OPS',
    titleFa: 'OPS — چرخه نگهداشت و نسخه‌های فصلی',
    titleEn: 'Operations & Maintenance',
    startDate: '2028-03-20',
    endDate: '2029-03-31',
    milestone: 'OPS',
    milestoneName: 'انتشارهای دوره‌ای ۸ هفته‌ای',
    color: '#5b6472',
    fte: 3.5,
    criticalPath: false,
    status: 'upcoming',
    descriptionFa: 'پشتیبانی مستمر، به‌روزرسانی آیین‌نامه‌ها و هماهنگی با نسخه‌های آتی ETABS 23 و ProtaStructure.',
  },
];

export const ROADMAP_TASKS: RoadmapTask[] = [
  // P0
  { id: 'P0-T01', phaseId: 'P0', nameFa: 'استعلام رسمی کتبی از فروشندگان درباره API', nameEn: 'Vendor API Formal Inquiries', startDate: '2026-11-02', endDate: '2026-11-15', durationDays: 14, isCritical: false, ownerRole: 'Product Owner', status: 'passed' },
  { id: 'P0-T02', phaseId: 'P0', nameFa: 'استخراج و اعتبارسنجی مستندات ETABS OAPI', nameEn: 'ETABS OAPI Validation', startDate: '2026-11-02', endDate: '2026-11-12', durationDays: 10, isCritical: true, ownerRole: 'Integration Eng', status: 'passed' },
  { id: 'P0-T04', phaseId: 'P0', nameFa: 'تعریف خط پایه دستی و پروتکل ضریب تسریع ۱۰۰۰×', nameEn: 'Manual Baseline DB Definition', startDate: '2026-11-09', endDate: '2026-11-22', durationDays: 14, isCritical: true, ownerRole: 'QA Automation', status: 'passed' },
  { id: 'P0-T07', phaseId: 'P0', nameFa: 'قفل معماری مدل میانی CSM و Gate M0', nameEn: 'CSM Architecture Lock & Gate M0', startDate: '2026-11-25', endDate: '2026-11-29', durationDays: 5, isCritical: true, ownerRole: '.NET Lead', status: 'passed' },
  { id: 'M0', phaseId: 'P0', nameFa: 'مایل‌استون M0: اعتبارسنجی API و خط پایه دستی', nameEn: 'Milestone M0: API Validation & Baseline', startDate: '2026-11-29', endDate: '2026-11-29', durationDays: 1, isCritical: true, isMilestone: true, ownerRole: 'Release Board', status: 'passed' },

  // P1
  { id: 'P1-T01', phaseId: 'P1', nameFa: 'پیاده‌سازی M01 آداپتورهای ایمپورت (.e2k, .edb, ifc, csv)', nameEn: 'M01 Ingestion Adapters', startDate: '2026-11-30', endDate: '2026-12-28', durationDays: 28, isCritical: true, ownerRole: '.NET Developer', status: 'passed' },
  { id: 'P1-T02', phaseId: 'P1', nameFa: 'پیاده‌سازی M02 مدل سازه‌ای همگن (CSM)', nameEn: 'M02 Canonical Structural Model', startDate: '2026-12-07', endDate: '2027-01-10', durationDays: 34, isCritical: true, ownerRole: '.NET Developer', status: 'passed' },
  { id: 'P1-T03', phaseId: 'P1', nameFa: 'پیاده‌سازی M03 پل ارتباطی ETABS OAPI', nameEn: 'M03 ETABS OAPI Bridge', startDate: '2026-12-14', endDate: '2027-01-17', durationDays: 34, isCritical: true, ownerRole: 'Integration Eng', status: 'passed' },
  { id: 'P1-T04', phaseId: 'P1', nameFa: 'پیاده‌سازی M04 درگاه هوش مصنوعی AI Gateway', nameEn: 'M04 AI Gateway & TLS 1.3', startDate: '2026-12-01', endDate: '2026-12-27', durationDays: 26, isCritical: false, ownerRole: 'AI/ML Eng', status: 'passed' },
  { id: 'P1-T05', phaseId: 'P1', nameFa: 'پیاده‌سازی M05 مخزن اعتبارنامه Credential Vault', nameEn: 'M05 Credential Vault', startDate: '2026-12-01', endDate: '2026-12-24', durationDays: 23, isCritical: false, ownerRole: 'DevSecOps', status: 'passed' },
  { id: 'P1-T06', phaseId: 'P1', nameFa: 'پیاده‌سازی M07 حلقه هماهنگ‌سازی Turn عامل', nameEn: 'M07 Agent Harness Turn Loop', startDate: '2026-12-21', endDate: '2027-01-20', durationDays: 30, isCritical: true, ownerRole: '.NET Lead', status: 'passed' },
  { id: 'M1', phaseId: 'P1', nameFa: 'مایل‌استون M1: زنجیره سرتاسری CSM+Bridge+Gateway', nameEn: 'Milestone M1: End-to-End Pipeline', startDate: '2027-01-24', endDate: '2027-01-24', durationDays: 1, isCritical: true, isMilestone: true, ownerRole: 'Release Board', status: 'passed' },

  // P2
  { id: 'P2-T02', phaseId: 'P2', nameFa: 'M03 فرمان‌های اجرای تحلیل/طراحی و خواندن نتایج', nameEn: 'ETABS Analysis & Design Commands', startDate: '2027-01-25', endDate: '2027-03-07', durationDays: 41, isCritical: true, ownerRole: 'Integration Eng', status: 'passed' },
  { id: 'P2-T04', phaseId: 'P2', nameFa: 'پیاده‌سازی M09 موتور چک‌لیست خودکار انطباق ۲۸۰۰', nameEn: 'M09 Compliance Checklist Engine', startDate: '2027-02-15', endDate: '2027-04-04', durationDays: 48, isCritical: true, ownerRole: 'AI/ML Eng', status: 'passed' },
  { id: 'M2', phaseId: 'P2', nameFa: 'مایل‌استون M2: نسخه آلفای داخلی (Alpha)', nameEn: 'Milestone M2: Internal Alpha', startDate: '2027-04-04', endDate: '2027-04-04', durationDays: 1, isCritical: true, isMilestone: true, ownerRole: 'Release Board', status: 'passed' },

  // P3
  { id: 'P3-T04', phaseId: 'P3', nameFa: 'پیاده‌سازی M10 تولید نقشه، جزئیات و شیت‌بندی', nameEn: 'M10 Detailing & Drawing Generator', startDate: '2027-04-19', endDate: '2027-06-27', durationDays: 69, isCritical: true, ownerRole: 'Integration Eng', status: 'passed' },
  { id: 'P3-T05', phaseId: 'P3', nameFa: 'پیاده‌سازی M11 متره، برآورد و BoQ سازه', nameEn: 'M11 Report & BoQ Generator', startDate: '2027-05-17', endDate: '2027-06-20', durationDays: 34, isCritical: false, ownerRole: '.NET Developer', status: 'passed' },
  { id: 'M3', phaseId: 'P3', nameFa: 'مایل‌استون M3: بتای محدود با خروجی نقشه و BoQ', nameEn: 'Milestone M3: Limited Beta', startDate: '2027-06-27', endDate: '2027-06-27', durationDays: 1, isCritical: true, isMilestone: true, ownerRole: 'Release Board', status: 'passed' },

  // P4
  { id: 'P4-T05', phaseId: 'P4', nameFa: 'پیاده‌سازی M12 موتور کنترل مستقل تعادل و دریفت', nameEn: 'M12 Independent Verification v1', startDate: '2027-07-05', endDate: '2027-08-22', durationDays: 48, isCritical: true, ownerRole: 'Lead Structural Eng', status: 'passed' },
  { id: 'M4', phaseId: 'P4', nameFa: 'مایل‌استون M4: بهینه‌ساز پرامپت v1 و یادگیری', nameEn: 'Milestone M4: Prompt Optimizer v1', startDate: '2027-08-22', endDate: '2027-08-22', durationDays: 1, isCritical: true, isMilestone: true, ownerRole: 'Release Board', status: 'passed' },

  // P5
  { id: 'P5-T01', phaseId: 'P5', nameFa: 'M12 تکمیل کنترل مستقل و Cross-check دو موتور', nameEn: 'M12 Cross-Check Engine', startDate: '2027-08-23', endDate: '2027-09-26', durationDays: 34, isCritical: true, ownerRole: 'Lead Structural Eng', status: 'passed' },
  { id: 'P5-T02', phaseId: 'P5', nameFa: 'M13 استقرار Benchmark Harness و DB خط پایه', nameEn: 'M13 Benchmark Harness & Baseline', startDate: '2027-08-23', endDate: '2027-09-19', durationDays: 27, isCritical: true, ownerRole: 'QA Automation', status: 'passed' },
  { id: 'P5-T03', phaseId: 'P5', nameFa: 'سنجش و اثبات ضریب تسریع >= ۱۰۰۰× (میانه و P95)', nameEn: 'Speedup Verification (>= 1000x)', startDate: '2027-09-20', endDate: '2027-10-17', durationDays: 27, isCritical: true, ownerRole: 'QA Automation', status: 'passed' },
  { id: 'M5', phaseId: 'P5', nameFa: 'مایل‌استون M5: بسته کارایی ۱۰۰۰× + ۵ حوزه استاندارد', nameEn: 'Milestone M5: 1000x Package & 5 Standards', startDate: '2027-10-17', endDate: '2027-10-17', durationDays: 1, isCritical: true, isMilestone: true, ownerRole: 'Release Board', status: 'passed' },

  // P6
  { id: 'P6-T06', phaseId: 'P6', nameFa: 'آماده‌سازی Release Candidate و بسته شواهد', nameEn: 'Release Candidate & Evidence Bundle', startDate: '2027-11-22', endDate: '2027-11-28', durationDays: 6, isCritical: true, ownerRole: 'Product Owner', status: 'passed' },
  { id: 'M6', phaseId: 'P6', nameFa: 'مایل‌استون M6: کاندیدای انتشار (Release Candidate)', nameEn: 'Milestone M6: Release Candidate', startDate: '2027-11-28', endDate: '2027-11-28', durationDays: 1, isCritical: true, isMilestone: true, ownerRole: 'Release Board', status: 'passed' },

  // P7
  { id: 'P7-T01', phaseId: 'P7', nameFa: 'اجرای ۷۸ آزمون عملکردی روی کلیه ماژول‌های M01..M20', nameEn: 'Execution of 78 Functional Tests', startDate: '2027-11-29', endDate: '2028-01-16', durationDays: 48, isCritical: true, ownerRole: 'QA Automation', status: 'passed' },
  { id: 'P7-T03', phaseId: 'P7', nameFa: 'تست بار و کارایی: ۲۰ کار همزمان + تست استقامت ۷۲ ساعته', nameEn: 'Load & 72h Soak Testing', startDate: '2027-12-13', endDate: '2028-01-30', durationDays: 48, isCritical: true, ownerRole: 'QA Automation', status: 'passed' },
  { id: 'P7-T07', phaseId: 'P7', nameFa: 'تأییدیه و امضای مهندس محاسب دارای پروانه اشتغال', nameEn: 'Licensed Structural Engineer Sign-off', startDate: '2028-01-24', endDate: '2028-02-20', durationDays: 27, isCritical: true, ownerRole: 'Lead Structural Eng', status: 'passed' },
  { id: 'P7-T08', phaseId: 'P7', nameFa: 'برگزاری جلسه رسمی هیئت انتشار (Release Board)', nameEn: 'Release Board Formal Sign-Off', startDate: '2028-02-14', endDate: '2028-02-20', durationDays: 6, isCritical: true, ownerRole: 'Release Board', status: 'passed' },
  { id: 'M7', phaseId: 'P7', nameFa: 'مایل‌استون M7: گزارش رسمی تأیید انتشار', nameEn: 'Milestone M7: Release Approval Report', startDate: '2028-02-20', endDate: '2028-02-20', durationDays: 1, isCritical: true, isMilestone: true, ownerRole: 'Release Board', status: 'passed' },

  // P8
  { id: 'P8-T01', phaseId: 'P8', nameFa: 'انتشار عمومی نسخه GA v1.0.0 با Ring Deployment', nameEn: 'GA v1.0.0 Deployment & Canary Ring', startDate: '2028-02-21', endDate: '2028-03-05', durationDays: 12, isCritical: true, ownerRole: '.NET Lead', status: 'passed' },
  { id: 'P8-T02', phaseId: 'P8', nameFa: 'پایش پایداری ۳۰ روزه و پایش سنجه‌های دسترس‌پذیری', nameEn: '30-Day Post-Launch Stability Watch', startDate: '2028-02-28', endDate: '2028-03-19', durationDays: 20, isCritical: false, ownerRole: 'QA Automation', status: 'passed' },
  { id: 'M8', phaseId: 'P8', nameFa: 'مایل‌استون M8: انتشار نهایی و پایدار GA v1.0.0', nameEn: 'Milestone M8: GA v1.0.0', startDate: '2028-03-19', endDate: '2028-03-19', durationDays: 1, isCritical: true, isMilestone: true, ownerRole: 'Release Board', status: 'passed' },
];
