import {
  Brain,
  CalendarCheck,
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
import type { Language, ViewId } from '../core/domain';
import { BrandMark } from './BrandMark';
import { BottomNav } from './BottomNav';
import { copy } from '../core/i18n';

interface AppShellProps {
  activeView: ViewId;
  language: Language;
  agentName: string;
  onViewChange: (view: ViewId) => void;
  onNewChat?: () => void;
  onToggleLanguage?: () => void;
  children: ReactNode;
}

const navItems: Array<{
  id: ViewId;
  icon: LucideIcon;
  key: keyof ReturnType<typeof copy>['nav'];
}> = [
  { id: 'chat', icon: MessageCircle, key: 'chat' },
  { id: 'tasks', icon: CalendarCheck, key: 'tasks' },
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
}: AppShellProps) {
  const t = copy(language);
  const currentNavItem = navItems.find((item) => item.id === activeView) || navItems[0];
  const CurrentIcon = currentNavItem.icon;

  return (
    <div className="app-shell">
      {/* Top Navigation Bar - Ultra-clean, organized, modern glassmorphic header */}
      <header className="navbar glass-panel">
        {/* Start: Brand & Agent Status */}
        <div className="navbar-start">
          <button
            type="button"
            className="navbar-brand"
            onClick={() => onViewChange('chat')}
            title="ADEM AI"
            aria-label="ADEM AI Home"
          >
            <BrandMark />
          </button>

          <div className="status-pill desktop-only" title={t.online}>
            <i />
            <span>{t.online}</span>
          </div>

          {/* Mobile Current View Context Pill */}
          <div className="mobile-view-pill mobile-only" aria-label={`Current view: ${t.nav[currentNavItem.key]}`}>
            <CurrentIcon size={13} className="text-emerald-400" />
            <span>{t.nav[currentNavItem.key]}</span>
          </div>
        </div>

        {/* Center: Navigation Tabs for Desktop/Tablet (Floating capsule) */}
        <nav className="navbar-center" aria-label="Main navigation">
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
                <Icon size={15} strokeWidth={isActive ? 2.4 : 1.8} />
                <span>{t.nav[key]}</span>
              </button>
            );
          })}
        </nav>

        {/* End: Quick Actions (Language & New Chat) */}
        <div className="navbar-end">
          {onToggleLanguage && (
            <button
              type="button"
              className="lang-toggle-btn"
              onClick={onToggleLanguage}
              title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
              aria-label="Toggle language"
            >
              <Globe size={14} className="text-emerald-400" />
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

