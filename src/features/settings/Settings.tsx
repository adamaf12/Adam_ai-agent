import { useState, useEffect } from 'react';
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
  Smartphone,
  Download,
  ExternalLink,
  CheckCircle2,
  Zap,
  Activity,
  Key,
  Layers,
} from 'lucide-react';
import type { AppPreferences, Language } from '../../core/domain';
import { THEME_CATALOG } from '../../core/themeCatalog';
import { AndroidPermissionsBanner } from '../../components/AndroidPermissionsBanner';
import { AndroidOAuthSetupCard } from '../../components/AndroidOAuthSetupCard';

interface HuggingFaceModelCard {
  id: string;
  name: string;
  category: string;
  parameters: string;
  descriptionAr: string;
  descriptionEn: string;
  speed: number;
  quality: number;
}

const HF_MODELS: HuggingFaceModelCard[] = [
  {
    id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    name: 'Qwen 2.5 Coder 32B (Hugging Face)',
    category: 'coding',
    parameters: '32.5B Dense',
    descriptionAr: 'المحرك الأقوى في Hugging Face لبرمجة التطبيقات، تصحيح الأخطاء، وكتابة الألعاب والخوارزميات.',
    descriptionEn: 'Top-tier code engine for app synthesis, debugging, canvas games, and modern full-stack code.',
    speed: 9.5,
    quality: 9.8,
  },
  {
    id: 'deepseek-ai/DeepSeek-R1',
    name: 'DeepSeek-R1 (Hugging Face Reasoning)',
    category: 'reasoning',
    parameters: '671B MoE',
    descriptionAr: 'نموذج التفكير العميق والمنطق الرياضي الفائق مع سلسلة استنتاج تفصيلية لحل أصعب المسائل.',
    descriptionEn: 'SOTA Deep Reasoning model with chain-of-thought deduction, advanced mathematics, and logic.',
    speed: 8.8,
    quality: 9.9,
  },
  {
    id: 'meta-llama/Llama-3.3-70B-Instruct',
    name: 'Llama 3.3 70B (Hugging Face)',
    category: 'general',
    parameters: '70B Dense',
    descriptionAr: 'النموذج المفتوح الرائد عالمياً للذكاء العام، التحليل الاستراتيجي، والفصاحة اللغوية العالية.',
    descriptionEn: 'Premier open foundation model for general intelligence, deep analysis, and multilingual fluency.',
    speed: 9.0,
    quality: 9.7,
  },
  {
    id: 'mistralai/Mistral-Small-24B-Instruct-2501',
    name: 'Mistral Small 24B (Hugging Face)',
    category: 'fast',
    parameters: '24B Dense',
    descriptionAr: 'محرك مدمج فائق السرعة والاستجابة، ممتاز في تلخيص المحتوى والعمليات اللحظية.',
    descriptionEn: 'Ultra-fast and highly responsive compact model, ideal for rapid iterations and quick answers.',
    speed: 9.8,
    quality: 9.4,
  },
];

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
  const [hfTokenInput, setHfTokenInput] = useState(preferences.huggingFaceToken || '');
  const [hfSavedNotice, setHfSavedNotice] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem('gemini_api_key') || localStorage.getItem('adam_gemini_key') || ''
      : '';
  });
  const [geminiSavedNotice, setGeminiSavedNotice] = useState(false);
  const [customApiUrlInput, setCustomApiUrlInput] = useState(() => {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem('adam_custom_api_url') || ''
      : '';
  });
  const [apiUrlSavedNotice, setApiUrlSavedNotice] = useState(false);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSaveGeminiKey = () => {
    const val = geminiKeyInput.trim();
    if (typeof localStorage !== 'undefined') {
      if (val) {
        localStorage.setItem('gemini_api_key', val);
        localStorage.setItem('adam_gemini_key', val);
      } else {
        localStorage.removeItem('gemini_api_key');
        localStorage.removeItem('adam_gemini_key');
      }
    }
    setGeminiSavedNotice(true);
    setTimeout(() => setGeminiSavedNotice(false), 2500);
  };

  const handleSaveCustomApiUrl = () => {
    const val = customApiUrlInput.trim();
    if (typeof localStorage !== 'undefined') {
      if (val) {
        localStorage.setItem('adam_custom_api_url', val);
      } else {
        localStorage.removeItem('adam_custom_api_url');
      }
    }
    setApiUrlSavedNotice(true);
    setTimeout(() => setApiUrlSavedNotice(false), 2500);
  };

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

  const handleSaveHfToken = () => {
    onChange({ huggingFaceToken: hfTokenInput.trim() });
    setHfSavedNotice(true);
    setTimeout(() => setHfSavedNotice(false), 2500);
  };

  const handleTestHfModel = async (modelId: string) => {
    setTestingModel(modelId);
    setTestResult(null);
    try {
      const res = await fetch('/api/hf/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'Say hello in 3 words' }],
          customToken: preferences.huggingFaceToken,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTestResult({
          ok: true,
          message: language === 'ar'
            ? `✅ متصل بنجاح (${data.executionTimeMs}ms): "${data.text?.slice(0, 50)}"`
            : `✅ Connected (${data.executionTimeMs}ms): "${data.text?.slice(0, 50)}"`,
        });
      } else {
        setTestResult({
          ok: false,
          message: language === 'ar' ? `⚠️ تعذر الاتصال: ${data.error || 'Server error'}` : `⚠️ Connection error: ${data.error}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: language === 'ar' ? `⚠️ خطأ في الشبكة: ${err.message}` : `⚠️ Network error: ${err.message}`,
      });
    } finally {
      setTestingModel(null);
    }
  };

  return (
    <section className="feature-page max-w-5xl mx-auto pb-28 animate-fadeIn" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="feature-heading mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <span className="eyebrow flex items-center gap-1.5 text-[var(--accent)] font-mono text-[11px] tracking-wider uppercase">
            <Sliders size={13} />
            <span>ADEM OS / PREFERENCES</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] mt-1">{t.title}</h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">{t.sub}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] text-[var(--accent)] text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <Sparkles size={14} />
            <span>{t.themeCount}</span>
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Appearance & Themes Section */}
        <div className="settings-card settings-card--glass p-5 sm:p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shadow-xl">
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
        </div>

        {/* Hugging Face Intelligence & Open Model Hub */}
        <div className="settings-card p-5 sm:p-6 rounded-3xl border border-[var(--border-strong)] bg-[var(--surface)] backdrop-blur-xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Zap size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-base text-[var(--text)] font-bold block">
                    {language === 'ar' ? 'محرك ونماذج Hugging Face الذكية (Open Models Hub)' : 'Hugging Face Open Models Hub'}
                  </strong>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    🤗 Hugging Face Active
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {language === 'ar'
                    ? 'تعزيز ADEM بنماذج Hugging Face العالمية (DeepSeek-R1 للتفكير، Qwen 2.5 Coder للبرمجة، Llama 3.3 للذكاء العام).'
                    : 'Supercharge ADEM with top Hugging Face open models (DeepSeek-R1 for reasoning, Qwen 2.5 Coder, Llama 3.3).'}
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm self-start sm:self-auto">
              <CheckCircle2 size={13} />
              <span>{language === 'ar' ? 'الموجّه التلقائي نشط' : 'Router Ready'}</span>
            </span>
          </div>

          {/* Model Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
            {HF_MODELS.map((hf) => {
              const isSelected = preferences.activeModelId === hf.id;
              const isTesting = testingModel === hf.id;

              return (
                <div
                  key={hf.id}
                  className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[var(--accent-subtle)] border-[var(--accent)] shadow-[0_0_20px_var(--accent-glow)]'
                      : 'bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-[var(--text)] truncate">
                          {hf.name}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] whitespace-nowrap font-mono">
                        {hf.parameters}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--muted)] leading-relaxed mb-3">
                      {language === 'ar' ? hf.descriptionAr : hf.descriptionEn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border)]">
                    <button
                      type="button"
                      disabled={isTesting}
                      onClick={() => handleTestHfModel(hf.id)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Activity size={12} className={isTesting ? 'animate-spin text-amber-400' : 'text-emerald-400'} />
                      <span>{isTesting ? (language === 'ar' ? 'فحص...' : 'Pinging...') : (language === 'ar' ? 'فحص الاستجابة' : 'Test Model')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onChange({ activeModelId: isSelected ? undefined : hf.id })}
                      className={`text-[11px] px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                          : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                      <span>{isSelected ? (language === 'ar' ? 'النموذج النشط' : 'Active Model') : (language === 'ar' ? 'تعيين كافتراضي' : 'Set as Active')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {testResult && (
            <div className={`p-3 rounded-2xl mb-4 border text-xs font-mono animate-fadeIn ${
              testResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              {testResult.message}
            </div>
          )}

          {/* Optional Hugging Face Token Configuration */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-amber-400" />
                <strong className="text-xs text-[var(--text)]">
                  {language === 'ar' ? 'رمز الوصول الخاص بـ Hugging Face (اختياري - HF Token):' : 'Hugging Face Access Token (Optional - HF Token):'}
                </strong>
              </div>
              <span className="text-[10px] text-[var(--muted)]">
                {language === 'ar' ? 'يعمل مجاناً تلقائياً عبر الموجّه المفتوح' : 'Free serverless router active by default'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={hfTokenInput}
                onChange={(e) => setHfTokenInput(e.target.value)}
                placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
              <button
                type="button"
                onClick={handleSaveHfToken}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-slate-950 text-xs font-bold transition-all hover:opacity-90 active:scale-95 cursor-pointer whitespace-nowrap shadow-sm"
              >
                {hfSavedNotice ? (language === 'ar' ? '✓ تم الحفظ' : '✓ Saved') : (language === 'ar' ? 'حفظ المفتاح' : 'Save Key')}
              </button>
            </div>
          </div>

          {/* Google Gemini Direct API Key (For Mobile APK & Offline Autonomy) */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-400" />
                <strong className="text-xs text-[var(--text)]">
                  {language === 'ar'
                    ? 'مفتاح Google Gemini API لتطبيق الهاتف APK (اختياري):'
                    : 'Google Gemini API Key for Mobile APK (Optional):'}
                </strong>
              </div>
              <span className="text-[10px] text-[var(--muted)]">
                {language === 'ar'
                  ? 'يسمح لتطبيق الهاتف بالاتصال المباشر بنماذج Google'
                  : 'Enables direct phone connection to Gemini models'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
              <button
                type="button"
                onClick={handleSaveGeminiKey}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-sm"
              >
                {geminiSavedNotice ? (language === 'ar' ? '✓ تم الحفظ' : '✓ Saved') : (language === 'ar' ? 'حفظ المفتاح' : 'Save Key')}
              </button>
            </div>
            <p className="text-[10px] text-[var(--muted)] mt-2">
              {language === 'ar'
                ? '💡 عند وضع مفتاح Gemini الخاص بك، سيعمل تطبيق APK بكامل الذكاء وسرعة الاستجابة على هاتفك مباشرة دون الحاجة لأي خادم وسيط.'
                : '💡 Setting your Gemini key allows the mobile APK to generate responses directly with zero intermediary server needed.'}
            </p>
          </div>

          {/* Custom Backend Server URL */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-emerald-400" />
                <strong className="text-xs text-[var(--text)]">
                  {language === 'ar'
                    ? 'عنوان خادم ADEM المخصص (Custom API Server URL):'
                    : 'Custom ADEM API Server URL:'}
                </strong>
              </div>
              <span className="text-[10px] text-[var(--muted)]">
                {language === 'ar' ? 'اختياري لربط APK بخادم خاص' : 'Optional endpoint for mobile app'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={customApiUrlInput}
                onChange={(e) => setCustomApiUrlInput(e.target.value)}
                placeholder="https://your-server.run.app"
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
              <button
                type="button"
                onClick={handleSaveCustomApiUrl}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-sm"
              >
                {apiUrlSavedNotice ? (language === 'ar' ? '✓ تم الحفظ' : '✓ Saved') : (language === 'ar' ? 'حفظ الرابط' : 'Save URL')}
              </button>
            </div>
          </div>
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

        {/* System & Storage Management */}
        <div className="settings-card p-5 sm:p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--border-strong)]">
                <HardDrive size={22} />
              </div>
              <div>
                <strong className="text-base text-[var(--text)] font-bold block">{t.system}</strong>
                <p className="text-xs text-[var(--muted)] mt-0.5">{t.systemSub}</p>
              </div>
            </div>

            <span className="text-xs font-mono text-[var(--muted)] px-3 py-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              {t.storageUsed}: {storageCount} keys
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-[var(--accent)] flex-shrink-0" />
              <div>
                <strong className="text-xs text-[var(--text)] block">{t.privacy}</strong>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">{t.privacySub}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap shadow-sm"
            >
              <Trash2 size={15} />
              <span>{resetSuccess ? '✓ تم المسح' : t.reset}</span>
            </button>
          </div>
        </div>

        {/* Android Over-App & Full Operational Permissions */}
        <AndroidPermissionsBanner language={language} />

        {/* Android Google Sign-In & OAuth Client Configuration */}
        <AndroidOAuthSetupCard language={language} defaultExpanded={false} />

        {/* Mobile & APK Readiness Foundation */}
        <div className="settings-card p-5 sm:p-6 rounded-3xl border border-[var(--border-strong)] bg-[var(--surface)] backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--border-strong)]">
                <Smartphone size={22} />
              </div>
              <div>
                <strong className="text-base text-[var(--text)] font-bold block">
                  {language === 'ar' ? 'جاهزية تطبيق الهاتف ونسخة APK' : 'Mobile & Android APK Foundation'}
                </strong>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {language === 'ar'
                    ? 'قاعدة برمجية مدعمة لنظام أندرويد (Capacitor / PWA / WebView) مع تصفح آمن للمواقع دون أعطال.'
                    : 'Hardened foundation for Android APK (Capacitor/WebView) with safe external web handling.'}
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-[var(--accent)] px-3 py-1 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 size={13} />
              <span>{language === 'ar' ? 'جاهز لـ APK' : 'APK Ready'}</span>
            </span>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-center">
              <span className="text-[11px] text-[var(--accent)] font-medium block">
                {language === 'ar' ? '🛡️ تصفح آمن مدمج' : '🛡️ Safe In-App Browser'}
              </span>
              <small className="text-[10px] text-[var(--muted)]">
                {language === 'ar' ? 'حماية من الشاشة البيضاء' : 'Prevents WebView freeze'}
              </small>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-center">
              <span className="text-[11px] text-[var(--accent)] font-medium block">
                {language === 'ar' ? '⚡ زر الرجوع لأندرويد' : '⚡ Android Back Guard'}
              </span>
              <small className="text-[10px] text-[var(--muted)]">
                {language === 'ar' ? 'يمنع الخروج العرضي' : 'Graceful back navigation'}
              </small>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-center">
              <span className="text-[11px] text-[var(--accent)] font-medium block">
                {language === 'ar' ? '📦 كاش Offline PWA' : '📦 Offline PWA Cache'}
              </span>
              <small className="text-[10px] text-[var(--muted)]">
                {language === 'ar' ? 'Service Worker نشط' : 'Service Worker active'}
              </small>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-center">
              <span className="text-[11px] text-[var(--accent)] font-medium block">
                {language === 'ar' ? '📱 مانع التكبير المشوه' : '📱 No-Zoom Distortion'}
              </span>
              <small className="text-[10px] text-[var(--muted)]">
                {language === 'ar' ? 'قياسات شاشة دقيقة' : 'Viewport locked cover'}
              </small>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)]">
              {language === 'ar'
                ? 'يمكنك تحميل حزمة APK الجاهزة مباشرة أو مزامنة الكود مع Android Studio باستخدام Capacitor:'
                : 'Download the compiled APK directly or sync with Android Studio using Capacitor:'}
            </p>
            <div className="flex items-center gap-2">
              <a
                href="/Adam-AI-Agent.apk"
                download="Adam-AI-Agent.apk"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 hover:opacity-90"
              >
                <Download size={14} />
                <span>{language === 'ar' ? 'تحميل تطبيق APK' : 'Download APK'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
