import { useState, useMemo } from 'react';
import {
  Globe2,
  Palette,
  Sparkles,
  Check,
  Search,
  Dice5,
  X,
  Film,
  Code,
  Crown,
  Leaf,
  Layout,
} from 'lucide-react';
import type { AppPreferences, Language } from '../../core/domain';
import { THEME_CATALOG, THEME_CATEGORIES, type ThemeCategory } from '../../core/themeCatalog';

const c = {
  ar: {
    title: 'إعدادات النظام والمظهر',
    sub: 'تخصيص كامل للواجهة، التنسيقات اللونية الفاخرة، ولغة التفاعل.',
    appearance: 'السمات والمظهر البصري',
    appearanceSub: 'اختر السمة اللونية المفضلة لديك من تشكيلة السمات المصممة للوضوح والراحة البصرية.',
    language: 'لغة الواجهة والتحدث',
    languageSub: 'اختر اللغة الأساسية للتطبيق والمحادثة مع الوكيل الذكي ADEM.',
    arabic: 'العربية (Arabic)',
    english: 'English (الإنجليزية)',
    themeCount: '38 ثيماً مصنفاً',
    searchPlaceholder: 'ابحث عن اسم الثيم أو المسلسل أو الطابع...',
    all: 'الكل',
    randomTheme: '🎲 ثيم عشوائي',
    noResults: 'لا توجد ثيمات مطابقة لبحثك',
    showingCount: (count: number, total: number) => `عرض ${count} من أصل ${total} ثيم`,
  },
  en: {
    title: 'Settings & Appearance',
    sub: 'Full customization for UI themes, luxury color palettes, and language.',
    appearance: 'Visual Themes & Palette',
    appearanceSub: 'Choose your preferred visual theme from curated high-contrast and glass styles.',
    language: 'Interface & Chat Language',
    languageSub: 'Select the primary language for system interactions and agent responses.',
    arabic: 'العربية (Arabic)',
    english: 'English (English)',
    themeCount: '38 Categorized Themes',
    searchPlaceholder: 'Search themes by title, series, or palette...',
    all: 'All',
    randomTheme: '🎲 Random Theme',
    noResults: 'No themes match your search query',
    showingCount: (count: number, total: number) => `Showing ${count} of ${total} themes`,
  },
};

const themeClass = (tone: string) => `theme-preview theme-preview--${tone}`;

const CATEGORY_ICONS = {
  all: Sparkles,
  cinema: Film,
  cyber: Code,
  luxury: Crown,
  nature: Leaf,
  minimal: Layout,
};

export function Settings({
  language,
  preferences,
  onChange,
}: {
  language: Language;
  preferences: AppPreferences;
  onChange: (p: Partial<AppPreferences>) => void;
  onOpenApps?: () => void;
}) {
  const t = c[language];
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThemes = useMemo(() => {
    return THEME_CATALOG.filter((theme) => {
      const matchesCategory =
        selectedCategory === 'all' || theme.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const labelAr = theme.label.ar.toLowerCase();
      const labelEn = theme.label.en.toLowerCase();
      const descAr = theme.description.ar.toLowerCase();
      const descEn = theme.description.en.toLowerCase();
      const badgeAr = theme.badge?.ar.toLowerCase() || '';
      const badgeEn = theme.badge?.en.toLowerCase() || '';

      return (
        labelAr.includes(q) ||
        labelEn.includes(q) ||
        descAr.includes(q) ||
        descEn.includes(q) ||
        badgeAr.includes(q) ||
        badgeEn.includes(q) ||
        theme.id.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  const handleRandomTheme = () => {
    const list = filteredThemes.length > 0 ? filteredThemes : THEME_CATALOG;
    const randomIndex = Math.floor(Math.random() * list.length);
    const chosen = list[randomIndex];
    onChange({ theme: chosen.id });
  };

  return (
    <section className="feature-page max-w-5xl mx-auto pb-28 animate-fadeIn pt-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="space-y-6">
        {/* Appearance & Themes Section */}
        <div className="settings-card settings-card--glass p-5 sm:p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--border-strong)]">
                <Palette size={22} />
              </div>
              <div>
                <strong className="text-base text-[var(--text)] font-bold block">{t.appearance}</strong>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t.appearanceSub}</p>
              </div>
            </div>

            {/* Random Theme Trigger */}
            <button
              type="button"
              onClick={handleRandomTheme}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Dice5 size={15} className="text-[var(--accent)]" />
              <span>{t.randomTheme}</span>
            </button>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="space-y-4 mb-6">
            {/* Search Input Bar */}
            <div className="relative">
              <Search
                size={16}
                className={`absolute top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none ${
                  language === 'ar' ? 'right-3.5' : 'left-3.5'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`w-full py-2.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all ${
                  language === 'ar' ? 'pr-10 pl-10' : 'pl-10 pr-10'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={`absolute top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--text)] transition-colors ${
                    language === 'ar' ? 'left-3' : 'right-3'
                  }`}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {THEME_CATEGORIES.map((cat) => {
                const isCatActive = selectedCategory === cat.id;
                const IconComponent = CATEGORY_ICONS[cat.id];
                const catThemesCount =
                  cat.id === 'all'
                    ? THEME_CATALOG.length
                    : THEME_CATALOG.filter((item) => item.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                      isCatActive
                        ? 'bg-[var(--accent)] text-slate-950 border-[var(--accent)] shadow-md scale-105'
                        : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <IconComponent size={13} />
                    <span>{cat.label[language]}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isCatActive
                          ? 'bg-black/20 text-slate-950'
                          : 'bg-[var(--surface-hover)] text-[var(--muted)]'
                      }`}
                    >
                      {catThemesCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Showing Count Status */}
            <div className="flex items-center justify-between text-[11px] text-[var(--muted)] px-1">
              <span>{t.showingCount(filteredThemes.length, THEME_CATALOG.length)}</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[var(--accent)] hover:underline font-medium"
                >
                  {language === 'ar' ? 'مسح التصفية' : 'Clear filter'}
                </button>
              )}
            </div>
          </div>

          {/* Themes Grid */}
          {filteredThemes.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]">
              <Search size={32} className="mx-auto text-[var(--muted)] mb-2 opacity-50" />
              <p className="text-xs text-[var(--muted)] font-medium">{t.noResults}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[580px] overflow-y-auto p-1 pr-2 scrollbar-thin">
              {filteredThemes.map((theme) => {
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
                      <small className="text-[10px] text-[var(--muted)] mt-0.5 line-clamp-2 leading-relaxed">
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
          )}
        </div>

        {/* Language Selection */}
        <div className="settings-card p-5 sm:p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--border-strong)]">
              <Globe2 size={22} />
            </div>
            <div>
              <strong className="text-base text-[var(--text)] font-bold block">{t.language}</strong>
              <p className="text-xs text-[var(--muted)] mt-0.5">{t.languageSub}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              className={`flex items-center justify-between p-4 rounded-2xl border font-bold text-xs transition-all cursor-pointer ${
                language === 'ar'
                  ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--text)] shadow-md'
                  : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }`}
              onClick={() => onChange({ language: 'ar' })}
            >
              <span>{t.arabic}</span>
              {language === 'ar' && <Check size={16} className="text-[var(--accent)]" />}
            </button>

            <button
              type="button"
              className={`flex items-center justify-between p-4 rounded-2xl border font-bold text-xs transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--text)] shadow-md'
                  : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }`}
              onClick={() => onChange({ language: 'en' })}
            >
              <span>{t.english}</span>
              {language === 'en' && <Check size={16} className="text-[var(--accent)]" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
