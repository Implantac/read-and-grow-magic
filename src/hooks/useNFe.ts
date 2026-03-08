import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { NFe } from '@/types/fiscal';

export function useNFe() {
  const [nfes, setNfes] = useState<NFe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('nfe').select('*').order('issue_date', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar NF-e'); setLoading(false); return; }

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
      items: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    setNfes(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { nfes, loading, refetch: fetch };
}
