import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import type { SystemUser, UserRole } from '@/types/administration';


interface AdminUserResponse {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  status: 'active' | 'pending' | 'blocked';
}

interface InviteUserData {
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  phone?: string;
  department?: string;
  branch_id?: string | null;
}

interface ChangeRoleData {
  user_id: string;
  role?: 'admin' | 'manager' | 'operator' | 'viewer';
  phone?: string;
  department?: string;
  branch_id?: string | null;
}

async function callAdminUsers(action: string, params?: any) {
  try {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action, ...params },
    });
    
    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Erro na comunicação com o servidor');
    }
    return data;
  } catch (err: any) {
    console.error('Admin users call failed:', err);
    throw err;
  }
}


function mapToSystemUser(user: any): SystemUser {
  return {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar_url,
    role: (user.role as UserRole) || 'viewer',
    status: user.status || 'active',
    permissions: [],
    lastLogin: user.last_sign_in_at,
    createdAt: user.created_at || new Date().toISOString(),
    updatedAt: user.updated_at || new Date().toISOString(),
    phone: user.phone || '',
    department: user.department || '',
    branchId: user.branch_id || '',
    branchName: '', // This would need a join in the edge function or hydration here
  };
}


export function useUsers() {
  const queryClient = useQueryClient();
  const { userRole } = useAppStore();

  const usersQuery = useQuery<SystemUser[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await callAdminUsers('list');
      if (!response?.data) return [];
      return response.data.map(mapToSystemUser);
    },
    enabled: userRole === 'admin',
  });

  const inviteUserMutation = useMutation({
    mutationFn: (userData: InviteUserData) => callAdminUsers('invite', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (user_id: string) => callAdminUsers('delete', { user_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: (data: ChangeRoleData) => callAdminUsers('change_role', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const toggleBanMutation = useMutation({
    mutationFn: (data: { user_id: string; banned: boolean }) => 
      callAdminUsers('toggle_ban', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => callAdminUsers('reset_password', { email }),
  });

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    
    // Mutations
    inviteUser: inviteUserMutation.mutateAsync,
    deleteUser: deleteUserMutation.mutateAsync,
    changeRole: changeRoleMutation.mutateAsync,
    toggleBan: toggleBanMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    
    // Loading states
    isInviting: inviteUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    isChangingRole: changeRoleMutation.isPending,
    isTogglingBan: toggleBanMutation.isPending,
    isSendingReset: resetPasswordMutation.isPending,
  };
}