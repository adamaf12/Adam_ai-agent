import {
  Clock,
  Globe,
  Languages,
  Plus,
  Settings2,
} from 'lucide-react';
import { type ReactNode, useEffect } from 'react';
import type { Language, ViewId } from '../core/domain';
import { BrandMark } from './BrandMark';
import { GoogleAuthButton } from './GoogleAuthButton';
import { copy } from '../core/i18n';

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
        const num = parseInt(e.key, 10);
        if (num === 1) {
          e.preventDefault();
          onViewChange('chat');
        } else if (num === 2) {
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
    </div>
  );
}

