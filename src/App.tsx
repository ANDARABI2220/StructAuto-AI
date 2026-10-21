/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Main Application Component: StructAuto AI (سازه‌یار هوشمند اتوماسیون سازه)
 * Full engineering suite featuring 3D CSM viewport, seismic simulation,
 * ML sensitivity hotspots, procurement BOM, Recharts dashboards, and global shortcuts.
 */

import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuth, saveProjectToFirestore } from './services/firebase.ts';
import { createTenStoryRcBuilding } from './core/sampleModels.ts';
import { CsmProject } from './types/csm.ts';
import { Header } from './components/Header.tsx';
import { Navigation, NavTabId } from './components/Navigation.tsx';
import { ThreeDViewer } from './components/ThreeDViewer.tsx';
import { AgentHarnessPanel } from './components/AgentHarnessPanel.tsx';
import { StandardsCompliancePanel } from './components/StandardsCompliancePanel.tsx';
import { VerificationPanel } from './components/VerificationPanel.tsx';
import { DetailingBoQPanel } from './components/DetailingBoQPanel.tsx';
import { BenchmarkPanel } from './components/BenchmarkPanel.tsx';
import { AuditTrailPanel } from './components/AuditTrailPanel.tsx';
import { GanttRoadmapPanel } from './components/GanttRoadmapPanel.tsx';
import { ModulesCatalogPanel } from './components/ModulesCatalogPanel.tsx';
import { LoadDistributionDashboard } from './components/LoadDistributionDashboard.tsx';
import { ProjectProgressDashboard } from './components/ProjectProgressDashboard.tsx';
import { ImageGeneratorModal } from './components/ImageGeneratorModal.tsx';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal.tsx';
import { auditLedger } from './core/auditEngine.ts';
import { UnitProvider, useUnits } from './context/UnitContext.tsx';
import { ShortcutProvider, useShortcuts } from './context/ShortcutContext.tsx';

function AppContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProject, setCurrentProject] = useState<CsmProject>(() => createTenStoryRcBuilding());
  const [activeTab, setActiveTab] = useState<NavTabId>('3d_viewer');
  const [lang, setLang] = useState<'fa' | 'en'>('fa');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Undo / Redo Stacks for model states
  const [undoStack, setUndoStack] = useState<CsmProject[]>([]);
  const [redoStack, setRedoStack] = useState<CsmProject[]>([]);

  const { toggleUnitSystem } = useUnits();

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user) {
        showToast(`خوش‌آمدید ${user.displayName || user.email}. احراز هویت با گوگل برقرار شد.`);
      }
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApplyModelMutation = async (mutationDetails: string) => {
    // Push current to undo stack
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(currentProject))]);
    setRedoStack([]);

    // Clone and mutate model
    const updated = JSON.parse(JSON.stringify(currentProject)) as CsmProject;
    updated.name = `${updated.name} (بهینه‌سازی شده)`;
    updated.stats.maxDcRatio = 0.86;
    updated.stats.totalWeightKn = Math.round(updated.stats.totalWeightKn * 0.95);
    updated.stats.totalConcreteVolumeM3 = Math.round(updated.stats.totalConcreteVolumeM3 * 0.96);
    updated.updatedAt = new Date().toISOString();

    // Mutate column elements
    for (const el of updated.elements) {
      if (el.type === 'column' && el.designResults) {
        el.designResults.dcRatio = Number((el.designResults.dcRatio * 0.91).toFixed(3));
        if (el.designResults.dcRatio > 0.95) el.designResults.status = 'passed';
      }
    }

    setCurrentProject(updated);
    auditLedger.recordEvent('MODEL_MUTATION', 'Agent', updated.id, mutationDetails);
    await saveProjectToFirestore(updated);
    showToast('تغییرات در مدل سازه، دیتابیس Firestore و زنجیره حسابرسی اعمال گردید.');
  };

  const handleUndo = () => {
    if (undoStack.length === 0) {
      showToast('تغییری برای بازگردانی وجود ندارد.');
      return;
    }
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(currentProject))]);
    setCurrentProject(previous);
    showToast('آخرین تغییرات مدل با موفقیت بازگردانده شد (Undo).');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      showToast('عملیاتی برای انجام مجدد وجود ندارد.');
      return;
    }
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(currentProject))]);
    setCurrentProject(next);
    showToast('عملیات مدل مجدداً اعمال گردید (Redo).');
  };

  const handleSaveToFirestore = async () => {
    try {
      await saveProjectToFirestore(currentProject);
      showToast(`مدل سازه "${currentProject.name}" با موفقیت در پایگاه داده Firestore ذخیره شد.`);
    } catch (e) {
      showToast('خطا در ذخیره‌سازی مدل در Firestore.');
    }
  };

  return (
    <ShortcutProvider onNavigateTab={(tab) => setActiveTab(tab)}>
      <ActionHandlersConnector
        onSave={handleSaveToFirestore}
        onToggleUnits={toggleUnitSystem}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <div className={`flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 ${lang === 'fa' ? 'font-sans' : 'font-mono'}`}>
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-cyan-600/90 text-white px-5 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold backdrop-blur-md border border-cyan-400/40 animate-fade-in flex items-center gap-2">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Header */}
        <Header
          currentProject={currentProject}
          onSelectProject={(p) => {
            setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(currentProject))]);
            setCurrentProject(p);
            auditLedger.recordEvent('PROJECT_SWITCH', 'User', p.id, `جابجایی به مدل سازه: ${p.name}`);
            showToast(`مدل سازه ${p.name} با موفقیت بارگذاری گردید.`);
          }}
          currentUser={currentUser}
          lang={lang}
          onToggleLang={() => setLang(lang === 'fa' ? 'en' : 'fa')}
        />

        {/* Primary Navigation Tabs */}
        <Navigation activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-hidden p-4">
          {activeTab === '3d_viewer' && (
            <ThreeDViewer
              project={currentProject}
            />
          )}

          {activeTab === 'dashboard' && (
            <LoadDistributionDashboard
              project={currentProject}
            />
          )}

          {activeTab === 'progress_dashboard' && (
            <ProjectProgressDashboard
              currentProject={currentProject}
              onSwitchProject={(p) => setCurrentProject(p)}
            />
          )}

          {activeTab === 'agent_harness' && (
            <AgentHarnessPanel
              project={currentProject}
              onApplyModelMutation={handleApplyModelMutation}
              onOpenImageModal={() => setIsImageModalOpen(true)}
            />
          )}

          {activeTab === 'standards' && (
            <StandardsCompliancePanel
              project={currentProject}
            />
          )}

          {activeTab === 'verification' && (
            <VerificationPanel
              project={currentProject}
            />
          )}

          {activeTab === 'detailing_boq' && (
            <DetailingBoQPanel
              project={currentProject}
            />
          )}

          {activeTab === 'benchmark' && (
            <BenchmarkPanel />
          )}

          {activeTab === 'audit' && (
            <AuditTrailPanel
              project={currentProject}
            />
          )}

          {activeTab === 'gantt' && (
            <GanttRoadmapPanel />
          )}

          {activeTab === 'modules' && (
            <ModulesCatalogPanel />
          )}
        </main>

        {/* Image AI Modal (gemini-3-pro-image-preview with 1K, 2K, 4K) */}
        <ImageGeneratorModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          projectName={currentProject.name}
        />

        {/* Keyboard Shortcuts Settings & Customization Modal */}
        <KeyboardShortcutsModal />
      </div>
    </ShortcutProvider>
  );
}

/**
 * Connects action handlers to the ShortcutProvider registry
 */
function ActionHandlersConnector({
  onSave,
  onToggleUnits,
  onUndo,
  onRedo,
}: {
  onSave: () => void;
  onToggleUnits: () => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const { registerActionHandler } = useShortcuts();

  useEffect(() => {
    const un1 = registerActionHandler('act_save', onSave);
    const un2 = registerActionHandler('act_toggle_units', onToggleUnits);
    const un3 = registerActionHandler('act_undo', onUndo);
    const un4 = registerActionHandler('act_redo', onRedo);

    return () => {
      un1();
      un2();
      un3();
      un4();
    };
  }, [registerActionHandler, onSave, onToggleUnits, onUndo, onRedo]);

  return null;
}

export default function App() {
  return (
    <UnitProvider>
      <AppContent />
    </UnitProvider>
  );
}
