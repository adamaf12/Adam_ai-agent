/**
 * Android and Web Permission Orchestrator for Adam AI Agent
 * Ensures full operational freedom:
 * - SYSTEM_ALERT_WINDOW (Display over other apps / Overlay)
 * - Battery optimization bypass (Prevent system background kill)
 * - Camera & Microphone (Vision and Speech)
 * - Location (Geospatial navigation)
 * - Notifications (Background alerts & system updates)
 * - Storage / Media
 */

declare global {
  interface Window {
    AndroidApp?: {
      hasOverlayPermission: () => boolean;
      requestOverlayPermission: () => void;
      requestAllPermissions: () => void;
      requestIgnoreBattery: () => void;
      openAppSettings: () => void;
      signInWithGoogle: (serverClientId: string) => void;
      signOutGoogle: () => void;
      getPackageNameString: () => string;
    };
    onAndroidGoogleSignIn?: (userJsonString: string) => void;
    onAndroidGoogleSignInError?: (errorJsonString: string) => void;
  }
}

export const ANDROID_OAUTH_CONFIG = {
  packageName: 'com.adam.aiagent',
  sha1: 'CA:61:BD:E6:8E:CD:E3:01:E5:0D:E3:B1:95:93:6A:74:F8:E9:D5:C1',
  sha256: 'CC:C7:7D:A3:52:5B:0E:01:7E:52:D6:75:12:6F:3A:27:D7:0D:24:0F:FF:10:8C:0F:BA:E6:24:B4:DE:FC:C3:4A',
  projectId: 'gen-lang-client-0046555590',
  createClientUrl: 'https://console.cloud.google.com/auth/clients/create?hl=ar&project=gen-lang-client-0046555590',
};

export function isAndroidNative(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.AndroidApp || !!(window as any).Capacitor?.isNativePlatform?.();
}

export interface PermissionStatusSummary {
  hasOverlay: boolean;
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  geolocation: 'granted' | 'denied' | 'prompt' | 'unknown';
  notifications: 'granted' | 'denied' | 'default' | 'unknown';
}

export async function checkPermissionsStatus(): Promise<PermissionStatusSummary> {
  const result: PermissionStatusSummary = {
    hasOverlay: false,
    microphone: 'unknown',
    camera: 'unknown',
    geolocation: 'unknown',
    notifications: 'unknown',
  };

  if (typeof window === 'undefined') return result;

  // Check Android overlay
  if (window.AndroidApp && typeof window.AndroidApp.hasOverlayPermission === 'function') {
    try {
      result.hasOverlay = window.AndroidApp.hasOverlayPermission();
    } catch {
      result.hasOverlay = false;
    }
  }

  // Check Notifications
  if (typeof Notification !== 'undefined') {
    result.notifications = Notification.permission;
  }

  // Check standard web permissions
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      result.microphone = micStatus.state;
    } catch {}

    try {
      const camStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      result.camera = camStatus.state;
    } catch {}

    try {
      const geoStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      result.geolocation = geoStatus.state;
    } catch {}
  }

  return result;
}

export async function requestAllPermissions(options?: { promptOverlay?: boolean }): Promise<void> {
  // 1. If running inside native Android app with our Java bridge
  if (window.AndroidApp) {
    try {
      window.AndroidApp.requestAllPermissions();
      if (options?.promptOverlay !== false) {
        setTimeout(() => {
          window.AndroidApp?.requestOverlayPermission();
        }, 1200);
      }
      return;
    } catch (err) {
      console.warn('Native AndroidApp permission call failed, falling back to Web APIs', err);
    }
  }

  // 2. Browser / PWA / Web fallback permission requests
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  } catch {}

  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      // Stop stream immediately after acquiring permission
      stream.getTracks().forEach((track) => track.stop());
    }
  } catch {
    // If combined audio/video fails, try audio alone
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getTracks().forEach((track) => track.stop());
      }
    } catch {}
  }

  try {
    if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {},
        { timeout: 5000, enableHighAccuracy: true }
      );
    }
  } catch {}
}

export function requestOverlayPermission(): void {
  if (window.AndroidApp) {
    window.AndroidApp.requestOverlayPermission();
  } else {
    alert('إذن الظهور فوق التطبيقات مخصص لتطبيق أندرويد APK المرفق.');
  }
}

export function requestIgnoreBatteryOptimization(): void {
  if (window.AndroidApp) {
    window.AndroidApp.requestIgnoreBattery();
  }
}

export function openAppSettings(): void {
  if (window.AndroidApp) {
    window.AndroidApp.openAppSettings();
  }
}

export interface AndroidGoogleUserPayload {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  idToken?: string;
  serverAuthCode?: string;
}

export function startAndroidGoogleSignIn(serverClientId: string): Promise<AndroidGoogleUserPayload> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.AndroidApp?.signInWithGoogle) {
      reject(new Error('ميزة تسجيل الدخول عبر Google لأندرويد مخصصة لبيئة التطبيق الأصلي.'));
      return;
    }

    const timeout = setTimeout(() => {
      window.onAndroidGoogleSignIn = undefined;
      window.onAndroidGoogleSignInError = undefined;
      reject(new Error('انتهت مهلة تسجيل الدخول عبر Google.'));
    }, 90000);

    window.onAndroidGoogleSignIn = (jsonStr: string) => {
      clearTimeout(timeout);
      window.onAndroidGoogleSignIn = undefined;
      window.onAndroidGoogleSignInError = undefined;
      try {
        const payload: AndroidGoogleUserPayload = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
        resolve(payload);
      } catch (err: any) {
        reject(new Error('فشل معالجة بيانات الحساب المستلمة: ' + err?.message));
      }
    };

    window.onAndroidGoogleSignInError = (errJsonStr: string) => {
      clearTimeout(timeout);
      window.onAndroidGoogleSignIn = undefined;
      window.onAndroidGoogleSignInError = undefined;
      try {
        const parsed = typeof errJsonStr === 'string' ? JSON.parse(errJsonStr) : errJsonStr;
        const msg = parsed?.error || errJsonStr || 'فشل تسجيل الدخول عبر Google';
        reject(new Error(msg));
      } catch {
        reject(new Error(errJsonStr || 'فشل تسجيل الدخول عبر Google'));
      }
    };

    window.AndroidApp.signInWithGoogle(serverClientId);
  });
}

export function signOutAndroidGoogle(): void {
  if (typeof window !== 'undefined' && window.AndroidApp?.signOutGoogle) {
    try {
      window.AndroidApp.signOutGoogle();
    } catch {}
  }
}
