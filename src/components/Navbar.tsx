import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Languages, Moon, Sun, PlusCircle, PanelLeft, PanelLeftClose, Settings, History, MoreHorizontal } from 'lucide-react';
import React, { useState } from 'react';
import { resolveAppLanguage } from '../lib/languageResolver';
import { AgentSettings } from '../types';
import { QuickActionsDropdown } from './QuickActionsDropdown';
import { AgentAvatar } from './AgentAvatar';

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

export const Navbar: React.FC<NavbarProps> = (props) => {
  const { settings, onUpdateSettings, onOpenSettings, onOpenHistory, onNewChat, isDarkMode, onToggleTheme, isSidebarOpen, onToggleSidebar } = props;
  const isArabic = resolveAppLanguage(settings) === 'ar';
  const { isInstallable, promptInstall } = usePWAInstall();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    onUpdateSettings({ ...settings, language: isArabic ? 'en' : 'ar' });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-3 py-2 safe-area-top">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {onToggleSidebar && <button onClick={onToggleSidebar} className="hidden md:flex rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white" title={isArabic ? 'الشريط الجانبي' : 'Sidebar'}>{isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}</button>}
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900 shadow-lg shadow-emerald-500/10"><AgentAvatar className="h-full w-full rounded-2xl" /><span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-slate-950 bg-emerald-500" /></div>
          <div className="min-w-0">
            <div className="flex items-center gap-2"><h1 className="truncate text-base font-black text-white">{settings.name}</h1><span className="hidden sm:inline text-[10px] font-bold text-emerald-400">AI Agent</span></div>
            <p className="hidden sm:block text-[10px] text-slate-500">{isArabic ? 'مساعدك الذكي' : 'Your personal AI assistant'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <QuickActionsDropdown
            isArabic={isArabic}
            onOpenLiveVoiceCall={props.onOpenLiveVoiceCall}
            onOpenWorkspaceHub={props.onOpenWorkspaceHub}
            onOpenMediaGenerator={props.onOpenMediaGenerator}
            onOpenBackgroundTaskCenter={props.onOpenBackgroundTaskCenter}
            onOpenNewsRadar={props.onOpenNewsRadar}
            onOpenThemeSelector={props.onOpenThemeSelector}
            onOpenMemories={props.onOpenMemories}
            onOpenNotes={props.onOpenNotes}
            onOpenCalendar={props.onOpenCalendar}
            onOpenLocalFiles={props.onOpenLocalFiles}
            onOpenApkModal={props.onOpenApkModal}
            onOpenActivityLog={props.onOpenActivityLog}
            onOpenVoiceHistory={props.onOpenVoiceHistory}
            onOpenTrustModal={props.onOpenTrustModal}
            onOpenSkillsManager={props.onOpenSkillsManager}
            onOpenDataUsageModal={props.onOpenDataUsageModal}
            onOpenModelQuota={props.onOpenModelQuota}
          />
          <button onClick={onNewChat} className="hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 active:scale-95" title={isArabic ? 'محادثة جديدة' : 'New chat'}><PlusCircle className="h-4 w-4" />{isArabic ? 'جديدة' : 'New'}</button>
          <button onClick={toggleLanguage} className="hidden sm:flex rounded-xl p-2 text-slate-300 hover:bg-slate-800" title={isArabic ? 'English' : 'العربية'}><Languages className="h-4 w-4" /></button>
          <button onClick={onToggleTheme} className="hidden sm:flex rounded-xl p-2 text-slate-300 hover:bg-slate-800" title={isArabic ? 'المظهر' : 'Theme'}>{isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          <button onClick={onOpenHistory} className="rounded-xl p-2 text-slate-300 hover:bg-slate-800" title={isArabic ? 'المحادثات' : 'History'}><History className="h-4 w-4" /></button>
          <button onClick={onOpenSettings} className="rounded-xl p-2 text-slate-300 hover:bg-slate-800" title={isArabic ? 'الإعدادات' : 'Settings'}><Settings className="h-4 w-4" /></button>
          <button onClick={() => setMobileMenuOpen(v => !v)} className="sm:hidden rounded-xl p-2 text-slate-300 hover:bg-slate-800" title={isArabic ? 'المزيد' : 'More'}><MoreHorizontal className="h-5 w-5" /></button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="mx-auto mt-2 flex max-w-6xl flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-xl sm:hidden">
          <button onClick={() => { onNewChat(); setMobileMenuOpen(false); }} className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950"><PlusCircle className="mr-1 inline h-4 w-4" />{isArabic ? 'محادثة جديدة' : 'New chat'}</button>
          <button onClick={toggleLanguage} className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"><Languages className="mr-1 inline h-4 w-4" />{isArabic ? 'English' : 'العربية'}</button>
          <button onClick={onToggleTheme} className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800">{isDarkMode ? '☀️' : '🌙'} {isArabic ? 'المظهر' : 'Theme'}</button>
          {isInstallable && <button onClick={promptInstall} className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"><Download className="mr-1 inline h-4 w-4" />{isArabic ? 'تثبيت' : 'Install'}</button>}
        </div>
      )}
    </header>
  );
};
