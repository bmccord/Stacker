export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
}

export interface AuthContextValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  token: string | null;
  user: AuthUser | null;
  userId: string | null;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
}
