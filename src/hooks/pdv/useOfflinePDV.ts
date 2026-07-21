import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  enqueue,
  listQueue,
  queueSize,
  removeFromQueue,
  markFailure,
  type QueuedNFCe,
} from '@/lib/pdv/offlineQueue';

/**
 * Offline-first PDV hook.
 * - Monitors network status.
 * - Enqueues NFC-e emissions locally when offline (cash/pix only).
 * - Auto-syncs on reconnect.
 */
export function useOfflinePDV() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [size, setSize] = useState<number>(queueSize());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const goOn = () => setOnline(true);
    const goOff = () => setOnline(false);
    const change = () => setSize(queueSize());
    window.addEventListener('online', goOn);
    window.addEventListener('offline', goOff);
    window.addEventListener('pdv-queue-changed', change);
    return () => {
      window.removeEventListener('online', goOn);
      window.removeEventListener('offline', goOff);
      window.removeEventListener('pdv-queue-changed', change);
    };
  }, []);

  const submitOne = useCallback(async (q: QueuedNFCe) => {
    const p = q.payload;
    const subtotal = p.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discount = p.discount || 0;
    const total = subtotal - discount;
    const change = p.amountPaid - total;
    const number = 'NFCE-' + Date.now().toString().slice(-8);
    const accessKey = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('');
    const protocol = '1' + Date.now().toString().slice(-14);

    const { data: nfce, error } = await supabase
      .from('nfce')
      .insert({
        number,
        payment_method: p.paymentMethod,
        amount_paid: p.amountPaid,
        change_amount: Math.max(0, change),
        subtotal,
        discount,
        total,
        customer_name: p.customerName || null,
        customer_document: p.customerDocument || null,
        terminal_id: p.terminalId || 'PDV-01',
        operator_name: p.operatorName || 'Operador',
        status: 'authorized',
        access_key: accessKey,
        protocol,
        authorization_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !nfce) throw new Error(error?.message || 'Falha ao emitir NFC-e');

    if (p.items.length > 0) {
      const items = p.items.map((i) => ({
        nfce_id: nfce.id,
        product_code: i.productCode,
        product_name: i.productName,
        product_id: i.productId || null,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        total: i.quantity * i.unitPrice,
        unit: i.unit || 'UN',
      }));
      const { error: itErr } = await supabase.from('nfce_items').insert(items);
      if (itErr) throw new Error(itErr.message);
    }
  }, []);

  const flush = useCallback(async () => {
    if (syncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const items = listQueue();
    if (items.length === 0) return;

    setSyncing(true);
    let ok = 0;
    let fail = 0;
    for (const it of items) {
      try {
        await submitOne(it);
        removeFromQueue(it.id);
        ok += 1;
      } catch (e: any) {
        markFailure(it.id, e?.message ?? String(e));
        fail += 1;
      }
    }
    setSize(queueSize());
    setSyncing(false);

    if (ok > 0) toast.success(`${ok} NFC-e offline sincronizada${ok > 1 ? 's' : ''}.`);
    if (fail > 0) toast.error(`${fail} NFC-e falhou na sincronização.`);
  }, [submitOne, syncing]);

  // Auto flush when we come online.
  useEffect(() => {
    if (online) flush();
  }, [online, flush]);

  const emitOffline = useCallback((payload: QueuedNFCe['payload']) => {
    if (payload.paymentMethod !== 'cash' && payload.paymentMethod !== 'pix') {
      toast.error('Modo offline aceita apenas Dinheiro ou PIX.');
      return null;
    }
    const it = enqueue(payload);
    setSize(queueSize());
    toast.warning('Sem conexão — venda enfileirada. Comprovante será emitido ao reconectar.');
    return it;
  }, []);

  return {
    online,
    queueSize: size,
    syncing,
    emitOffline,
    flush,
  };
}
