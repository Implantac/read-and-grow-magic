import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarcodeScanner, type ScanFeedback } from '@/components/wms/BarcodeScanner';
import { Card } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { ArrowLeft, CheckCircle2, ListChecks } from 'lucide-react';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

async function fetchOrders() {
  const { data, error } = await supabase
    .from('wms_picking_orders')
    .select('id, order_number, customer_name, priority, status')
    .in('status', ['pending', 'assigned', 'in_progress'])
    .order('priority', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

async function fetchItems(orderId: string) {
  const { data, error } = await supabase
    .from('wms_picking_items')
    .select('id, product_code, product_name, location, requested_qty, picked_qty')
    .eq('picking_order_id', orderId);
  if (error) throw error;
  return data || [];
}

export default function ColetorPicking() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const orders = useQuery({ queryKey: ['coletor-pick-orders'], queryFn: fetchOrders });
  const items = useQuery({
    queryKey: ['coletor-pick-items', selectedId],
    queryFn: () => fetchItems(selectedId!),
    enabled: !!selectedId,
  });

  const onScan = async (code: string): Promise<ScanFeedback> => {
    if (!selectedId || !items.data) return { type: 'error', message: 'Abra um pedido' };
    const item = items.data.find(i => i.product_code === code && Number(i.picked_qty) < Number(i.requested_qty));
    if (!item) return { type: 'error', message: 'Produto inválido ou já completo', code };
    const next = Number(item.picked_qty || 0) + 1;
    const { error } = await supabase
      .from('wms_picking_items')
      .update({ picked_qty: next })
      .eq('id', item.id);
    if (error) return { type: 'error', message: 'Falha ao separar', code };
    qc.invalidateQueries({ queryKey: ['coletor-pick-items', selectedId] });
    return { type: 'success', message: `${item.product_name} @ ${item.location}`, code };
  };

  const finish = async () => {
    if (!selectedId) return;
    const { error } = await supabase
      .from('wms_picking_orders')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', selectedId);
    if (error) return toastError('Não foi possível concluir');
    toastSuccess('Separação concluída');
    setSelectedId(null);
    qc.invalidateQueries({ queryKey: ['coletor-pick-orders'] });
    qc.invalidateQueries({ queryKey: ['coletor-counts'] });
  };

  if (!selectedId) {
    return (
      <div className="p-4 space-y-3">
        <h1 className="text-lg font-semibold">Separação</h1>
        <p className="text-xs text-muted-foreground">Selecione um pedido para separar.</p>
        {orders.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {orders.data?.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">Nenhum pedido em separação.</Card>
        )}
        <ul className="space-y-2" aria-label="Pedidos">
          {orders.data?.map(o => (
            <li key={o.id}>
              <button onClick={() => setSelectedId(o.id)} className="w-full text-left active:scale-[0.99] transition-transform">
                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    <ListChecks className="h-5 w-5 text-primary shrink-0" aria-hidden />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{o.order_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.customer_name}</p>
                    </div>
                    <Badge variant={o.priority === 'urgent' || o.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {o.priority}
                    </Badge>
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

      <BarcodeScanner onScan={onScan} placeholder="Escaneie o produto separado" />

      <ul className="space-y-2" aria-label="Itens">
        {items.data?.map(i => {
          const done = Number(i.picked_qty) >= Number(i.requested_qty);
          return (
            <li key={i.id}>
              <Card className={done ? 'p-3 border-primary/40 bg-primary/5' : 'p-3'}>
                <div className="flex items-center gap-3">
                  {done && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{i.product_name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{i.location} · {i.product_code}</p>
                  </div>
                  <Badge variant={done ? 'default' : 'secondary'} className="font-mono text-xs">
                    {i.picked_qty}/{i.requested_qty}
                  </Badge>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Button onClick={finish} className="w-full h-12 text-base" size="lg">
        <CheckCircle2 className="h-5 w-5" /> Concluir Separação
      </Button>
    </div>
  );
}
