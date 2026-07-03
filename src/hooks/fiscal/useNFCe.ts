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
      cancellationReason: row.cancellation_reason,
      returnStatus: row.return_status || 'none',
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

    if (error) { console.error('NFC-e emission error:', error); toast.error('Erro ao emitir NFC-e: ' + (error.message || '')); return null; }

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

  const cancel = useCallback(async (id: string, reason: string) => {
    const trimmed = (reason || '').trim();
    if (trimmed.length < 15) {
      toast.error('Motivo do cancelamento deve ter pelo menos 15 caracteres (regra SEFAZ).');
      return false;
    }
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from('nfce').update({
      status: 'cancelled',
      cancellation_date: new Date().toISOString(),
      cancellation_reason: trimmed,
      cancelled_by: userRes?.user?.id ?? null,
    } as any).eq('id', id);

    if (error) { toast.error('Erro ao cancelar NFC-e'); return false; }
    toast.success('NFC-e cancelada com sucesso');
    await fetchNFCes();
    return true;
  }, [fetchNFCes]);

  const createReturn = useCallback(async (params: {
    nfceId: string;
    reason: string;
    refundMethod: string;
    items: { nfceItemId: string; productId?: string | null; productCode?: string; productName?: string; quantity: number; unitPrice: number }[];
    terminalId?: string;
    operatorName?: string;
  }) => {
    const trimmed = (params.reason || '').trim();
    if (trimmed.length < 5) { toast.error('Informe o motivo da devolução.'); return null; }
    const items = params.items.filter((i) => i.quantity > 0);
    if (items.length === 0) { toast.error('Selecione ao menos um item para devolver.'); return null; }

    const refundAmount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const number = 'DEV-' + Date.now().toString().slice(-8);

    const { data: userRes } = await supabase.auth.getUser();
    const { data: ret, error } = await (supabase.from('nfce_returns' as any) as any).insert({
      nfce_id: params.nfceId,
      number,
      reason: trimmed,
      refund_method: params.refundMethod,
      refund_amount: refundAmount,
      status: 'authorized',
      terminal_id: params.terminalId || null,
      operator_name: params.operatorName || null,
      created_by: userRes?.user?.id ?? null,
    }).select().single();

    if (error || !ret) { toast.error('Erro ao registrar devolução'); return null; }

    const itemsPayload = items.map((i) => ({
      return_id: ret.id,
      nfce_item_id: i.nfceItemId,
      product_id: i.productId || null,
      product_code: i.productCode || null,
      product_name: i.productName || null,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      total: i.quantity * i.unitPrice,
    }));
    await (supabase.from('nfce_return_items' as any) as any).insert(itemsPayload);

    // Recalcular status de devolução do cupom
    const { data: allReturns } = await (supabase
      .from('nfce_return_items' as any) as any)
      .select('quantity, nfce_item_id')
      .in('return_id', [ret.id]);
    void allReturns;

    // Somar total devolvido por cupom
    const { data: sums } = await (supabase
      .from('nfce_returns' as any) as any)
      .select('refund_amount, status')
      .eq('nfce_id', params.nfceId)
      .eq('status', 'authorized');
    const totalReturned = (sums || []).reduce((s: number, r: any) => s + Number(r.refund_amount || 0), 0);

    const { data: nfceRow } = await supabase.from('nfce').select('total').eq('id', params.nfceId).single();
    const nfceTotal = Number(nfceRow?.total || 0);
    const newStatus = totalReturned <= 0 ? 'none' : (totalReturned + 0.001 >= nfceTotal ? 'full' : 'partial');
    await supabase.from('nfce').update({ return_status: newStatus } as any).eq('id', params.nfceId);

    toast.success(`Devolução ${number} registrada — reembolso ${refundAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    await fetchNFCes();
    return ret;
  }, [fetchNFCes]);

  useEffect(() => { fetchNFCes(); }, [fetchNFCes]);

  // Realtime: refetch quando NFC-e, itens ou devoluções mudarem em qualquer terminal
  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => { fetchNFCes(); }, 250);
    };
    const channel = supabase
      .channel('nfce-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nfce' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nfce_items' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nfce_returns' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nfce_return_items' }, schedule)
      .subscribe();
    return () => {
      if (debounce) clearTimeout(debounce);
      supabase.removeChannel(channel);
    };
  }, [fetchNFCes]);

  return { nfces, loading, refetch: fetchNFCes, emit, cancel, createReturn };
}


