import { useEffect, useState, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, Globe, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { Language } from '../core/domain';
import { isApkOrWebView } from '../core/utils/mobileWebHandler';
import { getResolvedApiBase } from '../core/ai/client';

interface NetworkSentinelProps {
  language: Language;
}

export function NetworkSentinel({ language }: NetworkSentinelProps) {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  });
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [justRestored, setJustRestored] = useState<boolean>(false);
  const isApk = isApkOrWebView();

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      // Fast ping to verify real internet connectivity (not just local interface up)
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const apiBase = getResolvedApiBase();
      const testUrl = apiBase ? `${apiBase}/api/health` : '/api/health';
      
      const res = await fetch(testUrl, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timer);

      if (res && res.ok) {
        if (!isOnline) {
          setJustRestored(true);
          setTimeout(() => setJustRestored(false), 4000);
        }
        setIsOnline(true);
      } else {
        // Test external fallback ping if server is remote
        const pingExternal = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
        }).then(() => true).catch(() => false);
        
        if (pingExternal && !isOnline) {
          setJustRestored(true);
          setTimeout(() => setJustRestored(false), 4000);
        }
        setIsOnline(pingExternal);
      }
    } catch {
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setIsOnline(false);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  if (isOnline && !justRestored) {
    return null;
  }

  if (justRestored) {
    return (
      <div
        className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-fadeIn"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="quick-liquid-glass p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/90 shadow-2xl backdrop-blur-2xl text-emerald-200 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="text-xs font-semibold">
            {language === 'ar'
              ? 'تم استعادة الاتصال بالإنترنت وسيرفر ADEM بنجاح 🟢'
              : 'Internet & live ADEM server connection restored 🟢'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-fadeIn"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="quick-liquid-glass p-4 rounded-2xl border border-red-500/40 bg-slate-950/90 shadow-2xl backdrop-blur-2xl text-[var(--text)]">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">
            <WifiOff size={20} className="animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <strong className="text-xs font-bold text-red-300">
                {language === 'ar' ? 'انقطع الاتصال بالإنترنت' : 'Internet Connection Required'}
              </strong>
              {isApk && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  APK Online Mode
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              {language === 'ar'
                ? 'يعمل التطبيق بالاتصال المباشر بالإنترنت لضمان جلب أدق وأحدث المعلومات الموثوقة من الويب.'
                : 'The application requires an active internet connection to fetch 100% verified, accurate, and live web information.'}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={checkConnection}
                disabled={isChecking}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent)] text-slate-950 hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
                <span>{language === 'ar' ? 'إعادة فحص الاتصال' : 'Check Connection'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
