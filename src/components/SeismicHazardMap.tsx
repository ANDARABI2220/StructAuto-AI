/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Interactive Regional Seismic Hazard Zoning Map & Gemini Seismic Code Chat (M08 / M09)
 * Renders seismic acceleration coefficients (A), design spectrums, and regional fault hazard data.
 */

import React, { useState } from 'react';
import { CsmProject } from '../types/csm.ts';
import { callSearchGrounding } from '../services/geminiApi.ts';
import {
  MapPin,
  Compass,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Activity,
  Bot,
  Send,
  Loader2,
  Sparkles,
  Info,
  TrendingUp,
} from 'lucide-react';

export interface SeismicZoneLocation {
  id: string;
  nameFa: string;
  nameEn: string;
  region: 'iran' | 'international';
  accelerationA: number; // in g
  hazardLevelFa: string;
  hazardLevelEn: string;
  color: string;
  primaryFaults: string[];
  soilTypesSupported: string[];
  defaultSoilClass: string;
  xPercent: number; // coordinate percentage for map pin
  yPercent: number;
  buildingCode: string;
}

export const SEISMIC_LOCATIONS: SeismicZoneLocation[] = [
  {
    id: 'tehran',
    nameFa: 'تهران (پایتخت)',
    nameEn: 'Tehran (Capital Zone)',
    region: 'iran',
    accelerationA: 0.35,
    hazardLevelFa: 'خطر خیلی زیاد (Very High)',
    hazardLevelEn: 'Very High Hazard',
    color: '#ef4444',
    primaryFaults: ['گسل شمال تهران (North Tehran)', 'گسل مشا (Mosha)', 'گسل ری (Ray)'],
    soilTypesSupported: ['تیپ I (سنگ بستر)', 'تیپ II (آبرفت متراکم)', 'تیپ III (خاک رسی متوسط)'],
    defaultSoilClass: 'تیپ II (Type II)',
    xPercent: 52,
    yPercent: 32,
    buildingCode: 'استاندارد ۲۸۰۰ (ویرایش ۴)',
  },
  {
    id: 'tabriz',
    nameFa: 'تبریز (شمال‌غرب)',
    nameEn: 'Tabriz',
    region: 'iran',
    accelerationA: 0.35,
    hazardLevelFa: 'خطر خیلی زیاد (Very High)',
    hazardLevelEn: 'Very High Hazard',
    color: '#ef4444',
    primaryFaults: ['گسل شمال تبریز (NTF)', 'گسل صوفیان'],
    soilTypesSupported: ['تیپ II', 'تیپ III'],
    defaultSoilClass: 'تیپ II',
    xPercent: 28,
    yPercent: 18,
    buildingCode: 'استاندارد ۲۸۰۰ (ویرایش ۴)',
  },
  {
    id: 'mashhad',
    nameFa: 'مشهد (شمال‌شرق)',
    nameEn: 'Mashhad',
    region: 'iran',
    accelerationA: 0.35,
    hazardLevelFa: 'خطر زیاد (High)',
    hazardLevelEn: 'High Hazard',
    color: '#f97316',
    primaryFaults: ['گسل کشف‌رود (Kashaf Rood)', 'گسل بینالود'],
    soilTypesSupported: ['تیپ II', 'تیپ III'],
    defaultSoilClass: 'تیپ II',
    xPercent: 82,
    yPercent: 28,
    buildingCode: 'استاندارد ۲۸۰۰ (ویرایش ۴)',
  },
  {
    id: 'isfahan',
    nameFa: 'اصفهان (مرکز)',
    nameEn: 'Isfahan',
    region: 'iran',
    accelerationA: 0.25,
    hazardLevelFa: 'خطر متوسط (Moderate)',
    hazardLevelEn: 'Moderate Hazard',
    color: '#eab308',
    primaryFaults: ['گسل قم-زفره', 'گسل کلمرد'],
    soilTypesSupported: ['تیپ I', 'تیپ II'],
    defaultSoilClass: 'تیپ I/II',
    xPercent: 48,
    yPercent: 52,
    buildingCode: 'استاندارد ۲۸۰۰ (ویرایش ۴)',
  },
  {
    id: 'shiraz',
    nameFa: 'شیراز (جنوب‌غرب)',
    nameEn: 'Shiraz',
    region: 'iran',
    accelerationA: 0.30,
    hazardLevelFa: 'خطر زیاد (High)',
    hazardLevelEn: 'High Hazard',
    color: '#f97316',
    primaryFaults: ['گسل سبزپوشان', 'گسل کره بس (Kareh-Bas)'],
    soilTypesSupported: ['تیپ II', 'تیپ III'],
    defaultSoilClass: 'تیپ II',
    xPercent: 45,
    yPercent: 72,
    buildingCode: 'استاندارد ۲۸۰۰ (ویرایش ۴)',
  },
  {
    id: 'bandar_abbas',
    nameFa: 'بندرعباس (خلیج فارس)',
    nameEn: 'Bandar Abbas',
    region: 'iran',
    accelerationA: 0.30,
    hazardLevelFa: 'خطر زیاد (High)',
    hazardLevelEn: 'High Hazard',
    color: '#f97316',
    primaryFaults: ['گسل میناب', 'کمربند چین‌خورده زاگرس ساحلی'],
    soilTypesSupported: ['تیپ III (ساحلی)', 'تیپ IV (آبرفت سست)'],
    defaultSoilClass: 'تیپ III',
    xPercent: 62,
    yPercent: 88,
    buildingCode: 'استاندارد ۲۸۰۰ (ویرایش ۴)',
  },
  {
    id: 'san_francisco',
    nameFa: 'سان‌فرانسیسکو (کالیفرنیا)',
    nameEn: 'San Francisco, CA',
    region: 'international',
    accelerationA: 0.40,
    hazardLevelFa: 'خطر بحرانی (Critical Fault Zone)',
    hazardLevelEn: 'Seismic Design Category E/F',
    color: '#dc2626',
    primaryFaults: ['San Andreas Fault', 'Hayward Fault'],
    soilTypesSupported: ['Site Class B (Rock)', 'Site Class C/D (Stiff Soil)'],
    defaultSoilClass: 'Site Class D',
    xPercent: 12,
    yPercent: 40,
    buildingCode: 'ASCE 7-22 / IBC 2024',
  },
  {
    id: 'tokyo',
    nameFa: 'توکیو (ژاپن)',
    nameEn: 'Tokyo, Japan',
    region: 'international',
    accelerationA: 0.45,
    hazardLevelFa: 'خطر فرابحرانی (Subduction Trench)',
    hazardLevelEn: 'Extreme Subduction Zone',
    color: '#b91c1c',
    primaryFaults: ['Sagami Trough', 'Nankai Megathrust'],
    soilTypesSupported: ['Type 1 Soft Rock', 'Type 2 Deep Clay'],
    defaultSoilClass: 'Type 2 Soil',
    xPercent: 88,
    yPercent: 55,
    buildingCode: 'AIJ Standard / Building Standard Law',
  },
];

interface SeismicHazardMapProps {
  project: CsmProject;
  onSelectLocation?: (location: SeismicZoneLocation) => void;
}

export const SeismicHazardMap: React.FC<SeismicHazardMapProps> = ({ project, onSelectLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState<SeismicZoneLocation>(SEISMIC_LOCATIONS[0]);
  const [regionFilter, setRegionFilter] = useState<'all' | 'iran' | 'international'>('all');

  // Dedicated AI Chat
  const [chatPrompt, setChatPrompt] = useState('');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; sources?: string[] }>>([
    {
      role: 'assistant',
      text: `سلام! من مشاور هوشمند لرزه‌ای StructAuto AI هستم. منطقه فعال: **${selectedLocation.nameFa}** با شتاب مبنای **A = ${selectedLocation.accelerationA}g** بر اساس **${selectedLocation.buildingCode}**. هر پرسشی در خصوص ضرایب زلزله، طیف طرح، اثرات خاک یا جزئیات شکل‌پذیری دارید بفرمایید.`,
    },
  ]);

  const handleSelectLocation = (loc: SeismicZoneLocation) => {
    setSelectedLocation(loc);
    if (onSelectLocation) onSelectLocation(loc);

    // Add proactive advice message in chat
    setChatMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: `موقعیت مکانی پروژه به **${loc.nameFa}** تغییر یافت.\n• شتاب مبنای طرح: **A = ${loc.accelerationA}g**\n• آیین‌نامه حاکم: **${loc.buildingCode}**\n• گسل‌های اصلی فعال: ${loc.primaryFaults.join('، ')}\n• تیپ خاک پیش‌فرض: **${loc.defaultSoilClass}**\nبرای سیستم باربر "${project.structuralSystem || 'دوگانه بتنی'}" ضریب بازتاب B1 و پریود تحلیلی به طور خودکار بهینه‌سازی خواهند شد.`,
      },
    ]);
  };

  const handleSendChat = async () => {
    if (!chatPrompt.trim() || isAskingAi) return;

    const userText = chatPrompt;
    setChatPrompt('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsAskingAi(true);

    try {
      const prompt = `شما کارشناس ارشد مهندسی زلزله و آیین‌نامه‌های طراحی لرزه‌ای هستید.
منطقه جغرافیایی پروژه: ${selectedLocation.nameFa} (${selectedLocation.nameEn})
شتاب مبنای طرح: A = ${selectedLocation.accelerationA}g
آیین‌نامه حاکم: ${selectedLocation.buildingCode}
گسل‌های مجاور: ${selectedLocation.primaryFaults.join(', ')}
مدل سازه: ${project.name} با ${project.stories.length} طبقه و سیستم ${project.structuralSystem || 'دوگانه بتن‌آرمه'}.
پرسش مهندس محاسب: "${userText}".
لطفاً پاسخ دقیق، مستند به بندهای آیین‌نامه زلزله، همراه با مقادیر عددی، روابط محاسباتی و توصیه‌های فنی برای این موقعیت مکانی ارائه فرمایید.`;

      const result = await callSearchGrounding(prompt);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: result.text,
          sources: result.sources,
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'خطا در برقراری ارتباط با سرویس هوش مصنوعی. لطفاً مجدداً تلاش نمایید.',
        },
      ]);
    } finally {
      setIsAskingAi(false);
    }
  };

  const filteredLocations = SEISMIC_LOCATIONS.filter(
    (l) => regionFilter === 'all' || l.region === regionFilter
  );

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">
              نقشه پهنه‌بندی خطر زلزله و مشاور هوشمند لرزه‌ای (Regional Seismic Zoning & AI Chat)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ارزیابی ضرایب شتاب مبنای طرح ($A$)، خطای گسل‌های فعال و طیف طراحی استاندارد ۲۸۰۰ و ASCE 7
          </p>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {(['all', 'iran', 'international'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                regionFilter === r
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === 'all' ? 'همه پهنه‌ها' : r === 'iran' ? 'پهنه‌های ایران' : 'بین‌المللی'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Map Canvas Visualizer (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative w-full h-72 sm:h-80 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
            {/* SVG Interactive Map Background & Grid */}
            <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="seismic-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="1" />
                </pattern>
                <radialGradient id="high-hazard-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#seismic-grid)" />
              {/* Decorative Fault lines */}
              <path d="M 40 80 Q 150 120 280 90 T 450 130 T 600 80" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.6" />
              <path d="M 80 180 Q 220 200 350 240 T 520 210" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.5" />
              <circle cx="50%" cy="40%" r="120" fill="url(#high-hazard-glow)" />
            </svg>

            {/* Interactive Location Pins */}
            {filteredLocations.map((loc) => {
              const isSelected = selectedLocation.id === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => handleSelectLocation(loc)}
                  style={{ left: `${loc.xPercent}%`, top: `${loc.yPercent}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group cursor-pointer transition-all ${
                    isSelected ? 'scale-125 z-20' : 'hover:scale-110 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${
                      isSelected
                        ? 'border-white shadow-rose-500/50 ring-4 ring-rose-500/30'
                        : 'border-slate-700/80'
                    }`}
                    style={{ backgroundColor: loc.color }}
                  >
                    <MapPin className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 backdrop-blur-md shadow whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-rose-300 border border-rose-500/60 font-mono'
                        : 'bg-slate-950/80 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {loc.nameFa.split(' ')[0]} ({loc.accelerationA}g)
                  </span>
                </button>
              );
            })}

            {/* Legend Overlay at bottom */}
            <div className="absolute bottom-2.5 right-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl flex flex-wrap items-center justify-between text-[11px] text-slate-300">
              <span className="font-semibold text-white">راهنمای پهنه‌بندی زلزله:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> A = 0.35g (خیلی زیاد)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> A = 0.30g (زیاد)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> A = 0.25g (متوسط)
                </span>
              </div>
            </div>
          </div>

          {/* Selected Location Engineering Card */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: selectedLocation.color }}
                />
                <h4 className="text-sm font-bold text-white">{selectedLocation.nameFa}</h4>
                <span className="text-xs text-slate-400 font-mono">({selectedLocation.nameEn})</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold">
                A = {selectedLocation.accelerationA}g
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">سطح خطر لرزه‌ای:</div>
                <div className="font-bold text-white mt-0.5">{selectedLocation.hazardLevelFa}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">آیین‌نامه مرجع:</div>
                <div className="font-bold text-cyan-300 mt-0.5">{selectedLocation.buildingCode}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">تیپ خاک پیش‌فرض:</div>
                <div className="font-bold text-amber-300 mt-0.5">{selectedLocation.defaultSoilClass}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">شتاب مبنای طرح:</div>
                <div className="font-mono font-bold text-emerald-400 mt-0.5">{selectedLocation.accelerationA} × 9.81 m/s²</div>
              </div>
            </div>

            {/* Faults breakdown */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-300">
              <span className="font-semibold text-rose-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> گسل‌های اصلی فعال مجاور:
              </span>
              {selectedLocation.primaryFaults.map((fault, fIdx) => (
                <span key={fIdx} className="bg-slate-950 px-2.5 py-0.5 rounded-md border border-slate-800 text-slate-300">
                  {fault}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Dedicated Gemini Regional Seismic Code Chat (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-[440px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          {/* Chat Header */}
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>مشاور هوشمند لرزه‌ای (Gemini Seismic AI)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              gemini-3.8-flash
            </span>
          </div>

          {/* Chat Message Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Sources pill if provided */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-400">
                    <span className="text-slate-500">مراجع:</span>
                    {msg.sources.slice(0, 2).map((src, sIdx) => (
                      <span key={sIdx} className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[150px]">
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isAskingAi && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال تحلیل الزامات لرزه‌ای پهنه {selectedLocation.nameFa}...</span>
              </div>
            )}
          </div>

          {/* Quick Questions Suggestions */}
          <div className="px-3 py-1.5 bg-slate-950/50 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <span className="text-slate-500 shrink-0">پرسش سریع:</span>
            {[
              'محاسبه ضریب زلزله C و B1',
              'ضوابط شکل‌پذیری ویژه در این پهنه',
              'تأثیر تیپ خاک بر برش پایه',
            ].map((q, qIdx) => (
              <button
                key={qIdx}
                onClick={() => {
                  setChatPrompt(q);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded-md whitespace-nowrap cursor-pointer transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendChat();
              }}
              placeholder={`پرسش درباره الزامات لرزه‌ای ${selectedLocation.nameFa}...`}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button
              onClick={handleSendChat}
              disabled={isAskingAi || !chatPrompt.trim()}
              className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-all shadow cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
