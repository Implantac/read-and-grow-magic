import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export interface MDFe {
  id: string;
  number: string;
  series: string;
  access_key: string | null;
  protocol: string | null;
  issue_date: string;
  authorization_date: string | null;
  cancellation_date: string | null;
  closure_date: string | null;
  status: 'draft' | 'pending' | 'authorized' | 'cancelled' | 'closed';
  modal: string;
  uf_origin: string;
  uf_destination: string;
  loading_city: string | null;
  unloading_cities: string[] | null;
  vehicle_plate: string | null;
  vehicle_renavam: string | null;
  vehicle_uf: string | null;
  driver_name: string | null;
  driver_cpf: string | null;
  carrier_id: string | null;
  total_cargo_value: number;
  total_weight: number;
  total_documents: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useMDFes() {
  return useQuery({
    queryKey: ['mdfes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('mdfe' as any).select('*').order('issue_date', { ascending: false }).limit(500);
      if (error) throw error;
      return (data as any as MDFe[]) ?? [];
    },
  });
}

export function useCreateMDFe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any & { uf_origin: string; uf_destination: string }) => {
      const number = 'MDFE-' + Date.now().toString().slice(-8);
      const { data, error } = await supabase.from('mdfe' as any).insert({ ...payload, number, status: 'draft' }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mdfes'] });
      toastSuccess('MDF-e criado');
    },
    onError: handleMutationError,
  });
}

export function useTransmitMDFe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const access_key = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('');
      const protocol = '1' + Date.now().toString().slice(-14);
      const { error } = await supabase.from('mdfe' as any).update({
        status: 'authorized', access_key, protocol, authorization_date: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mdfes'] });
      toastSuccess('MDF-e autorizado (simulação)');
    },
    onError: handleMutationError,
  });
}

export function useCloseMDFe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mdfe' as any).update({
        status: 'closed', closure_date: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mdfes'] });
      toastSuccess('Viagem encerrada');
    },
    onError: handleMutationError,
  });
}

export function useAddMDFeDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { mdfe_id: string; document_type: 'nfe' | 'cte'; document_number: string; access_key?: string; document_value?: number; document_weight?: number; unloading_city?: string }) => {
      const { error } = await supabase.from('mdfe_documents' as any).insert(payload as any);
      if (error) throw error;
      // Atualiza totais
      const { data: docs } = await supabase.from('mdfe_documents' as any).select('*').eq('mdfe_id', payload.mdfe_id);
      const arr = (docs as any[]) ?? [];
      await supabase.from('mdfe' as any).update({
        total_documents: arr.length,
        total_cargo_value: arr.reduce((s, d) => s + Number(d.document_value || 0), 0),
        total_weight: arr.reduce((s, d) => s + Number(d.document_weight || 0), 0),
      }).eq('id', payload.mdfe_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mdfes'] });
      qc.invalidateQueries({ queryKey: ['mdfe_documents'] });
      toastSuccess('Documento adicionado ao MDF-e');
    },
    onError: handleMutationError,
  });
}
