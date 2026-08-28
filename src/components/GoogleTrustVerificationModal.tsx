import React, { useState } from 'react';
import { X, ShieldCheck, RefreshCw, UserCheck } from 'lucide-react';
import { fastGoogleSignIn } from '../lib/workspaceAuth';
import { User as FirebaseUser } from 'firebase/auth';
import { maskEmailAddress } from '../lib/quotaManager';

interface GoogleTrustVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic: boolean;
  currentUser: FirebaseUser | null;
  onAuthSuccess?: () => void;
}

export const GoogleTrustVerificationModal: React.FC<GoogleTrustVerificationModalProps> = ({
  isOpen,
  onClose,
  isArabic,
  currentUser,
  onAuthSuccess,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstantGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      await fastGoogleSignIn();
      if (onAuthSuccess) onAuthSuccess();
      onClose();
    } catch (err: any) {
      console.error('Fast Google sign-in failed:', err);
      setErrorMsg(err?.message || (isArabic ? 'فشل تسجيل الدخول، يرجى المحاولة ثانية' : 'Sign in failed, please try again'));
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (X) */}
        <button
          onClick={onClose}
          className={`absolute top-4 ${isArabic ? 'left-4' : 'right-4'} p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors z-10`}
          style={{ touchAction: 'manipulation' }}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 flex flex-col items-center text-center space-y-7 mt-4">
          
          <div className="w-24 h-24 bg-gradient-to-tr from-emerald-100 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/20 rounded-full flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-12 h-12 text-emerald-500" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isArabic ? 'تسجيل الدخول' : 'Sign In'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 px-2 leading-relaxed">
              {isArabic 
                ? 'استخدم حساب قوقل الخاص بك للوصول إلى كافة المميزات وحفظ بياناتك بأمان تام.' 
                : 'Securely sign in with your Google account to access all features and sync your data.'}
            </p>
          </div>

          {errorMsg && (
            <div className="w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold leading-relaxed">
              {errorMsg}
            </div>
          )}

          {currentUser ? (
            <div className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center gap-4 text-left dir-ltr">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || ''}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                  {currentUser.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.displayName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {maskEmailAddress(currentUser.email)}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleInstantGoogleSignIn}
              disabled={isSigningIn}
              className="w-full relative flex items-center justify-center gap-3 py-4 px-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:shadow-md text-slate-700 font-extrabold text-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
              style={{ touchAction: 'manipulation' }}
            >
              {isSigningIn ? (
                <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
              ) : (
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>{isSigningIn ? (isArabic ? 'جاري تسجيل الدخول...' : 'Signing in...') : (isArabic ? 'المتابعة باستخدام Google' : 'Continue with Google')}</span>
            </button>
          )}

          {/* Fallback Cancel text button */}
          <button
            onClick={onClose}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-2 px-6"
            style={{ touchAction: 'manipulation' }}
          >
            {isArabic ? 'تخطي وإغلاق' : 'Skip & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
