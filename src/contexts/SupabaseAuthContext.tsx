import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { User, Session } from '@supabase/supabase-js';

// Firebase-compatible user type: extends Supabase User with aliases for legacy properties.
// uid mirrors id, emailVerified mirrors email_confirmed_at — allows unmigrated components to
// continue compiling without modification until they are individually migrated.
export type CompatUser = User & {
  uid: string;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
};

interface AuthContextType {
  user: CompatUser | null;
  session: Session | null;
  loading: boolean;
  userFriends: string[];
  login: (email: string, password: string) => Promise<CompatUser | null>;
  register: (email: string, password: string, displayName: string) => Promise<CompatUser | null>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Add Firebase-compatible alias properties to a Supabase User. */
function toCompatUser(user: User): CompatUser {
  return Object.assign(Object.create(Object.getPrototypeOf(user)), user, {
    uid: user.id,
    emailVerified: !!user.email_confirmed_at,
    displayName: (user.user_metadata?.display_name as string | undefined) ?? user.email ?? null,
    photoURL: (user.user_metadata?.photo_url as string | undefined) ?? null,
  });
}

export const SupabaseAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useSupabaseAuth();

  const value = useMemo((): AuthContextType => ({
    user: auth.user ? toCompatUser(auth.user) : null,
    session: auth.session,
    loading: auth.loading,
    userFriends: auth.userFriends,
    login: async (email, password) => {
      const u = await auth.login(email, password);
      return u ? toCompatUser(u) : null;
    },
    register: async (email, password, displayName) => {
      const u = await auth.register(email, password, displayName);
      return u ? toCompatUser(u) : null;
    },
    signInWithGoogle: auth.signInWithGoogle,
    signOut: auth.signOut,
  }), [auth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
