import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  CalendarCheck,
  Film,
  Gamepad2,
  LayoutGrid,
  MessageCircle,
  Settings2,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { Language, ViewId } from '../core/domain';

interface NavItemDef {
  id: ViewId;
  icon: LucideIcon;
  labelAr: string;
  labelEn: string;
}

const mobileNavItems: NavItemDef[] = [
  { id: 'chat', icon: MessageCircle, labelAr: 'المحادثة', labelEn: 'Chat' },
  { id: 'apps', icon: Gamepad2, labelAr: 'الألعاب والتطبيقات', labelEn: 'Apps & Games' },
  { id: 'tasks', icon: CalendarCheck, labelAr: 'المهام', labelEn: 'Tasks' },
  { id: 'media', icon: Film, labelAr: 'الوسائط', labelEn: 'Media' },
  { id: 'settings', icon: Settings2, labelAr: 'الإعدادات', labelEn: 'Settings' },
];

export function BottomNav({
  active,
  language,
  onChange,
}: {
  active: ViewId;
  language: Language;
  onChange: (view: ViewId) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (id: ViewId) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* 1. Floating Side Navigation Button */}
      <div className="mobile-side-lock-container">
        <button
          type="button"
          className={`mobile-side-lock-btn ${isOpen ? 'mobile-side-lock-btn--active' : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          title={
            isOpen
              ? (language === 'ar' ? 'إغلاق القائمة' : 'Close Menu')
              : (language === 'ar' ? 'فتح القائمة' : 'Open Menu')
          }
          aria-label={isOpen ? 'Close Menu' : 'Open Menu'}
          aria-expanded={isOpen}
        >
          <div className="mobile-side-lock-icon-wrap">
            {isOpen ? (
              <X size={15} className="text-slate-200" />
            ) : (
              <LayoutGrid size={15} className="text-emerald-400" />
            )}
            <span className="mobile-side-lock-dot" />
          </div>
          <span className="mobile-side-lock-label">
            {isOpen ? (language === 'ar' ? 'إغلاق' : 'Close') : (language === 'ar' ? 'القائمة' : 'Menu')}
          </span>
        </button>
      </div>

      {/* 2. Backdrop Overlay when Navigation is Open */}
      {isOpen && (
        <div
          className="mobile-nav-backdrop animate-fadeIn"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 3. Pop-out Floating Navigation Dock */}
      <div
        className={`mobile-nav-popout ${isOpen ? 'mobile-nav-popout--open' : 'mobile-nav-popout--closed'}`}
        aria-hidden={!isOpen}
        {...(!isOpen ? { inert: true } : {})}
      >
        <div className="mobile-nav-popout-inner glass-panel">
          {/* Top Bar inside the Popout */}
          <div className="mobile-nav-popout-header">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-[12px] font-bold text-slate-300">
                {language === 'ar' ? 'شريط التنقل السريع' : 'Quick Navigation'}
              </span>
            </div>

            <button
              type="button"
              className="mobile-nav-lock-close-btn"
              onClick={() => setIsOpen(false)}
              title={language === 'ar' ? 'إغلاق' : 'Close'}
              tabIndex={isOpen ? 0 : -1}
            >
              <X size={13} className="text-slate-400" />
              <span>{language === 'ar' ? 'إغلاق' : 'Close'}</span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="mobile-nav-popout-grid" aria-label="Mobile Navigation Destinations">
            {mobileNavItems.map(({ id, icon: Icon, labelAr, labelEn }) => {
              const isActive = active === id;
              const label = language === 'ar' ? labelAr : labelEn;
              return (
                <button
                  key={id}
                  type="button"
                  className={`mobile-nav-popout-item ${isActive ? 'mobile-nav-popout-item--active' : ''}`}
                  onClick={() => handleSelect(id)}
                  aria-current={isActive ? 'page' : undefined}
                  tabIndex={isOpen ? 0 : -1}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-active-pill"
                      className="mobile-nav-popout-active-bg"
                      transition={{ type: 'spring', stiffness: 440, damping: 34 }}
                    />
                  )}
                  <div className="mobile-nav-popout-icon-box relative z-10">
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                    {isActive && <span className="mobile-nav-popout-glow-dot" />}
                  </div>
                  <span className="mobile-nav-popout-item-label relative z-10">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
