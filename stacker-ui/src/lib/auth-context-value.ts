import { createContext } from 'react';
import type { AuthContextValue } from './auth-types';

export const AuthContext = createContext<AuthContextValue>({
  isLoaded: false,
  isSignedIn: false,
  token: null,
  user: null,
  userId: null,
  signIn: () => {},
  signOut: () => {},
});
