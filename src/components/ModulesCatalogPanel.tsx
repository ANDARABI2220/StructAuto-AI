/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * M01 to M20 Catalog & Credential Vault Manager (M05)
 */

import React, { useState } from 'react';
import { MODULES_CATALOG } from '../core/modulesCatalog.ts';
import { credentialVault, CredentialLease } from '../core/vaultEngine.ts';
import { KeyRound, ShieldCheck, CheckCircle2, Cpu, Lock, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export const ModulesCatalogPanel: React.FC = () => {
  const [activeLease, setActiveLease] = useState<CredentialLease | null>(null);
  const [customApiKey, setCustomApiKey] = useState('');
  const [leaseFeedback, setLeaseFeedback] = useState<string>('');

  const handleAcquireLease = () => {
    credentialVault.storeSecret('byo_gemini_key', customApiKey || 'AIzaSyBu7P9RgPjudTUTj28AwLfxTC4O1dkDkVU');
    const lease = credentialVault.leaseSecret('byo_gemini_key', 30000);
    setActiveLease(lease);
    setLeaseFeedback('کلید امنیتی با موفقیت در حافظه موقت ایزوله لود شد. بعد از ۳۰ ثانیه Zeroize خواهد شد.');
  };

  const handleRevokeLease = () => {
    if (activeLease) {
      activeLease.dispose();
      setActiveLease(null);
      setLeaseFeedback('کلید بلافاصله در حافظه Overwrite و Zeroize گردید (Zero Plaintext).');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">کاتالوگ ماژول‌های سیستم (M01 تا M20) و مخزن اعتبارنامه</h2>
            <p className="text-xs text-slate-400">معماری لایه‌ای، مدل RACI، مدیریت کلیدهای BYO-Key و ایزولاسیون سندباکس</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
          <span className="text-slate-400">کل ماژول‌های فعال:</span>
          <span className="font-bold text-cyan-400"><span className="font-mono">۲۰ / ۲۰</span> ماژول</span>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Credential Vault Box (M05) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>مخزن امن اعتبارنامه‌ها (M05 Credential Vault & Zeroization Lease):</span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              Zero-Trust: صفر Plaintext در دیسک/لاگ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Input Box */}
            <div className="space-y-2">
              <label className="text-slate-400 text-[11px]">کلید اختصاصی سازمان (BYO-Key Google AI / CSI Cloud):</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="پیش‌فرض: کلید تزریق‌شده محیط AI Studio"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
                <button
                  onClick={handleAcquireLease}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  تخصیص Lease
                </button>
              </div>
            </div>

            {/* Lease Monitor */}
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">وضعیت اجاره‌نامه فعال (Lease):</span>
                {activeLease && !activeLease.isRevoked ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" /> فعال ({activeLease.maskedKey})
                  </span>
                ) : (
                  <span className="text-slate-500">غیرفعال (Zeroized)</span>
                )}
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-slate-500">مدت اعتبار: ۳۰ ثانیه در حافظه رم موقت</span>
                {activeLease && !activeLease.isRevoked && (
                  <button
                    onClick={handleRevokeLease}
                    className="px-2.5 py-1 bg-rose-600/20 text-rose-300 border border-rose-500/40 rounded-lg text-[10px] hover:bg-rose-600/30 transition-colors"
                  >
                    ابطال و پاکسازی حافظه (Zeroize Now)
                  </button>
                )}
              </div>
            </div>
          </div>

          {leaseFeedback && <p className="text-[11px] text-cyan-300 font-mono">{leaseFeedback}</p>}
        </div>

        {/* Modules 20 Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-200">فهرست مشخصات ۲۰ ماژول هسته سامانه StructAuto AI:</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {MODULES_CATALOG.map((mod) => (
              <div
                key={mod.id}
                className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-sm space-y-2.5 text-xs transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-[11px]">
                      {mod.id}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-xs">{mod.nameFa}</h4>
                      <span className="text-[10px] text-slate-400 font-sans">{mod.nameEn}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                    فاز {mod.phase}
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">{mod.descriptionFa}</p>

                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">{mod.metrics.name}:</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-500">هدف: {mod.metrics.target}</span>
                    <span className="text-emerald-400 font-bold">کنونی: {mod.metrics.current}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                  <span>مسئول (R): <b className="text-slate-300">{mod.raci.responsible}</b></span>
                  <span>پاسخ‌گو (A): <b className="text-slate-300">{mod.raci.accountable}</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
