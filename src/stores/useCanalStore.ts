import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CanalOperacional = 'VAREJO_PDV' | 'ATACADO_INDUSTRIA';
export type CanalFilter = 'CONSOLIDADO' | CanalOperacional;

interface CanalState {
  canal: CanalFilter;
  branchId: string | null;
  setCanal: (c: CanalFilter) => void;
  setBranchId: (id: string | null) => void;
}

export const useCanalStore = create<CanalState>()(
  persist(
    (set) => ({
      canal: 'CONSOLIDADO',
      branchId: null,
      setCanal: (canal) => set({ canal }),
      setBranchId: (branchId) => set({ branchId }),
    }),
    { name: 'canal-operacional-storage' }
  )
);

/** Apply the current canal filter to a Supabase query builder. */
export function applyCanalFilter<Q extends { eq: (col: string, val: any) => Q }>(
  query: Q,
  canal: CanalFilter,
  branchId: string | null,
  column: string = 'canal_operacional'
): Q {
  let q = query;
  if (canal !== 'CONSOLIDADO') q = q.eq(column, canal);
  if (branchId) q = q.eq('branch_id', branchId);
  return q;
}

export const CANAL_LABEL: Record<CanalFilter, string> = {
  CONSOLIDADO: 'Visão Consolidada',
  VAREJO_PDV: 'Apenas Varejo (PDV)',
  ATACADO_INDUSTRIA: 'Apenas Indústria/Atacado',
};
