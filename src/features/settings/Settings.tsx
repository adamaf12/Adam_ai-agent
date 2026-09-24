import { useState, useMemo, useEffect } from 'react';
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
  Gauge,
  Zap,
  Activity,
  Play,
  Clock,
  Cpu,
  Server,
  Layers,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import type { AppPreferences, Language } from '../../core/domain';
import { THEME_CATALOG, THEME_CATEGORIES, type ThemeCategory } from '../../core/themeCatalog';
import { formatAdemModelName } from '../../core/models/modelSwarm';
import { getSpeedTestHistory, type SpeedTestResultRecord } from '../diagnostics/speedTestClient';

export interface AdemGModelOption {
  id: string;
  name: string;
  descAr: string;
  descEn: string;
  badgeAr: string;
  badgeEn: string;
  speed: string;
  tier: 'flagship' | 'lite' | 'balanced' | 'pro';
}

export const ADEM_G_MODELS: AdemGModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'ADEM-G 3.8 Flash',
    descAr: 'النسخة القياسية الأحدث فائقة السرعة والاستدلال البرمجي واللغوي (موصى بها)',
    descEn: 'Latest flagship high-throughput model with state-of-the-art coding and reasoning (Recommended)',
    badgeAr: 'الأسرع والافتراضي',
    badgeEn: 'Default & Fastest',
    speed: '~120-160 T/s',
    tier: 'flagship',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'ADEM-G 3.1 Flash Lite',
    descAr: 'نسخة فورية خفيفة مصممة لتقليل زمن الاستجابة الأول إلى أدنى حد ممكن',
    descEn: 'Ultra-lightweight engine tuned for sub-second responses and low latency',
    badgeAr: 'استجابة فائقة',
    badgeEn: 'Ultra Low Latency',
    speed: '~140-180 T/s',
    tier: 'lite',
  },
  {
    id: 'gemini-flash-latest',
    name: 'ADEM-G Flash Latest',
    descAr: 'أحدث بناء تجريبي مستمر لمعالجة الأكواد والوسائط المتعددة',
    descEn: 'Latest dynamic build with real-time code and multimodal streaming',
    badgeAr: 'إصدار حديث',
    badgeEn: 'Dynamic Build',
    speed: '~115-150 T/s',
    tier: 'balanced',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'ADEM-G 2.5 Flash',
    descAr: 'نسخة متزنة ومستقرة للمهام الهندسية وسير العمل المستمر',
    descEn: 'High stability workhorse for sustained agentic workflows',
    badgeAr: 'استقرار هندسي',
    badgeEn: 'High Stability',
    speed: '~95-125 T/s',
    tier: 'balanced',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'ADEM-G 2.5 Pro',
    descAr: 'نسخة المنطق التحليلي والبرمجي المكثف للمشاريع المعقدة وتدقيق الثغرات',
    descEn: 'Deep analytical reasoning engine for complex architectures and security audits',
    badgeAr: 'منطق مكثف',
    badgeEn: 'Deep Reasoning',
    speed: '~70-95 T/s',
    tier: 'pro',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'ADEM-G 3.1 Pro Preview',
    descAr: 'نسخة التفكير العميق المتقدم للمشاريع الضخمة متعددة الملفات',
    descEn: 'Advanced frontier reasoning and deep architectural synthesis',
    badgeAr: 'منطق متقدم',
    badgeEn: 'Frontier Pro',
    speed: '~65-90 T/s',
    tier: 'pro',
  },
];

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
  const [recentSpeedRuns, setRecentSpeedRuns] = useState<SpeedTestResultRecord[]>([]);

  useEffect(() => {
    setRecentSpeedRuns(getSpeedTestHistory());
  }, []);

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

            {/* QuickLiquid Engine Status & Random Theme Trigger */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--border-strong)] shadow-sm">
                <Sparkles size={13} className="animate-pulse" />
                <span>QuickLiquid v2 (amarnath3003)</span>
              </div>
              <button
                type="button"
                onClick={handleRandomTheme}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Dice5 size={15} className="text-[var(--accent)]" />
                <span>{t.randomTheme}</span>
              </button>
            </div>
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

        {/* App Programming & ADEM-G AI Engine Settings */}
        <div className="settings-card p-5 sm:p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <Cpu size={22} className="text-cyan-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-base text-[var(--text)] font-bold">
                    {language === 'ar' ? 'إعدادات برمجة التطبيق والمحرك الذكي' : 'Application Programming & Engine Settings'}
                  </strong>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    ADEM-G
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {language === 'ar'
                    ? 'المزود الأساسي هو ADEM-G مع دعم كامل لكافة إصدارات ونسخ الذكاء الاصطناعي الفائقة.'
                    : 'Primary provider configured to ADEM-G with full support for ultra-fast generation tiers.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-2 text-xs">
                <Server size={13} className="text-cyan-400" />
                <span className="text-[var(--muted)]">{language === 'ar' ? 'المزود:' : 'Provider:'}</span>
                <span className="font-bold text-cyan-300">ADEM-G</span>
              </div>
            </div>
          </div>

          {/* Provider Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-[var(--surface-2)] to-indigo-950/20 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-black text-sm">
                AG
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--text)]">ADEM-G Sovereign AI Engine</span>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck size={11} />
                    {language === 'ar' ? 'مزود نشط معتمد' : 'Active & Verified'}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--muted)]">
                  {language === 'ar'
                    ? 'محرك المعالجة المباشر لنظام ADEM (تم استبدال مزود Gemini إلى ADEM-G)'
                    : 'Direct processing engine for ADEM (Gemini provider rebranded to ADEM-G)'}
                </span>
              </div>
            </div>

            <div className="text-xs font-mono text-cyan-300 bg-black/30 px-3 py-1.5 rounded-lg border border-cyan-500/20 self-start sm:self-auto">
              provider: &quot;ADEM-G&quot;
            </div>
          </div>

          {/* Model Versions Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[var(--text)] flex items-center gap-2">
                <Layers size={14} className="text-cyan-400" />
                {language === 'ar' ? 'اختر نسخة نموذج ADEM-G النشطة' : 'Select Active ADEM-G Model Version'}
              </span>
              <span className="text-[11px] text-[var(--muted)]">
                {language === 'ar' ? '6 نسخ متاحة' : '6 versions available'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ADEM_G_MODELS.map((m) => {
                const isSelected = (preferences.activeModelId || 'gemini-3.8-flash') === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onChange({ activeModelId: m.id })}
                    className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/60 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/40'
                        : 'bg-[var(--surface-2)] border-[var(--border)] hover:border-cyan-500/30 hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <Radio size={13} className={isSelected ? 'text-cyan-400 animate-pulse' : 'text-[var(--muted)]'} />
                        <span className="font-mono font-bold text-xs text-[var(--text)]">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                          {m.speed}
                        </span>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-cyan-500 text-black">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                      {language === 'ar' ? m.descAr : m.descEn}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]">
                        {language === 'ar' ? m.badgeAr : m.badgeEn}
                      </span>
                      <span className="font-mono text-[var(--muted)] opacity-60">id: {m.id}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* LLM Speed & Performance Diagnostics Card */}
        <div className="settings-card p-5 sm:p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <Gauge size={22} className="animate-pulse" />
              </div>
              <div>
                <strong className="text-base text-[var(--text)] font-bold block">
                  {language === 'ar' ? 'فحص الأداء ومعدل توليد الرموز (ADEM-G Speed)' : 'ADEM-G Speed & Generation Diagnostics'}
                </strong>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {language === 'ar'
                    ? 'اختبار حقيقي لقياس زمن الاستجابة الأول (TTFT) ومعدل الرموز في الثانية (Tokens/Sec).'
                    : 'Real-time benchmark measuring Time-to-First-Token and sustained streaming tokens-per-second.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('adam:open-speed-test'));
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-md hover:opacity-95 transition cursor-pointer active:scale-95"
            >
              <Play size={13} fill="currentColor" />
              <span>{language === 'ar' ? 'إطلاق فحص السرعة' : 'Run Speed Test'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted)] block">{language === 'ar' ? 'المزود والنموذج النشط' : 'Active Engine & Model'}</span>
              <span className="text-xs font-mono font-bold text-cyan-300 mt-1 block">
                {formatAdemModelName(preferences.activeModelId || 'gemini-3.8-flash')}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted)] block">{language === 'ar' ? 'آخر سرعة مقاسة' : 'Latest Speed'}</span>
              <span className="text-xs font-mono font-bold text-emerald-400 mt-1 block">
                {recentSpeedRuns.length > 0 ? `${recentSpeedRuns[0].averageTps} T/s` : (language === 'ar' ? 'جاهز للاختبار' : 'Ready to test')}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted)] block">{language === 'ar' ? 'زمن الاستجابة (TTFT)' : 'Latency (TTFT)'}</span>
              <span className="text-xs font-mono font-bold text-amber-300 mt-1 block">
                {recentSpeedRuns.length > 0 ? `${recentSpeedRuns[0].ttftMs}ms` : '< 200ms'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted)] block">{language === 'ar' ? 'المزود المعتمد' : 'Verified Provider'}</span>
              <span className="text-xs font-mono font-bold text-cyan-300 mt-1 block">ADEM-G</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
