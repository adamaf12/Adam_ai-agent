import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  CalendarCheck,
  ChevronUp,
  Film,
  Gamepad2,
  MessageCircle,
  Settings2,
  ShieldCheck,
  Sparkles,
  Award,
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

const allNavItems: NavItemDef[] = [
  { id: 'chat', icon: MessageCircle, labelAr: 'المحادثة', labelEn: 'Chat' },
  { id: 'tasks', icon: CalendarCheck, labelAr: 'المهام', labelEn: 'Tasks' },
  { id: 'apps', icon: Gamepad2, labelAr: 'التطبيقات', labelEn: 'Apps' },
  { id: 'workspace', icon: Sparkles, labelAr: 'مساحة العمل', labelEn: 'Workspace' },
  { id: 'media', icon: Film, labelAr: 'الاستوديو', labelEn: 'Media' },
  { id: 'memory', icon: Brain, labelAr: 'الذاكرة', labelEn: 'Memory' },
  { id: 'iq', icon: Award, labelAr: 'اختبار الذكاء', labelEn: 'IQ Test' },
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
  const isAr = language === 'ar';
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeItem = allNavItems.find((item) => item.id === active) || allNavItems[0];
  const ActiveIcon = activeItem.icon;

  const handleSelect = (id: ViewId) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Corner Trigger Pill ("القفل الجانبي / زر التنقل السريع") */}
      <aside aria-label="Mobile Navigation" className="fixed bottom-[98px] end-4 z-40 md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--surface)]/95 hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--accent)] shadow-2xl backdrop-blur-md text-[var(--text)] text-[13px] font-bold transition-all active:scale-95 cursor-pointer select-none"
          aria-label={isAr ? 'القفل الجانبي للتنقل' : 'Navigation Menu'}
        >
          <ChevronUp
            size={15}
            className={`text-[var(--accent)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
          <ActiveIcon size={16} className="text-[var(--accent)]" />
          <span>{isAr ? activeItem.labelAr : activeItem.labelEn}</span>
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
        </button>
      </aside>

      {/* Navigation Sheet Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-0 inset-x-0 z-50 p-5 rounded-t-3xl bg-[var(--surface)] border-t border-[var(--border)] shadow-2xl backdrop-blur-2xl md:hidden max-w-lg mx-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                  <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                    {isAr ? 'منظومة وتطبيقات ADEM' : 'ADEM System & Tools'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {allNavItems.map(({ id, icon: Icon, labelAr, labelEn }) => {
                  const isActive = active === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelect(id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)] font-bold shadow-sm'
                          : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <Icon size={20} className="mb-1.5" strokeWidth={isActive ? 2.4 : 1.8} />
                      <span className="text-xs font-semibold">{isAr ? labelAr : labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
