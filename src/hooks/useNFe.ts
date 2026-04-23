import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { NFe, NFeItem } from '@/types/fiscal';

export function useNFe() {
  const [nfes, setNfes] = useState<NFe[]>([]);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  // Invalida queries cross-módulo afetadas por NF-e (triggers no banco geram AR/ledger/accounting)
  const invalidateCrossModule = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['accounts_receivable'] });
    qc.invalidateQueries({ queryKey: ['financial_ledger'] });
    qc.invalidateQueries({ queryKey: ['bank_accounts'] });
    qc.invalidateQueries({ queryKey: ['journal_entries'] });
    qc.invalidateQueries({ queryKey: ['dre_summary'] });
    qc.invalidateQueries({ queryKey: ['dre_detailed'] });
    qc.invalidateQueries({ queryKey: ['fiscal_reports'] });
  }, [qc]);

  const fetchNFes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('nfe').select('*').order('issue_date', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar NF-e'); setLoading(false); return; }

    // Fetch items for all NFes
    const nfeIds = (data || []).map((r: any) => r.id);
    let itemsMap = new Map<string, any[]>();
    if (nfeIds.length > 0) {
      const { data: itemsData } = await supabase.from('nfe_items').select('*').in('nfe_id', nfeIds);
      (itemsData || []).forEach((item: any) => {
        const arr = itemsMap.get(item.nfe_id) || [];
        arr.push({
          id: item.id,
          productId: item.product_id,
          productCode: item.product_code,
          productName: item.product_name,
          ncm: item.ncm || '',
          cfop: item.cfop || '',
          unit: item.unit,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          discount: Number(item.discount),
          icmsBase: Number(item.icms_base),
          icmsRate: Number(item.icms_rate),
          icmsValue: Number(item.icms_value),
          ipiRate: Number(item.ipi_rate),
          ipiValue: Number(item.ipi_value),
          pisRate: Number(item.pis_rate),
          pisValue: Number(item.pis_value),
          cofinsRate: Number(item.cofins_rate),
          cofinsValue: Number(item.cofins_value),
          total: Number(item.total),
        });
        itemsMap.set(item.nfe_id, arr);
      });
    }

    const mapped: NFe[] = (data || []).map((row: any) => ({
      id: row.id,
      number: row.number,
      series: row.series,
      issueDate: row.issue_date,
      operationType: row.operation_type,
      clientId: row.client_id || '',
      clientName: row.client_name,
      clientDocument: row.client_document || '',
      status: row.status,
      accessKey: row.access_key || '',
      protocol: row.protocol || '',
      subtotal: Number(row.subtotal),
      discount: Number(row.discount),
      shipping: Number(row.shipping),
      icms: Number(row.icms),
      ipi: Number(row.ipi),
      pis: Number(row.pis),
      cofins: Number(row.cofins),
      total: Number(row.total),
      authorizationDate: row.authorization_date,
      cancellationDate: row.cancellation_date,
      cancellationReason: row.cancellation_reason,
      orderId: row.order_id,
      items: itemsMap.get(row.id) || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    setNfes(mapped);
    setLoading(false);
  }, []);

  const create = useCallback(async (nfeData: {
    clientName: string;
    clientId?: string;
    clientDocument?: string;
    operationType: string;
    items: { productCode: string; productName: string; productId?: string; quantity: number; unitPrice: number; unit?: string; ncm?: string; cfop?: string }[];
    discount?: number;
    shipping?: number;
  }) => {
    const number = 'NFE-' + Date.now().toString().slice(-8);
    const subtotal = nfeData.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discount = nfeData.discount || 0;
    const shipping = nfeData.shipping || 0;
    const total = subtotal - discount + shipping;

    const { data, error } = await supabase.from('nfe').insert({
      number,
      client_name: nfeData.clientName,
      client_id: nfeData.clientId || null,
      client_document: nfeData.clientDocument || null,
      operation_type: nfeData.operationType,
      subtotal,
      discount,
      shipping,
      total,
      status: 'draft',
    }).select().single();

    if (error) { toast.error('Erro ao criar NF-e'); return null; }

    // Insert items
    if (nfeData.items.length > 0 && data) {
      const itemsToInsert = nfeData.items.map(item => ({
        nfe_id: data.id,
        product_code: item.productCode,
        product_name: item.productName,
        product_id: item.productId || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.quantity * item.unitPrice,
        unit: item.unit || 'UN',
        ncm: item.ncm || null,
        cfop: item.cfop || null,
      }));
      await supabase.from('nfe_items').insert(itemsToInsert);
    }

    toast.success(`NF-e ${number} criada como rascunho`);
    await fetchNFes();
    return data;
  }, [fetchNFes]);

  const transmit = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fiscal-transmitter', {
        body: { nfeId: id, action: 'transmit' }
      });

      if (error) {
        const errorData = await error.context?.json();
        toast.error(errorData?.error || 'Erro ao transmitir NF-e');
        return false;
      }

      toast.success('NF-e autorizada na SEFAZ');
      await fetchNFes();
      invalidateCrossModule();
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Erro na comunicação com o transmissor');
      return false;
    }
  }, [fetchNFes, invalidateCrossModule]);

  const cancel = useCallback(async (id: string, reason: string) => {
    try {
      const { error } = await supabase.functions.invoke('fiscal-transmitter', {
        body: { nfeId: id, action: 'cancel', reason }
      });

      if (error) {
        const errorData = await error.context?.json();
        toast.error(errorData?.error || 'Erro ao cancelar NF-e');
        return false;
      }

      toast.success('NF-e cancelada com sucesso');
      await fetchNFes();
      invalidateCrossModule();
      return true;
    } catch (e: any) {
      toast.error(e.message || 'Erro na comunicação com o transmissor');
      return false;
    }
  }, [fetchNFes, invalidateCrossModule]);

  const sendToPending = useCallback(async (id: string) => {
    const { error } = await supabase.from('nfe').update({ status: 'pending' }).eq('id', id);
    if (error) { toast.error('Erro ao enviar NF-e'); return false; }
    toast.success('NF-e enviada para transmissão');
    await fetchNFes();
    return true;
  }, [fetchNFes]);

  useEffect(() => { fetchNFes(); }, [fetchNFes]);

  return { nfes, loading, refetch: fetchNFes, create, transmit, cancel, sendToPending };
}
