import { create } from 'zustand';

interface CRMState {
  funnelView: 'pipeline' | 'list';
  selectedPipelineId: string | null;
  setFunnelView: (view: 'pipeline' | 'list') => void;
  setSelectedPipelineId: (id: string | null) => void;
}

export const useCRMStore = create<CRMState>((set) => ({
  funnelView: 'pipeline',
  selectedPipelineId: null,
  setFunnelView: (view) => set({ funnelView: view }),
  setSelectedPipelineId: (id) => set({ selectedPipelineId: id }),
}));
