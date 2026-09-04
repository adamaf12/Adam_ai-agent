import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Plug,
  MoreHorizontal,
  Languages,
  Moon,
  Sun,
  History,
  Settings,
  Brain,
  FileText,
  Calendar,
  PhoneCall,
  Download,
  Clock,
  Sparkles,
  Layers,
  Crown,
  PanelLeft,
  PanelLeftClose,
  ShieldCheck,
  Film,
  Activity,
  Folder,
} from 'lucide-react';
import { AgentSettings } from '../types';
import { AgentAvatar } from './AgentAvatar';
import { resolveAppLanguage } from '../lib/languageResolver';
import { usePWAInstall } from '../hooks/usePWAInstall';
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
  onOpenIntegrations?: () => void;
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
  onOpenIntegrations,
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const toggleLanguage = () => {
    const currentResolved = resolveAppLanguage(settings);
    const newLang = currentResolved === 'ar' ? 'en' : 'ar';
    onUpdateSettings({ ...settings, language: newLang });
  };

  return (
    <header className="sticky top-2 sm:top-3 z-30 px-3 sm:px-4 w-full max-w-4xl mx-auto">
      <div className="ios-glass-header rounded-full px-3 sm:px-4 py-2 flex items-center justify-between transition-all duration-300">
        {/* Left: Brand / Identity */}
        <div className="flex items-center gap-2.5">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 transition-colors ios-btn"
              title={isArabic ? 'الشريط الجانبي' : 'Toggle Sidebar'}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4 text-blue-500" />
              )}
            </button>
          )}

          <div className="relative flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border border-black/5 dark:border-white/15 bg-white/50 dark:bg-zinc-800/60 shrink-0 shadow-2xs">
            <AgentAvatar className="w-full h-full rounded-full" />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-zinc-900" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {settings.name || 'Adam'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" />
            <span className="text-[11px] font-medium text-slate-400 hidden md:inline-block">
              {isArabic ? 'متصل' : 'Online'}
            </span>
          </div>
        </div>

        {/* Right: Clean Minimalist Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all ios-btn"
            title={isArabic ? 'محادثة جديدة' : 'New Chat'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isArabic ? 'جديدة' : 'New'}</span>
          </button>

          {/* Connect Apps & Integrations Button */}
          {onOpenIntegrations && (
            <button
              onClick={onOpenIntegrations}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all ios-btn"
              title={isArabic ? 'ربط التطبيقات والخدمات' : 'Connect Apps & Services'}
            >
              <Plug className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">{isArabic ? 'ربط التطبيقات' : 'Apps'}</span>
            </button>
          )}

          {/* Language Switcher Pill */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 text-xs font-semibold rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 transition-all ios-btn"
            title={isArabic ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            {isArabic ? 'EN' : 'عربي'}
          </button>

          {/* Dark / Light Mode Pill */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors ios-btn"
            title={isArabic ? 'تغيير المظهر' : 'Toggle Theme'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* iOS Action Menu (⋯) Container */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors ios-btn"
              title={isArabic ? 'المزيد من الخيارات' : 'More Options'}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Apple iOS Frosted Glass Popover Menu */}
            {isMenuOpen && (
              <div
                className={`ios-glass-menu rounded-3xl p-2.5 shadow-2xl absolute top-11 ${
                  isArabic ? 'left-0' : 'right-0'
                } w-64 z-50 animate-fadeIn text-xs text-slate-800 dark:text-slate-200 divide-y divide-black/5 dark:divide-white/5 space-y-1`}
              >
                {/* Section 1: Core Hubs */}
                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenHistory();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition text-start font-medium"
                  >
                    <History className="w-4 h-4 text-blue-500" />
                    <span>{isArabic ? 'سجل المحادثات' : 'Chat History'}</span>
                  </button>

                  {onOpenLiveVoiceCall && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenLiveVoiceCall();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition text-start font-medium"
                    >
                      <PhoneCall className="w-4 h-4 text-emerald-500" />
                      <span>{isArabic ? 'مكالمة صوتية حية' : 'Live Voice Call'}</span>
                    </button>
                  )}

                  {onOpenIntegrations && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenIntegrations();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition text-start font-medium"
                    >
                      <Plug className="w-4 h-4 text-indigo-500" />
                      <span>{isArabic ? 'ربط التطبيقات والحسابات' : 'Connected Apps'}</span>
                    </button>
                  )}
                </div>

                {/* Section 2: Productivity & Memory */}
                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenMemories();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition text-start font-medium"
                  >
                    <Brain className="w-4 h-4 text-purple-500" />
                    <span>{isArabic ? 'الذاكرة الذكية' : 'Smart Memories'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenNotes();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition text-start font-medium"
                  >
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span>{isArabic ? 'الملاحظات' : 'Notes'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenCalendar();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition text-start font-medium"
                  >
                    <Calendar className="w-4 h-4 text-rose-500" />
                    <span>{isArabic ? 'التقويم والتذكيرات' : 'Calendar & Reminders'}</span>
                  </button>

                  {onOpenWorkspaceHub && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenWorkspaceHub();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition text-start font-medium"
                    >
                      <Layers className="w-4 h-4 text-teal-500" />
                      <span>{isArabic ? 'مركز Google Workspace' : 'Google Workspace'}</span>
                    </button>
                  )}

                  {onOpenLocalFiles && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenLocalFiles();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition text-start font-medium"
                    >
                      <Folder className="w-4 h-4 text-cyan-500" />
                      <span>{isArabic ? 'الملفات المحلية' : 'Local Files'}</span>
                    </button>
                  )}
                </div>

                {/* Section 3: System, Settings & PWA */}
                <div className="py-1 space-y-0.5">
                  {onOpenModelQuota && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenModelQuota();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition text-start font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>{isArabic ? 'حصص النماذج' : 'Model Quotas'}</span>
                      </div>
                      {isAppCreator(currentUserEmail) && (
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </button>
                  )}

                  {isInstallable && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        promptInstall();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition text-start font-medium text-blue-600 dark:text-blue-400"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isArabic ? 'تثبيت التطبيق على جهازك' : 'Install App'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition text-start font-medium"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>{isArabic ? 'الإعدادات المتقدمة' : 'Settings'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
