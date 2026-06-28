import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Company, Branch } from '@/types';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  userRole: 'admin' | 'manager' | 'operator' | 'viewer' | 'diretor' | 'financeiro' | 'fiscal' | 'contabil' | 'compras' | 'producao' | 'logistica' | 'comercial' | 'loja' | 'franquia' | 'system_admin' | null;
  
  // Company/Branch
  activeCompany: Company | null;
  activeBranch: Branch | null;
  companies: Company[];
  
  // UI State
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  
  // Actions
  setUser: (user: User | null) => void;
  logout: () => void;
  setUserRole: (role: 'admin' | 'manager' | 'operator' | 'viewer' | 'diretor' | 'financeiro' | 'fiscal' | 'contabil' | 'compras' | 'producao' | 'logistica' | 'comercial' | 'loja' | 'franquia' | 'system_admin' | null) => void;
  setActiveCompany: (company: Company | null) => void;
  setActiveBranch: (branch: Branch | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleTheme: () => void;
  setCompanies: (companies: Company[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      userRole: null,
      activeCompany: null,
      activeBranch: null,
      companies: [],
      sidebarCollapsed: false,
      theme: 'light',
      
      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      setUserRole: (role) => set({ userRole: role }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        userRole: null,
        activeCompany: null,
        activeBranch: null,
      }),
      
      setActiveCompany: (company) => set({ 
        activeCompany: company,
        activeBranch: (company && Array.isArray(company.branches) && company.branches.length > 0) 
          ? company.branches[0] 
          : null,
      }),

      
      setActiveBranch: (branch) => set({ activeBranch: branch }),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),
      
      setCompanies: (companies) => set({ companies }),
    }),
    {
      name: 'erp-app-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        activeCompany: state.activeCompany,
        activeBranch: state.activeBranch,
      }),
    }
  )
);
