import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download } from 'lucide-react';
import { resolveAppLanguage } from '../lib/languageResolver';
import React, { useState, useEffect } from 'react';
import {
  Settings,
  History,
  Languages,
  Moon,
  Sun,
  PlusCircle,
  PanelLeft,
  PanelLeftClose,
  Zap,
  Wifi,
  WifiOff,
  Cpu,
  Clock,
  Crown,
  Sparkles,
} from 'lucide-react';
import { AgentSettings } from '../types';
import { QuickActionsDropdown } from './QuickActionsDropdown';
import { AgentAvatar } from './AgentAvatar';
import { isAppCreator, isVipUser, CREATOR_NAME } from '../lib/quotaManager';

interface NavbarProps {
  settings: AgentSettings;
  currentUserEmail?: string | null;
  onUpdateSettings: (settings: AgentSettings) => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenMemories: () => void;
  onOpenNotes: () => void;
  onOpenCalendar: () => void;
  onOpenActivityLog: () => void;
  onOpenLocalFiles: () => void;
  onOpenMediaGenerator?: () => void;
  onOpenBackgroundTaskCenter?: () => void;
  onOpenNewsRadar?: () => void;
  onOpenVoiceHistory?: () => void;
  onOpenVideoDownloader?: () => void;
  onOpenApkModal?: () => void;
  onOpenThemeSelector?: () => void;
  onOpenLiveVoiceCall?: () => void;
  onOpenPersonaSelector?: () => void;
  onOpenWorkspaceHub?: () => void;
  onOpenTrustModal?: () => void;
  onOpenSkillsManager?: () => void;
  onOpenDataUsageModal?: () => void;
  onOpenModelQuota?: () => void;
  onNewChat: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isContinuousListening: boolean;
  onToggleContinuousListening: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  currentUserEmail,
  onUpdateSettings,
  onOpenSettings,
  onOpenHistory,
  onOpenMemories,
  onOpenNotes,
  onOpenCalendar,
  onOpenActivityLog,
  onOpenLocalFiles,
  onOpenMediaGenerator,
  onOpenBackgroundTaskCenter,
  onOpenNewsRadar,
  onOpenVoiceHistory,
  onOpenVideoDownloader,
  onOpenApkModal,
  onOpenThemeSelector,
  onOpenLiveVoiceCall,
  onOpenPersonaSelector,
  onOpenWorkspaceHub,
  onOpenTrustModal,
  onOpenSkillsManager,
  onOpenDataUsageModal,
  onOpenModelQuota,
  onNewChat,
  isDarkMode,
  onToggleTheme,
  isContinuousListening,
  onToggleContinuousListening,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const isArabic = resolveAppLanguage(settings) === 'ar';
  const { isInstallable, promptInstall } = usePWAInstall();

  const toggleLanguage = () => {
    const currentResolved = resolveAppLanguage(settings);
    const newLang = currentResolved === 'ar' ? 'en' : 'ar';
    onUpdateSettings({ ...settings, language: newLang });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 sm:px-4 py-2 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Sidebar Toggle + Brand Identity */}
        <div className="flex items-center gap-2.5">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isArabic ? 'فتح/إغلاق الشريط الجانبي' : 'Toggle Sidebar'}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            </button>
          )}

          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-md shadow-emerald-500/20 bg-slate-900 shrink-0">
            <AgentAvatar className="w-full h-full rounded-2xl" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-900"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">
                {settings.name}
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300/40">
                {isArabic ? 'وكيل ذكي' : 'AI Agent'}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-2xs">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
                <span className="hidden sm:inline">{isArabic ? 'فائق السرعة ⚡' : 'Ultra Fast ⚡'}</span>
                <span className="sm:hidden">⚡</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
              {isArabic ? 'المساعد الذكي المستقل وفائق الأداء' : 'Autonomous Personal AI Agent'}
            </p>
          </div>
        </div>

        {/* Right: Clean, Unified Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Master Consolidated Quick Access Dropdown (All Tools in One Clean Menu) */}
          <QuickActionsDropdown
            isArabic={isArabic}
            onOpenLiveVoiceCall={onOpenLiveVoiceCall}
            onOpenWorkspaceHub={onOpenWorkspaceHub}
            onOpenMediaGenerator={onOpenMediaGenerator}
            onOpenBackgroundTaskCenter={onOpenBackgroundTaskCenter}
            onOpenNewsRadar={onOpenNewsRadar}
            onOpenThemeSelector={onOpenThemeSelector}
            onOpenMemories={onOpenMemories}
            onOpenNotes={onOpenNotes}
            onOpenCalendar={onOpenCalendar}
            onOpenLocalFiles={onOpenLocalFiles}
            onOpenApkModal={onOpenApkModal}
            onOpenActivityLog={onOpenActivityLog}
            onOpenVoiceHistory={onOpenVoiceHistory}
            onOpenTrustModal={onOpenTrustModal}
            onOpenSkillsManager={onOpenSkillsManager}
            onOpenDataUsageModal={onOpenDataUsageModal}
            onOpenModelQuota={onOpenModelQuota}
          />

          {/* Model Quota & Creator VIP Button */}
          {onOpenModelQuota && (
            <button
              onClick={onOpenModelQuota}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs ${
                isAppCreator(currentUserEmail)
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black border-amber-300 shadow-md shadow-amber-500/25 active:scale-95'
                  : isVipUser(currentUserEmail)
                  ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 border-amber-400/60 active:scale-95'
                  : 'bg-blue-600/10 dark:bg-blue-500/15 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border-blue-500/30 active:scale-95'
              }`}
              title={
                isAppCreator(currentUserEmail)
                  ? isArabic
                    ? `مرحباً بك! كل شيء مجاني ومفتوح بالكامل لك لأنك صانع التطبيق (${CREATOR_NAME}) 👑`
                    : `Welcome! Everything is 100% free and unlocked because you are the App Creator (${CREATOR_NAME}) 👑`
                  : isVipUser(currentUserEmail)
                  ? isArabic
                    ? 'عضوية VIP مميزة 🌟 - أولوية معالجة ووصول موسع لأقوى النماذج'
                    : 'VIP Membership Active 🌟 - High priority processing'
                  : isArabic
                  ? 'الحصص اليومية: 5 دقائق لأقوى النماذج + 3 ساعات مجمعة لباقي النماذج ⚡'
                  : 'Model Quotas: 5m Top Frontier + 3h Shared Pool ⚡'
              }
            >
              {isAppCreator(currentUserEmail) ? (
                <Crown className="w-3.5 h-3.5 text-slate-950 animate-bounce shrink-0" />
              ) : isVipUser(currentUserEmail) ? (
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              )}
              <span className="text-[11px] font-extrabold whitespace-nowrap">
                {isAppCreator(currentUserEmail)
                  ? isArabic
                    ? 'كل شيء مجاني لك لأنك صانع التطبيق 👑'
                    : 'Everything Free (Creator VIP) 👑'
                  : isVipUser(currentUserEmail)
                  ? isArabic
                    ? 'عضوية VIP 🌟'
                    : 'VIP Member 🌟'
                  : isArabic
                  ? 'الحصص اليومية ⚡'
                  : 'Daily Quotas ⚡'}
              </span>
            </button>
          )}

          {/* Adam Skills & Extensions Hub Button */}
          {onOpenSkillsManager && (
            <button
              onClick={onOpenSkillsManager}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 transition shadow-xs"
              title={isArabic ? 'إدارة المهارات، الإضافات و MCP من الإنترنت' : 'Manage Skills, MCP & Extensions'}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
              <span className="hidden sm:inline text-[11px] font-bold">
                {isArabic ? 'المهارات' : 'Skills'}
              </span>
            </button>
          )}

          
          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={promptInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-blue-600/25 transition active:scale-95 shrink-0 animate-fadeIn"
              title={isArabic ? 'تثبيت التطبيق على جهازك' : 'Install App on your device'}
            >
              <Download className="w-3.5 h-3.5 animate-bounce" />
              <span className="hidden sm:inline">{isArabic ? 'تثبيت التطبيق' : 'Install App'}</span>
            </button>
          )}
          
          {/* New Chat Primary Action */}
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-emerald-600/25 transition active:scale-95 shrink-0"
            title={isArabic ? 'بدء محادثة جديدة (Ctrl+N)' : 'Start New Chat (Ctrl+N)'}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isArabic ? 'محادثة جديدة' : 'New Chat'}</span>
            <span className="sm:hidden">{isArabic ? 'جديدة' : 'New'}</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={isArabic ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Languages className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-[11px]">{isArabic ? 'EN' : 'عربي'}</span>
          </button>

          {/* Theme Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={isArabic ? 'تغيير المظهر' : 'Toggle Theme'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* History Drawer (Mobile Trigger) */}
          <button
            onClick={onOpenHistory}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={isArabic ? 'سجل المحادثات' : 'History'}
          >
            <History className="w-4 h-4" />
          </button>

          {/* Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={isArabic ? 'الإعدادات' : 'Settings'}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
