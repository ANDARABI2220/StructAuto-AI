/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Centralized Global Keyboard Shortcut Manager Context
 * Provides customizable keybindings for core tab navigation and frequent actions,
 * with persistence in localStorage and conflict prevention.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { NavTabId } from '../components/Navigation.tsx';

export interface ShortcutBinding {
  id: string;
  nameFa: string;
  category: 'navigation' | 'actions';
  defaultKey: string; // e.g. "Ctrl+1", "Ctrl+S"
  currentKey: string;
  description: string;
}

export const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  // Navigation shortcuts
  { id: 'nav_3d', nameFa: 'نمایشگر ۳ بعدی سازه (CSM)', category: 'navigation', defaultKey: 'Ctrl+1', currentKey: 'Ctrl+1', description: 'انتقال سریع به پنل نمایش سه‌بعدی و تداخلات' },
  { id: 'nav_dashboard', nameFa: 'داشبورد توزیع بار و پیش‌بینی', category: 'navigation', defaultKey: 'Ctrl+2', currentKey: 'Ctrl+2', description: 'انتقال به داشبورد نمودارهای بار و شبیه‌ساز مقاطع' },
  { id: 'nav_progress', nameFa: 'روند پیشرفت پروژه (Firestore)', category: 'navigation', defaultKey: 'Ctrl+3', currentKey: 'Ctrl+3', description: 'انتقال به داشبورد پیشرفت زمانی و نسخه‌های Firestore' },
  { id: 'nav_agent', nameFa: 'عامل هوشمند خودکارساز', category: 'navigation', defaultKey: 'Ctrl+4', currentKey: 'Ctrl+4', description: 'انتقال به پنل عامل مدل‌سازی خودکار و تولید تصویر' },
  { id: 'nav_standards', nameFa: 'چک‌لیست آیین‌نامه‌ها و نقشه زلزله', category: 'navigation', defaultKey: 'Ctrl+5', currentKey: 'Ctrl+5', description: 'انتقال به پنل استانداردهای ۲۸۰۰ و نقشه پهنه‌بندی' },
  { id: 'nav_verification', nameFa: 'کنترل مستقل و نقشه حرارتی ML', category: 'navigation', defaultKey: 'Ctrl+6', currentKey: 'Ctrl+6', description: 'انتقال به پنل صحه‌گذاری تعادل و نقاط بحرانی' },
  { id: 'nav_boq', nameFa: 'نقشه‌ها، BoQ و خرید متریال (BOM)', category: 'navigation', defaultKey: 'Ctrl+7', currentKey: 'Ctrl+7', description: 'انتقال به متره، لیستوفر و پیش‌فاکتور خرید متریال' },
  { id: 'nav_benchmark', nameFa: 'بنچمارک کارایی ۱۰۰۰×', category: 'navigation', defaultKey: 'Ctrl+8', currentKey: 'Ctrl+8', description: 'انتقال به نتایج سرعت پردازش الگوریتم‌ها' },
  { id: 'nav_audit', nameFa: 'زنجیره حسابرسی امنیتی هش', category: 'navigation', defaultKey: 'Ctrl+9', currentKey: 'Ctrl+9', description: 'انتقال به دفترکل تغییرات و مقایسه نسخه‌ها' },
  { id: 'nav_gantt', nameFa: 'گانت نقشه راه توسعه', category: 'navigation', defaultKey: 'Ctrl+0', currentKey: 'Ctrl+0', description: 'انتقال به نمودار گانت ۷۲ هفته‌ای' },

  // Action shortcuts
  { id: 'act_save', nameFa: 'ذخیره اسنپ‌شات در Firestore', category: 'actions', defaultKey: 'Ctrl+S', currentKey: 'Ctrl+S', description: 'ذخیره و همگام‌سازی فوری مدل جاری در دیتابیس ابری' },
  { id: 'act_toggle_units', nameFa: 'تغییر سیستم واحدها (SI/US)', category: 'actions', defaultKey: 'Ctrl+U', currentKey: 'Ctrl+U', description: 'تغییر سراسری واحدها بین متریک و امپریال' },
  { id: 'act_undo', nameFa: 'بازگردانی آخرین تغییر (Undo)', category: 'actions', defaultKey: 'Ctrl+Z', currentKey: 'Ctrl+Z', description: 'بازگشت به وضعیت قبلی مدل سازه' },
  { id: 'act_redo', nameFa: 'انجام مجدد تغییر (Redo)', category: 'actions', defaultKey: 'Ctrl+Y', currentKey: 'Ctrl+Y', description: 'اعمال دوباره تغییر بازگردانده شده' },
  { id: 'act_help', nameFa: 'راهنما و تنظیمات کلیدهای میانبر', category: 'actions', defaultKey: '?', currentKey: '?', description: 'باز کردن پنجره شخصی‌سازی میانبرها' },
];

interface ShortcutContextValue {
  shortcuts: ShortcutBinding[];
  updateShortcut: (id: string, newKey: string) => boolean;
  resetShortcutsToDefault: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  registerActionHandler: (actionId: string, handler: () => void) => () => void;
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

const STORAGE_KEY = 'structauto_custom_shortcuts_v1';

export const ShortcutProvider: React.FC<{
  children: ReactNode;
  onNavigateTab?: (tab: NavTabId) => void;
}> = ({ children, onNavigateTab }) => {
  const [shortcuts, setShortcuts] = useState<ShortcutBinding[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return DEFAULT_SHORTCUTS.map((def) => {
          const match = parsed.find((p: any) => p.id === def.id);
          return match ? { ...def, currentKey: match.currentKey } : def;
        });
      }
    } catch (e) {
      console.warn('Could not load custom shortcuts:', e);
    }
    return DEFAULT_SHORTCUTS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const actionHandlersRef = React.useRef<Map<string, () => void>>(new Map());

  const registerActionHandler = useCallback((actionId: string, handler: () => void) => {
    actionHandlersRef.current.set(actionId, handler);
    return () => {
      actionHandlersRef.current.delete(actionId);
    };
  }, []);

  const updateShortcut = (id: string, newKey: string): boolean => {
    // Conflict check
    const normalizedKey = newKey.trim();
    const conflict = shortcuts.find((s) => s.id !== id && s.currentKey.toLowerCase() === normalizedKey.toLowerCase());
    if (conflict) {
      return false;
    }

    const updated = shortcuts.map((s) => (s.id === id ? { ...s, currentKey: normalizedKey } : s));
    setShortcuts(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.map((u) => ({ id: u.id, currentKey: u.currentKey }))));
    } catch (e) {
      console.warn('Could not persist shortcuts:', e);
    }
    return true;
  };

  const resetShortcutsToDefault = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  // Global keydown event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Build key string matching formats: e.g. "Ctrl+1", "Ctrl+S", "Ctrl+Shift+Z", "?"
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey && e.key !== 'Shift') parts.push('Shift');

      let mainKey = e.key;
      if (mainKey === 'Control' || mainKey === 'Alt' || mainKey === 'Shift' || mainKey === 'Meta') {
        return;
      }
      if (mainKey.length === 1) mainKey = mainKey.toUpperCase();

      parts.push(mainKey);
      const pressedCombo = parts.join('+');

      // Check against registered shortcuts
      const matched = shortcuts.find(
        (s) => s.currentKey.toLowerCase() === pressedCombo.toLowerCase() ||
               (s.currentKey === '?' && e.key === '?' && !e.ctrlKey && !e.altKey)
      );

      if (!matched) return;

      // Allow Ctrl+S, Ctrl+Z etc. even in inputs if appropriate, or prevent default
      if (isInput && !e.ctrlKey && !e.metaKey) {
        return;
      }

      e.preventDefault();

      // Execute matched action or navigation
      if (matched.category === 'navigation' && onNavigateTab) {
        const tabMap: Record<string, NavTabId> = {
          nav_3d: '3d_viewer',
          nav_dashboard: 'dashboard',
          nav_progress: 'progress_dashboard',
          nav_agent: 'agent_harness',
          nav_standards: 'standards',
          nav_verification: 'verification',
          nav_boq: 'detailing_boq',
          nav_benchmark: 'benchmark',
          nav_audit: 'audit',
          nav_gantt: 'gantt',
        };
        const targetTab = tabMap[matched.id];
        if (targetTab) {
          onNavigateTab(targetTab);
        }
      } else if (matched.category === 'actions') {
        if (matched.id === 'act_help') {
          setIsSettingsOpen(true);
        } else {
          const handler = actionHandlersRef.current.get(matched.id);
          if (handler) {
            handler();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, onNavigateTab]);

  return (
    <ShortcutContext.Provider
      value={{
        shortcuts,
        updateShortcut,
        resetShortcutsToDefault,
        isSettingsOpen,
        setIsSettingsOpen,
        registerActionHandler,
      }}
    >
      {children}
    </ShortcutContext.Provider>
  );
};

export const useShortcuts = () => {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutProvider');
  }
  return context;
};
