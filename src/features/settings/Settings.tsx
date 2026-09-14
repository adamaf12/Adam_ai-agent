import { useState } from 'react';
import {
  Globe2,
  RotateCcw,
  ShieldCheck,
  Palette,
  Sparkles,
  Sliders,
  Check,
  Cpu,
  HardDrive,
  Trash2,
  Lock,
} from 'lucide-react';
import type { AppPreferences, Language } from '../../core/domain';
import { THEME_CATALOG } from '../../core/themeCatalog';

const c = {
  ar: {
    title: 'إعدادات النظام والمظهر',
    sub: 'تخصيص كامل للواجهة، التنسيقات اللونية، إدارة الذاكرة المحلية واللغة.',
    appearance: 'السمات والمظهر البصري',
    appearanceSub: 'اختر السمة اللونية المفضلة لديك من تشكيلة السمات المصممة للوضوح والراحة.',
    language: 'لغة الواجهة والتحدث',
    languageSub: 'اختر اللغة الأساسية للتطبيق والمحادثة مع الوكيل الذكي.',
    system: 'أداء النظام والذاكرة المؤقتة',
    systemSub: 'التحكم في التخزين المحلي، جلسات المحادثة وبيانات الأداء.',
    reset: 'إعادة تعيين التطبيق ومسح التخزين المؤقت',
    resetConfirm: 'هل أنت متأكد من رغبتك في إعادة تعيين كافة البيانات المحلية والبدء من جديد؟',
    privacy: 'الخصوصية والأمان المشدد',
    privacySub: 'كافة مفاتيحك وبياناتك ومحادثاتك مشفرة ومحفوظة على جهازك بشكل آمن وخاص.',
    arabic: 'العربية (Arabic)',
    english: 'English (الإنجليزية)',
    activeBadge: 'مفعل حالياً',
    storageUsed: 'التخزين المحلي المستخدم',
    themeCount: '23 ثيم سينمائي وفاخر',
  },
  en: {
    title: 'Settings & Appearance',
    sub: 'Full customization for UI themes, color palettes, local cache and language.',
    appearance: 'Visual Themes & Palette',
    appearanceSub: 'Choose your preferred visual theme from curated high-contrast and glass styles.',
    language: 'Interface & Voice Language',
    languageSub: 'Select the primary language for system interactions and agent responses.',
    system: 'System Performance & Storage',
    systemSub: 'Manage local storage caches, conversation sessions, and runtime performance.',
    reset: 'Reset All Data & Clear Cache',
    resetConfirm: 'Are you sure you want to reset all local storage and start fresh?',
    privacy: 'Privacy & Security Guard',
    privacySub: 'All your keys, memories, and chats are encrypted and stored locally on-device.',
    arabic: 'العربية (Arabic)',
    english: 'English',
    activeBadge: 'Currently Active',
    storageUsed: 'Local Storage Used',
    themeCount: '23 Cinematic & Luxury Themes',
  },
};

const themeClass = (tone: string) => `theme-preview theme-preview--${tone}`;

export function Settings({
  language,
  preferences,
  onChange,
}: {
  language: Language;
  preferences: AppPreferences;
  onChange: (p: Partial<AppPreferences>) => void;
}) {
  const t = c[language];
  const [resetSuccess, setResetSuccess] = useState(false);

  // Calculate rough storage used
  const storageCount = typeof localStorage !== 'undefined' ? localStorage.length : 0;

  const handleReset = () => {
    if (window.confirm(t.resetConfirm)) {
      localStorage.clear();
      setResetSuccess(true);
      setTimeout(() => {
        location.reload();
      }, 800);
    }
  };

  return (
    <section className="feature-page max-w-5xl mx-auto pb-28 animate-fadeIn" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="feature-heading mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <span className="eyebrow flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] tracking-wider uppercase">
            <Sliders size={13} />
            <span>ADEM OS / PREFERENCES</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">{t.title}</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.sub}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
            <Sparkles size={14} className="text-emerald-400" />
            <span>{t.themeCount}</span>
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Appearance & Themes Section */}
        <div className="settings-card settings-card--glass p-5 sm:p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shadow-2xl">
          <div className="flex items-start justify-between gap-3 mb-6 pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--border-strong)]">
                <Palette size={22} />
              </div>
              <div>
                <strong className="text-base text-[var(--text)] font-bold block">{t.appearance}</strong>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t.appearanceSub}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {THEME_CATALOG.map((theme) => {
              const isSelected = preferences.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  className={`group relative flex items-center gap-3.5 p-3 rounded-2xl border text-start transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[var(--accent-subtle)] border-[var(--accent)] shadow-[0_0_20px_var(--accent-glow)] scale-[1.01]'
                      : 'bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border-[var(--border)]'
                  }`}
                  onClick={() => onChange({ theme: theme.id })}
                  aria-pressed={isSelected}
                >
                  <span className={`${themeClass(theme.tone)} flex-shrink-0`} aria-hidden="true">
                    <i />
                    <i />
                  </span>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-xs font-bold text-[var(--text)] truncate">
                        {theme.label[language]}
                      </strong>
                      {theme.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold border border-[var(--border-strong)]">
                          {theme.badge[language]}
                        </span>
                      )}
                    </div>
                    <small className="text-[10px] text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                      {theme.description[language]}
                    </small>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-slate-950 flex items-center justify-center flex-shrink-0 shadow-md animate-scaleIn">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Selection */}
        <div className="settings-card p-5 sm:p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/30">
              <Globe2 size={22} />
            </div>
            <div>
              <strong className="text-base text-slate-100 font-bold block">{t.language}</strong>
              <p className="text-xs text-slate-400 mt-0.5">{t.languageSub}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              className={`flex items-center justify-between p-4 rounded-2xl border font-bold text-xs transition-all cursor-pointer ${
                language === 'ar'
                  ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => onChange({ language: 'ar' })}
            >
              <span>{t.arabic}</span>
              {language === 'ar' && <Check size={16} className="text-emerald-400" />}
            </button>

            <button
              type="button"
              className={`flex items-center justify-between p-4 rounded-2xl border font-bold text-xs transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => onChange({ language: 'en' })}
            >
              <span>{t.english}</span>
              {language === 'en' && <Check size={16} className="text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* System & Storage Management */}
        <div className="settings-card p-5 sm:p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <HardDrive size={22} />
              </div>
              <div>
                <strong className="text-base text-slate-100 font-bold block">{t.system}</strong>
                <p className="text-xs text-slate-400 mt-0.5">{t.systemSub}</p>
              </div>
            </div>

            <span className="text-xs font-mono text-slate-400 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800">
              {t.storageUsed}: {storageCount} keys
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-emerald-400 flex-shrink-0" />
              <div>
                <strong className="text-xs text-slate-200 block">{t.privacy}</strong>
                <p className="text-[11px] text-slate-400 mt-0.5">{t.privacySub}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-300 text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Trash2 size={15} />
              <span>{resetSuccess ? '✓ تم المسح' : t.reset}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
