import {
  Brain,
  CalendarCheck,
  Globe,
  MessageCircle,
  Plus,
  Settings2,
  Sparkles,
  Film,
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
  { id: 'memory', icon: Brain, key: 'memory' },
  { id: 'workspace', icon: Sparkles, key: 'workspace' },
  { id: 'media', icon: Film, key: 'media' },
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

  return (
    <div className="app-shell">
      {/* Top Navigation Bar - Always visible, clean & organized */}
      <header className="navbar glass-panel">
        <div className="navbar-start">
          <button className="navbar-brand" onClick={() => onViewChange('chat')}>
            <BrandMark />
          </button>
          <span className="status-pill">
            <i /> {t.online}
          </span>
        </div>

        {/* Center Navigation Tabs for Desktop/Tablet */}
        <nav className="navbar-center" aria-label="Main navigation">
          {navItems.map(({ id, icon: Icon, key }) => {
            const isActive = activeView === id;
            return (
              <button
                key={id}
                className={isActive ? 'nav-pill nav-pill--active' : 'nav-pill'}
                onClick={() => onViewChange(id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={16} strokeWidth={isActive ? 2.3 : 1.8} />
                <span>{t.nav[key]}</span>
              </button>
            );
          })}
        </nav>

        {/* End Quick Actions */}
        <div className="navbar-end">
          <button
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
            <Plus size={16} />
            <span className="desktop-only">{t.newChat}</span>
          </button>

          {onToggleLanguage && (
            <button
              className="lang-toggle-btn"
              onClick={onToggleLanguage}
              title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
              aria-label="Toggle language"
            >
              <Globe size={15} />
              <span>{language === 'ar' ? 'English' : 'عربي'}</span>
            </button>
          )}

          <button
            className="icon-button mobile-only"
            onClick={() => onViewChange('settings')}
            aria-label={t.nav.settings}
          >
            <Settings2 size={18} />
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
