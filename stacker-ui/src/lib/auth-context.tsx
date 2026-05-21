import { useState, useCallback } from 'react';
import { AuthContext } from './auth-context-value';
import type { AuthUser } from './auth-types';

const TOKEN_KEY = 'stacker_token';
const USER_KEY = 'stacker_user';

function loadSavedUser(): AuthUser | null {
  try {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => loadSavedUser());

  const signIn = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      isLoaded: true,
      isSignedIn: !!token,
      token,
      user,
      userId: user?.id ?? null,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
