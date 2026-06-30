import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarcodeScanner, type ScanFeedback } from '@/components/wms/BarcodeScanner';
import { Card } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { ArrowLeft, CheckCircle2, Truck } from 'lucide-react';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

async function fetchPending() {
  const { data, error } = await supabase
    .from('wms_receiving_orders')
    .select('id, order_number, supplier, expected_date, status, dock')
    .eq('status', 'pending')
    .order('expected_date', { ascending: true })
    .limit(50);
  if (error) throw error;
  return data || [];
}

async function fetchItems(orderId: string) {
  const { data, error } = await supabase
    .from('wms_receiving_items')
    .select('id, product_code, product_name, expected_qty, received_qty, unit')
    .eq('receiving_order_id', orderId);
  if (error) throw error;
  return data || [];
}

export default function ColetorReceiving() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const orders = useQuery({ queryKey: ['coletor-recv-pending'], queryFn: fetchPending });
  const items = useQuery({
    queryKey: ['coletor-recv-items', selectedId],
    queryFn: () => fetchItems(selectedId!),
    enabled: !!selectedId,
  });

  const onScan = async (code: string): Promise<ScanFeedback> => {
    if (!selectedId || !items.data) return { type: 'error', message: 'Selecione uma OR primeiro' };
    const item = items.data.find(i => i.product_code === code);
    if (!item) return { type: 'error', message: 'Produto não pertence a esta OR', code };
    const next = Number(item.received_qty || 0) + 1;
    const { error } = await supabase
      .from('wms_receiving_items')
      .update({ received_qty: next })
      .eq('id', item.id);
    if (error) return { type: 'error', message: 'Falha ao registrar', code };
    qc.invalidateQueries({ queryKey: ['coletor-recv-items', selectedId] });
    return { type: 'success', message: `+1 ${item.product_name}`, code };
  };

  const finish = async () => {
    if (!selectedId) return;
    const { error } = await supabase
      .from('wms_receiving_orders')
      .update({ status: 'completed', received_date: new Date().toISOString() })
      .eq('id', selectedId);
    if (error) return toastError('Não foi possível concluir');
    toastSuccess('Recebimento concluído');
    setSelectedId(null);
    qc.invalidateQueries({ queryKey: ['coletor-recv-pending'] });
    qc.invalidateQueries({ queryKey: ['coletor-counts'] });
  };

  if (!selectedId) {
    return (
      <div className="p-4 space-y-3">
        <h1 className="text-lg font-semibold">Recebimento</h1>
        <p className="text-xs text-muted-foreground">Selecione uma ordem pendente para iniciar a conferência.</p>
        {orders.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {orders.data?.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">Nenhuma ordem pendente.</Card>
        )}
        <ul className="space-y-2" aria-label="Ordens pendentes">
          {orders.data?.map(o => (
            <li key={o.id}>
              <button
                onClick={() => setSelectedId(o.id)}
                className="w-full text-left active:scale-[0.99] transition-transform"
              >
                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-primary shrink-0" aria-hidden />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{o.order_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.supplier}</p>
                    </div>
                    {o.dock && <Badge variant="outline" className="text-[10px]">Doca {o.dock}</Badge>}
                  </div>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold flex-1 truncate">
          {orders.data?.find(o => o.id === selectedId)?.order_number}
        </h1>
      </div>

      <BarcodeScanner onScan={onScan} placeholder="Escaneie o produto recebido" />

      <ul className="space-y-2" aria-label="Itens">
        {items.data?.map(i => {
          const done = Number(i.received_qty) >= Number(i.expected_qty);
          return (
            <li key={i.id}>
              <Card className={done ? 'p-3 border-primary/40 bg-primary/5' : 'p-3'}>
                <div className="flex items-center gap-3">
                  {done && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{i.product_name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{i.product_code}</p>
                  </div>
                  <Badge variant={done ? 'default' : 'secondary'} className="font-mono text-xs">
                    {i.received_qty}/{i.expected_qty} {i.unit}
                  </Badge>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Button onClick={finish} className="w-full h-12 text-base" size="lg">
        <CheckCircle2 className="h-5 w-5" /> Concluir Recebimento
      </Button>
    </div>
  );
}
