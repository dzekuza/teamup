import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userFriends, setUserFriends] = useState<string[]>([]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch friends when user changes
  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) {
        setUserFriends([]);
        return;
      }

      const { data, error } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching friends:', error);
        setUserFriends([]);
        return;
      }

      setUserFriends(data?.map(f => f.friend_id) ?? []);
    };

    fetchFriends();
  }, [user]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  };

  const register = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          photo_url: 'Avatar1',
        },
      },
    });
    if (error) throw error;

    // Update profile with display name (trigger creates profile, we update it)
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', data.user.id);
    }

    return data.user;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    // OAuth redirects, so user is set via onAuthStateChange after redirect
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    session,
    loading,
    userFriends,
    login,
    register,
    signInWithGoogle,
    signOut,
  };
};
