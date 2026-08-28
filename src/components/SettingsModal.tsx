import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  User,
  Volume2,
  Brain,
  Shield,
  Trash2,
  AlertTriangle,
  Lock,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Plus,
  RotateCcw,
  Key,
  Cpu,
  Layers,
  ListOrdered,
  Palette,
  Mic,
  Sparkles,
  Sliders,
  Globe,
  LogOut,
  RefreshCw,
  Mail,
  Send,
  Clock,
  Crown,
} from 'lucide-react';
import { AgentSettings, AppTheme, PersonalityTone } from '../types';
import { DEFAULT_MODEL_FALLBACK_LIST } from '../lib/storage';
import { GLOBAL_VOICES, speakWithGlobalVoice } from '../lib/voiceEngine';
import { resolveSystemLanguage, getLanguageName } from '../lib/languageResolver';
import {
  ALERT_SOUND_OPTIONS,
  ALERT_VIBRATION_OPTIONS,
  playAlertSound,
  triggerAlertVibration,
  AlertSoundType,
  AlertVibrationPattern,
} from '../lib/alertFeedback';
import { THEME_OPTIONS } from './ThemeSelectorModal';
import { auth, fastGoogleSignIn, logoutWorkspace } from '../lib/workspaceAuth';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { CREATOR_DEVELOPER_EMAIL, sendTestDeveloperDiagnostic } from '../lib/developerErrorReporting';
import { logAnalyticsEvent } from '../lib/analytics';
import { getAllQuotasSummary, isAppCreator, isVipUser, maskEmailAddress, CREATOR_NAME, formatSecondsToTime } from '../lib/quotaManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AgentSettings;
  onSaveSettings: (settings: AgentSettings) => void;
  onClearMemories: () => void;
  onWipeAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearMemories,
  onWipeAllData,
}) => {
  const [localSettings, setLocalSettings] = useState<AgentSettings>(settings);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [swCacheMessage, setSwCacheMessage] = useState<string | null>(null);

  const handleClearSwCache = async () => {
    setSwCacheMessage(null);
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
        await navigator.serviceWorker.register('/sw.js');
      }
      logAnalyticsEvent('manual_clear_sw_cache');
      setSwCacheMessage(
        localSettings.language === 'ar'
          ? 'تم تفريغ ذاكرة التخزين المؤقت (Cache) وإعادة تحميل الخدمة بنجاح ⚡'
          : 'Service Worker Cache cleared successfully! Latest version ready.'
      );
    } catch (err) {
      console.error('Failed clearing SW cache:', err);
      setSwCacheMessage(
        localSettings.language === 'ar' ? 'حدث خطأ أثناء إخلاء الكاش' : 'Failed to clear Service Worker cache'
      );
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const isArabic = localSettings.language === 'ar';

  const handleGoogleConnect = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const user = await fastGoogleSignIn();
      if (user) {
        setCurrentUser(user);
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setAuthError(err?.message || 'فشلت عملية الربط بحساب قوقل');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await logoutWorkspace();
      setCurrentUser(null);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const currentFallbackList = localSettings.modelFallbackList && localSettings.modelFallbackList.length > 0
    ? localSettings.modelFallbackList
    : DEFAULT_MODEL_FALLBACK_LIST;

  const updateFallbackList = (newList: string[]) => {
    const updated = { ...localSettings, modelFallbackList: newList };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const handleMoveModelUp = (index: number) => {
    if (index === 0) return;
    const newList = [...currentFallbackList];
    const temp = newList[index - 1];
    newList[index - 1] = newList[index];
    newList[index] = temp;
    updateFallbackList(newList);
  };

  const handleMoveModelDown = (index: number) => {
    if (index === currentFallbackList.length - 1) return;
    const newList = [...currentFallbackList];
    const temp = newList[index + 1];
    newList[index + 1] = newList[index];
    newList[index] = temp;
    updateFallbackList(newList);
  };

  const handleRemoveModel = (index: number) => {
    if (currentFallbackList.length <= 1) return;
    const newList = currentFallbackList.filter((_, i) => i !== index);
    updateFallbackList(newList);
  };

  const handleAddModel = (modelName: string) => {
    const trimmed = modelName.trim();
    if (!trimmed || currentFallbackList.includes(trimmed)) return;
    const newList = [...currentFallbackList, trimmed];
    updateFallbackList(newList);
    setCustomModelInput('');
  };

  const handleResetFallbackList = () => {
    updateFallbackList([...DEFAULT_MODEL_FALLBACK_LIST]);
  };

  const handleToneChange = (tone: PersonalityTone) => {
    const updated = { ...localSettings, tone };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const handlePermissionToggle = (key: keyof AgentSettings['permissions']) => {
    const updated = {
      ...localSettings,
      permissions: {
        ...localSettings.permissions,
        [key]: !localSettings.permissions[key],
      },
    };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                {isArabic ? 'إعدادات الوكيل والخصوصية' : 'Agent & Privacy Settings'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isArabic
                  ? 'تخصيص شخصية الوكيل، الصلاحيات، وإدارة البيانات'
                  : 'Customize agent persona, permissions, and data'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 theme-scrollbar">
          {/* Section 0: Google Account Linking */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-white/10 text-white backdrop-blur-md">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>{isArabic ? 'ربط حساب قوقل (Google OAuth 2.0)' : 'Google Account Linking'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {currentUser ? (isArabic ? 'مربوط 🟢' : 'Linked 🟢') : (isArabic ? 'غير مربوط ⚪' : 'Not Linked ⚪')}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    {isArabic
                      ? 'ربط حسابك الشخصي في قوقل لمزامنة البريد الوارد، التقويم، المستندات والملفات تلقائياً.'
                      : 'Connect your personal Google account to sync Gmail, Calendar, Drive & Contacts automatically.'}
                  </p>
                </div>
              </div>
            </div>

            {currentUser ? (
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Google User'}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border-2 border-emerald-400 shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center text-sm shadow">
                      {currentUser.displayName?.[0] || currentUser.email?.[0] || 'G'}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>{currentUser.displayName || 'Google Account'}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono">{maskEmailAddress(currentUser.email)}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleDisconnect}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1 shrink-0"
                  title={isArabic ? 'فصل وتغيير حساب قوقل' : 'Disconnect Google Account'}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'إلغاء الربط' : 'Disconnect'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  disabled={isSigningIn}
                  className="w-full py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2.5 transition active:scale-98"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {isSigningIn
                      ? isArabic
                        ? 'جاري الربط بحساب Google...'
                        : 'Linking Google Account...'
                      : isArabic
                      ? 'ربط حساب قوقل الخاص بي الآن 🔑'
                      : 'Link My Google Account Now 🔑'}
                  </span>
                </button>
                {authError && <p className="text-[11px] text-rose-300 text-center font-medium">{authError}</p>}
              </div>
            )}
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 1: Agent Persona */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isArabic ? 'شخصية ونبرة الوكيل' : 'Agent Persona & Tone'}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isArabic ? 'اسم الوكيل:' : 'Agent Name:'}
                </label>
                <input
                  type="text"
                  value={localSettings.name}
                  onChange={(e) => {
                    const updated = { ...localSettings, name: e.target.value };
                    setLocalSettings(updated);
                    onSaveSettings(updated);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isArabic ? 'اللغة الافتراضية:' : 'Default Language:'}
                </label>
                <select
                  value={localSettings.language}
                  onChange={(e) => {
                    const updated = { ...localSettings, language: e.target.value as any };
                    setLocalSettings(updated);
                    onSaveSettings(updated);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="auto">{isArabic ? `تلقائي (لغة جهازك: ${getLanguageName(resolveSystemLanguage(), true)})` : `Auto (Device Language: ${getLanguageName(resolveSystemLanguage(), false)})`}</option>
                  <option value="ar">العربية (Arabic)</option>
                  <option value="en">English (الإنجليزية)</option>
                  <option value="fr">Français (الفرنسية)</option>
                  <option value="es">Español (الإسبانية)</option>
                  <option value="de">Deutsch (الألمانية)</option>
                  <option value="tr">Türkçe (التركية)</option>
                  <option value="it">Italiano (الإيطالية)</option>
                  <option value="pt">Português (البرتغالية)</option>
                  <option value="ru">Русский (الروسية)</option>
                  <option value="zh">中文 (الصينية)</option>
                  <option value="ja">日本語 (اليابانية)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isArabic
                    ? '⚡ في وضع التلقائي، تتطابق الواجهة والردود مع لغة هاتفك أو حاسوبك فوراً، وتتكيف تلقائياً مع لغة أي رسالة جديدة.'
                    : '⚡ In Auto mode, interface and AI mirror your device OS language, adapting instantly to any message language.'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {isArabic ? 'نبرة الحديث والشخصية:' : 'Personality Tone:'}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'friendly', nameAr: 'ودود ودافئ', nameEn: 'Friendly' },
                  { id: 'formal', nameAr: 'رسمي ودقيق', nameEn: 'Formal' },
                  { id: 'concise', nameAr: 'مباشر وموجز', nameEn: 'Concise' },
                  { id: 'expert', nameAr: 'خبير متعمق', nameEn: 'Expert' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleToneChange(t.id as PersonalityTone)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      localSettings.tone === t.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700/70 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isArabic ? t.nameAr : t.nameEn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 1.5: Global Themes Gallery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-emerald-500" />
                <span>{isArabic ? 'مجموعة الثيمات والمظاهر العالمية' : 'Global Themes Gallery'}</span>
              </h4>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                7 {isArabic ? 'ثيمات فاخرة' : 'Global Themes'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEME_OPTIONS.map((t) => {
                const isSelected = localSettings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      const updated = { ...localSettings, theme: t.id };
                      setLocalSettings(updated);
                      onSaveSettings(updated);
                    }}
                    className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between gap-2 relative ${
                      isSelected
                        ? `${t.accentBorder} bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30`
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                        {t.tag}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                      {isArabic ? t.nameAr.split('(')[0] : t.nameEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 1.6: Global Voices & Speech Engine */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    {isArabic ? 'محرك الأصوات العالمية (Global Voice Engine)' : 'Global Voice Engine'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isArabic
                      ? 'اختر الصوت الفائق المفضل للنطق المباشر مع أدم واستجابة الصوت العصبية'
                      : 'Select neural voice for direct voice conversation and audio answers'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GLOBAL_VOICES.map((v) => {
                const currentVoiceId = localSettings.voiceSettings?.voiceId || 'adam-neural';
                const isSelected = currentVoiceId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      const updatedVoiceSettings = {
                        voiceId: v.id,
                        rate: localSettings.voiceSettings?.rate || 1.0,
                        pitch: localSettings.voiceSettings?.pitch || 1.0,
                        autoSpeakResponses: localSettings.voiceSettings?.autoSpeakResponses ?? true,
                      };
                      const updated = { ...localSettings, voiceSettings: updatedVoiceSettings };
                      setLocalSettings(updated);
                      onSaveSettings(updated);

                      speakWithGlobalVoice(
                        isArabic ? 'أهلاً بك! هذا تجريب للصوت المختار.' : 'Hello! Testing selected voice.',
                        v.id,
                        {
                          customRate: updatedVoiceSettings.rate,
                          customPitch: updatedVoiceSettings.pitch,
                        }
                      );
                    }}
                    className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{isArabic ? v.nameAr : v.nameEn}</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        {v.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {isArabic ? v.descriptionAr : v.descriptionEn}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isArabic ? 'تشغيل الردود بالصوت تلقائياً عند الإجابة:' : 'Auto-speak AI responses:'}
              </span>
              <input
                type="checkbox"
                checked={localSettings.voiceSettings?.autoSpeakResponses ?? true}
                onChange={(e) => {
                  const updatedVoice = {
                    voiceId: localSettings.voiceSettings?.voiceId || 'adam-neural',
                    rate: localSettings.voiceSettings?.rate || 1.0,
                    pitch: localSettings.voiceSettings?.pitch || 1.0,
                    autoSpeakResponses: e.target.checked,
                  };
                  const updated = { ...localSettings, voiceSettings: updatedVoice, autoTTS: e.target.checked };
                  setLocalSettings(updated);
                  onSaveSettings(updated);
                }}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Section: Wake Word Activation / الاستيقاظ الصوتي */}
          <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{isArabic ? 'الاستيقاظ بالصوت (Wake Word / يا آدم)' : 'Voice Wake Word (Hey Adam)'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
                      {localSettings.wakeWordEnabled ? (isArabic ? 'مفعل ⚡' : 'Active ⚡') : (isArabic ? 'معطل' : 'Off')}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isArabic
                      ? 'ينتبه أدم ويستجيب مباشرة عندما تناديه بـ "يا آدم" دون الحاجة للضغط على أي زر'
                      : 'Adam wakes up and responds automatically when you say "Hey Adam" without clicking buttons'}
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={localSettings.wakeWordEnabled ?? true}
                onChange={(e) => {
                  const updated = { ...localSettings, wakeWordEnabled: e.target.checked };
                  setLocalSettings(updated);
                  onSaveSettings(updated);
                }}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
              />
            </div>

            {localSettings.wakeWordEnabled && (
              <div className="pt-2 border-t border-emerald-500/20 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic ? 'كلمة/عبارة الاستيقاظ المفضلة:' : 'Custom Wake Word Phrase:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={localSettings.wakeWordPhrase || 'آدم'}
                    onChange={(e) => {
                      const updated = { ...localSettings, wakeWordPhrase: e.target.value };
                      setLocalSettings(updated);
                      onSaveSettings(updated);
                    }}
                    placeholder="آدم / يا آدم / Adam"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                    {isArabic ? 'الكلمات: "آدم"، "يا آدم"، "Adam"' : 'Triggers: "Adam", "Hey Adam"'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section: AutoHeal Alert Sounds & Mobile Vibration Customizer */}
          <div className="space-y-4 p-4 rounded-2xl bg-gradient-to-br from-teal-50/50 via-emerald-50/40 to-slate-50 dark:from-teal-950/20 dark:via-emerald-950/20 dark:to-slate-900 border border-teal-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{isArabic ? 'نغمات واهتزازات التعافي الذاتي (AutoHeal Alerts)' : 'AutoHeal Sound & Vibration Alerts'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] font-bold">
                      {isArabic ? 'صوت + اهتزاز للموبايل 📳' : 'Audio + Haptics 📳'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isArabic
                      ? 'تخصيص النغمات الصوتية وأنماط الاهتزاز اللمسية عند اكتشاف الأخطاء وإصلاحها برمجياً في الخلفية'
                      : 'Customize audio feedback & mobile vibration patterns triggered when AutoHeal discovers or fixes code issues'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sound Selector */}
            <div className="space-y-2 pt-2 border-t border-teal-500/20">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-teal-500" />
                  <span>{isArabic ? 'النغمة الصوتية المفضلة (Custom Alert Sound):' : 'Preferred Alert Sound:'}</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isArabic ? 'تفعيل الصوت:' : 'Sound:'}
                  </span>
                  <input
                    type="checkbox"
                    checked={localSettings.autoHealAlertSettings?.soundEnabled ?? true}
                    onChange={(e) => {
                      const updatedAlert = {
                        soundEnabled: e.target.checked,
                        soundType: localSettings.autoHealAlertSettings?.soundType || 'healing_chime',
                        soundVolume: localSettings.autoHealAlertSettings?.soundVolume ?? 0.4,
                        vibrationEnabled: localSettings.autoHealAlertSettings?.vibrationEnabled ?? true,
                        vibrationPattern: localSettings.autoHealAlertSettings?.vibrationPattern || 'double_pulse',
                        notifyOnBackgroundFix: localSettings.autoHealAlertSettings?.notifyOnBackgroundFix ?? true,
                      };
                      const updated = { ...localSettings, autoHealAlertSettings: updatedAlert };
                      setLocalSettings(updated);
                      onSaveSettings(updated);
                    }}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 accent-teal-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALERT_SOUND_OPTIONS.map((snd) => {
                  const currentSound = localSettings.autoHealAlertSettings?.soundType || 'healing_chime';
                  const isSelected = currentSound === snd.id;
                  return (
                    <button
                      key={snd.id}
                      type="button"
                      onClick={() => {
                        const updatedAlert = {
                          soundEnabled: true,
                          soundType: snd.id as AlertSoundType,
                          soundVolume: localSettings.autoHealAlertSettings?.soundVolume ?? 0.4,
                          vibrationEnabled: localSettings.autoHealAlertSettings?.vibrationEnabled ?? true,
                          vibrationPattern: localSettings.autoHealAlertSettings?.vibrationPattern || 'double_pulse',
                          notifyOnBackgroundFix: localSettings.autoHealAlertSettings?.notifyOnBackgroundFix ?? true,
                        };
                        const updated = { ...localSettings, autoHealAlertSettings: updatedAlert };
                        setLocalSettings(updated);
                        onSaveSettings(updated);

                        // Test play audio immediately
                        playAlertSound(snd.id as AlertSoundType, updatedAlert.soundVolume);
                      }}
                      className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500/15 text-teal-900 dark:text-teal-100 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span>{isArabic ? snd.nameAr : snd.nameEn}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {isArabic ? snd.descriptionAr : snd.descriptionEn}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Vibration Pattern Selector */}
            <div className="space-y-2 pt-2 border-t border-teal-500/20">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-teal-500" />
                  <span>{isArabic ? 'نمط اهتزاز الهاتف (Mobile Vibration Pattern):' : 'Mobile Vibration Pattern:'}</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isArabic ? 'تفعيل الاهتزاز:' : 'Vibration:'}
                  </span>
                  <input
                    type="checkbox"
                    checked={localSettings.autoHealAlertSettings?.vibrationEnabled ?? true}
                    onChange={(e) => {
                      const updatedAlert = {
                        soundEnabled: localSettings.autoHealAlertSettings?.soundEnabled ?? true,
                        soundType: localSettings.autoHealAlertSettings?.soundType || 'healing_chime',
                        soundVolume: localSettings.autoHealAlertSettings?.soundVolume ?? 0.4,
                        vibrationEnabled: e.target.checked,
                        vibrationPattern: localSettings.autoHealAlertSettings?.vibrationPattern || 'double_pulse',
                        notifyOnBackgroundFix: localSettings.autoHealAlertSettings?.notifyOnBackgroundFix ?? true,
                      };
                      const updated = { ...localSettings, autoHealAlertSettings: updatedAlert };
                      setLocalSettings(updated);
                      onSaveSettings(updated);
                    }}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 accent-teal-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALERT_VIBRATION_OPTIONS.map((vib) => {
                  const currentVib = localSettings.autoHealAlertSettings?.vibrationPattern || 'double_pulse';
                  const isSelected = currentVib === vib.id;
                  return (
                    <button
                      key={vib.id}
                      type="button"
                      onClick={() => {
                        const updatedAlert = {
                          soundEnabled: localSettings.autoHealAlertSettings?.soundEnabled ?? true,
                          soundType: localSettings.autoHealAlertSettings?.soundType || 'healing_chime',
                          soundVolume: localSettings.autoHealAlertSettings?.soundVolume ?? 0.4,
                          vibrationEnabled: true,
                          vibrationPattern: vib.id as AlertVibrationPattern,
                          notifyOnBackgroundFix: localSettings.autoHealAlertSettings?.notifyOnBackgroundFix ?? true,
                        };
                        const updated = { ...localSettings, autoHealAlertSettings: updatedAlert };
                        setLocalSettings(updated);
                        onSaveSettings(updated);

                        // Trigger vibration test immediately on mobile/supported devices
                        triggerAlertVibration(vib.id as AlertVibrationPattern);
                      }}
                      className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500/15 text-teal-900 dark:text-teal-100 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span>{isArabic ? vib.nameAr : vib.nameEn}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {isArabic ? vib.descriptionAr : vib.descriptionEn}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section: Daily Model Quotas & Creator Status */}
          {(() => {
            const quotaSummary = getAllQuotasSummary(currentUser?.email, isArabic);
            const isCreator = quotaSummary.isCreator;

            return (
              <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/20 dark:from-slate-800/60 dark:to-slate-900 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      {isCreator ? <Crown className="w-4 h-4 text-amber-500" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{isArabic ? 'نظام الحصص اليومية للنماذج الذكية' : 'Daily AI Models Quota System'}</span>
                        {isCreator && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/30 text-amber-700 dark:text-amber-300 font-extrabold">
                            VIP
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isCreator
                          ? (isArabic ? `مرحباً بالسيد ${CREATOR_NAME} - كل شيء مجاني ومفتوح بالكامل لك لأنك صانع التطبيق 👑` : `Creator ${CREATOR_NAME} - All features unlocked 👑`)
                          : (isArabic ? '5 دقائق لكل نموذج من أقوى 3 نماذج + 3 ساعات مجمعة لباقي النماذج' : '5 min per Top 3 model + 3h pooled for others')}
                      </p>
                    </div>
                  </div>
                </div>

                {isCreator ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200">
                    <div className="font-bold flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span>{isArabic ? `تم تفعيل صلاحيات صانع التطبيق الكاملة (${CREATOR_NAME})` : `App Creator VIP Status Unlocked (${CREATOR_NAME})`}</span>
                    </div>
                    <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? 'كافة النماذج مفتوحة للاستخدام اللامحدود 24/7 بلا قيود زمنية أو حصص يومية.'
                        : 'All models are 100% unlocked with zero time limits or daily quotas.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Top 3 models card */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-slate-700 dark:text-slate-200">
                          {isArabic ? 'أقوى 3 نماذج (5 د/نموذج)' : 'Top 3 (5m each)'}
                        </span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">5:00 / يوم</span>
                      </div>
                      <div className="space-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                        {quotaSummary.topModels.map((m) => (
                          <div key={m.modelId} className="flex items-center justify-between">
                            <span className="truncate max-w-[120px]">{m.displayName}</span>
                            <span className={`font-mono font-bold ${m.isDepleted ? 'text-red-500' : 'text-emerald-500'}`}>
                              {m.formattedRemaining}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shared pool card */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-slate-700 dark:text-slate-200">
                            {isArabic ? 'باقي النماذج (مجمعة)' : 'Other Models (Pool)'}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            {quotaSummary.otherModelsPool.formattedRemaining}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          {isArabic ? 'حصة مجمعة 3 ساعات يومياً لكافة النماذج المتبقية' : '3 hours daily pooled quota'}
                        </p>
                      </div>
                      <div className="mt-2 text-[10px] text-slate-400">
                        {isArabic ? `تتجدد عند: ${quotaSummary.resetTimeFormatted}` : `Resets at: ${quotaSummary.resetTimeFormatted}`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section: Automatic Model Fallback System */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ListOrdered className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    {isArabic ? 'قائمة أولويات التبديل التلقائي بين النماذج (Model Fallback Priority)' : 'Model Fallback Priority List'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isArabic
                      ? 'يتم تجربة النماذج بترتيب الأولوية أدناه. في حال حدوث خطأ أو انتهاء الحصة، ينتقل النظام تلقائياً للنموذج التالي.'
                      : 'Models are tried sequentially in order. On failure or rate limit, automatically fails over to the next.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetFallbackList}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center gap-1 transition"
                title={isArabic ? 'استعادة الترتيب الافتراضي' : 'Reset to Default'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">{isArabic ? 'الافتراضي' : 'Reset'}</span>
              </button>
            </div>

            {/* Model Reordering & Action List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {currentFallbackList.map((modelItem, idx) => (
                <div
                  key={`${modelItem}-${idx}`}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 shadow-2xs group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {modelItem}
                    </span>
                    {modelItem.includes(':free') && (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase shrink-0">
                        {isArabic ? 'مجاني' : 'Free'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveModelUp(idx)}
                      className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
                      title={isArabic ? 'تحريك للأعلى' : 'Move Up'}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === currentFallbackList.length - 1}
                      onClick={() => handleMoveModelDown(idx)}
                      className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
                      title={isArabic ? 'تحريك للأسفل' : 'Move Down'}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentFallbackList.length <= 1}
                      onClick={() => handleRemoveModel(idx)}
                      className="p-1 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-30 disabled:hover:bg-transparent transition"
                      title={isArabic ? 'حذف النموذج' : 'Remove Model'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Presets / Suggestions */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                {isArabic ? 'إضافة سريعة لنماذج ذكاء اصطناعي إضافية (NVIDIA / Gemini / OpenRouter):' : 'Quick Add Popular AI Models:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'gemini-2.5-flash',
                  'gemini-2.5-pro',
                  'gemini-2.5-flash-lite',
                  'gemini-3.7-flash',
                  'meta/llama-3.1-405b-instruct',
                  'nvidia/llama-3.1-nemotron-70b-instruct',
                  'meta/llama-3.1-70b-instruct',
                  'qwen/qwen-2.5-72b-instruct:free',
                  'meta-llama/llama-3.1-70b-instruct:free',
                  'deepseek/deepseek-chat:free',
                  'pollinations/openai',
                  'pollinations/qwen',
                  'pollinations/mistral',
                ].map((m) => {
                  const exists = currentFallbackList.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={exists}
                      onClick={() => handleAddModel(m)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium border transition ${
                        exists
                          ? 'opacity-40 border-slate-200 dark:border-slate-800 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
                          : 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                      }`}
                    >
                      + {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Model Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                placeholder={isArabic ? 'أدخل معرف أي نموذج مخصص (مثال: openai/gpt-4o-mini)' : 'Custom model ID (e.g. openai/gpt-4o-mini)'}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleAddModel(customModelInput)}
                disabled={!customModelInput.trim()}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 transition flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إضافة' : 'Add'}</span>
              </button>
            </div>

            {/* NVIDIA Build API Key field */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isArabic ? 'مفتاح NVIDIA Build API (لتشغيل نماذج Nemotron 70B و Meta Llama 405B):' : 'NVIDIA Build API Key (For Nemotron 70B & Meta Llama 405B):'}</span>
              </label>
              <input
                type="password"
                value={localSettings.nvidiaApiKey || ''}
                onChange={(e) => {
                  const updated = { ...localSettings, nvidiaApiKey: e.target.value };
                  setLocalSettings(updated);
                  onSaveSettings(updated);
                }}
                placeholder="nvapi-..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isArabic
                  ? '⚡ يتيح لك الاستفادة من قوة المعالجة الخارقة ونماذج Llama 3.1 Nemotron 70B و Llama 3.1 405B للاستدلال والبرمجة المتقدمة.'
                  : '⚡ Unlocks ultra-high reasoning & advanced coding power with Llama 3.1 Nemotron 70B and Llama 3.1 405B.'}
              </p>
            </div>

            {/* OpenRouter API Key optional field */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? 'مفتاح OpenRouter API (لتشغيل نماذج OpenRouter):' : 'OpenRouter API Key (For OpenRouter models):'}</span>
              </label>
              <input
                type="password"
                value={localSettings.openRouterApiKey || ''}
                onChange={(e) => {
                  const updated = { ...localSettings, openRouterApiKey: e.target.value };
                  setLocalSettings(updated);
                  onSaveSettings(updated);
                }}
                placeholder="sk-or-v1-..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isArabic
                  ? '💡 عند إدخال مفتاح OpenRouter مجاني من openrouter.ai/keys، سيتم تفعيل نماذج DeepSeek وLlama وMistral وQwen. في حال عدم إدخاله، ينطوي النظام تلقائياً وبسلاسة على نماذج Gemini المنشورة.'
                  : '💡 Enter a free key from openrouter.ai/keys to enable DeepSeek, Llama, Mistral & Qwen models. If omitted, system seamlessly falls back to Gemini models.'}
              </p>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 2: Permissions Manager */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isArabic ? 'إدارة الصلاحيات (Runtime Permissions)' : 'Permissions Manager'}
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                {isArabic ? 'مقبولة بصفة دائمة 🛡️' : 'Permanently Granted 🛡️'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isArabic
                ? 'تطلب الصلاحيات مرة واحدة فقط عند بداية الاستخدام وتبقى مقبولة دائماً دون إعادة طلبها.'
                : 'Permissions are requested only once and stay permanently granted thereafter.'}
            </p>

            <div className="space-y-2">
              {[
                { key: 'calendar', title: isArabic ? 'أداة التقويم والأحداث' : 'Calendar Tool' },
                { key: 'reminders', title: isArabic ? 'أداة التنبيهات والتذكيرات' : 'Reminders Tool' },
                { key: 'microphone', title: isArabic ? 'الإدخال الصوتي (الميكروفون)' : 'Microphone STT' },
                { key: 'webSearch', title: isArabic ? 'البحث في الويب الحي' : 'Live Web Search' },
              ].map((p) => (
                <div
                  key={p.key}
                  onClick={() => handlePermissionToggle(p.key as any)}
                  className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {p.title}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      localSettings.permissions[p.key as keyof AgentSettings['permissions']]
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {localSettings.permissions[p.key as keyof AgentSettings['permissions']] && (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section: Service Worker & Offline Cache Management */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    {isArabic ? 'ذاكرة التخزين المؤقت للخدمة (Service Worker Cache)' : 'Service Worker & Offline Cache'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isArabic
                      ? 'تفريغ وتحديث كاش التطبيق (PWA) يدوياً لحل مشكلات استمرار النسخ القديمة وتفعيل التحديثات المباشرة'
                      : 'Manually clear offline SW assets cache to force application refresh and resolve stale code issues'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleClearSwCache}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>{isArabic ? 'تفريغ ذاكرة الكاش وإعادة تحميل الخدمة الآن ⚡' : 'Clear SW Cache & Reload App Shell ⚡'}</span>
              </button>
              {swCacheMessage && (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center animate-fade-in">
                  {swCacheMessage}
                </p>
              )}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 3: Privacy & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isArabic ? 'الأمان والخصوصية' : 'Security & Privacy'}
            </h4>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4 text-teal-500" />
                <span>{isArabic ? 'عرض سياسة الخصوصية' : 'Privacy Policy'}</span>
              </button>

              <button
                type="button"
                onClick={onClearMemories}
                className="px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition flex items-center gap-1.5"
              >
                <Brain className="w-4 h-4 text-purple-500" />
                <span>{isArabic ? 'تفريغ الذاكرة طويلة المدى' : 'Clear Long-term Memories'}</span>
              </button>
            </div>

            {showPrivacyPolicy && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed animate-fade-in">
                <h5 className="font-bold text-slate-800 dark:text-slate-100">
                  {isArabic ? 'سياسة الخصوصية وأمان البيانات' : 'Privacy & Data Protection'}
                </h5>
                <p>
                  {isArabic
                    ? '1. يتم تخزين كل محادثاتك، ملاحظاتك، وتفضيلاتك في جهازك محلياً بدقة وأمان.'
                    : '1. All conversations, notes, and facts are stored securely locally on your device.'}
                </p>
                <p>
                  {isArabic
                    ? '2. لا يتم مشاركة أي مفاتيح API أو معلومات حساسة مع أي طرف ثالث خارجي.'
                    : '2. No API keys or sensitive user facts are stored in public source code.'}
                </p>
                <p>
                  {isArabic
                    ? '3. خيار "حذف كل بياناتي" يمسح جميع السجلات وقاعدة البيانات بالكامل فوراً دون ردة.'
                    : '3. "Delete all my data" permanently wipes your local database immediately.'}
                </p>
              </div>
            )}

            {/* Developer Crash Reports & Telemetry Routing Destination */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {isArabic ? 'توجيه تقارير واستثناءات الأخطاء (Developer Telemetry):' : 'Developer Error Telemetry Routing:'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  {isArabic ? 'للمصنّع فقط 🛡️' : 'Creator Only 🛡️'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {isArabic
                  ? 'تقارير الانهيار والأخطاء البرمجية توجه وتُشفر حصرياً إلى سيرفر وقناة مطور التطبيق دون مشاركتها مع أي طرف ثالث أو مستخدمين آخرين.'
                  : 'All crash diagnostics and stack traces are strictly routed and encrypted to the developer server, completely shielded from third parties.'}
              </p>
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                <span>🔒 {isArabic ? 'قناة المطور المشفرة والآمنة 🛡️' : 'Private Encrypted Developer Channel 🛡️'}</span>
              </div>
            </div>

            {/* Public Support & Inquiries Email */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {isArabic ? 'الدعم الفني والتواصل مع فريق التطبيق:' : 'Technical Support & Inquiries:'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  {isArabic ? 'دعم رسمي ✉️' : 'Official Support ✉️'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {isArabic
                  ? 'لأي استفسارات، اقتراحات، أو الإبلاغ عن أي مشكلة برمجية تواجهها في التطبيق، يمكنك مراسلة الدعم الفني مباشرة:'
                  : 'For any issues, inquiries, or bug reports, you can reach out directly to our official support team:'}
              </p>
              <a
                href="mailto:adamaiproduction@gmail.com"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs transition border border-blue-500/20"
              >
                <span>📧 adamaiproduction@gmail.com</span>
              </a>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 4: Instant Data Wipe */}
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-rose-800 dark:text-rose-200">
                  {isArabic ? 'خيار حذف كل البيانات (Instant Data Wipe)' : 'Delete All My Data'}
                </h5>
                <p className="text-[11px] text-rose-600 dark:text-rose-300 mt-0.5">
                  {isArabic
                    ? 'مسح كل المحادثات، الملاحظات، الأحداث، والذاكرة نهائياً دون إمكانية للاسترجاع.'
                    : 'Wipes all chat sessions, notes, events, and memories permanently.'}
                </p>
              </div>
            </div>

            {confirmWipe ? (
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onWipeAllData();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20"
                >
                  {isArabic ? 'نعم، امسح كل البيانات الآن' : 'Yes, Wipe Everything Now'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmWipe(false)}
                  className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmWipe(true)}
                className="px-4 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-700 dark:text-rose-300 border border-rose-300/40 font-bold text-xs"
              >
                {isArabic ? 'حذف كل بياناتي' : 'Delete All My Data'}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
          >
            {isArabic ? 'حفظ الإعدادات' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
