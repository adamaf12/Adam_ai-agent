import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  type AppUser,
  getCachedUser,
  saveCachedUser,
  signInWithGoogle,
  signInWithGoogleCredential,
  signInDirectProfile,
  signOutUser,
  subscribeToAuthState,
  isMobileOrStoragePartitioned,
} from './firebaseAuth';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  unauthorizedDomain: string | null;
  isMobile: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  signIn: () => Promise<void>;
  signInDirect: (name?: string, email?: string) => void;
  signInWithIdToken: (idToken: string) => Promise<void>;
  signInAsGuest: (name?: string) => void;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => getCachedUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    setIsMobile(isMobileOrStoragePartitioned());
    const handleResize = () => setIsMobile(isMobileOrStoragePartitioned());
    window.addEventListener('resize', handleResize);

    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setError(null);
    setUnauthorizedDomain(null);
    setLoading(true);
    try {
      const signedInUser = await signInWithGoogle();
      setUser(signedInUser);
      setAuthModalOpen(false);
    } catch (err: any) {
      console.error('[AuthProvider] Failed to sign in:', err);
      const msg = String(err?.message || '');
      if (err?.code === 'auth/popup-closed-by-user' || msg === 'popup_closed_by_user') {
        setError(null);
      } else if (err?.code === 'auth/popup-blocked') {
        setError('تم حظر النافذة المنبثقة بواسطة المتصفح. يرجى السماح بالنوافذ المنبثقة لتسجيل الدخول.');
      } else if (
        msg.includes('missing initial state') ||
        msg.includes('sessionStorage') ||
        msg.includes('storage-partitioned') ||
        msg === 'GSI_NOT_LOADED'
      ) {
        setError('تعذر إكمال المصادقة التلقائية. يرجى تجربة تسجيل الدخول بحساب Google أو الدخول كزائر.');
      } else if (err?.code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'run.app';
        setUnauthorizedDomain(host);
        setError(`النطاق (${host}) غير مصرح به في Firebase Authentication.`);
      } else {
        setError(err?.message || 'تعذر تسجيل الدخول بحساب Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithIdToken = async (idToken: string) => {
    setError(null);
    setLoading(true);
    try {
      const signedInUser = await signInWithGoogleCredential(idToken);
      setUser(signedInUser);
      setAuthModalOpen(false);
    } catch (err: any) {
      console.error('[AuthProvider] GSI credential failed:', err);
      setError('تعذر التحقق من حساب Google عبر One Tap.');
    } finally {
      setLoading(false);
    }
  };

  const signInDirect = (customName?: string, customEmail?: string) => {
    const directUser = signInDirectProfile(
      customName || 'مستخدم آدم',
      customEmail || 'user@adam.agent'
    );
    setUser(directUser);
    setError(null);
    setUnauthorizedDomain(null);
    setAuthModalOpen(false);
  };

  const signInAsGuest = (customName?: string) => {
    signInDirect(customName || 'مستخدم زائر', 'guest@adam.agent');
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
      setUser(null);
    } catch (err: any) {
      console.error('[AuthProvider] Failed to sign out:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        unauthorizedDomain,
        isMobile,
        authModalOpen,
        setAuthModalOpen,
        signIn: handleSignIn,
        signInDirect,
        signInWithIdToken: handleSignInWithIdToken,
        signInAsGuest,
        signOut: handleSignOut,
        clearError: () => {
          setError(null);
          setUnauthorizedDomain(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
