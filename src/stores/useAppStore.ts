import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Company, Branch } from '@/types';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  
  // Company/Branch
  activeCompany: Company | null;
  activeBranch: Branch | null;
  
  // UI State
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  
  // Actions
  setUser: (user: User | null) => void;
  logout: () => void;
  setActiveCompany: (company: Company | null) => void;
  setActiveBranch: (branch: Branch | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      activeCompany: null,
      activeBranch: null,
      sidebarCollapsed: false,
      theme: 'light',
      
      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        activeCompany: null,
        activeBranch: null,
      }),
      
      setActiveCompany: (company) => set({ 
        activeCompany: company,
        activeBranch: company?.branches[0] || null,
      }),
      
      setActiveBranch: (branch) => set({ activeBranch: branch }),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),
    }),
    {
      name: 'erp-wms-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
