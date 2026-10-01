import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { NFCe, NFCeItem, NFCePaymentMethod, NFCeStatus } from '@/types/fiscal';

export function useNFCe() {
  const [nfces, setNfces] = useState<NFCe[]>([]);
  const [loading, setLoading] = useState(true);

  const isFetching = useRef(false);
  const fetchNFCes = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    const { data, error } = await supabase.from('nfce').select('*').order('issue_date', { ascending: false }).limit(200);
    if (error) { 
      console.error(error); 
      toast.error('Erro ao carregar NFC-e'); 
      setLoading(false); 
      isFetching.current = false;
      return; 
    }

    const { data: itemsData } = await supabase.from('nfce_items').select('*');
    const itemsMap = new Map<string, NFCeItem[]>();
    const toItem = (item: Record<string, unknown>): NFCeItem => ({
      id: String(item.id),
      productId: String(item.product_id ?? ''),
      productCode: String(item.product_code ?? ''),
      productName: String(item.product_name ?? ''),
      ncm: String(item.ncm ?? ''),
      cfop: String(item.cfop ?? ''),
      unit: String(item.unit ?? 'UN'),
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unit_price ?? 0),
      discount: Number(item.discount ?? 0),
      total: Number(item.total ?? 0),
    });
    (itemsData || []).forEach((item) => {
      const arr = itemsMap.get(item.nfce_id) || [];
      arr.push(toItem(item as unknown as Record<string, unknown>));
      itemsMap.set(item.nfce_id, arr);
    });

    const mapped: NFCe[] = (data || []).map((row) => ({
      id: row.id,
      number: row.number,
      series: row.series,
      issueDate: row.issue_date,
      status: row.status as NFCeStatus,
      accessKey: row.access_key || '',
      protocol: row.protocol || '',
      qrCode: row.qr_code || '',
      paymentMethod: row.payment_method as NFCePaymentMethod,
      terminalId: row.terminal_id || '',
      operatorId: row.operator_id || '',
      operatorName: row.operator_name || '',
      customerName: row.customer_name,
      customerDocument: row.customer_document,
      subtotal: Number(row.subtotal),
      discount: Number(row.discount),
      total: Number(row.total),
      amountPaid: Number(row.amount_paid),
      change: Number(row.change_amount),
      authorizationDate: row.authorization_date,
      cancellationDate: row.cancellation_date,
      cancellationReason: row.cancellation_reason,
      returnStatus: (row.return_status || 'none') as NFCe['returnStatus'],
      items: itemsMap.get(row.id) || [],
      createdAt: row.created_at,
    }));

    setNfces(mapped);
    setLoading(false);
    isFetching.current = false;
  }, []);


  const emit = useCallback(async (data: {
    items: { productCode: string; productName: string; productId?: string; quantity: number; unitPrice: number; unit?: string }[];
    paymentMethod: string;
    amountPaid: number;
    discount?: number;
    customerName?: string;
    customerDocument?: string;
    terminalId?: string;
    operatorName?: string;
  }) => {
    toast.error('Emissão de NFC-e indisponível sem autorização oficial. A venda não foi finalizada.');
    return null;
  }, []);

  const cancel = useCallback(async (id: string, reason: string) => {
    toast.error('Cancelamento de NFC-e indisponível sem confirmação oficial. Nenhum documento foi alterado.');
    return false;
  }, []);

  const createReturn = useCallback(async (params: {
    nfceId: string;
    reason: string;
    refundMethod: string;
    items: { nfceItemId: string; productId?: string | null; productCode?: string; productName?: string; quantity: number; unitPrice: number }[];
    terminalId?: string;
    operatorName?: string;
  }) => {
    toast.error('Devolução fiscal indisponível sem processamento transacional e confirmação fiscal.');
    return null;
  }, []);

  useEffect(() => { fetchNFCes(); }, [fetchNFCes]);

  // Realtime: refetch quando NFC-e, itens ou devoluções mudarem em qualquer terminal
  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => { 
        // Only fetch if tab is active to avoid background loops
        if (document.visibilityState === 'visible') {
          fetchNFCes(); 
        }
      }, 1000); // Increased debounce for stability
    };
    const channel = supabase
      .channel('nfce-live-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nfce' }, schedule)
      .subscribe();
    return () => {
      if (debounce) clearTimeout(debounce);
      supabase.removeChannel(channel);
    };
  }, [fetchNFCes]);

  return { nfces, loading, refetch: fetchNFCes, emit, cancel, createReturn };
}


