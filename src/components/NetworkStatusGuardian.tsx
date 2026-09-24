import React, { useEffect, useState, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getResolvedApiBase, isNativeApp } from '../core/ai/client';

interface NetworkStatusGuardianProps {
  language?: 'ar' | 'en';
}

export function NetworkStatusGuardian({ language = 'ar' }: NetworkStatusGuardianProps) {
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isServerReachable, setIsServerReachable] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showRestoredNotice, setShowRestoredNotice] = useState<boolean>(false);
  const isAr = language === 'ar';

  const checkLiveConnectivity = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setIsServerReachable(false);
      return;
    }

    setIsChecking(true);
    const apiBase = getResolvedApiBase();
    const testUrl = apiBase ? `${apiBase}/api/health` : '/api/health';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(testUrl, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        if (!isOnline || !isServerReachable) {
          setShowRestoredNotice(true);
          setTimeout(() => setShowRestoredNotice(false), 4500);
        }
        setIsOnline(true);
        setIsServerReachable(true);
      } else {
        setIsServerReachable(false);
      }
    } catch {
      // If health check failed, check standard internet connectivity
      try {
        const pingRes = await fetch('https://www.google.com/favicon.ico', {
          mode: 'no-cors',
          cache: 'no-store',
        });
        setIsOnline(true);
        setIsServerReachable(true);
      } catch {
        setIsOnline(false);
        setIsServerReachable(false);
      }
    } finally {
      setIsChecking(false);
    }
  }, [isOnline, isServerReachable]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkLiveConnectivity();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsServerReachable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkLiveConnectivity();

    // Heartbeat every 45s to ensure live connectivity
    const interval = setInterval(checkLiveConnectivity, 45_000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkLiveConnectivity]);

  if (isOnline && isServerReachable && !showRestoredNotice) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] w-auto animate-fadeIn pointer-events-auto select-none"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {showRestoredNotice ? (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 backdrop-blur-xl shadow-2xl text-xs font-semibold">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>
            {isAr
              ? 'تم استعادة الاتصال بالإنترنت وسيرفر ADEM الحي بنجاح 🟢'
              : 'Internet and ADEM live server connection restored 🟢'}
          </span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-3 p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-slate-950/95 text-slate-100 border border-rose-500/40 backdrop-blur-2xl shadow-2xl text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <WifiOff size={16} className="animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle size={13} />
                <span>
                  {isAr ? 'يلزم وجود اتصال بالإنترنت' : 'Internet Connection Required'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 max-w-sm leading-relaxed">
                {isAr
                  ? 'يعمل ADEM حصرياً بالاتصال بالإنترنت والبحث الحي لجلب معلومات دقيقة وصحيحة 100%.'
                  : 'ADEM operates strictly with active internet for verified real-time accurate information.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => checkLiveConnectivity()}
            disabled={isChecking}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs transition-all cursor-pointer shadow-md shrink-0 w-full sm:w-auto"
          >
            <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
            <span>{isAr ? (isChecking ? 'جارٍ الفحص...' : 'إعادة الاتصال') : isChecking ? 'Checking...' : 'Retry Connection'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
