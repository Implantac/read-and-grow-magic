import { supabase } from '@/integrations/supabase/client';
import type { SystemUser, UserRole } from '@/types/administration';

export interface InviteUserData {
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  department?: string;
  branch_id?: string | null;
}

export interface ChangeRoleData {
  user_id: string;
  role?: UserRole;
  phone?: string;
  department?: string;
  branch_id?: string | null;
}

async function callAdminUsers(action: string, params?: any) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action, ...params },
  });
  
  if (error) {
    console.error('Edge function error:', error);
    throw new Error(error.message || 'Erro na comunicação com o servidor');
  }
  return data;
}

export const usersService = {
  async getAll(): Promise<SystemUser[]> {
    const response = await callAdminUsers('list');
    if (!response?.data) return [];
    
    return response.data.map((user: any) => ({
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
      branchName: '',
    }));
  },

  async invite(userData: InviteUserData) {
    return callAdminUsers('invite', userData);
  },

  async delete(userId: string) {
    return callAdminUsers('delete', { user_id: userId });
  },

  async update(data: ChangeRoleData) {
    return callAdminUsers('change_role', data);
  },

  async toggleBan(userId: string, banned: boolean) {
    return callAdminUsers('toggle_ban', { user_id: userId, banned });
  },

  async resetPassword(email: string) {
    return callAdminUsers('reset_password', { email });
  }
};
