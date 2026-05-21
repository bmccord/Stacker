import { useContext } from 'react';
import { AuthContext } from './auth-context-value';

/** Hook to access auth state — replaces useAuth() from Clerk. */
export function useAuth() {
  return useContext(AuthContext);
}
