import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { NFCe } from '@/types/fiscal';

export function useNFCe() {
  const [nfces, setNfces] = useState<NFCe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('nfce').select('*').order('issue_date', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar NFC-e'); setLoading(false); return; }

    const { data: itemsData } = await supabase.from('nfce_items').select('*');
    const itemsMap = new Map<string, any[]>();
    (itemsData || []).forEach((item: any) => {
      const arr = itemsMap.get(item.nfce_id) || [];
      arr.push({
        id: item.id,
        productCode: item.product_code,
        productName: item.product_name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        total: Number(item.total),
        unit: item.unit,
      });
      itemsMap.set(item.nfce_id, arr);
    });

    const mapped: NFCe[] = (data || []).map((row: any) => ({
      id: row.id,
      number: row.number,
      series: row.series,
      issueDate: row.issue_date,
      status: row.status,
      accessKey: row.access_key || '',
      protocol: row.protocol || '',
      qrCode: row.qr_code || '',
      paymentMethod: row.payment_method,
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
      items: itemsMap.get(row.id) || [],
      createdAt: row.created_at,
    }));

    setNfces(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { nfces, loading, refetch: fetch };
}
