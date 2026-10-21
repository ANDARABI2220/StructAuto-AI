/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Primary Navigation Bar Component
 */

import React from 'react';
import { Box, BrainCircuit, Award, ShieldCheck, Layout, Zap, Lock, Calendar, Cpu, TrendingUp } from 'lucide-react';

export type NavTabId =
  | '3d_viewer'
  | 'dashboard'
  | 'progress_dashboard'
  | 'agent_harness'
  | 'standards'
  | 'verification'
  | 'detailing_boq'
  | 'benchmark'
  | 'audit'
  | 'gantt'
  | 'modules';

interface NavigationProps {
  activeTab: NavTabId;
  onChangeTab: (tab: NavTabId) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: '3d_viewer' as NavTabId, labelFa: 'مدل سازه و ۳D (CSM)', icon: Box },
    { id: 'dashboard' as NavTabId, labelFa: 'توزیع بار ستون‌ها و تیرها', icon: Layout, badge: 'Recharts' },
    { id: 'progress_dashboard' as NavTabId, labelFa: 'پیشرفت پروژه‌ها (Firestore)', icon: TrendingUp, badge: 'Firestore' },
    { id: 'agent_harness' as NavTabId, labelFa: 'عامل خودکارساز (Harness)', icon: BrainCircuit, badge: 'Argon' },
    { id: 'standards' as NavTabId, labelFa: 'چک‌لیست آیین‌نامه‌ها', icon: Award },
    { id: 'verification' as NavTabId, labelFa: 'کنترل مستقل (M12)', icon: ShieldCheck },
    { id: 'detailing_boq' as NavTabId, labelFa: 'نقشه و BoQ (M10/M11)', icon: Layout },
    { id: 'benchmark' as NavTabId, labelFa: 'کارایی ۱۰۰۰× (M13)', icon: Zap, highlight: true },
    { id: 'audit' as NavTabId, labelFa: 'حسابرسی هش (M15)', icon: Lock },
    { id: 'gantt' as NavTabId, labelFa: 'گانت نقشه راه (۷۲ هفته)', icon: Calendar },
    { id: 'modules' as NavTabId, labelFa: 'ماژول‌های M01-M20', icon: Cpu },
  ];

  return (
    <nav className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs select-none scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950 flex-nowrap">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;

        return (
          <button
            key={t.id}
            onClick={() => onChangeTab(t.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
              isActive
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span>{t.labelFa}</span>
            {t.badge && (
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                {t.badge}
              </span>
            )}
            {t.highlight && (
              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                1000×
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
