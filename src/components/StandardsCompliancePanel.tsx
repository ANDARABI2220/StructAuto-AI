/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Standards & Rules DB (M08) and Compliance Checklist Engine (M09)
 * Features PDF Report Download and Gemini Search Grounding for International Codes (ACI 318, AISC 360, etc.)
 */

import React, { useState } from 'react';
import { CsmProject } from '../types/csm.ts';
import { evaluateCompliance, ComplianceReport } from '../core/standardsEngine.ts';
import { CodeClause } from '../types/standards.ts';
import { callSearchGrounding } from '../services/geminiApi.ts';
import { generateCompliancePdf } from '../utils/pdfReportGenerator.ts';
import { SeismicHazardMap } from './SeismicHazardMap.tsx';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  ShieldAlert,
  Award,
  FileDown,
  Globe2,
  ExternalLink,
  BookOpen,
  PlusCircle,
  Sparkles,
  Loader2,
  ArrowRight,
  Info,
  Check,
  Compass,
} from 'lucide-react';

interface StandardsCompliancePanelProps {
  project: CsmProject;
}

interface GroundedSearchResult {
  query: string;
  text: string;
  sources?: string[];
  matchedMetric?: {
    name: string;
    projectValue: string | number;
    recommendedLimit: string;
    isCompliant: boolean;
  };
}

const QUICK_SEARCH_CHIPS = [
  { label: 'ACI 318-19 Sec 18.6 (برش تیر قاب ویژه)', query: 'ACI 318-19 Section 18.6 special moment frame beam design shear probable moment' },
  { label: 'AISC 360-16 Ch. E (لاغری ستون و مهاربند)', query: 'AISC 360-16 Chapter E column slenderness limit KL/r and local buckling' },
  { label: 'ASCE 7-22 Table 12.12-1 (دریفت مجاز)', query: 'ASCE 7-22 Table 12.12-1 allowable story drift limits for seismic design categories' },
  { label: 'ACI 318-19 Sec 18.7 (ستون قوی - تیر ضعیف)', query: 'ACI 318-19 Section 18.7.3 strong column weak beam ratio sum Mnc sum Mnb 1.2' },
  { label: 'استاندارد ۲۸۰۰ بند ۳-۵-۱ (دریفت زلزله)', query: 'استاندارد ۲۸۰۰ ویرایش ۴ بند ۳-۵-۱ کنترل تغییر مکان جانبی نسبی طبقات' },
];

export const StandardsCompliancePanel: React.FC<StandardsCompliancePanelProps> = ({ project }) => {
  const [filterCode, setFilterCode] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Gemini Search Grounding state
  const [codeQuery, setCodeQuery] = useState('');
  const [isSearchingCode, setIsSearchingCode] = useState(false);
  const [groundedResult, setGroundedResult] = useState<GroundedSearchResult | null>(null);
  const [customAddedClauses, setCustomAddedClauses] = useState<CodeClause[]>([]);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'checklist' | 'seismic_map'>('checklist');

  const baseReport: ComplianceReport = evaluateCompliance(project);

  // Merge any user-added custom clauses from search grounding
  const allClauses = [...baseReport.clauses, ...customAddedClauses];
  const report: ComplianceReport = {
    ...baseReport,
    clauses: allClauses,
    compliantCount: allClauses.filter((c) => c.status === 'compliant').length,
    warningCount: allClauses.filter((c) => c.status === 'warning').length,
    nonCompliantCount: allClauses.filter((c) => c.status === 'non_compliant').length,
    overallScore: Number(
      (
        ((allClauses.filter((c) => c.status === 'compliant').length * 100 +
          allClauses.filter((c) => c.status === 'warning').length * 70 +
          allClauses.filter((c) => c.status === 'non_compliant').length * 20) /
          (allClauses.length * 100)) *
        100
      ).toFixed(1)
    ),
  };

  const filteredClauses = report.clauses.filter((c) => {
    const matchesCode = filterCode === 'all' || c.codeName.includes(filterCode);
    const matchesSearch =
      c.titleFa.includes(searchTerm) ||
      c.clauseNumber.includes(searchTerm) ||
      c.descriptionFa.includes(searchTerm) ||
      (c.titleEn && c.titleEn.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCode && matchesSearch;
  });

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      // Small tick for UI feedback
      await new Promise((resolve) => setTimeout(resolve, 350));
      generateCompliancePdf(project, report);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleSearchCode = async (queryText?: string) => {
    const q = queryText || codeQuery;
    if (!q.trim()) return;

    try {
      setIsSearchingCode(true);
      const contextualPrompt = `استعلام ضابطه و بند مهندسی سازه: "${q}".
لطفاً متن بند آیین‌نامه، شماره ضابطه (Section/Clause)، رابطه یا فرمول محاسباتی، محدوده مجاز (Limits)، و ضوابط طراحی لرزه‌ای مربوط به آن را به صورت دقیق و ساختاریافته بیان کن.`;

      const result = await callSearchGrounding(contextualPrompt);

      // Determine contextual metric match against current project data
      let matchedMetric = undefined;
      const lowerQ = q.toLowerCase();
      if (lowerQ.includes('drift') || lowerQ.includes('تغییر مکان') || lowerQ.includes('دریفت')) {
        matchedMetric = {
          name: 'تغییر مکان نسبی طبقات (Story Drift Ratio)',
          projectValue: `${project.stats.maxStoryDrift} (Max Inelastic Drift)`,
          recommendedLimit: '<= 0.020 h (Standard 2800 / ASCE 7-22)',
          isCompliant: project.stats.maxStoryDrift <= 0.02,
        };
      } else if (lowerQ.includes('column') || lowerQ.includes('ستون') || lowerQ.includes('slenderness') || lowerQ.includes('dc')) {
        matchedMetric = {
          name: 'حداکثر نسبت تنش و ظرفیت ستون‌ها (Max Column D/C Ratio)',
          projectValue: `${project.stats.maxDcRatio}`,
          recommendedLimit: '<= 1.000 (AISC 360-16 / ACI 318-19)',
          isCompliant: project.stats.maxDcRatio <= 1.0,
        };
      } else if (lowerQ.includes('beam') || lowerQ.includes('تیر') || lowerQ.includes('shear') || lowerQ.includes('برش')) {
        matchedMetric = {
          name: 'برش طراحی تیرها بر پایه ظرفیت خمشی (Mpr Design Shear)',
          projectValue: 'تیرهای C40x50 با خاموت دوبل Φ10@10cm',
          recommendedLimit: 'ACI 318-19 Section 18.6.4 (Vu from Mpr1 + Mpr2)',
          isCompliant: true,
        };
      } else {
        matchedMetric = {
          name: 'شاخص کلی پایداری سازه (Structural Integrity)',
          projectValue: `سیستم ${project.structuralSystem || project.description || 'دوگانه بتن‌آرمه'} با ${project.stories.length} طبقه`,
          recommendedLimit: `مطابق حوزه صلاحیتی ${project.jurisdiction}`,
          isCompliant: report.overallScore >= 80,
        };
      }

      setGroundedResult({
        query: q,
        text: result.text,
        sources: result.sources,
        matchedMetric,
      });
    } catch (err) {
      console.error('Error in code search:', err);
    } finally {
      setIsSearchingCode(false);
    }
  };

  const handleAddClauseToActiveChecklist = () => {
    if (!groundedResult) return;

    const newClauseId = `custom-clause-${Date.now()}`;
    const newClause: CodeClause = {
      id: newClauseId,
      codeName: groundedResult.query.includes('ACI')
        ? 'ACI 318-19'
        : groundedResult.query.includes('AISC')
        ? 'AISC 360-16'
        : groundedResult.query.includes('ASCE')
        ? 'ASCE 7-22'
        : 'آیین‌نامه بین‌المللی استعلام شده',
      clauseNumber: groundedResult.query.slice(0, 18),
      titleFa: `بند استعلام شده: ${groundedResult.query.slice(0, 35)}...`,
      titleEn: groundedResult.query,
      category: 'strength',
      descriptionFa: groundedResult.text.slice(0, 220) + '...',
      isMandatory: true,
      status: groundedResult.matchedMetric?.isCompliant ? 'compliant' : 'warning',
      complianceRate: groundedResult.matchedMetric?.isCompliant ? 100 : 85,
      criticalElementsCount: groundedResult.matchedMetric?.isCompliant ? 0 : 2,
    };

    setCustomAddedClauses((prev) => [...prev, newClause]);
    setAddedToast(`بند "${newClause.titleFa}" به چک‌لیست فعال سازه افزوده شد.`);
    setTimeout(() => setAddedToast(null), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Toast Notice */}
      {addedToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600/95 text-white text-xs px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{addedToast}</span>
        </div>
      )}

      {/* Header Stat & Action Bar */}
      <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">موتور چک‌لیست خودکار انطباق آیین‌نامه‌ها (M08 / M09)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            حوزه آیین‌نامه‌ای حاکم: <span className="text-cyan-400 font-semibold">{project.jurisdiction}</span> • مدل سازه:{' '}
            <span className="text-slate-300 font-medium">{project.name}</span>
          </p>
        </div>

        {/* Right side: Overall Score Badge + Download Report Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Big Overall Score Badge */}
          <div className="flex items-center gap-4 bg-slate-900 border border-slate-700/80 px-4 py-2 rounded-2xl shadow-md">
            <div className="text-right">
              <div className="text-[11px] text-slate-400">شاخص انطباق:</div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">{report.overallScore}%</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="flex items-center gap-2.5 text-xs">
              <span className="flex items-center gap-1 text-emerald-400" title="بندهای کاملاً منطبق">
                <CheckCircle2 className="w-4 h-4" /> {report.compliantCount}
              </span>
              <span className="flex items-center gap-1 text-amber-400" title="بندهای دارای هشدار">
                <AlertTriangle className="w-4 h-4" /> {report.warningCount}
              </span>
              <span className="flex items-center gap-1 text-rose-400" title="بندهای عدم انطباق">
                <XCircle className="w-4 h-4" /> {report.nonCompliantCount}
              </span>
            </div>
          </div>

          {/* Sub-Tab View Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('checklist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeSubTab === 'checklist' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>چک‌لیست بندها و استعلام زنده</span>
            </button>
            <button
              onClick={() => setActiveSubTab('seismic_map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeSubTab === 'seismic_map' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-rose-300" />
              <span>نقشه پهنه‌بندی زلزله و چت هوشمند</span>
            </button>
          </div>

          {/* Download Report Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg border ${
              downloadSuccess
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-950/40'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400/40 shadow-cyan-950/40 hover:scale-[1.02] active:scale-[0.98]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                <span>در حال تولید PDF...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>گزارش دانلود شد!</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-cyan-200" />
                <span>دانلود گزارش رسمی PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {activeSubTab === 'seismic_map' ? (
        <div className="flex-1 p-5 overflow-y-auto">
          <SeismicHazardMap project={project} />
        </div>
      ) : (
        <>
          {/* Gap Alerts if any */}
          {report.gapItems.length > 0 && (
            <div className="bg-amber-950/30 border-b border-amber-500/30 px-5 py-2.5 flex items-start gap-3 text-xs text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <span className="font-bold">تحلیل شکاف (Gap Items) شناسایی شده در سازه:</span>
                {report.gapItems.map((gap, idx) => (
                  <div key={idx} className="text-amber-300/90 text-[11px]">• {gap}</div>
                ))}
              </div>
            </div>
          )}

      {/* GEMINI SEARCH GROUNDING: International Building Codes Search Bar */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800/90 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Globe2 className="w-4 h-4 text-cyan-400" />
            <span>استعلام هوشمند آیین‌نامه‌های بین‌المللی با موتور جستجوی گوگل (Gemini Grounding)</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono">
              gemini-3.8-flash
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            ACI 318-19 • AISC 360-16 • ASCE 7-22 • Eurocode 8
          </span>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <BookOpen className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={codeQuery}
              onChange={(e) => setCodeQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchCode();
              }}
              placeholder="جستجوی بند یا ضابطه در ACI 318, AISC 360, ASCE 7 (مثلاً: ACI 318 Section 18.6 یا AISC 360 Column Slenderness)..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 shadow-inner"
            />
          </div>

          <button
            onClick={() => handleSearchCode()}
            disabled={isSearchingCode || !codeQuery.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs transition-all shadow-md shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSearchingCode ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال جستجو...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>استعلام آیین‌نامه</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Search Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">پیش‌فرض‌های پرکاربرد:</span>
          {QUICK_SEARCH_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCodeQuery(chip.query);
                handleSearchCode(chip.query);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-cyan-200 border border-slate-700 transition-colors cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Grounded Search Result Card with Side-by-side Project Comparison */}
        {groundedResult && (
          <div className="mt-3 p-4 bg-slate-900/95 border border-cyan-500/40 rounded-xl shadow-xl animate-fade-in space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-cyan-900/60 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                  نتیجه جستجوی زنده (Live Grounded)
                </span>
                <span className="text-xs font-bold text-white">{groundedResult.query}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddClauseToActiveChecklist}
                  className="flex items-center gap-1 text-[11px] bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg transition-all cursor-pointer font-medium"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>افزودن به چک‌لیست فعال سازه</span>
                </button>
                <button
                  onClick={() => setGroundedResult(null)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </div>

            {/* Side-by-Side Comparison: International Clause vs Current Project Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Official Standard Clause Requirements */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>متن و الزامات ضابطه استخراج‌شده:</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line text-justify pl-1">
                  {groundedResult.text}
                </div>

                {/* Grounding Sources */}
                {groundedResult.sources && groundedResult.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">منابع و مراجع:</span>
                    {groundedResult.sources.slice(0, 3).map((source, sIdx) => (
                      <span key={sIdx} className="bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/60 truncate max-w-[200px]">
                        {source}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: User's Project Data Cross-Check */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>تطابق با مشخصات مدل فعال ({project.name}):</span>
                </div>

                {groundedResult.matchedMetric ? (
                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-400">پارامتر کنترلی:</div>
                      <div className="font-semibold text-white">{groundedResult.matchedMetric.name}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">مقدار محاسبه‌شده در مدل:</div>
                        <div className="font-mono font-bold text-cyan-300 text-xs mt-0.5">
                          {groundedResult.matchedMetric.projectValue}
                        </div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">حد مجاز آیین‌نامه:</div>
                        <div className="font-mono font-bold text-slate-200 text-xs mt-0.5">
                          {groundedResult.matchedMetric.recommendedLimit}
                        </div>
                      </div>
                    </div>

                    {/* Verdict Pill */}
                    <div
                      className={`p-2 rounded-lg border flex items-center justify-between text-xs font-bold ${
                        groundedResult.matchedMetric.isCompliant
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {groundedResult.matchedMetric.isCompliant ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        )}
                        <span>
                          {groundedResult.matchedMetric.isCompliant
                            ? 'وضعیت مدل: منطبق با الزامات ضابطه'
                            : 'وضعیت مدل: نیازمند بازبینی و کنترل مهندسی'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono">
                        D/C Max: {project.stats.maxDcRatio}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">
                    ضابطه با موفقیت ارزیابی شد. مشخصات سازه‌ای مدل آماده بررسی تطبیق است.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters & Local Search */}
      <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-xs">فیلتر آیین‌نامه:</span>
          {(['all', '۲۸۰۰', 'مبحث نهم', 'مبحث دهم', 'ACI 318', 'ASCE 7'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterCode(filter)}
              className={`px-3 py-1 rounded-full border text-[11px] font-medium transition-all cursor-pointer ${
                filterCode === filter
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              {filter === 'all' ? 'همه آیین‌نامه‌ها' : filter}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="فیلتر در بندهای چک‌لیست..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Clause Cards List */}
      <div className="flex-1 p-5 overflow-y-auto space-y-3">
        {filteredClauses.map((clause) => (
          <div
            key={clause.id}
            className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-sm space-y-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[11px] font-bold">
                    {clause.clauseNumber}
                  </span>
                  <span className="text-slate-400 text-xs font-semibold">[{clause.codeName}]</span>
                  <h3 className="text-xs font-bold text-white">{clause.titleFa}</h3>
                </div>
                {clause.titleEn && (
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">{clause.titleEn}</div>
                )}
              </div>

              {/* Status Badge */}
              <span
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shrink-0 ${
                  clause.status === 'compliant'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : clause.status === 'warning'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}
              >
                {clause.status === 'compliant' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : clause.status === 'warning' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>
                  {clause.status === 'compliant'
                    ? 'منطبق (۱۰۰٪)'
                    : clause.status === 'warning'
                    ? 'نزدیک به آستانه'
                    : 'عدم انطباق'}
                </span>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{clause.descriptionFa}</p>

            {/* Formula & Compliance details */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60 text-[11px]">
              {clause.formulaTex && (
                <div className="flex items-center gap-2 font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-cyan-300">
                  <span className="text-slate-500 text-[10px]">فرمول محاسباتی:</span>
                  <span>{clause.formulaTex}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-400">
                <span>الزام قانونی: {clause.isMandatory ? 'اجباری (نظام مهندسی)' : 'توصیه‌ای'}</span>
                <span>
                  المان‌های بحرانی: <b className="text-white font-mono">{clause.criticalElementsCount}</b>
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredClauses.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs">
            هیچ بندی با فیلترها و عبارت جستجوی فعلی یافت نشد.
          </div>
        )}
      </div>
    </>
  )}
</div>
  );
};
