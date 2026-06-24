import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EnterpriseConfig {
  segment: 'textile' | 'food' | 'pharma' | 'metal' | 'distribution' | 'services' | 'general';
  subSegment?: string;
  tier: 'small' | 'medium' | 'enterprise';
  taxRegime: 'simples' | 'presumed' | 'real';
}

interface EnterpriseState {
  config: EnterpriseConfig | null;
  isLoading: boolean;
  activeCompanyId: string | null;
  activeBranchId: string | null;
  setConfig: (config: EnterpriseConfig) => void;
  resetConfig: () => void;
  setActiveCompanyId: (id: string | null) => void;
  setActiveBranchId: (id: string | null) => void;
}

export const useEnterpriseStore = create<EnterpriseState>()(
  persist(
    (set) => ({
      config: null,
      isLoading: false,
      activeCompanyId: null,
      activeBranchId: null,
      setConfig: (config) => set({ config }),
      resetConfig: () => set({ config: null }),
      setActiveCompanyId: (id) => set({ activeCompanyId: id }),
      setActiveBranchId: (id) => set({ activeBranchId: id }),
    }),
    {
      name: 'enterprise-context-storage',
      partialize: (state) => ({
        activeCompanyId: state.activeCompanyId,
        activeBranchId: state.activeBranchId,
      }),
    }
  )
);

/** Non-reactive accessor for use outside React (e.g. fetch interceptors). */
export const getActiveBranchId = (): string | null =>
  useEnterpriseStore.getState().activeBranchId;

export const getActiveCompanyId = (): string | null =>
  useEnterpriseStore.getState().activeCompanyId;
