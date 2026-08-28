import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { setActiveUserId } from './storage';

// Ensure single Firebase app instance
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// Handle redirect sign-in result if used
if (typeof window !== 'undefined') {
  getRedirectResult(auth)
    .then((result) => {
      if (result?.user) {
        setActiveUserId(result.user.uid);
      }
    })
    .catch((err) => {
      console.warn('Redirect result warning:', err);
    });
}

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/calendar',
];

// 1. Fast & Trusted Profile Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Alias for compatibility
export const fastGoogleProvider = googleProvider;

// 2. Full Workspace Scopes Provider
const workspaceGoogleProvider = new GoogleAuthProvider();
workspaceGoogleProvider.setCustomParameters({
  prompt: 'select_account',
});
WORKSPACE_SCOPES.forEach((scope) => {
  workspaceGoogleProvider.addScope(scope);
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize active user partition immediately on auth change
onAuthStateChanged(auth, (user) => {
  if (user) {
    setActiveUserId(user.uid);
  } else {
    setActiveUserId(null);
  }
});

/**
 * Initialize Firebase Auth listener and maintain cached access token in memory.
 */
export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      setActiveUserId(user.uid);
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      setActiveUserId(null);
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Helper wrapper with timeout to prevent hanging if absolutely necessary
const signInWithPopupWithTimeout = async (authInstance: any, provider: any, timeoutMs = 60000) => {
  return Promise.race([
    signInWithPopup(authInstance, provider),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AUTH_TIMEOUT: Sign-in took too long (1 minute) or was blocked.')), timeoutMs)
    ),
  ]);
};

/**
 * Fast, official, friction-free Google Sign-In.
 */
export const fastGoogleSignIn = async (): Promise<User> => {
  try {
    isSigningIn = true;
    // Check if running inside iframe where popups often hang or get blocked
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
    
    let result: any;
    try {
      result = await signInWithPopupWithTimeout(auth, fastGoogleProvider, 60000);
    } catch (popupErr: any) {
      console.warn('Popup sign-in blocked or failed:', popupErr);
      if (isInIframe && (popupErr?.code === 'auth/popup-blocked' || popupErr?.message?.includes('AUTH_TIMEOUT'))) {
        throw new Error('Popup blocked by browser iframe. Please click the "Open in new tab" icon (top right) to sign in smoothly.');
      }
      throw popupErr;
    }

    if (result?.user) {
      setActiveUserId(result.user.uid);
    }
    return result.user;
  } catch (error: any) {
    console.error('Fast Google sign-in error:', error);
    if (error?.code === 'auth/access-denied' || error?.message?.includes('access_denied') || error?.message?.includes('testing mode')) {
      throw new Error(
        'Google Auth Access Denied: Your Firebase project OAuth consent screen is in "Testing" mode and this email is not added as a test user in Google Cloud Console, or the app needs to be published.'
      );
    }
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user' || error?.message?.includes('AUTH_TIMEOUT')) {
      throw new Error(
        'Sign-in was cancelled or blocked by the browser. Please allow popups or open in a new tab.'
      );
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Trigger Sign-In with Google popup to obtain user access token for Workspace APIs.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    let result: any;
    try {
      result = await signInWithPopupWithTimeout(auth, workspaceGoogleProvider, 60000);
    } catch (popupErr: any) {
      throw popupErr;
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token');
    }

    cachedAccessToken = credential.accessToken;
    if (result.user) {
      setActiveUserId(result.user.uid);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.warn('Google Workspace full scope error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current cached in-memory access token.
 */
export const getWorkspaceAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Set workspace access token manually (if retrieved from login flow).
 */
export const setWorkspaceAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Sign out user, reset active user partition, and clear token cache.
 */
export const logoutWorkspace = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  setActiveUserId(null);
};

