import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  CalendarCheck,
  Film,
  Gamepad2,
  Lock,
  MessageCircle,
  Settings2,
  Sparkles,
  Unlock,
  X,
  type LucideIcon,
  ChevronUp,
} from 'lucide-react';
import type { Language, ViewId } from '../core/domain';

interface NavItemDef {
  id: ViewId;
  icon: LucideIcon;
  labelAr: string;
  labelEn: string;
}

const navItemsList: NavItemDef[] = [
  { id: 'chat', icon: MessageCircle, labelAr: 'المحادثة', labelEn: 'Chat' },
  { id: 'tasks', icon: CalendarCheck, labelAr: 'المهام', labelEn: 'Tasks' },
  { id: 'workspace', icon: Sparkles, labelAr: 'مساحة العمل', labelEn: 'Workspace' },
  { id: 'apps', icon: Gamepad2, labelAr: 'التطبيقات والألعاب', labelEn: 'Apps & Games' },
  { id: 'media', icon: Film, labelAr: 'الوسائط', labelEn: 'Media' },
  { id: 'memory', icon: Brain, labelAr: 'الذاكرة', labelEn: 'Memory' },
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

  // Close on Escape key
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

  const currentNav = navItemsList.find((i) => i.id === active) || navItemsList[0];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. ELEVATED & ENLARGED CORNER LOCK TRIGGER */}
      {/* ========================================================================= */}
      <div className="mini-lock-corner-wrapper fixed bottom-28 inset-inline-start-3.5 z-40 select-none md:hidden pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group flex items-center gap-2 h-9 px-3.5 rounded-full border shadow-lg backdrop-blur-2xl transition-all duration-200 cursor-pointer active:scale-95 ${
            isOpen
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.4)]'
              : 'bg-slate-950/90 border-slate-700/80 text-slate-200 hover:text-emerald-300 hover:border-emerald-500/60 shadow-black/50 hover:shadow-[0_0_14px_rgba(16,185,129,0.25)]'
          }`}
          title={isAr ? 'فتح قائمة التنقل السريع' : 'Open Navigation Dock'}
          aria-label={isAr ? 'شريط التنقل' : 'Navigation Dock'}
        >
          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <Unlock size={15} className="text-emerald-400" />
            ) : (
              <Lock size={15} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          </div>

          <span className="text-xs font-bold tracking-tight text-white max-w-[85px] truncate">
            {isAr ? currentNav.labelAr : currentNav.labelEn}
          </span>

          <ChevronUp
            size={13}
            className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : 'group-hover:text-emerald-400'}`}
          />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. BACKDROP OVERLAY */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. PREMIUM SLIDE-UP NAVIGATION DOCK */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-emerald-500/30 rounded-t-[28px] p-4 shadow-2xl backdrop-blur-2xl md:hidden max-w-lg mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span className="text-xs font-bold text-white tracking-tight">
                  {isAr ? 'لوحة تحكم وتطبيقات ADEM' : 'ADEM Control & Apps'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X size={16} />
              </button>
            </div>

            {/* Clean Grid of destinations */}
            <div className="grid grid-cols-4 gap-2">
              {navItemsList.map(({ id, icon: Icon, labelAr, labelEn }) => {
                const isActive = active === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelect(id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all cursor-pointer border active:scale-95 ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-bold'
                        : 'bg-slate-900/60 text-slate-300 hover:text-white border-slate-800/90 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <Icon size={19} className="mb-1" strokeWidth={isActive ? 2.4 : 1.8} />
                    <span className="text-[10px] font-medium truncate max-w-full">
                      {isAr ? labelAr : labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
