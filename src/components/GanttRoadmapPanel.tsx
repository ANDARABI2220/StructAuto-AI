/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Master Development Roadmap & Interactive Gantt Timeline (72 Weeks: P0..P8 + OPS)
 * Faithfully brings 06_Gantt.html and 01_Roadmap.md into an interactive React view.
 */

import React, { useState } from 'react';
import { ROADMAP_PHASES, ROADMAP_TASKS } from '../core/roadmapData.ts';
import { Calendar, Filter, Maximize2, Flag, AlertCircle, CheckCircle2 } from 'lucide-react';

export const GanttRoadmapPanel: React.FC = () => {
  const [scale, setScale] = useState<'compact' | 'normal' | 'wide'>('normal');
  const [showOnlyCritical, setShowOnlyCritical] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string>('all');

  // Timeline boundaries (2026-10-01 to 2029-04-01)
  const startDateMs = new Date('2026-10-01').getTime();
  const endDateMs = new Date('2029-04-01').getTime();
  const totalDays = (endDateMs - startDateMs) / (1000 * 60 * 60 * 24);

  const getPositionPercent = (dateStr: string) => {
    const d = new Date(dateStr).getTime();
    return Math.max(0, Math.min(100, ((d - startDateMs) / (1000 * 60 * 60 * 24) / totalDays) * 100));
  };

  const getWidthPercent = (startStr: string, endStr: string) => {
    const s = new Date(startStr).getTime();
    const e = new Date(endStr).getTime();
    const days = Math.max(1, (e - s) / (1000 * 60 * 60 * 24) + 1);
    return (days / totalDays) * 100;
  };

  const currentTodayPercent = getPositionPercent('2026-10-16');

  // Chart width based on scale
  const chartWidthClass = scale === 'compact' ? 'w-[980px]' : scale === 'normal' ? 'w-[1400px]' : 'w-[2200px]';

  const filteredPhases = selectedPhase === 'all' ? ROADMAP_PHASES : ROADMAP_PHASES.filter((p) => p.id === selectedPhase);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header Toolbar */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold text-white">نمودار گانت نقشه راه توسعه (۷۲ هفته • P0 تا P8 و OPS)</h2>
            <p className="text-[11px] text-slate-400">تاریخ مبنا: 2026-10-16 • انتشار نهایی GA v1.0.0 در 2028-03-19</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Scale Buttons */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
            {(['compact', 'normal', 'wide'] as const).map((sc) => (
              <button
                key={sc}
                onClick={() => setScale(sc)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  scale === sc ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sc === 'compact' ? 'فشرده' : sc === 'normal' ? 'عادی' : 'باز (Wide)'}
              </button>
            ))}
          </div>

          {/* Critical Path Toggle */}
          <button
            onClick={() => setShowOnlyCritical(!showOnlyCritical)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              showOnlyCritical
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-orange-400" />
            <span>مسیر بحرانی (Critical Path)</span>
          </button>
        </div>
      </div>

      {/* Critical Path Legend */}
      <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-600 inline-block" />
          <span>مسیر بحرانی (تسریع پروژه به این زنجیره وابسته است)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rotate-45 bg-cyan-400 inline-block" />
          <span>مایل‌استون‌های کلیدی (M0 تا M8)</span>
        </span>
        <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
          <span>خط قرمز: تاریخ مبنای پروژه (2026-10-16)</span>
        </span>
      </div>

      {/* Interactive Gantt Chart Body */}
      <div className="flex-1 overflow-auto p-4">
        <div className={`${chartWidthClass} transition-all duration-300`}>
          {/* Timeline Axis Header */}
          <div className="flex border-b-2 border-slate-700 bg-slate-950/80 text-[11px] font-semibold text-slate-300 sticky top-0 z-20">
            <div className="w-[380px] shrink-0 p-3 border-l border-slate-800 text-right">فاز / تسک مهندسی / مایل‌استون</div>
            <div className="flex-1 relative h-9">
              {/* Year Quarter Ticks */}
              {['Q4 2026', 'Q1 2027', 'Q2 2027', 'Q3 2027', 'Q4 2027', 'Q1 2028', 'Q2 2028', 'Q3 2028', 'Q4 2028', 'Q1 2029'].map(
                (q, i) => (
                  <div
                    key={q}
                    className="absolute top-0 bottom-0 border-r border-slate-800/80 px-2 flex items-center text-[10px] text-slate-500 font-mono"
                    style={{ left: `${(i / 10) * 100}%` }}
                  >
                    {q}
                  </div>
                )
              )}
              {/* Today line */}
              <div
                className="absolute top-0 bottom-0 border-r-2 border-rose-500 z-10"
                style={{ left: `${currentTodayPercent}%` }}
                title="تاریخ مبنا: 2026-10-16"
              >
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] px-1 rounded">امروز</span>
              </div>
            </div>
          </div>

          {/* Phase Groups & Task Rows */}
          <div className="divide-y divide-slate-800/60 font-sans text-xs">
            {filteredPhases.map((phase) => {
              const phaseTasks = ROADMAP_TASKS.filter(
                (t) => t.phaseId === phase.id && (!showOnlyCritical || t.isCritical)
              );

              return (
                <div key={phase.id} className="group">
                  {/* Phase Roll-up Header */}
                  <div className="flex items-center bg-slate-950/40 hover:bg-slate-950/80 transition-colors">
                    <div className="w-[380px] shrink-0 p-3 border-l border-slate-800 font-bold text-white flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-white" style={{ backgroundColor: phase.color }}>
                        {phase.id}
                      </span>
                      <span className="truncate">{phase.titleFa}</span>
                    </div>

                    <div className="flex-1 relative h-10 flex items-center">
                      {/* Phase Bar */}
                      <div
                        className="absolute h-4 rounded-md shadow-sm transition-all"
                        style={{
                          left: `${getPositionPercent(phase.startDate)}%`,
                          width: `${getWidthPercent(phase.startDate, phase.endDate)}%`,
                          backgroundColor: phase.color,
                          opacity: 0.85,
                        }}
                        title={`${phase.id}: ${phase.startDate} -> ${phase.endDate} (FTE: ${phase.fte})`}
                      />

                      {/* Milestone Diamond Marker */}
                      <div
                        className="absolute w-3.5 h-3.5 bg-cyan-400 border border-slate-900 rotate-45 -mt-0.5 shadow-md z-10 cursor-pointer"
                        style={{ left: `${getPositionPercent(phase.endDate)}%` }}
                        title={`${phase.milestone}: ${phase.milestoneName} (${phase.endDate})`}
                      />
                    </div>
                  </div>

                  {/* Task Sub-rows */}
                  {phaseTasks.map((task) => (
                    <div key={task.id} className="flex items-center hover:bg-slate-800/30 transition-colors text-[11px]">
                      <div className="w-[380px] shrink-0 py-2 px-4 border-l border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                              task.isCritical
                                ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 font-bold'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {task.id}
                          </span>
                          <span className={`truncate ${task.isCritical ? 'text-white font-medium' : 'text-slate-300'}`}>
                            {task.nameFa}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">{task.ownerRole}</span>
                      </div>

                      <div className="flex-1 relative h-8 flex items-center">
                        {task.isMilestone ? (
                          <div
                            className="absolute w-3.5 h-3.5 bg-cyan-300 border border-slate-950 rotate-45 z-10"
                            style={{ left: `${getPositionPercent(task.startDate)}%` }}
                            title={`${task.nameFa} (${task.startDate})`}
                          />
                        ) : (
                          <div
                            className={`absolute h-3 rounded transition-all ${
                              task.isCritical ? 'bg-orange-500 shadow-sm' : 'bg-slate-600'
                            }`}
                            style={{
                              left: `${getPositionPercent(task.startDate)}%`,
                              width: `${getWidthPercent(task.startDate, task.endDate)}%`,
                            }}
                            title={`${task.id}: ${task.nameFa} | ${task.startDate} -> ${task.endDate} (${task.durationDays} روز)`}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
