/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Header Component with Project Ingestion, Language, and Firebase Auth
 */

import React, { useRef } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, logOut } from '../services/firebase.ts';
import { CsmProject } from '../types/csm.ts';
import { PRESET_MODELS } from '../core/sampleModels.ts';
import { parseStructuralFile } from '../core/csmEngine.ts';
import { Building2, Upload, LogIn, LogOut, Globe, Sparkles, Layers, FileCode, Keyboard } from 'lucide-react';
import { useUnits } from '../context/UnitContext.tsx';
import { useShortcuts } from '../context/ShortcutContext.tsx';

interface HeaderProps {
  currentProject: CsmProject;
  onSelectProject: (p: CsmProject) => void;
  currentUser: User | null;
  lang: 'fa' | 'en';
  onToggleLang: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentProject, onSelectProject, currentUser, lang, onToggleLang }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { unitSystem, toggleUnitSystem } = useUnits();
  const { setIsSettingsOpen } = useShortcuts();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseStructuralFile(file.name, content);
      if (res.project) {
        onSelectProject(res.project);
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="bg-slate-950/90 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-md">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-white tracking-tight">StructAuto AI</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              v1.0.0 GA
            </span>
          </div>
          <p className="text-xs text-slate-400">سازه‌یار هوشمند • اتوماسیون ETABS، ProtaStructure و ETABS MATE</p>
        </div>
      </div>

      {/* Project Selector & Upload */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
          <span className="text-slate-400">مدل سازه فعال:</span>
          <select
            value={currentProject.id}
            onChange={(e) => {
              const presetKey = e.target.value === 'proj-rc-tower-10' ? 'rc_tower_10' : 'steel_braced_6';
              const builder = PRESET_MODELS[presetKey];
              if (builder) onSelectProject(builder());
            }}
            className="bg-transparent text-white font-semibold outline-none cursor-pointer"
          >
            <option value="proj-rc-tower-10" className="bg-slate-900 text-white">برج ۱۰ طبقه بتن‌آرمه (Dual System)</option>
            <option value="proj-steel-braced-6" className="bg-slate-900 text-white">اسکلت فولادی ۶ طبقه مهاربندی (CBF)</option>
          </select>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".e2k,.edb,.prota,.ifc,.saf,.csv,.json,.txt,.mat"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
          title="ایمپورت فایل مدل (.edb, .e2k, .prota, IFC, SAF, CSV)"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span>ایمپورت مدل (.edb / .e2k)</span>
        </button>
      </div>

      {/* User Auth, Units & Language Actions */}
      <div className="flex items-center gap-3">
        {/* Global Unit Conversion Toggle (Metric SI <-> Imperial US) */}
        <button
          onClick={toggleUnitSystem}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            unitSystem === 'metric'
              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-sm'
              : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40 shadow-sm'
          }`}
          title="تغییر سیستم واحدها (متریک SI ⇄ امپریال اینچی)"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px]">
            {unitSystem === 'metric' ? (
              <span>واحد: <span className="font-mono font-semibold">SI</span> (متریک • <span className="font-mono">kN/m</span>)</span>
            ) : (
              <span>واحد: <span className="font-mono font-semibold">US</span> (امپریال • <span className="font-mono">kip/ft</span>)</span>
            )}
          </span>
        </button>

        {/* Language switch */}
        <button
          onClick={onToggleLang}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 font-medium transition-colors cursor-pointer"
          title="تغییر زبان"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>{lang === 'fa' ? 'FA (فارسی)' : 'EN'}</span>
        </button>

        {/* Keyboard Shortcuts Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 font-medium transition-colors cursor-pointer"
          title="کلیدهای میانبر سریع و تنظیمات (کلید ? یا Ctrl+/)"
        >
          <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[10px] bg-slate-800 px-1 py-0.2 rounded border border-slate-700 text-slate-300">
            ?
          </span>
        </button>

        {/* Firebase Google Auth */}
        {currentUser ? (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" className="w-6 h-6 rounded-full border border-cyan-400/50" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-[10px]">
                {currentUser.displayName?.[0] || 'U'}
              </div>
            )}
            <div className="text-right">
              <span className="font-bold text-white text-[11px] block">{currentUser.displayName || 'مهندس محاسب'}</span>
              <span className="text-[10px] text-emerald-400 block font-medium">احراز شده در Firebase</span>
            </div>
            <button onClick={() => logOut()} className="p-1 text-slate-500 hover:text-rose-400" title="خروج">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>ورود با حساب گوگل (Firebase Auth)</span>
          </button>
        )}
      </div>
    </header>
  );
};
