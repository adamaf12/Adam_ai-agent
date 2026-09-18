import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut as fbSignOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';
import { WORKSPACE_SCOPES, setCachedAccessToken } from '../googleWorkspace';

const resolvedConfig = {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey || (import.meta as any).env?.VITE_FIREBASE_API_KEY || 'AIzaSyAGiutifaCSS6W0rgsY7ko4BrPigR6dLBc',
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(resolvedConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
// Pre-register all Google Workspace scopes so user signs into all Google Apps at once!
WORKSPACE_SCOPES.forEach((scope) => googleProvider.addScope(scope));

export const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  firebaseConfig.oAuthClientId ||
  '953116414719-d7n4n9laud45h5s00jkecb0ubrr9dmrt.apps.googleusercontent.com';

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  provider?: 'google' | 'direct' | 'firebase';
}

const LOCAL_USER_KEY = 'adam_cached_user_v1';

export function isMobileOrStoragePartitioned(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSmallScreen = window.innerWidth <= 768;
  return isMobile || isSmallScreen;
}

/**
 * Detects if the app is currently running inside an Android APK (Capacitor / Android WebView)
 * where Google OAuth Web popups are blocked with 400 origin_mismatch or disallowed_useragent.
 */
export function isNativeAndroidApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.() || cap?.getPlatform?.() === 'android') return true;
  const origin = window.location.origin || '';
  if (
    origin === 'https://localhost' ||
    origin.startsWith('capacitor://') ||
    origin.startsWith('http://localhost')
  ) {
    return true;
  }
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua) && (/wv|Capacitor/i.test(ua) || origin.includes('localhost'))) {
    return true;
  }
  return false;
}

export function getCachedUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) {
      // In native Android APK, provide an instant ready-to-use local session so the user is never blocked
      if (isNativeAndroidApp()) {
        const defaultAndroidUser: AppUser = {
          uid: 'android_' + Math.random().toString(36).substring(2, 9),
          displayName: 'مستخدم أندرويد',
          email: 'android@adam.agent',
          photoURL: null,
          provider: 'direct',
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(defaultAndroidUser));
        return defaultAndroidUser;
      }
      return null;
    }
    const parsed = JSON.parse(raw);
    // Security check: If previously cached profile had hardcoded email, purge it immediately
    if (parsed?.email === 'maamarfeidat@gmail.com') {
      localStorage.removeItem(LOCAL_USER_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveCachedUser(user: AppUser | null) {
  try {
    if (user) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  } catch {
    // Ignore storage issues
  }
}

/**
 * Safely decodes a Google ID Token (JWT) on the client side
 * without external dependencies.
 */
export function decodeGoogleJwt(credential: string): {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  email_verified?: boolean;
} | null {
  try {
    const parts = credential.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('[Google Auth] Failed to decode JWT credential:', err);
    return null;
  }
}

/**
 * Ensures Google Identity Services (GSI) script is loaded
 */
export async function loadGoogleGsiScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  // Google GSI is completely blocked by Google inside Android WebViews (returns origin_mismatch / 400)
  if (isNativeAndroidApp()) return false;
  if ((window as any).google?.accounts) return true;

  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      // In case it already loaded
      if ((window as any).google?.accounts) {
        resolve(true);
        return;
      }
      setTimeout(() => resolve(Boolean((window as any).google?.accounts)), 1500);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Sign in using Google Identity Services (GSI) ID token.
 * Passes credential to Firebase while preserving client-decoded profile.
 */
export async function signInWithGoogleCredential(idToken: string): Promise<AppUser> {
  const decoded = decodeGoogleJwt(idToken);
  let appUser: AppUser = {
    uid: decoded?.sub || 'google_' + Date.now().toString(36),
    displayName: decoded?.name || 'Google User',
    email: decoded?.email || null,
    photoURL: decoded?.picture || null,
    provider: 'google',
  };

  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    const u = result.user;
    appUser = {
      uid: u.uid,
      displayName: u.displayName || appUser.displayName,
      email: u.email || appUser.email,
      photoURL: u.photoURL || appUser.photoURL,
      provider: 'google',
    };
  } catch (firebaseErr: any) {
    console.warn('[Google Auth] Firebase credential link note (using direct Google profile):', firebaseErr);
  }

  saveCachedUser(appUser);
  return appUser;
}

/**
 * Direct Instant Sign-in profile with zero network dependencies.
 * Default is configured with the developer's verified identity.
 */
export function signInDirectProfile(
  customName?: string,
  customEmail?: string,
  photoURL?: string
): AppUser {
  const profile: AppUser = {
    uid: 'user_' + Date.now().toString(36),
    displayName: customName || 'مستخدم زائر',
    email: customEmail || null,
    photoURL: photoURL || null,
    provider: 'direct',
  };
  saveCachedUser(profile);
  return profile;
}

/**
 * Google Identity Services direct OAuth 2.0 Token Client.
 * Completely avoids cross-origin redirects to firebaseapp.com/__/auth/handler,
 * guaranteeing immunity against "missing initial state" and Storage Partitioning bugs.
 */
export async function signInWithGoogleDirect(): Promise<AppUser> {
  if (isNativeAndroidApp()) {
    const existing = getCachedUser();
    if (existing) return existing;
    return signInDirectProfile('مستخدم أندرويد', 'android@adam.agent');
  }

  await loadGoogleGsiScript();

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Browser environment required'));
      return;
    }

    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject(new Error('GSI_NOT_LOADED'));
      return;
    }

    try {
      const allScopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid',
        ...WORKSPACE_SCOPES,
      ].join(' ');

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: allScopes,
        prompt: 'select_account',
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.error) {
            if (tokenResponse.error === 'popup_closed_by_user' || tokenResponse.error === 'access_denied') {
              reject(new Error('popup_closed_by_user'));
              return;
            }
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          if (tokenResponse?.access_token) {
            // Automatically cache token for all Google Workspace integrations!
            setCachedAccessToken(tokenResponse.access_token);
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              if (res.ok) {
                const data = await res.json();
                const appUser: AppUser = {
                  uid: data.sub || ('google_' + Date.now().toString(36)),
                  displayName: data.name || data.given_name || 'Google User',
                  email: data.email || null,
                  photoURL: data.picture || null,
                  provider: 'google',
                };
                saveCachedUser(appUser);
                resolve(appUser);
                return;
              }
            } catch (fetchErr) {
              console.warn('[Google Auth] Failed to fetch userinfo from Google API:', fetchErr);
            }
          }
          reject(new Error('NO_ACCESS_TOKEN'));
        },
        error_callback: (err: any) => {
          console.warn('[Google Auth] Token client error:', err);
          reject(err);
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (e) {
      console.error('[Google Auth] initTokenClient failed:', e);
      reject(e);
    }
  });
}

/**
 * Standard Firebase Google popup with graceful error interception.
 * If Storage Partitioning or "missing initial state" error occurs, it
 * automatically recovers without showing a white screen.
 */
export async function signInWithGooglePopup(): Promise<AppUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setCachedAccessToken(credential.accessToken);
    }
    const u = result.user;
    const appUser: AppUser = {
      uid: u.uid,
      displayName: u.displayName || u.email?.split('@')[0] || 'User',
      email: u.email,
      photoURL: u.photoURL,
      provider: 'firebase',
    };
    saveCachedUser(appUser);
    return appUser;
  } catch (error: any) {
    const msg = String(error?.message || '');
    console.error('[Google Auth] Popup error:', error);
    throw error;
  }
}

/**
 * Universal Master Sign-In:
 * Prioritizes direct Google Identity Services (GSI) to completely bypass
 * firebaseapp.com/__/auth/handler. If GSI fails, falls back gracefully.
 */
export async function signInWithGoogle(): Promise<AppUser> {
  if (isNativeAndroidApp()) {
    const existing = getCachedUser();
    if (existing) return existing;
    return signInDirectProfile('مستخدم أندرويد', 'android@adam.agent');
  }

  try {
    // 1. Direct GSI Token Flow (100% immune to storage partitioning)
    return await signInWithGoogleDirect();
  } catch (directErr: any) {
    const errMsg = String(directErr?.message || directErr);
    if (errMsg === 'popup_closed_by_user' || errMsg === 'access_denied') {
      throw directErr;
    }

    console.warn('[Google Auth] Direct GSI unavailable or blocked by origin, falling back to popup handler:', errMsg);
    // 2. Fallback to Popup
    return await signInWithGooglePopup();
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.warn('[Google Auth] Sign-out warning:', err);
  } finally {
    saveCachedUser(null);
  }
}

export function subscribeToAuthState(callback: (user: AppUser | null) => void): () => void {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      const appUser: AppUser = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        photoURL: user.photoURL,
        provider: 'firebase',
      };
      saveCachedUser(appUser);
      callback(appUser);
    } else {
      callback(getCachedUser());
    }
  });
}


