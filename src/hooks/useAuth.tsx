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
    role: (role as AppUser['role']) || 'viewer',
    permissions: ['all'],
  };
}

export function useAuth() {
  const { setUser, setUserRole, setActiveCompany, logout: storeLogout } = useAppStore();
  const [loading, setLoading] = useState(true);

  const syncAuthState = useCallback(async (sessionUser: SupabaseUser | null) => {
    if (sessionUser) {
      const [profileResponse, roleResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('name')
          .eq('id', sessionUser.id)
          .single(),
        supabase.rpc('get_user_role', { _user_id: sessionUser.id })
      ]);

      const role = roleResponse.data || 'viewer';
      const appUser = mapSupabaseUser(sessionUser, profileResponse.data?.name, role);
      setUser(appUser);
      setUserRole(role);
      setActiveCompany(mockCompanies[0] ?? null);
    } else {
      storeLogout();
    }
  }, [setUser, setUserRole, setActiveCompany, storeLogout]);

  useEffect(() => {
    let mounted = true;

    const runSync = async (sessionUser: SupabaseUser | null) => {
      try {
        await syncAuthState(sessionUser);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Avoid async Supabase calls directly inside this callback (deadlock workaround)
      setTimeout(() => {
        void runSync(session?.user ?? null);
      }, 0);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void runSync(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncAuthState]);

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
