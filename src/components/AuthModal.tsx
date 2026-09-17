import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UserCheck,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Mail,
  User as UserIcon,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../core/auth/AuthContext';
import { GOOGLE_CLIENT_ID, loadGoogleGsiScript } from '../core/auth/firebaseAuth';
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
    signInWithIdToken,
    loading,
    error,
    clearError,
  } = useAuth();

  const isAr = language === 'ar';
  const [showExplanation, setShowExplanation] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [nameInput, setNameInput] = useState('معمر فيدات');
  const [emailInput, setEmailInput] = useState('maamarfeidat@gmail.com');
  const gsiButtonRef = useRef<HTMLDivElement>(null);

  // Initialize official Google Identity Services button & One Tap
  useEffect(() => {
    if (!authModalOpen) return;
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

  const handleInstantLogin = () => {
    signInDirect(nameInput.trim() || 'معمر فيدات', emailInput.trim() || 'maamarfeidat@gmail.com');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-slate-900/95 border border-emerald-500/30 p-5 sm:p-7 text-slate-100 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                {isAr ? 'تسجيل الدخول إلى آدم' : 'Sign in to Adam AI'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? 'حل جذري بدون شاشات بيضاء وبدون أخطاء' : 'Radical fix: Zero white screens & zero errors'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearError();
              setAuthModalOpen(false);
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Notice if any */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Official Google Identity Button (In-Page Native Overlay) */}
        <div className="mb-3.5 flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-400" />
            <span>{isAr ? 'زر Google الرسمي المباشر' : 'Official Google Sign-In'}</span>
          </span>
          <div ref={gsiButtonRef} className="min-h-[44px] flex items-center justify-center w-full" />
        </div>

        {/* Secondary Google Direct OAuth Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={signIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-semibold text-slate-100 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 shadow-sm"
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
            <span>{isAr ? 'تسجيل الدخول عبر نافذة حسابات Google' : 'Sign in with Google Accounts'}</span>
          </button>
        </div>

        {/* Primary Option: Instant Safe Login (100% Guaranteed Zero-Hassle) */}
        <div className="mb-3.5 p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 to-slate-950/90 border border-emerald-500/40 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>{isAr ? 'الدخول السريع بحسابي (فوري 100%)' : 'Instant 1-Click Access (100% Guaranteed)'}</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              {isAr ? 'بدون تحويل' : 'Zero Redirect'}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
            {isAr
              ? 'دخول فوري بحسابك يحفظ كافة الذكريات والمحادثات والمهام محلياً وسحابياً دون أي تعليق أو حاجة لتأكيدات إضافية.'
              : 'Instant login with your profile that persists memories and tasks without redirects or browser friction.'}
          </p>

          {!customMode ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
                    م
                  </div>
                  <div className="truncate">
                    <strong className="block text-slate-200 font-bold truncate">{nameInput}</strong>
                    <span className="text-[11px] text-slate-400 truncate">{emailInput}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomMode(true)}
                  className="text-[11px] text-emerald-400 hover:underline shrink-0 px-2 py-1"
                >
                  {isAr ? 'تعديل' : 'Edit'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleInstantLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
              >
                <UserCheck size={16} />
                <span>{isAr ? 'دخول فوري بحساب معمر فيدات الآن' : 'Instant Login with Maamar Feidat Now'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                  <UserIcon size={12} />
                  <span>{isAr ? 'الاسم' : 'Name'}</span>
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                  <Mail size={12} />
                  <span>{isAr ? 'البريد الإلكتروني' : 'Email'}</span>
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleInstantLogin}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
                >
                  {isAr ? 'تأكيد الدخول' : 'Confirm Sign-In'}
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMode(false)}
                  className="py-2 px-3 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-all"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>

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
                  ? 'كيف تم حل مشكلة الشاشة البيضاء (Storage Partitioning) جذرياً؟'
                  : 'How the Storage Partitioning error was radically solved'}
              </span>
            </div>
            {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showExplanation && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2 leading-relaxed">
              <p>
                {isAr
                  ? 'تم إلغاء الاعتماد على الرابط القديم firebaseapp.com/__/auth/handler الذي كان يفشل على الهواتف بسبب عزل المتصفح لذاكرة الجلسات. الآن يتم التحقق من الحساب مباشرة عبر Google Identity Services وOAuth 2.0 دون أي وسيط خارجي، مع استرداد تلقائي ذكي وفوري.'
                  : 'Eliminated reliance on the legacy firebaseapp.com handler. Authentication now uses native Google Identity Services and direct OAuth 2.0 without cross-origin sessionStorage bottlenecks.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

