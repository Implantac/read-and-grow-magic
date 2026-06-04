import { create } from 'zustand';

interface UserRole {
  role: 'admin' | 'director' | 'financial' | 'commercial' | 'production' | 'logistics';
  permissions: string[];
}

interface AuthState {
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  hasPermission: (permission: string) => boolean;
}

export const useCoreAuthStore = create<AuthState>((set, get) => ({
  role: null,
  setRole: (role) => set({ role }),
  hasPermission: (permission) => {
    const role = get().role;
    if (!role) return false;
    if (role.role === 'admin') return true;
    return role.permissions.includes(permission);
  },
}));
