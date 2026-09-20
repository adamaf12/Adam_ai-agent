import {
  CalendarCheck,
  Clock,
  Gamepad2,
  Globe,
  MessageCircle,
  Plus,
  Radio,
  Settings2,
  Sparkles,
  Film,
  Award,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
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
  shortcut: string;
}> = [
  { id: 'chat', icon: MessageCircle, key: 'chat', shortcut: '1' },
  { id: 'tasks', icon: CalendarCheck, key: 'tasks', shortcut: '2' },
  { id: 'apps', icon: Gamepad2, key: 'apps', shortcut: '3' },
  { id: 'workspace', icon: Sparkles, key: 'workspace', shortcut: '4' },
  { id: 'media', icon: Film, key: 'media', shortcut: '5' },
  { id: 'iq', icon: Award, key: 'iq', shortcut: '6' },
  { id: 'settings', icon: Settings2, key: 'settings', shortcut: '7' },
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
  const navContainerRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = navContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = navContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  // Keyboard shortcut listener: Alt+1..9 or Cmd/Ctrl+Alt+1..9 for fast desktop navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input/textarea/contenteditable
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
        if (num >= 1 && num <= navItems.length) {
          e.preventDefault();
          onViewChange(navItems[num - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onViewChange]);

  const scrollNav = (direction: 'left' | 'right') => {
    if (!navContainerRef.current) return;
    const amount = direction === 'left' ? -180 : 180;
    navContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

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

          {/* Mobile Unified Context (One slim layer combining title and status, click opens all tools drawer) */}
          <button
            type="button"
            className="navbar-mobile-context mobile-only cursor-pointer"
            onClick={() => window.dispatchEvent(new CustomEvent('adam:open-nav-drawer'))}
            title={language === 'ar' ? 'استعراض جميع أدوات وتطبيقات ADEM' : 'Browse all ADEM tools'}
            aria-label="Open ADEM Tools Drawer"
          >
            <span className="navbar-context-sep">/</span>
            <span className="navbar-context-dot" title={t.online} />
            <span className="navbar-context-text" title={currentDisplayTitle}>
              {currentDisplayTitle}
            </span>
          </button>
        </div>

        {/* Center: Navigation Tabs for Desktop/Tablet (Floating capsule with scroll affordance) */}
        <div className="navbar-center-wrapper desktop-only">
          {canScrollLeft && (
            <button
              type="button"
              className="navbar-scroll-btn navbar-scroll-btn--left"
              onClick={() => scrollNav('left')}
              aria-label="Scroll left"
            >
              <ChevronLeft size={14} />
            </button>
          )}

          <nav
            ref={navContainerRef}
            className="navbar-center"
            aria-label="Main navigation"
            onWheel={(e) => {
              if (navContainerRef.current && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
                navContainerRef.current.scrollLeft += e.deltaY;
              }
            }}
          >
            {navItems.map(({ id, icon: Icon, key, shortcut }) => {
              const isActive = activeView === id;
              return (
                <button
                  type="button"
                  key={id}
                  className={isActive ? 'nav-pill nav-pill--active' : 'nav-pill'}
                  onClick={() => onViewChange(id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={`${t.nav[key]} (Alt+${shortcut})`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-nav-pill-highlight"
                      className="nav-pill-highlight"
                      transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon size={14} strokeWidth={isActive ? 2.4 : 1.8} />
                    <span className="nav-pill-label">{t.nav[key]}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          {canScrollRight && (
            <button
              type="button"
              className="navbar-scroll-btn navbar-scroll-btn--right"
              onClick={() => scrollNav('right')}
              aria-label="Scroll right"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

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

