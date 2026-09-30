import { useState, useRef, useEffect } from 'react';
import { LogOut, CheckCircle2, Copy, Check, ExternalLink, ShieldAlert, UserCheck, X, UserCircle2 } from 'lucide-react';
import { useAuth } from '../core/auth/AuthContext';
import { isNativeAndroidApp } from '../core/auth/firebaseAuth';
import type { Language } from '../core/domain';

interface GoogleAuthButtonProps {
  language: Language;
  compact?: boolean;
  onUnauthenticatedClick?: () => void;
}

export function GoogleAuthButton({ language, compact = false, onUnauthenticatedClick }: GoogleAuthButtonProps) {
  const {
    user,
    loading,
    signIn,
    signInDirect,
    signInAsGuest,
    signOut,
    error,
    unauthorizedDomain,
    clearError,
    setAuthModalOpen,
  } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAr = language === 'ar';

  const handleCopyDomain = async () => {
    if (!unauthorizedDomain) return;
    try {
      await navigator.clipboard.writeText(unauthorizedDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {user ? (
        <>
          <button
            type="button"
            className="google-user-trigger"
            onClick={() => setDropdownOpen((prev) => !prev)}
            title={user.displayName || user.email || 'Google Account'}
            aria-label="Google Account Menu"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="google-user-avatar"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="google-user-avatar-placeholder">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            {!compact && (
              <span className="google-user-name desktop-only">
                {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
              </span>
            )}
            <span className="google-status-indicator" />
          </button>

          {dropdownOpen && (
            <div className="google-user-dropdown glass-panel">
              <div className="google-dropdown-header">
                <div className="google-dropdown-user-info">
                  <strong>{user.displayName || 'User'}</strong>
                  <small>{user.email}</small>
                </div>
                <div className="google-badge">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span>
                    {user.uid.startsWith('guest_') || user.uid.startsWith('android_')
                      ? isAr
                        ? 'حساب محلي نشط'
                        : 'Local Account'
                      : isAr
                      ? 'حساب Google متصل'
                      : 'Google Account'}
                  </span>
                </div>
              </div>

              <div className="google-dropdown-divider" />

              <button
                type="button"
                className="google-dropdown-logout-btn"
                onClick={() => {
                  setDropdownOpen(false);
                  signOut();
                }}
              >
                <LogOut size={14} />
                <span>{isAr ? 'تسجيل الخروج' : 'Sign out'}</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <button
          type="button"
          className={`google-user-trigger google-user-trigger--guest ${compact ? 'google-user-trigger--compact' : ''}`}
          onClick={() => onUnauthenticatedClick ? onUnauthenticatedClick() : setAuthModalOpen(true)}
          disabled={loading}
          title={isAr ? 'الملف الشخصي — تسجيل الدخول أو المتابعة كضيف' : 'Profile — sign in or continue as guest'}
          aria-label={isAr ? 'الملف الشخصي' : 'Profile'}
        >
          <span className="google-user-avatar-placeholder">
            <UserCircle2 size={compact ? 21 : 20} strokeWidth={1.7} />
          </span>
          {!compact && <span className="google-user-name desktop-only">{isAr ? 'الملف الشخصي' : 'Profile'}</span>}
        </button>
      )}

      {error && unauthorizedDomain && (
        <div className="absolute top-[calc(100%+8px)] inset-inline-end-0 w-[310px] sm:w-[360px] p-3.5 rounded-xl bg-neutral-900/95 border border-amber-500/40 text-neutral-100 shadow-2xl z-[1100] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
              <ShieldAlert size={15} />
              <span>{isAr ? 'نطاق Vercel غير مصرّح به في Firebase' : 'Unauthorized Domain in Firebase'}</span>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-[11px] text-neutral-300 leading-relaxed mb-2.5">
            {isAr
              ? 'لكي يعمل تسجيل الدخول بحساب Google على Vercel، يجب إضافة نطاق موقعك إلى قائمة Authorized Domains في Firebase Console:'
              : 'To enable Google Sign-In on Vercel, add your current domain to Authorized Domains in Firebase Console:'}
          </p>

          <div className="flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-lg bg-black/60 border border-neutral-700/60 mb-3 font-mono text-[11px]">
            <span className="truncate text-amber-200">{unauthorizedDomain}</span>
            <button
              type="button"
              onClick={handleCopyDomain}
              className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-white shrink-0 transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <a
              href="https://console.firebase.google.com/project/gen-lang-client-0046555590/authentication/settings"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-medium transition-colors"
            >
              <ExternalLink size={13} />
              <span>{isAr ? 'فتح إعدادات Firebase لإضافة النطاق' : 'Open Firebase Console Settings'}</span>
            </a>

            <button
              type="button"
              onClick={() => signInAsGuest()}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
            >
              <UserCheck size={13} />
              <span>{isAr ? 'المتابعة كزائر مؤقتاً' : 'Continue as Guest'}</span>
            </button>
          </div>
        </div>
      )}

      {error && !unauthorizedDomain && (
        <div className="google-auth-error-toast" onClick={clearError}>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
