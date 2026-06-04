import { create } from 'zustand';

interface EnterpriseConfig {
  segment: 'textile' | 'food' | 'pharma' | 'metal' | 'distribution' | 'services' | 'general';
  subSegment?: string;
  tier: 'small' | 'medium' | 'enterprise';
  taxRegime: 'simples' | 'presumed' | 'real';
}

interface EnterpriseState {
  config: EnterpriseConfig | null;
  isLoading: boolean;
  setConfig: (config: EnterpriseConfig) => void;
  resetConfig: () => void;
}

export const useEnterpriseStore = create<EnterpriseState>((set) => ({
  config: null,
  isLoading: false,
  setConfig: (config) => set({ config }),
  resetConfig: () => set({ config: null }),
}));
