import {
  Clock,
  Globe,
  Languages,
  Plus,
  Settings2,
  Gauge,
  Radio,
  Film,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import type { Language, ViewId } from '../core/domain';
import { BrandMark } from './BrandMark';
import { GoogleAuthButton } from './GoogleAuthButton';
import { copy } from '../core/i18n';
import { SpeedTestDiagnosticModal } from '../features/diagnostics/SpeedTestDiagnosticModal';
import { getSpeedTestHistory } from '../features/diagnostics/speedTestClient';
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
  onNewChat,
  onToggleLanguage,
  children,
  sessionTitle: _sessionTitle,
  conversationCount,
  onOpenSessionDrawer,
}: AppShellProps) {
  const t = copy(language);
  const [isSpeedTestOpen, setIsSpeedTestOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [lastSpeedTps, setLastSpeedTps] = useState<number | null>(() => {
    const history = getSpeedTestHistory();
    return history.length > 0 ? history[0].averageTps : null;
  });

  // Listen for custom events
  useEffect(() => {
    const handleOpenSpeedTest = () => setIsSpeedTestOpen(true);
    const handleOpenLiveVoice = () => setIsLiveVoiceOpen(true);
    window.addEventListener('adam:open-speed-test' as any, handleOpenSpeedTest);
    window.addEventListener('adam:open-live-voice' as any, handleOpenLiveVoice);
    return () => {
      window.removeEventListener('adam:open-speed-test' as any, handleOpenSpeedTest);
      window.removeEventListener('adam:open-live-voice' as any, handleOpenLiveVoice);
    };
  }, []);

  // Keyboard shortcut listener: Alt+1 / Alt+2 for fast navigation, Alt+S for speed test
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
        } else if (key === 's') {
          e.preventDefault();
          setIsSpeedTestOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onViewChange]);

  return (
    <div className="app-shell">
      {/* Top Navigation Bar - Minimalist, unified modern header */}
      <header className="navbar glass-panel">
        {/* Start: Brand & Active Status */}
        <div className="navbar-start">
          <button
            type="button"
            className="navbar-brand"
            onClick={() => onViewChange('chat')}
            title="ADEM AI"
            aria-label="ADEM AI Home"
          >
            <BrandMark compact />
          </button>

          <div className="status-pill hidden sm:inline-flex" title={t.online}>
            <i />
            <span>{t.online}</span>
          </div>

          {/* Real-time LLM Speed Test & Diagnostic Trigger */}
          <button
            type="button"
            onClick={() => setIsSpeedTestOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all cursor-pointer shadow-sm active:scale-95"
            title={language === 'ar' ? 'فحص سرعة النموذج والرموز في الثانية (Alt+S)' : 'LLM Speed Test & Tokens/sec Diagnostic (Alt+S)'}
            aria-label="Speed Test"
          >
            <Gauge size={13} className="text-cyan-400 animate-pulse" />
            <span className="hidden md:inline">
              {lastSpeedTps ? `${lastSpeedTps} T/s` : (language === 'ar' ? 'فحص السرعة' : 'Speed Test')}
            </span>
          </button>

          {/* Multimodal Live API Trigger (WebSockets - ADEM-G 3.8 Live) */}
          <button
            type="button"
            onClick={() => setIsLiveVoiceOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-purple-500/40 bg-purple-500/15 text-purple-200 hover:bg-purple-500/25 hover:border-purple-400/60 transition-all cursor-pointer shadow-sm active:scale-95"
            title={language === 'ar' ? 'Multimodal Live API: صوت وكاميرا وشاشة عبر WebSockets فائقة السرعة' : 'Multimodal Live API: Real-time Audio & Vision via WebSockets'}
            aria-label="Multimodal Live API"
          >
            <Radio size={13} className="text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">{language === 'ar' ? 'Multimodal Live' : 'Multimodal Live'}</span>
          </button>

          {/* Media Studio Trigger (Veo 3 & Gemini Image) */}
          <button
            type="button"
            onClick={() => onViewChange(activeView === 'media' ? 'chat' : 'media')}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-sm active:scale-95 ${
              activeView === 'media'
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
            }`}
            title={language === 'ar' ? 'استوديو الفيديو والصور (Veo 3 & Gemini Image)' : 'Veo 3 & Image Studio'}
            aria-label="Media Studio"
          >
            <Film size={13} className="text-emerald-400" />
            <span>{language === 'ar' ? 'استوديو الفيديو' : 'Veo 3 Studio'}</span>
          </button>
        </div>

        {/* Center: Clean layout space */}
        <div className="navbar-center-wrapper flex-1" />

        {/* End: Quick Actions (Settings + New Chat + History + Language + Google Auth) */}
        <div className="navbar-end">
          {/* Prominent Top-Side Settings Button (زر الإعدادات في الجانب في الأعلى) */}
          <button
            type="button"
            className={activeView === 'settings' ? 'settings-nav-btn settings-nav-btn--active' : 'settings-nav-btn'}
            onClick={() => onViewChange(activeView === 'settings' ? 'chat' : 'settings')}
            title={activeView === 'settings' ? (language === 'ar' ? 'الرجوع للمحادثة (Alt+1)' : 'Back to Chat (Alt+1)') : `${t.nav.settings} (Alt+2)`}
            aria-label={t.nav.settings}
          >
            <Settings2 size={15} className={activeView === 'settings' ? 'text-[var(--accent)] animate-spin-slow' : 'text-slate-300'} />
            <span className="font-bold text-xs">
              {activeView === 'settings' 
                ? (language === 'ar' ? 'المحادثة ↩' : 'Chat ↩') 
                : t.nav.settings}
            </span>
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            className="new-chat-btn"
            onClick={() => {
              if (onNewChat) {
                onNewChat();
              } else {
                onViewChange('chat');
              }
            }}
            title={t.newChat}
            aria-label={t.newChat}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">{t.newChat}</span>
          </button>

          {/* Session / History Button */}
          {activeView === 'chat' && (
            <button
              type="button"
              className="navbar-session-trigger"
              onClick={() => {
                if (onOpenSessionDrawer) {
                  onOpenSessionDrawer();
                } else {
                  window.dispatchEvent(new CustomEvent('adam:open-session-drawer'));
                }
              }}
              title={language === 'ar' ? 'إدارة الجلسات والذاكرة' : 'Session & Memory Drawer'}
              aria-label="Session Menu"
            >
              <Clock size={14} className="text-emerald-400" />
              {typeof conversationCount === 'number' && conversationCount > 0 && (
                <span className="navbar-session-badge">{conversationCount}</span>
              )}
            </button>
          )}

          <GoogleAuthButton language={language} />

          {onToggleLanguage && (
            <button
              type="button"
              className="lang-toggle-btn"
              onClick={onToggleLanguage}
              title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
              aria-label="Toggle language"
            >
              <Globe size={13} className="text-emerald-400" />
              <span className="lang-toggle-label">{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="main-content">{children}</main>

      {/* Global LLM Speed Test & Tokens-Per-Second Diagnostic Panel */}
      <SpeedTestDiagnosticModal
        isOpen={isSpeedTestOpen}
        onClose={() => {
          setIsSpeedTestOpen(false);
          const history = getSpeedTestHistory();
          if (history.length > 0) {
            setLastSpeedTps(history[0].averageTps);
          }
        }}
        language={language}
      />

      {/* Real-time Voice Stream Modal (gemini-3.8-live) */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        language={language}
      />
    </div>
  );
}

