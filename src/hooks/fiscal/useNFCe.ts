import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { NFCe } from '@/types/fiscal';

export function useNFCe() {
  const [nfces, setNfces] = useState<NFCe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNFCes = useCallback(async () => {
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
    const number = 'NFCE-' + Date.now().toString().slice(-8);
    const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discount = data.discount || 0;
    const total = subtotal - discount;
    const change = data.amountPaid - total;
    const accessKey = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('');
    const protocol = '1' + Date.now().toString().slice(-14);

    const { data: nfce, error } = await supabase.from('nfce').insert({
      number,
      payment_method: data.paymentMethod,
      amount_paid: data.amountPaid,
      change_amount: Math.max(0, change),
      subtotal,
      discount,
      total,
      customer_name: data.customerName || null,
      customer_document: data.customerDocument || null,
      terminal_id: data.terminalId || 'PDV-01',
      operator_name: data.operatorName || 'Operador',
      status: 'authorized',
      access_key: accessKey,
      protocol,
      authorization_date: new Date().toISOString(),
    }).select().single();

    if (error) { toast.error('Erro ao emitir NFC-e'); return null; }

    if (data.items.length > 0 && nfce) {
      const itemsToInsert = data.items.map(item => ({
        nfce_id: nfce.id,
        product_code: item.productCode,
        product_name: item.productName,
        product_id: item.productId || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.quantity * item.unitPrice,
        unit: item.unit || 'UN',
      }));
      await supabase.from('nfce_items').insert(itemsToInsert);
    }

    toast.success(`NFC-e ${number} emitida e autorizada!`);
    await fetchNFCes();
    return nfce;
  }, [fetchNFCes]);

  const cancel = useCallback(async (id: string) => {
    const { error } = await supabase.from('nfce').update({
      status: 'cancelled',
      cancellation_date: new Date().toISOString(),
    }).eq('id', id);

    if (error) { toast.error('Erro ao cancelar NFC-e'); return false; }
    toast.success('NFC-e cancelada com sucesso');
    await fetchNFCes();
    return true;
  }, [fetchNFCes]);

  useEffect(() => { fetchNFCes(); }, [fetchNFCes]);

  return { nfces, loading, refetch: fetchNFCes, emit, cancel };
}
