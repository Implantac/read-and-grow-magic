import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Input } from '@/ui/base/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { Package, CheckCircle, Truck, Search, AlertTriangle, PackageCheck } from 'lucide-react';
import { format } from 'date-fns';

interface OrderRow {
  id: string;
  number: string;
  client_name: string;
  status: string;
  total: number;
  date: string;
  reserved_lines: number;
  picked_lines: number;
  shipped_lines: number;
  stage: 'reserved' | 'partial_picked' | 'picked' | 'shipped' | 'none';
}

export default function OrderPicking() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders-for-picking'],
    queryFn: async (): Promise<OrderRow[]> => {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id, number, client_name, status, total, date')
        .in('status', ['approved', 'awaiting_separation', 'in_separation', 'confirmed', 'awaiting_conference'])
        .order('date', { ascending: false })
        .limit(200);
      if (error) throw error;

      const ids = (ordersData || []).map((o) => o.id);
      if (ids.length === 0) return [];

      const { data: res } = await supabase
        .from('stock_reservations')
        .select('order_id, status')
        .in('order_id', ids);

      const map = new Map<string, { reserved: number; picked: number; shipped: number }>();
      (res || []).forEach((r: any) => {
        const cur = map.get(r.order_id) || { reserved: 0, picked: 0, shipped: 0 };
        if (r.status === 'reserved') cur.reserved += 1;
        if (r.status === 'picked') cur.picked += 1;
        if (r.status === 'shipped') cur.shipped += 1;
        map.set(r.order_id, cur);
      });

      return (ordersData || [])
        .map((o: any) => {
          const m = map.get(o.id) || { reserved: 0, picked: 0, shipped: 0 };
          let stage: OrderRow['stage'] = 'none';
          if (m.shipped > 0 && m.reserved === 0 && m.picked === 0) stage = 'shipped';
          else if (m.picked > 0 && m.reserved === 0) stage = 'picked';
          else if (m.picked > 0 && m.reserved > 0) stage = 'partial_picked';
          else if (m.reserved > 0) stage = 'reserved';
          return {
            ...o,
            reserved_lines: m.reserved,
            picked_lines: m.picked,
            shipped_lines: m.shipped,
            stage,
          };
        })
        .filter((o) => o.stage !== 'none');
    },
  });

  const pickMut = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('wms_pick_order_stock', { p_order_id: orderId });
      if (error) throw error;
      return data as any;
    },
    onSuccess: (data: any) => {
      const short = data?.lines_short || 0;
      if (short > 0) {
        toastError(`Separação parcial: ${short} linha(s) sem saldo suficiente`);
      } else {
        toastSuccess(`Separação concluída — ${data?.total_picked || 0} unidade(s)`);
      }
      qc.invalidateQueries({ queryKey: ['orders-for-picking'] });
      qc.invalidateQueries({ queryKey: ['orders-for-reservation'] });
      qc.invalidateQueries({ queryKey: ['stock_balances'] });
      qc.invalidateQueries({ queryKey: ['stock-reservations'] });
    },
    onError: (err: any) => toastError(`Falha na separação: ${err.message}`),
  });

  const shipMut = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('wms_ship_order', { p_order_id: orderId });
      if (error) throw error;
      return data as any;
    },
    onSuccess: (data: any) => {
      toastSuccess(`Expedição registrada — ${data?.lines_shipped || 0} linha(s)`);
      qc.invalidateQueries({ queryKey: ['orders-for-picking'] });
      qc.invalidateQueries({ queryKey: ['stock-reservations'] });
    },
    onError: (err: any) => toastError(`Falha na expedição: ${err.message}`),
  });

  const filtered = orders.filter(
    (o) =>
      o.number.toLowerCase().includes(search.toLowerCase()) ||
      o.client_name.toLowerCase().includes(search.toLowerCase()),
  );

  const totals = {
    total: orders.length,
    reserved: orders.filter((o) => o.stage === 'reserved').length,
    picked: orders.filter((o) => o.stage === 'picked').length,
    shipped: orders.filter((o) => o.stage === 'shipped').length,
  };

  const stageBadge = (s: OrderRow['stage']) => {
    switch (s) {
      case 'reserved':
        return <Badge className="bg-info/10 text-info border-info/30">Reservado</Badge>;
      case 'partial_picked':
        return <Badge className="bg-warning/10 text-warning border-warning/30">Separação parcial</Badge>;
      case 'picked':
        return <Badge className="bg-success/10 text-success border-success/30">Separado</Badge>;
      case 'shipped':
        return <Badge className="bg-primary/10 text-primary border-primary/30">Expedido</Badge>;
      default:
        return <Badge variant="outline">—</Badge>;
    }
  };

  return (
    <PageContainer loading={isLoading}>
      <PageHeader
        title="Separação e Expedição"
        description="Confirma a separação física (consome reservado e baixa saldo) e marca a expedição. Isolado por empresa via RLS."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Pedidos no fluxo" value={totals.total} icon={Package} index={0} />
        <KPICard title="Aguardando separação" value={totals.reserved} icon={AlertTriangle} index={1} color="warning" />
        <KPICard title="Separados" value={totals.picked} icon={PackageCheck} index={2} color="success" />
        <KPICard title="Expedidos" value={totals.shipped} icon={Truck} index={3} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Reservadas</TableHead>
                <TableHead className="text-center">Separadas</TableHead>
                <TableHead className="text-center">Expedidas</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum pedido com reservas para separar
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">{o.number}</TableCell>
                    <TableCell>{o.client_name}</TableCell>
                    <TableCell>{format(new Date(o.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{stageBadge(o.stage)}</TableCell>
                    <TableCell className="text-center">{o.reserved_lines}</TableCell>
                    <TableCell className="text-center">{o.picked_lines}</TableCell>
                    <TableCell className="text-center">{o.shipped_lines}</TableCell>
                    <TableCell className="text-right">
                      {o.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {(o.stage === 'reserved' || o.stage === 'partial_picked') && (
                          <Button
                            size="sm"
                            onClick={() => pickMut.mutate(o.id)}
                            disabled={pickMut.isPending}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Separar
                          </Button>
                        )}
                        {o.stage === 'picked' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => shipMut.mutate(o.id)}
                            disabled={shipMut.isPending}
                          >
                            <Truck className="h-3 w-3 mr-1" />
                            Expedir
                          </Button>
                        )}
                        {o.stage === 'shipped' && (
                          <Badge variant="outline" className="text-muted-foreground">Finalizado</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
