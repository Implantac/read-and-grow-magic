import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import type { Company } from '@/types';
const mockCompanies: Company[] = [];
import type { User as AppUser } from '@/types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

function mapSupabaseUser(user: SupabaseUser, profileName?: string, role?: string): AppUser {
  return {
    id: user.id,
    name: profileName || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
    email: user.email || '',
    role: role || 'viewer',
    permissions: ['all'],
  };
}

export function useAuth() {
  const { setUser, setActiveCompany, logout: storeLogout } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Fetch profile name
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single();
          
          const appUser = mapSupabaseUser(session.user, profile?.name);
          setUser(appUser);
          setActiveCompany(mockCompanies[0]);
        } else {
          storeLogout();
        }
        setLoading(false);
      }
    );

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', session.user.id)
          .single();
        
        const appUser = mapSupabaseUser(session.user, profile?.name);
        setUser(appUser);
        setActiveCompany(mockCompanies[0]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setActiveCompany, storeLogout]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    storeLogout();
  }, [storeLogout]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  return { loading, signIn, signUp, signOut, resetPassword };
}
