import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  LogIn,
  Lock,
  Copy,
  Check,
  Zap,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../core/auth/AuthContext';
import { GOOGLE_CLIENT_ID, loadGoogleGsiScript, isNativeAndroidApp } from '../core/auth/firebaseAuth';
import { AndroidOAuthSetupCard } from './AndroidOAuthSetupCard';
import type { Language } from '../core/domain';

interface AuthModalProps {
  language: Language;
}

export function AuthModal({ language }: AuthModalProps) {
  const {
    authModalOpen,
    setAuthModalOpen,
    signIn,
    signInDirect,
    signInAsGuest,
    signInWithIdToken,
    loading,
    error,
    clearError,
  } = useAuth();

  const isAr = language === 'ar';
  const isAndroid = isNativeAndroidApp();
  const [showExplanation, setShowExplanation] = useState(false);
  const [showOAuthHelp, setShowOAuthHelp] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [androidName, setAndroidName] = useState('مستخدم أندرويد');
  const [androidEmail, setAndroidEmail] = useState('');
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const gsiButtonRef = useRef<HTMLDivElement>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost';

  const handleCopyOrigin = () => {
    navigator.clipboard?.writeText(currentOrigin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  // Initialize official Google Identity Services button & One Tap (Web only)
  useEffect(() => {
    if (!authModalOpen || isAndroid) return;
    let isCancelled = false;

    async function setupGsi() {
      await loadGoogleGsiScript();
      if (isCancelled) return;

      const google = (window as any).google;
      if (google?.accounts?.id) {
        try {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (res: any) => {
              if (res?.credential) {
                signInWithIdToken(res.credential);
              }
            },
            auto_select: false,
          });

          if (gsiButtonRef.current) {
            gsiButtonRef.current.innerHTML = '';
            google.accounts.id.renderButton(gsiButtonRef.current, {
              theme: 'filled_blue',
              size: 'large',
              type: 'standard',
              shape: 'pill',
              text: isAr ? 'signin_with' : 'signin_with',
              width: 290,
              logo_alignment: 'left',
            });
          }

          // Trigger One Tap prompt if supported
          google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              // Silently ignore dismissal
            }
          });
        } catch (err) {
          console.warn('[GSI Setup] Note:', err);
        }
      }
    }

    setupGsi();
    return () => {
      isCancelled = true;
    };
  }, [authModalOpen, isAr, signInWithIdToken]);

  if (!authModalOpen) return null;

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signInAsGuest(guestName.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900/95 border border-emerald-500/30 p-5 sm:p-7 text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                {isAr ? 'تسجيل الدخول إلى آدم' : 'Sign In to Adam'}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Lock size={12} className="text-emerald-400 inline" />
                <span>{isAr ? 'حماية مشفرة وخصوصية فردية لكل مستخدم' : 'End-to-end encrypted individual sessions'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearError();
              setAuthModalOpen(false);
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Notice if any */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span>{error}</span>
            </div>
          </div>
        )}

        {isAndroid ? (
          /* Dedicated Android APK Native Session with Native Google Sign-In & Instant Access */
          <div className="space-y-4">
            {/* 1. Official Google Sign-In on Android */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm">
              <div className="text-xs font-semibold text-slate-200 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-sky-400" />
                  <span>{isAr ? 'تسجيل الدخول بحساب Google (تطبيق أندرويد)' : 'Sign In with Google (Android App)'}</span>
                </span>
                <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                  Android Native
                </span>
              </div>
              <button
                type="button"
                onClick={signIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
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
                  {loading
                    ? (isAr ? 'جاري الاتصال بـ Google...' : 'Connecting to Google...')
                    : (isAr ? 'تسجيل الدخول بحساب Google الرسمي' : 'Sign in with Google Account')}
                </span>
              </button>
            </div>

            {/* Android OAuth Setup Card */}
            <AndroidOAuthSetupCard language={language} defaultExpanded={false} />

            {/* 2. Fast Direct 1-Click Access (Safe offline fallback) */}
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-emerald-400 text-xs font-bold">
                <Smartphone size={16} />
                <span>{isAr ? 'الدخول السريع بدون إنترنت / محلي' : 'Local Fast Access (Offline Ready)'}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                {isAr
                  ? 'يمكنك أيضاً الدخول فوراً بضغطة واحدة بحساب محلي آمن على الهاتف لتجربة كل قدرات آدم والذاكرة المستمرة.'
                  : 'You can also sign in instantly with a secure local profile to access all Adam AI features.'}
              </p>
              <button
                type="button"
                onClick={() =>
                  signInDirect(
                    androidName.trim() || (isAr ? 'مستخدم أندرويد' : 'Android User'),
                    androidEmail.trim() || 'android@adam.agent'
                  )
                }
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/40 cursor-pointer"
              >
                <LogIn size={15} />
                <span>{isAr ? 'دخول فوري بضغطة واحدة' : 'Instant 1-Click Sign In'}</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                signInDirect(
                  androidName.trim() || (isAr ? 'مستخدم أندرويد' : 'Android User'),
                  androidEmail.trim() || 'android@adam.agent'
                );
              }}
              className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800"
            >
              <div className="text-xs font-semibold text-slate-200 mb-1">
                {isAr ? 'تخصيص بيانات ملفك الشخصي في التطبيق:' : 'Customize your profile information:'}
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {isAr ? 'الاسم الظاهر لآدم' : 'Display Name for Adam'}
                </label>
                <input
                  type="text"
                  value={androidName}
                  onChange={(e) => setAndroidName(e.target.value)}
                  placeholder={isAr ? 'مثال: معمر، باحث...' : 'e.g. Adam User'}
                  maxLength={35}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {isAr ? 'البريد الإلكتروني (اختياري)' : 'Email Address (Optional)'}
                </label>
                <input
                  type="email"
                  value={androidEmail}
                  onChange={(e) => setAndroidEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 dir-ltr text-left"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check size={14} className="text-emerald-400" />
                <span>{isAr ? 'حفظ وتفعيل الحساب' : 'Save & Activate Profile'}</span>
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* 1. Fast Direct 1-Click Access (Recommended for immediate usage) */}
            <div className="mb-4 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-emerald-400 text-xs font-bold">
                <Zap size={16} />
                <span>{isAr ? 'الدخول المباشر الفوري' : 'Instant Direct Access'}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                {isAr
                  ? 'تفعيل كامل لإمكانيات آدم، الذاكرة المستمرة، وسجل المحادثات فوراً دون أي قيود من Google OAuth أو رسائل origin_mismatch.'
                  : 'Full access to Adam features, persistent memory, and history without Google OAuth restrictions or origin_mismatch errors.'}
              </p>
              <button
                type="button"
                onClick={() => signInDirect(isAr ? 'مستخدم آدم' : 'Adam User')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/40 cursor-pointer"
              >
                <LogIn size={15} />
                <span>{isAr ? 'دخول فوري بضغطة واحدة' : 'Instant 1-Click Sign In'}</span>
              </button>
            </div>

            {/* 2. Official Google Identity Button */}
            <div className="mb-3.5 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-400" />
                <span>{isAr ? 'تسجيل الدخول بحساب Google' : 'Sign in with Google Account'}</span>
              </span>
              <div ref={gsiButtonRef} className="min-h-[44px] flex items-center justify-center w-full" />
            </div>

            {/* Secondary Google Direct OAuth Button */}
            <div className="mb-3">
              <button
                type="button"
                onClick={signIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-bold text-slate-100 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 shadow-sm cursor-pointer"
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
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
                <span>{isAr ? 'تسجيل الدخول عبر نافذة حسابات Google المنبثقة' : 'Sign in via Google Popup'}</span>
              </button>
            </div>

            {/* Explanation for 400: origin_mismatch */}
            <div className="mb-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <button
                type="button"
                onClick={() => setShowOAuthHelp((prev) => !prev)}
                className="w-full flex items-center justify-between text-start text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{isAr ? 'حل مشكلة خطأ 400: origin_mismatch' : 'Fix 400: origin_mismatch error'}</span>
                </div>
                {showOAuthHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showOAuthHelp && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    {isAr
                      ? 'سبب الخطأ: تمنع Google تسجيل الدخول عبر OAuth من أي نطاق أو تطبيق APK غير مسجل مسبقاً في Google Cloud Console.'
                      : 'Cause: Google OAuth blocks sign-ins from any domain or APK not pre-registered in Google Cloud Console.'}
                  </p>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-emerald-400 truncate dir-ltr">
                      {currentOrigin}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyOrigin}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedOrigin ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedOrigin ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                    </button>
                  </div>
                  <p className="text-slate-400 text-[10px]">
                    {isAr
                      ? 'إذا كنت تريد تشغيل حساب Google: أضف الرابط أعلاه في Google Cloud Console > APIs & Services > Credentials > OAuth Client > Authorized JavaScript origins.'
                      : 'To enable Google account: add the URL above to Google Cloud Console > APIs & Services > Credentials > OAuth Client > Authorized JavaScript origins.'}
                  </p>
                </div>
              )}
            </div>

            {/* Guest / Custom Session */}
            <div className="mb-3.5 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              {!showGuestForm ? (
                <button
                  type="button"
                  onClick={() => setShowGuestForm(true)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-700 hover:border-emerald-500/50 bg-slate-900/60 hover:bg-slate-800/80 text-xs font-semibold text-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserIcon size={14} className="text-emerald-400" />
                  <span>{isAr ? 'الدخول باسم مخصص أو كزائر' : 'Sign in with custom name or guest'}</span>
                </button>
              ) : (
                <form onSubmit={handleGuestSubmit} className="space-y-2.5">
                  <label className="block text-[11px] text-slate-400 font-medium">
                    {isAr ? 'اسمك أو اسم الجلسة الخاصة:' : 'Your display name or session tag:'}
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder={isAr ? 'مثال: باحث، زائر...' : 'e.g. Guest User...'}
                    maxLength={30}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogIn size={14} />
                      <span>{isAr ? 'دخول الجلسة' : 'Start Session'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGuestForm(false)}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all cursor-pointer"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </form>
              )}
            </div>
            {/* Android OAuth Card for App Builders */}
            <div className="mb-3.5">
              <AndroidOAuthSetupCard language={language} defaultExpanded={false} />
            </div>
          </>
        )}

        {/* Technical Guarantee Note */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3">
          <button
            type="button"
            onClick={() => setShowExplanation((prev) => !prev)}
            className="w-full flex items-center justify-between text-start text-[11px] text-slate-400 hover:text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <HelpCircle size={14} className="text-emerald-400" />
              <span>
                {isAr
                  ? 'معايير الأمان وعزل الجلسات'
                  : 'Security standards and session isolation'}
              </span>
            </div>
            {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showExplanation && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2 leading-relaxed">
              <p>
                {isAr
                  ? 'كل مستخدم يحصل على جلسة خاصة به مشفرة محلياً. لا يمكن لأي مستخدم آخر رؤية بياناتك أو حسابك أو التدخل في ذكرياتك وسجلاتك.'
                  : 'Each user is isolated in their own encrypted container. No user can access or view another user’s email, data, or saved records.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
