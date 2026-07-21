import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
import type { CanalOperacional } from '@/stores/useCanalStore';

export interface TransferenciaCanalItem {
  product_id: string;
  quantidade: number;
  observacoes?: string | null;
}

export interface TransferenciaCanal {
  id: string;
  numero: string;
  status: 'pendente' | 'em_transito' | 'recebido' | 'cancelado' | string;
  canal_origem: CanalOperacional;
  canal_destino: CanalOperacional;
  origem_branch_id: string;
  destino_branch_id: string;
  observacoes: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export function useTransferenciasCanal() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['transferencias_canal', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transferencias_canal')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as TransferenciaCanal[];
    },
  });
}

export function useTransferenciaItens(transferenciaId: string | null) {
  return useQuery({
    queryKey: ['transferencia_canal_itens', transferenciaId],
    enabled: !!transferenciaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transferencias_canal_itens')
        .select('*, product:products(id, code, name, unit)')
        .eq('transferencia_id', transferenciaId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

interface CreateTransferInput {
  origem_branch_id: string;
  destino_branch_id: string;
  canal_origem: CanalOperacional;
  canal_destino: CanalOperacional;
  observacoes?: string;
  itens: TransferenciaCanalItem[];
}

export function useCreateTransferenciaCanal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      const company_id = useEnterpriseStore.getState().activeCompanyId;
      if (!company_id) throw new Error('Empresa não selecionada');
      if (!input.itens.length) throw new Error('Adicione ao menos um item');
      if (input.origem_branch_id === input.destino_branch_id) {
        throw new Error('Origem e destino devem ser diferentes');
      }

      const numero = `TR-${Date.now().toString(36).toUpperCase()}`;
      const { data: header, error: e1 } = await supabase
        .from('transferencias_canal')
        .insert({
          company_id,
          numero,
          status: 'pendente',
          origem_branch_id: input.origem_branch_id,
          destino_branch_id: input.destino_branch_id,
          canal_origem: input.canal_origem,
          canal_destino: input.canal_destino,
          observacoes: input.observacoes ?? null,
        })
        .select()
        .single();
      if (e1) throw e1;

      const rows = input.itens.map((i) => ({
        transferencia_id: header.id,
        product_id: i.product_id,
        quantidade: i.quantidade,
        observacoes: i.observacoes ?? null,
      }));
      const { error: e2 } = await supabase.from('transferencias_canal_itens').insert(rows);
      if (e2) throw e2;
      return header;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transferencias_canal'] });
      toastSuccess('Transferência criada');
    },
    onError: handleMutationError,
  });
}

export function useConfirmTransferenciaCanal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('transferencias_canal')
        .update({ status: 'recebido', confirmed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transferencias_canal'] });
      qc.invalidateQueries({ queryKey: ['stock_balances'] });
      toastSuccess('Transferência confirmada — estoque atualizado');
    },
    onError: handleMutationError,
  });
}

export function useCancelTransferenciaCanal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transferencias_canal')
        .update({ status: 'cancelado' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transferencias_canal'] });
      toastSuccess('Transferência cancelada');
    },
    onError: handleMutationError,
  });
}
