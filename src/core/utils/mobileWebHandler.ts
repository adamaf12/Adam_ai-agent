/**
 * Mobile & APK Universal Web Safety Handler
 * Ensures external web links, websites, and web apps open seamlessly on mobile
 * and within APK environments (Capacitor/WebView/TWA) without crashing, getting trapped,
 * or breaking the user interface.
 */

export interface OpenWebOptions {
  title?: string;
  forceExternal?: boolean;
}

/**
 * Detects whether the current device is a mobile phone/tablet or small viewport
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(ua);
  const touchPoints = (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
  const smallScreen = window.innerWidth <= 820;
  return mobileUa || (touchPoints && smallScreen);
}

/**
 * Detects if the app is running inside an APK, WebView, or standalone PWA environment
 */
export function isApkOrWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  const isAndroidWebView = /Android.*(wv|\.0\.0\.0|Version\/[\d.]+\s+Chrome\/)/i.test(ua);
  return isCapacitor || isStandalone || isAndroidWebView;
}

/**
 * Safely opens an external website or web application on mobile & APK
 * Guarantees the user is never trapped in a broken state or experiencing a white screen
 */
export function openSafeExternalUrl(rawUrl: string, options: OpenWebOptions = {}) {
  if (typeof window === 'undefined') return;

  let validUrl = String(rawUrl || '').trim();
  if (!validUrl) return;

  // Ensure scheme
  if (!/^https?:\/\//i.test(validUrl)) {
    validUrl = 'https://' + validUrl;
  }

  const { title, forceExternal = false } = options;
  const isMobile = isMobileDevice();
  const isApk = isApkOrWebView();

  // On Mobile or in APK, prefer opening the In-App Safe Web Viewer Modal
  // with quick navigation back to the app and a 1-tap button to open in external browser
  if ((isMobile || isApk) && !forceExternal) {
    window.dispatchEvent(
      new CustomEvent('adam_open_inapp_browser', {
        detail: {
          url: validUrl,
          title: title || formatDomainTitle(validUrl),
        },
      })
    );
    return;
  }

  // Fallback: Safe Anchor Click to bypass aggressive mobile popup blockers
  try {
    const link = document.createElement('a');
    link.href = validUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 150);
  } catch {
    try {
      window.open(validUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = validUrl;
    }
  }
}

function formatDomainTitle(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return 'Website';
  }
}

/**
 * Robust Android Hardware Back Button Hook for APK / PWA environments
 * Prevents accidental exit from the APK when the user wants to go back
 */
export function setupAndroidBackGuard(onBackRequested: () => boolean): () => void {
  if (typeof window === 'undefined') return () => {};

  // Push an initial history state if not present so popstate fires on back button
  try {
    if (!window.history.state || !window.history.state.adamApp) {
      window.history.replaceState({ adamApp: true, step: 0 }, document.title);
      window.history.pushState({ adamApp: true, step: 1 }, document.title);
    }
  } catch {
    // ignore
  }

  const handlePopState = (e: PopStateEvent) => {
    // Call the handler to check if a modal / in-app view can be closed
    const handled = onBackRequested();
    if (handled) {
      // Re-push state so subsequent back presses are still intercepted
      try {
        window.history.pushState({ adamApp: true, step: Date.now() }, document.title);
      } catch {
        // ignore
      }
    }
  };

  window.addEventListener('popstate', handlePopState);
  return () => {
    window.removeEventListener('popstate', handlePopState);
  };
}
