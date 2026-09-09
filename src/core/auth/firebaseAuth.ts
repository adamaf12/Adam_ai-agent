import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

const LOCAL_USER_KEY = 'adam_cached_user_v1';

export function getCachedUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
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

export async function signInWithGoogle(): Promise<AppUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const u = result.user;
    const appUser: AppUser = {
      uid: u.uid,
      displayName: u.displayName || u.email?.split('@')[0] || 'User',
      email: u.email,
      photoURL: u.photoURL,
    };
    saveCachedUser(appUser);
    return appUser;
  } catch (error: any) {
    console.error('[Google Auth] Sign-in error:', error);
    throw error;
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
      };
      saveCachedUser(appUser);
      callback(appUser);
    } else {
      callback(getCachedUser());
    }
  });
}
