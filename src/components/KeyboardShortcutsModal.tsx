/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Keyboard Shortcuts Manager & Customization Modal
 * Allows users to inspect and customize application keybindings with instant feedback.
 */

import React, { useState, useEffect } from 'react';
import { useShortcuts, ShortcutBinding } from '../context/ShortcutContext.tsx';
import {
  Keyboard,
  X,
  RotateCcw,
  Check,
  AlertCircle,
  Command,
  HelpCircle,
  Compass,
  Zap,
} from 'lucide-react';

export const KeyboardShortcutsModal: React.FC = () => {
  const {
    shortcuts,
    updateShortcut,
    resetShortcutsToDefault,
    isSettingsOpen,
    setIsSettingsOpen,
  } = useShortcuts();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordedCombo, setRecordedCombo] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Key recording listener when in edit mode
  useEffect(() => {
    if (!editingId) return;

    const handleRecord = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setEditingId(null);
        setRecordedCombo('');
        setErrorMessage(null);
        return;
      }

      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey && e.key !== 'Shift') parts.push('Shift');

      let mainKey = e.key;
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(mainKey)) {
        return; // wait for non-modifier key
      }
      if (mainKey.length === 1) mainKey = mainKey.toUpperCase();

      parts.push(mainKey);
      const newKey = parts.join('+');

      const success = updateShortcut(editingId, newKey);
      if (success) {
        setSuccessToast(`کلید میانبر جدید برای "${shortcuts.find((s) => s.id === editingId)?.nameFa}" ذخیره شد: ${newKey}`);
        setEditingId(null);
        setRecordedCombo('');
        setErrorMessage(null);
        setTimeout(() => setSuccessToast(null), 3000);
      } else {
        setErrorMessage(`کلید ترکیبی "${newKey}" قبلاً به عملکرد دیگری اختصاص یافته است.`);
      }
    };

    window.addEventListener('keydown', handleRecord, true);
    return () => window.removeEventListener('keydown', handleRecord, true);
  }, [editingId, updateShortcut, shortcuts]);

  if (!isSettingsOpen) return null;

  const navShortcuts = shortcuts.filter((s) => s.category === 'navigation');
  const actionShortcuts = shortcuts.filter((s) => s.category === 'actions');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">مدیریت و شخصی‌سازی کلیدهای میانبر (Keyboard Shortcuts)</h3>
              <p className="text-xs text-slate-400">جابجایی سریع بین زبانه‌ها، ذخیره در Firestore و اجرای عملیات مکرر</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsSettingsOpen(false);
              setEditingId(null);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Notifications */}
          {successToast && (
            <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{successToast}</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-950/80 border border-rose-500/40 text-rose-200 px-4 py-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Recording Banner */}
          {editingId && (
            <div className="bg-amber-950/60 border border-amber-500/40 text-amber-200 p-4 rounded-xl flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <Command className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="font-bold block">در حال ضبط کلید میانبر جدید...</span>
                  <span className="text-[11px] text-amber-300">
                    ترکیب کلیدهای دلخواه خود را روی کیبورد فشار دهید (برای انصراف کلید Esc را بزنید)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingId(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
              >
                انصراف
              </button>
            </div>
          )}

          {/* Section 1: Navigation Shortcuts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-cyan-300 text-xs border-b border-slate-800 pb-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>میانبرهای جابجایی بین زبانه‌های اصلی نرم‌افزار (Navigation Tabs)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {navShortcuts.map((sc) => {
                const isEditing = editingId === sc.id;
                return (
                  <div
                    key={sc.id}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-950/90 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-white block">{sc.nameFa}</span>
                      <span className="text-[10px] text-slate-400">{sc.description}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-cyan-300 font-mono font-bold rounded-lg text-xs shadow-inner">
                        {isEditing ? 'منتظر کلید...' : sc.currentKey}
                      </kbd>
                      <button
                        onClick={() => {
                          setEditingId(sc.id);
                          setErrorMessage(null);
                        }}
                        className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                      >
                        تغییر
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Action Shortcuts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-xs border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>میانبرهای عملیاتی و ابزارها (Actions & Quick Tools)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {actionShortcuts.map((sc) => {
                const isEditing = editingId === sc.id;
                return (
                  <div
                    key={sc.id}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-950/90 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-white block">{sc.nameFa}</span>
                      <span className="text-[10px] text-slate-400">{sc.description}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold rounded-lg text-xs shadow-inner">
                        {isEditing ? 'منتظر کلید...' : sc.currentKey}
                      </kbd>
                      <button
                        onClick={() => {
                          setEditingId(sc.id);
                          setErrorMessage(null);
                        }}
                        className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                      >
                        تغییر
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              resetShortcutsToDefault();
              setSuccessToast('کلیه کلیدهای میانبر به حالت پیش‌فرض کارخانه بازگردانده شدند.');
              setTimeout(() => setSuccessToast(null), 3000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی به تنظیمات پیش‌فرض</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            بستن و ذخیره
          </button>
        </div>
      </div>
    </div>
  );
};
