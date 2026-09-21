import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Film,
  Gamepad2,
  MessageCircle,
  Settings2,
  Sparkles,
  Award,
  GraduationCap,
  Grid,
  X,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import type { Language, ViewId } from '../core/domain';

interface NavItemDef {
  id: ViewId;
  icon: LucideIcon;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
}

const allNavItems: NavItemDef[] = [
  {
    id: 'chat',
    icon: MessageCircle,
    labelAr: 'المحادثة',
    labelEn: 'Chat',
    descAr: 'الوكيل التنفيذي الذاتي والبرمجة والأنظمة',
    descEn: 'Autonomous executive AI & system engineering',
  },
  {
    id: 'apps',
    icon: Gamepad2,
    labelAr: 'التطبيقات',
    labelEn: 'Apps & Games',
    descAr: 'استوديو الألعاب التفاعلية وتطبيقات الويب',
    descEn: 'Interactive canvas games & web tools studio',
  },
  {
    id: 'workspace',
    icon: Sparkles,
    labelAr: 'مساحة العمل',
    labelEn: 'Workspace',
    descAr: 'تكامل Google Workspace والسحاب',
    descEn: 'Google Workspace, Drive, Mail & Docs integration',
  },
  {
    id: 'media',
    icon: Film,
    labelAr: 'الاستوديو',
    labelEn: 'Media 8K',
    descAr: 'توليد الصور السينمائية 8K والإدراك البصري',
    descEn: '8K photorealistic visual generation & vision',
  },
  {
    id: 'iq',
    icon: Award,
    labelAr: 'اختبار الذكاء',
    labelEn: 'IQ Test',
    descAr: 'قياس دقيق غير مكرر بـ 100,000 احتمالية',
    descEn: 'Non-repeating high-precision cognitive assessment',
  },
  {
    id: 'settings',
    icon: Settings2,
    labelAr: 'الإعدادات',
    labelEn: 'Settings',
    descAr: 'تخصيص الثيمات واللغات ومفاتيح النظام',
    descEn: 'Themes, bilingual preferences & core config',
  },
];

// 4 Primary dock items
const PRIMARY_IDS: ViewId[] = ['chat', 'apps', 'workspace', 'media'];

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
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Support opening full drawer from top navbar or other triggers
  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('adam:open-nav-drawer', handleOpenEvent);
    return () => window.removeEventListener('adam:open-nav-drawer', handleOpenEvent);
  }, []);

  // Keyboard awareness to hide dock when typing on mobile
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setIsKeyboardOpen(true);
        document.body.classList.add('keyboard-open');
      }
    };
    const handleFocusOut = () => {
      setIsKeyboardOpen(false);
      document.body.classList.remove('keyboard-open');
    };
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      document.body.classList.remove('keyboard-open');
    };
  }, []);

  const handleSelect = (id: ViewId) => {
    onChange(id);
    setIsOpen(false);
  };

  const isMoreActive = !PRIMARY_IDS.includes(active);
  const activeDef = allNavItems.find((item) => item.id === active) || allNavItems[0];
  const ActiveSubIcon = activeDef.icon;

  return (
    <>
      {/* Floating Luxury Side Orb Button for Mobile Navigation (الزر الجانبي العائم الفاخر) */}
      <div
        className={`fixed z-40 md:hidden transition-all duration-300 select-none ${
          isKeyboardOpen ? 'translate-y-12 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
        style={{
          bottom:
            active === 'chat'
              ? 'calc(98px + env(safe-area-inset-bottom, 0px))'
              : 'calc(38px + env(safe-area-inset-bottom, 0px))',
          insetInlineEnd: '18px',
        }}
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.08 }}
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative flex items-center justify-center w-13 h-13 rounded-full bg-gradient-to-br from-[var(--surface-2)] via-[var(--surface)] to-[var(--surface-2)] border border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--accent)] shadow-[0_10px_35px_rgba(0,0,0,0.5),0_0_20px_var(--accent-glow)] backdrop-blur-2xl transition-all cursor-pointer group active:scale-90"
          aria-label={isAr ? 'زر التنقل الجانبي - منظومة ADEM' : 'Side Navigation Button'}
          title={isAr ? 'استعراض أدوات ومنظومة ADEM' : 'ADEM Autonomous Suite'}
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 rounded-full bg-[var(--accent)]/10 group-hover:bg-[var(--accent)]/20 blur-md transition-colors" />

          {/* Active View Icon */}
          <div className="relative z-10 flex items-center justify-center">
            <ActiveSubIcon size={22} strokeWidth={2.2} className="drop-shadow-[0_2px_8px_var(--accent-glow)]" />
          </div>

          {/* Glowing Status Indicator Dot */}
          <span className="absolute top-1 end-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[var(--surface)] shadow-[0_0_8px_#34d399] animate-pulse" />
        </motion.button>
      </div>

      {/* Comprehensive ADEM System & Applications Bottom Sheet Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-5 rounded-t-3xl bg-[var(--surface)] border-t border-[var(--border)] shadow-2xl backdrop-blur-3xl md:hidden max-w-xl mx-auto max-h-[85vh] flex flex-col"
              style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))' }}
              dir={isAr ? 'rtl' : 'ltr'}
            >
              {/* Drawer Handle */}
              <div className="w-12 h-1.5 rounded-full bg-[var(--border-strong)] mx-auto mb-3 opacity-60 flex-shrink-0" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)] animate-pulse" />
                  <div>
                    <h2 className="text-sm font-black text-[var(--text)] leading-tight">
                      {isAr ? 'منظومة وتطبيقات ADEM التنفيذية' : 'ADEM Autonomous Suite & Tools'}
                    </h2>
                    <span className="text-[10px] text-[var(--muted)] font-mono">
                      {isAr ? 'تحكم كامل وشامل في جميع القدرات' : 'Full visibility and adaptive control'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Complete 8-Tool Grid */}
              <div className="overflow-y-auto flex-1 pr-0.5 space-y-2 py-1">
                {allNavItems.map(({ id, icon: Icon, labelAr, labelEn, descAr, descEn }) => {
                  const isCurrent = active === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelect(id)}
                      className={`w-full p-3 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99] ${
                        isCurrent
                          ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)] shadow-sm'
                          : 'bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            isCurrent
                              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md shadow-[var(--accent-glow)]'
                              : 'bg-[var(--surface)] text-[var(--muted)] group-hover:text-[var(--accent)]'
                          }`}
                        >
                          <Icon size={20} strokeWidth={isCurrent ? 2.5 : 1.8} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold truncate">
                              {isAr ? labelAr : labelEn}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-[var(--accent)] text-[var(--accent-contrast)]">
                                {isAr ? 'النشط' : 'Active'}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[var(--muted)] truncate block mt-0.5">
                            {isAr ? descAr : descEn}
                          </span>
                        </div>
                      </div>

                      <ChevronRight
                        size={16}
                        className={`text-[var(--muted)] transition-transform flex-shrink-0 ${
                          isAr ? 'rotate-180' : ''
                        } ${isCurrent ? 'text-[var(--accent)]' : ''}`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Bottom Quick Info Signature */}
              <div className="pt-3 mt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted)] flex-shrink-0">
                <span>{isAr ? 'ADEM v2.5 Ultra • مهيأ لجميع الهواتف' : 'ADEM v2.5 Ultra • Adaptive mobile'}</span>
                <span className="font-mono text-[10px] text-[var(--accent)]">100% ONLINE</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
