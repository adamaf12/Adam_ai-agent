import {
  Brain,
  CalendarCheck,
  Clock,
  Gamepad2,
  Globe,
  MessageCircle,
  Plus,
  Settings2,
  Sparkles,
  Film,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import type { Language, ViewId } from '../core/domain';
import { BrandMark } from './BrandMark';
import { BottomNav } from './BottomNav';
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

const navItems: Array<{
  id: ViewId;
  icon: LucideIcon;
  key: keyof ReturnType<typeof copy>['nav'];
}> = [
  { id: 'chat', icon: MessageCircle, key: 'chat' },
  { id: 'tasks', icon: CalendarCheck, key: 'tasks' },
  { id: 'apps', icon: Gamepad2, key: 'apps' },
  { id: 'workspace', icon: Sparkles, key: 'workspace' },
  { id: 'media', icon: Film, key: 'media' },
  { id: 'memory', icon: Brain, key: 'memory' },
  { id: 'settings', icon: Settings2, key: 'settings' },
];

export function AppShell({
  activeView,
  language,
  agentName: _agentName,
  onViewChange,
  onNewChat,
  onToggleLanguage,
  children,
  sessionTitle,
  conversationCount,
  onOpenSessionDrawer,
}: AppShellProps) {
  const t = copy(language);
  const currentNavItem = navItems.find((item) => item.id === activeView) || navItems[0];

  const currentDisplayTitle =
    activeView === 'chat'
      ? (sessionTitle || (language === 'ar' ? 'جلسة جديدة' : 'New Session'))
      : t.nav[currentNavItem.key];

  return (
    <div className="app-shell">
      {/* Top Navigation Bar - Ultra-thin, single unified glassmorphic header */}
      <header className="navbar glass-panel">
        {/* Start: Brand & Agent Status & Inline Title */}
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

          <div className="status-pill desktop-only" title={t.online}>
            <i />
            <span>{t.online}</span>
          </div>

          {/* Mobile Unified Context (One slim layer combining title and status) */}
          <div className="navbar-mobile-context mobile-only">
            <span className="navbar-context-sep">/</span>
            <span className="navbar-context-dot" title={t.online} />
            <span className="navbar-context-text" title={currentDisplayTitle}>
              {currentDisplayTitle}
            </span>
          </div>
        </div>

        {/* Center: Navigation Tabs for Desktop/Tablet (Floating capsule) */}
        <nav className="navbar-center desktop-only" aria-label="Main navigation">
          {navItems.map(({ id, icon: Icon, key }) => {
            const isActive = activeView === id;
            return (
              <button
                type="button"
                key={id}
                className={isActive ? 'nav-pill nav-pill--active' : 'nav-pill'}
                onClick={() => onViewChange(id)}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-nav-pill-highlight"
                    className="nav-pill-highlight"
                    transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon size={15} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span>{t.nav[key]}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* End: Quick Actions (Session Drawer + Language + New Chat) */}
        <div className="navbar-end">
          {/* Mobile Session/History Button (Unified into top bar) */}
          {activeView === 'chat' && (
            <button
              type="button"
              className="navbar-session-trigger mobile-only"
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
            <span className="desktop-only">{t.newChat}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="main-content">{children}</main>

      {/* Floating Bottom Nav for Mobile */}
      <BottomNav active={activeView} language={language} onChange={onViewChange} />
    </div>
  );
}

