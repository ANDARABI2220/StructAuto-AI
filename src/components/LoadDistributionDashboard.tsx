/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Structural Load Distribution Dashboard & Material Cost Forecasting Engine (M11 / M13)
 * Uses Recharts for high-fidelity Bar and Line charts of column/beam load distributions.
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import { CsmProject } from '../types/csm.ts';
import { useUnits } from '../context/UnitContext.tsx';
import {
  BarChart3,
  TrendingUp,
  Calculator,
  Layers,
  DollarSign,
  Leaf,
  Activity,
  ArrowUpRight,
  Sparkles,
  Sliders,
  RotateCcw,
} from 'lucide-react';

interface LoadDistributionDashboardProps {
  project: CsmProject;
}

export const LoadDistributionDashboard: React.FC<LoadDistributionDashboardProps> = ({ project }) => {
  const { unitSystem, convertForceKn, convertMomentKnM, convertVolumeM3, convertWeightTon } = useUnits();

  // Forecasting parameters
  const [materialSystem, setMaterialSystem] = useState<'concrete' | 'steel'>('concrete');
  const [concreteGrade, setConcreteGrade] = useState<'C25' | 'C30' | 'C35' | 'C40' | 'C50'>('C35');
  const [rebarGrade, setRebarGrade] = useState<'S400' | 'S500'>('S400');
  const [steelGrade, setSteelGrade] = useState<'ST37' | 'ST52'>('ST37');
  const [columnSectionScale, setColumnSectionScale] = useState<number>(0); // -30% to +40%
  const [beamSectionScale, setBeamSectionScale] = useState<number>(0); // -25% to +35%
  const [activeTab, setActiveTab] = useState<'loads' | 'moments' | 'drift_dc' | 'forecast'>('loads');

  // Compute story-by-story data for charts
  const chartData = useMemo(() => {
    return project.stories.map((story, index) => {
      const storyNum = index + 1;
      const totalStories = project.stories.length;

      // Realistic cumulative structural mechanics distributions
      // Cumulative axial force increases downwards towards foundation
      const axialMultiplier = totalStories - storyNum + 1;
      const baseAxialKn = 320 * axialMultiplier;
      const exteriorAxialKn = Math.round(baseAxialKn * 0.75);
      const interiorAxialKn = Math.round(baseAxialKn * 1.35);

      // Bending moment peaks at mid-to-lower stories under lateral seismic loads
      const momentPeakFactor = Math.sin((Math.PI * storyNum) / (totalStories + 1));
      const beamMomentKnM = Math.round(180 + 240 * momentPeakFactor);
      const colMomentKnM = Math.round(140 + 290 * momentPeakFactor);

      // Triangular seismic story shear (highest at base)
      const storyShearKn = Math.round(project.stats.baseShearXKn * (1 - (storyNum - 1) / totalStories) * 0.85);

      // Story D/C ratio
      const avgDc = Number((0.68 + 0.22 * momentPeakFactor).toFixed(3));
      const maxDc = Number((avgDc + 0.08).toFixed(3));

      return {
        storyName: story.name,
        elevationM: story.elevation,
        exteriorAxial: convertForceKn(exteriorAxialKn).value,
        interiorAxial: convertForceKn(interiorAxialKn).value,
        totalAxial: convertForceKn(exteriorAxialKn + interiorAxialKn).value,
        beamMoment: convertMomentKnM(beamMomentKnM).value,
        colMoment: convertMomentKnM(colMomentKnM).value,
        storyShear: convertForceKn(storyShearKn).value,
        avgDc,
        maxDc,
      };
    });
  }, [project, unitSystem]);

  // Forecasting Computations with Column & Beam Specific Parametric Scaling
  const forecastResults = useMemo(() => {
    const baseConcreteM3 = project.stats.totalConcreteVolumeM3;
    const baseRebarTon = project.stats.totalRebarTonnageTon;
    const baseSteelTon = project.stats.totalStructuralSteelTon;

    // Component weight breakdown in baseline model
    // Columns typically account for ~42% of frame concrete, Beams ~38%, Slabs/Walls ~20%
    const baseColConcreteM3 = baseConcreteM3 * 0.42;
    const baseBeamConcreteM3 = baseConcreteM3 * 0.38;
    const baseSlabConcreteM3 = baseConcreteM3 * 0.20;

    const colFactor = 1 + columnSectionScale / 100;
    const beamFactor = 1 + beamSectionScale / 100;

    // Material system impact (RC Frame vs Structural Steel Frame)
    const isSteel = materialSystem === 'steel';
    const concreteStrengthFactor =
      concreteGrade === 'C50'
        ? 0.88
        : concreteGrade === 'C40'
        ? 0.93
        : concreteGrade === 'C35'
        ? 1.0
        : concreteGrade === 'C30'
        ? 1.06
        : 1.14;

    const rebarStrengthFactor = rebarGrade === 'S500' ? 0.85 : 1.0;
    const steelStrengthFactor = steelGrade === 'ST52' ? 0.86 : 1.0;

    // Projected quantities
    let projectedConcreteM3 = 0;
    let projectedRebarTon = 0;
    let projectedSteelTon = 0;
    let colConcreteM3 = 0;
    let beamConcreteM3 = 0;

    if (isSteel) {
      // Steel structure: Columns & beams are structural steel profiles (W/IPE/Box)
      // Composite deck slab remains concrete
      projectedConcreteM3 = Math.round(baseSlabConcreteM3 * 1.1);
      projectedRebarTon = Number((baseRebarTon * 0.25).toFixed(1)); // Mesh/rebar in deck slab
      // Equivalent steel frame tonnage (~32-45 kg/m2)
      projectedSteelTon = Math.round(
        (project.stories.length * 48 * colFactor * beamFactor * steelStrengthFactor)
      );
    } else {
      // Concrete structure
      colConcreteM3 = baseColConcreteM3 * colFactor * concreteStrengthFactor;
      beamConcreteM3 = baseBeamConcreteM3 * beamFactor * concreteStrengthFactor;
      projectedConcreteM3 = Math.round(colConcreteM3 + beamConcreteM3 + baseSlabConcreteM3);
      projectedRebarTon = Number(
        (baseRebarTon * rebarStrengthFactor * ((colFactor + beamFactor) / 2)).toFixed(1)
      );
      projectedSteelTon = Math.round(baseSteelTon * beamFactor);
    }

    // Weight calculations (kN)
    const concreteWeightKn = projectedConcreteM3 * 24.5;
    const rebarWeightKn = projectedRebarTon * 9.81;
    const steelWeightKn = projectedSteelTon * 9.81;
    const projectedTotalWeightKn = Math.round(concreteWeightKn + rebarWeightKn + steelWeightKn);

    const weightDeltaPercent = Number(
      (((projectedTotalWeightKn - project.stats.totalWeightKn) / project.stats.totalWeightKn) * 100).toFixed(1)
    );

    // Component weight deltas
    const colWeightDeltaKn = Math.round((colFactor - 1) * baseColConcreteM3 * 24.5);
    const beamWeightDeltaKn = Math.round((beamFactor - 1) * baseBeamConcreteM3 * 24.5);

    // Costs ($110/m3 concrete, $950/ton rebar, $1450/ton structural steel)
    const concreteCostUsd = projectedConcreteM3 * 110;
    const rebarCostUsd = projectedRebarTon * 950;
    const steelCostUsd = projectedSteelTon * 1450;
    const totalCostUsd = Math.round(concreteCostUsd + rebarCostUsd + steelCostUsd);

    const baseCostUsd = Math.round(baseConcreteM3 * 110 + baseRebarTon * 950 + baseSteelTon * 1450);
    const costDeltaUsd = totalCostUsd - baseCostUsd;
    const costDeltaPercent = Number(((costDeltaUsd / baseCostUsd) * 100).toFixed(1));

    // Carbon footprint (340 kg CO2/m3 concrete, 1850 kg CO2/ton steel)
    const carbonTonCo2 = Math.round((projectedConcreteM3 * 340 + (projectedRebarTon + projectedSteelTon) * 1850) / 1000);

    // Parametric Sensitivity Curve Points (Recharts)
    const sensitivityPoints = [-20, -10, 0, 10, 20, 30].map((delta) => {
      const f = 1 + delta / 100;
      const conc = isSteel
        ? baseSlabConcreteM3
        : Math.round(baseConcreteM3 * f * concreteStrengthFactor);
      const reb = isSteel
        ? baseRebarTon * 0.25
        : Number((baseRebarTon * f * rebarStrengthFactor).toFixed(1));
      const st = isSteel
        ? Math.round(project.stories.length * 48 * f * steelStrengthFactor)
        : baseSteelTon * f;
      const wKn = Math.round(conc * 24.5 + reb * 9.81 + st * 9.81);
      const cost = Math.round(conc * 110 + reb * 950 + st * 1450);
      return {
        scaleLabel: delta === 0 ? 'پایه (۰٪)' : delta > 0 ? `+${delta}%` : `${delta}%`,
        weightTon: Math.round(wKn / 9.81),
        costKUsd: Math.round(cost / 1000),
        dcEstimated: Number((project.stats.maxDcRatio / Math.sqrt(f)).toFixed(2)),
      };
    });

    return {
      projectedConcreteM3,
      projectedRebarTon,
      projectedSteelTon,
      projectedTotalWeightKn,
      weightDeltaPercent,
      colWeightDeltaKn,
      beamWeightDeltaKn,
      totalCostUsd,
      costDeltaUsd,
      costDeltaPercent,
      carbonTonCo2,
      sensitivityPoints,
    };
  }, [
    project,
    materialSystem,
    concreteGrade,
    rebarGrade,
    steelGrade,
    columnSectionScale,
    beamSectionScale,
  ]);

  const forceUnit = unitSystem === 'imperial' ? 'kips' : 'kN';
  const momentUnit = unitSystem === 'imperial' ? 'kip·ft' : 'kN·m';

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header Stat & Tab Bar */}
      <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">داشبورد آنالیز توزیع بار و شبیه‌ساز پیش‌بینی متریال (M11 / M13)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            نمودارهای تعاملی توزیع نیروی محوری، لنگر خمشی، برش پایه و تخمین وزن و هزینه بر مبنای Recharts
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('loads')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'loads' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            نیروی محوری ستون‌ها (P)
          </button>
          <button
            onClick={() => setActiveTab('moments')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'moments' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            لنگر خمشی و برش (M/V)
          </button>
          <button
            onClick={() => setActiveTab('drift_dc')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'drift_dc' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            نسبت تنش D/C طبقات
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'forecast'
                ? 'bg-amber-600 text-white shadow'
                : 'text-amber-400/90 hover:text-amber-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ابزار پیش‌بینی متریال و هزینه</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 pb-24 overflow-y-auto space-y-5">
        {/* TAB 1: Axial Load Distribution */}
        {activeTab === 'loads' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                توزیع نیروی محوری ستون‌های پیرامونی و میانی در ارتفاع ({forceUnit})
              </span>
              <span className="text-slate-500 text-[11px]">
                پریود تحلیلی سازه: {project.stats.fundamentalPeriodSec || (project.stories.length * 0.082).toFixed(2)} ثانیه
              </span>
            </div>

            <div className="w-full h-80 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInterior" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorExterior" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="storyName" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit={` ${forceUnit}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="interiorAxial"
                    name={`ستون‌های میانی (${forceUnit})`}
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#colorInterior)"
                  />
                  <Area
                    type="monotone"
                    dataKey="exteriorAxial"
                    name={`ستون‌های پیرامونی (${forceUnit})`}
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorExterior)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 2: Bending Moments & Shear */}
        {activeTab === 'moments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                لنگر خمشی حاکم تیرها و ستون‌ها به تفکیک طبقات ({momentUnit})
              </span>
              <span className="text-slate-500 text-[11px]">برش پایه کل: {project.stats.baseShearXKn} kN</span>
            </div>

            <div className="w-full h-80 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="storyName" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit={` ${momentUnit}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Legend />
                  <Bar dataKey="colMoment" name={`لنگر ستون‌ها (${momentUnit})`} fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="beamMoment" name={`لنگر تیرها (${momentUnit})`} fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 3: D/C Ratio across Stories */}
        {activeTab === 'drift_dc' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                نسبت تنش و ظرفیت اعضا (Demand / Capacity Ratio)
              </span>
              <span className="text-rose-400 text-[11px] font-bold">حد مجاز آیین‌نامه: D/C ≤ 1.00</span>
            </div>

            <div className="w-full h-80 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="storyName" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 1.2]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Legend />
                  <ReferenceLine y={1.0} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'حد بحرانی (D/C = 1.0)', fill: '#ef4444', fontSize: 11 }} />
                  <Line type="monotone" dataKey="maxDc" name="حداکثر D/C طبقه" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="avgDc" name="میانگین D/C طبقه" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 4: Material & Cost Forecasting Tool */}
        {activeTab === 'forecast' && (
          <div className="space-y-5 animate-fade-in">
            {/* Control Sliders Panel */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">متغیرهای شبیه‌سازی مقاطع و مصالح سازه (What-If Parameters)</h3>
                </div>
                <button
                  onClick={() => {
                    setMaterialSystem('concrete');
                    setConcreteGrade('C35');
                    setRebarGrade('S400');
                    setSteelGrade('ST37');
                    setColumnSectionScale(0);
                    setBeamSectionScale(0);
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تنظیم مجدد</span>
                </button>
              </div>

              {/* Material System Selection */}
              <div className="flex items-center gap-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="font-semibold text-slate-300">سیستم متریال سازه:</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name="materialSystem"
                    value="concrete"
                    checked={materialSystem === 'concrete'}
                    onChange={() => setMaterialSystem('concrete')}
                    className="accent-cyan-500"
                  />
                  <span>اسکلت بتن مسلح (RC Frame)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name="materialSystem"
                    value="steel"
                    checked={materialSystem === 'steel'}
                    onChange={() => setMaterialSystem('steel')}
                    className="accent-amber-500"
                  />
                  <span>اسکلت فلزی (Structural Steel Frame)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Column Section Scale Slider */}
                <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-cyan-300">ابعاد مقطع ستون‌ها:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {columnSectionScale > 0 ? `+${columnSectionScale}%` : `${columnSectionScale}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="40"
                    step="5"
                    value={columnSectionScale}
                    onChange={(e) => setColumnSectionScale(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>-۳۰٪ (مقاطع لاغر)</span>
                    <span>۰٪</span>
                    <span>+۴۰٪ (مقاطع عریض)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    تغییر وزن ستون‌ها: {forecastResults.colWeightDeltaKn > 0 ? `+${forecastResults.colWeightDeltaKn}` : forecastResults.colWeightDeltaKn} kN
                  </div>
                </div>

                {/* Beam Section Scale Slider */}
                <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-300">ارتفاع و ابعاد تیرها:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {beamSectionScale > 0 ? `+${beamSectionScale}%` : `${beamSectionScale}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-25"
                    max="35"
                    step="5"
                    value={beamSectionScale}
                    onChange={(e) => setBeamSectionScale(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>-۲۵٪ (تیر کم‌ارتفاع)</span>
                    <span>۰٪</span>
                    <span>+۳۵٪ (تیر عمیق)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    تغییر وزن تیرها: {forecastResults.beamWeightDeltaKn > 0 ? `+${forecastResults.beamWeightDeltaKn}` : forecastResults.beamWeightDeltaKn} kN
                  </div>
                </div>

                {/* Material Grade Selection */}
                {materialSystem === 'concrete' ? (
                  <>
                    <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <label className="text-xs font-semibold text-slate-300">رده مقاومت بتن:</label>
                      <select
                        value={concreteGrade}
                        onChange={(e) => setConcreteGrade(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                      >
                        <option value="C25">C25 (f'c = 25 MPa)</option>
                        <option value="C30">C30 (f'c = 30 MPa)</option>
                        <option value="C35">C35 (f'c = 35 MPa)</option>
                        <option value="C40">C40 (f'c = 40 MPa)</option>
                        <option value="C50">C50 (f'c = 50 MPa - HSC)</option>
                      </select>
                      <span className="text-[10px] text-slate-400">بتن قوی‌تر اجازه کاهش ابعاد ستون‌ها را می‌دهد.</span>
                    </div>

                    <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <label className="text-xs font-semibold text-slate-300">رده آرماتور:</label>
                      <select
                        value={rebarGrade}
                        onChange={(e) => setRebarGrade(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                      >
                        <option value="S400">AIII / S400 (fy = 400 MPa)</option>
                        <option value="S500">AIV / S500 (fy = 500 MPa)</option>
                      </select>
                      <span className="text-[10px] text-slate-400">S500 تا ۱۵٪ مصرف آرماتور را کم می‌کند.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <label className="text-xs font-semibold text-slate-300">نوع فولاد ساختمانی:</label>
                      <select
                        value={steelGrade}
                        onChange={(e) => setSteelGrade(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                      >
                        <option value="ST37">فولاد ST37-2 (معمولی)</option>
                        <option value="ST52">فولاد ST52-3 (پرمقاومت)</option>
                      </select>
                      <span className="text-[10px] text-slate-400">ST52 حدود ۱۴٪ وزن مقاطع فولادی را کاهش می‌دهد.</span>
                    </div>

                    <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <label className="text-xs font-semibold text-slate-300">سقف دال عرشه:</label>
                      <div className="text-xs text-amber-300 font-medium py-1">دال کامپوزیت بتنی روی متال‌دک</div>
                      <span className="text-[10px] text-slate-400">وزن مرده سقف تا ۴۵٪ کاهش می‌یابد.</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Forecast Projection KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Weight Projection Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 shadow-md">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>وزن پیش‌بینی‌شده سازه:</span>
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      forecastResults.weightDeltaPercent < 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {forecastResults.weightDeltaPercent > 0 ? `+${forecastResults.weightDeltaPercent}%` : `${forecastResults.weightDeltaPercent}%`}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {forecastResults.projectedTotalWeightKn.toLocaleString()} <span className="text-xs text-slate-400">kN</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  وزن مدل فعلی: {project.stats.totalWeightKn.toLocaleString()} kN
                </div>
              </div>

              {/* Concrete Volume Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 shadow-md">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>حجم بتن‌ریزی برآوردی:</span>
                  <span className="text-cyan-400 text-[11px] font-mono font-bold">{concreteGrade}</span>
                </div>
                <div className="text-xl font-bold font-mono text-cyan-300">
                  {convertVolumeM3(forecastResults.projectedConcreteM3).value.toLocaleString()}{' '}
                  <span className="text-xs text-slate-400">{convertVolumeM3(forecastResults.projectedConcreteM3).unit}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  مدل پایه: {convertVolumeM3(project.stats.totalConcreteVolumeM3).value} {convertVolumeM3(project.stats.totalConcreteVolumeM3).unit}
                </div>
              </div>

              {/* Rebar / Steel Tonnage Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 shadow-md">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>مصرف فولاد و آرماتور:</span>
                  <span className="text-amber-400 text-[11px] font-mono font-bold">
                    {materialSystem === 'steel' ? steelGrade : rebarGrade}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-amber-300">
                  {convertWeightTon(forecastResults.projectedRebarTon + forecastResults.projectedSteelTon).value}{' '}
                  <span className="text-xs text-slate-400">{convertWeightTon(forecastResults.projectedRebarTon).unit}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  فولاد مقاطع: {forecastResults.projectedSteelTon} Ton • میلگرد: {forecastResults.projectedRebarTon} Ton
                </div>
              </div>

              {/* Cost Forecast Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 shadow-md">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>تخمین هزینه مصالح:</span>
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      forecastResults.costDeltaPercent <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {forecastResults.costDeltaPercent > 0 ? `+${forecastResults.costDeltaPercent}%` : `${forecastResults.costDeltaPercent}%`}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  ${forecastResults.totalCostUsd.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500">
                  ردپای کربن: {forecastResults.carbonTonCo2.toLocaleString()} تن CO₂
                </div>
              </div>
            </div>

            {/* Recharts Sensitivity Prediction Curve */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  نمودار حساسیت پیش‌بینی وزن کل سازه و هزینه بر حسب درصد تغییر مقاطع
                </span>
                <span className="text-slate-400 text-[11px]">
                  بر مبنای Recharts ComposedChart
                </span>
              </div>

              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={forecastResults.sensitivityPoints} margin={{ top: 15, right: 40, left: 35, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="scaleLabel" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis
                      yAxisId="left"
                      stroke="#06b6d4"
                      width={72}
                      tick={{ fill: '#06b6d4', fontSize: 11 }}
                      unit=" Ton"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#10b981"
                      width={70}
                      tick={{ fill: '#10b981', fontSize: 11 }}
                      unit=" k$"
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '8px' }} />
                    <Bar
                      yAxisId="left"
                      dataKey="weightTon"
                      name="وزن کل پیش‌بینی‌شده (Ton)"
                      fill="#06b6d4"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="costKUsd"
                      name="هزینه برآوردی مصالح ($x1000)"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
