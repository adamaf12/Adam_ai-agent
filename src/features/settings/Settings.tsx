import { Globe2, RotateCcw, Server, ShieldCheck, Sun, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import type { AppPreferences, Language } from '../../core/domain';
import { THEME_CATALOG } from '../../core/themeCatalog';

const c = {
  ar: {
    title: 'الإعدادات',
    sub: 'تحكم كامل في تجربة ومظهر ومحرك Adam.',
    appearance: 'المظهر والتصميم',
    language: 'اللغة',
    system: 'النظام',
    light: 'فاتح',
    dark: 'داكن',
    glass: 'Glass',
    glassDark: 'Glass Dark',
    aurora: 'Aurora',
    server: 'حالة الخادم وتطبيق الهاتف (APK)',
    serverSub: 'المحرك السحابي ومعالجة طلبات الذكاء الاصطناعي والصور.',
    serverConnected: 'متصل بالسحابة (Cloud Run)',
    customUrlLabel: 'رابط الخادم المخصص (اختياري للأجهزة وتطبيقات APK):',
    saveUrl: 'حفظ الرابط',
    reset: 'إعادة ضبط الإعدادات ومسح الذاكرة المؤقتة',
    privacy: 'الخصوصية والأمان',
    privacySub: 'بياناتك ومحادثاتك محفوظة بأمان على جهازك ولا تُشارك مع أي جهة خارجية.',
    arabic: 'العربية',
    english: 'English',
  },
  en: {
    title: 'Settings',
    sub: 'Full control over your Adam experience, themes and engines.',
    appearance: 'Appearance & Themes',
    language: 'Language',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    glass: 'Glass',
    glassDark: 'Glass Dark',
    aurora: 'Aurora',
    server: 'Server & Mobile APK Connection',
    serverSub: 'Cloud reasoning, image generation, and live grounding engine.',
    serverConnected: 'Connected to Cloud Run',
    customUrlLabel: 'Custom Server URL (Optional for APK standalone mode):',
    saveUrl: 'Save URL',
    reset: 'Reset App & Clear Cache',
    privacy: 'Privacy & Security',
    privacySub: 'Your data and conversations are stored securely on-device.',
    arabic: 'العربية',
    english: 'English',
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
  const [customApiUrl, setCustomApiUrl] = useState(() => localStorage.getItem('adam_custom_api_url') || '');
  const [urlSaved, setUrlSaved] = useState(false);

  const handleSaveUrl = () => {
    if (customApiUrl.trim()) {
      localStorage.setItem('adam_custom_api_url', customApiUrl.trim());
    } else {
      localStorage.removeItem('adam_custom_api_url');
    }
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2500);
  };

  return (
    <section className="feature-page">
      <div className="feature-heading">
        <div>
          <span className="eyebrow">ADAM / SETTINGS</span>
          <h1>{t.title}</h1>
          <p>{t.sub}</p>
        </div>
      </div>

      <div className="settings-stack">
        {/* Appearance & Themes */}
        <div className="settings-card settings-card--glass">
          <div className="settings-title">
            <Sun size={19} className="text-emerald-400" />
            <div>
              <strong>{t.appearance}</strong>
            </div>
          </div>
          <div className="theme-grid">
            {THEME_CATALOG.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={
                  preferences.theme === theme.id
                    ? 'theme-option theme-option--rich selected'
                    : 'theme-option theme-option--rich'
                }
                onClick={() => onChange({ theme: theme.id })}
                aria-pressed={preferences.theme === theme.id}
              >
                <span className={themeClass(theme.tone)} aria-hidden="true">
                  <i />
                  <i />
                </span>
                <span className="theme-copy">
                  <strong>{theme.label[language]}</strong>
                  <small>{theme.description[language]}</small>
                </span>
                <span className="theme-check" aria-hidden="true">
                  ✓
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="settings-card">
          <div className="settings-title">
            <Globe2 size={19} className="text-emerald-400" />
            <strong>{t.language}</strong>
          </div>
          <div className="theme-options">
            <button
              type="button"
              className={language === 'ar' ? 'theme-option selected' : 'theme-option'}
              onClick={() => onChange({ language: 'ar' })}
            >
              {t.arabic}
            </button>
            <button
              type="button"
              className={language === 'en' ? 'theme-option selected' : 'theme-option'}
              onClick={() => onChange({ language: 'en' })}
            >
              {t.english}
            </button>
          </div>
        </div>

        {/* Server & Mobile Connection */}
        <div className="settings-card">
          <div className="settings-title">
            <Server size={19} className="text-emerald-400" />
            <div>
              <strong>{t.server}</strong>
              <p>{t.serverSub}</p>
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
              <CheckCircle2 size={14} />
              <span>{t.serverConnected}</span>
            </div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {t.customUrlLabel}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="url"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleSaveUrl}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: urlSaved ? '#10b981' : 'var(--accent)',
                  color: '#04140c',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                {urlSaved ? '✓' : t.saveUrl}
              </button>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="settings-card privacy-card">
          <div className="settings-title">
            <ShieldCheck size={19} className="text-emerald-400" />
            <div>
              <strong>{t.privacy}</strong>
              <p>{t.privacySub}</p>
            </div>
          </div>
        </div>

        {/* Reset */}
        <button
          type="button"
          className="danger-button"
          onClick={() => {
            localStorage.clear();
            location.reload();
          }}
        >
          <RotateCcw size={17} />
          {t.reset}
        </button>
      </div>
    </section>
  );
}

