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
  signInWithGoogle,
  signOutUser,
  subscribeToAuthState,
} from './firebaseAuth';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => getCachedUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const signedInUser = await signInWithGoogle();
      setUser(signedInUser);
    } catch (err: any) {
      console.error('[AuthProvider] Failed to sign in:', err);
      // Friendly message
      if (err?.code === 'auth/popup-closed-by-user') {
        setError(null);
      } else if (err?.code === 'auth/popup-blocked') {
        setError('تم حظر النافذة المنبثقة، يرجى السماح بالنوافذ المنبثقة لتسجيل الدخول.');
      } else {
        setError(err?.message || 'تعذر تسجيل الدخول بحساب Google');
      }
    } finally {
      setLoading(false);
    }
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
        signIn: handleSignIn,
        signOut: handleSignOut,
        clearError: () => setError(null),
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
