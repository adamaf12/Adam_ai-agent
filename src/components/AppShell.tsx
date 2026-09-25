import {
  Clock,
  Settings2,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import type { Language, ViewId } from '../core/domain';
import { BrandMark } from './BrandMark';
import { copy } from '../core/i18n';
import { LiveVoiceModal } from '../features/live/LiveVoiceModal';

interface AppShellProps {
  activeView: ViewId;
  language: Language;
  agentName: string;
  onViewChange: (view: ViewId) => void;
  onNewChat?: () => void;
  onToggleLanguage?: () => void;
  children: ReactNode;
  sessionTitle?: string;
  conversationCount?: number;
  onOpenSessionDrawer?: () => void;
}

export function AppShell({
  activeView,
  language,
  agentName: _agentName,
  onViewChange,
  onNewChat: _onNewChat,
  onToggleLanguage: _onToggleLanguage,
  children,
  sessionTitle: _sessionTitle,
  conversationCount,
  onOpenSessionDrawer,
}: AppShellProps) {
  const t = copy(language);
  const isAr = language === 'ar';
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);

  // Listen for custom events
  useEffect(() => {
    const handleOpenLiveVoice = () => setIsLiveVoiceOpen(true);
    window.addEventListener('adam:open-live-voice' as any, handleOpenLiveVoice);
    return () => {
      window.removeEventListener('adam:open-live-voice' as any, handleOpenLiveVoice);
    };
  }, []);

  // Keyboard shortcut listener: Alt+1 / Alt+2 for fast navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.altKey && !e.shiftKey) {
        const key = e.key.toLowerCase();
        if (key === '1') {
          e.preventDefault();
          onViewChange('chat');
        } else if (key === '2') {
          e.preventDefault();
          onViewChange('settings');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onViewChange]);

  return (
    <div className="app-shell">
      {/* Top Navigation Bar - Ultra Minimalist & Clean (Only Settings + Brand) */}
      <header className="navbar glass-panel">
        {/* Left / Start: History Drawer Button + Brand */}
        <div className="navbar-start flex items-center gap-2">
          {/* History / Session Drawer Button */}
          <button
            type="button"
            className="navbar-session-trigger flex items-center justify-center w-8 h-8 rounded-full bg-slate-800/70 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700/60 cursor-pointer active:scale-95 shrink-0"
            onClick={() => {
              if (onOpenSessionDrawer) {
                onOpenSessionDrawer();
              } else {
                window.dispatchEvent(new CustomEvent('adam:open-session-drawer'));
              }
            }}
            title={isAr ? 'سجل المحادثات والذاكرة' : 'Chat History & Memory'}
            aria-label="History Menu"
          >
            <Clock size={15} className="text-cyan-400" />
            {typeof conversationCount === 'number' && conversationCount > 0 && (
              <span className="navbar-session-badge">{conversationCount}</span>
            )}
          </button>

          {/* Brand Logo */}
          <button
            type="button"
            className="navbar-brand flex items-center"
            onClick={() => onViewChange('chat')}
            title="ADEM AI"
            aria-label="ADEM AI Home"
          >
            <BrandMark compact />
          </button>
        </div>

        {/* Center: Flexible Spacer */}
        <div className="navbar-center-wrapper flex-1" />

        {/* Right / End: ONLY the Settings option as requested */}
        <div className="navbar-end flex items-center gap-2">
          <button
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer active:scale-95 text-xs font-semibold ${
              activeView === 'settings'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-800/70 hover:bg-slate-700 text-slate-200 border-slate-700/60 hover:border-slate-500'
            }`}
            onClick={() => onViewChange(activeView === 'settings' ? 'chat' : 'settings')}
            title={activeView === 'settings' ? (isAr ? 'الرجوع للمحادثة' : 'Back to Chat') : (isAr ? 'الإعدادات والخيارات' : 'Settings')}
            aria-label={t.nav.settings}
          >
            <Settings2 size={15} className={activeView === 'settings' ? 'text-cyan-400' : 'text-slate-300'} />
            <span>{activeView === 'settings' ? (isAr ? 'المحادثة' : 'Chat') : (isAr ? 'الإعدادات' : 'Settings')}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="main-content">{children}</main>

      {/* Real-time Voice Stream Modal (gemini-3.8-live) */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        language={language}
      />
    </div>
  );
}
