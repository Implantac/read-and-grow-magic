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
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/ui/base/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { Package, CheckCircle, Truck, Search, AlertTriangle, PackageCheck, ClipboardList, Tag, Hand } from 'lucide-react';
import { format } from 'date-fns';
import { EmptyState } from '@/shared/components/EmptyState';

type ShipmentStage = 'conferred' | 'labeled' | 'collected' | 'shipped' | 'delivered';

const STAGE_LABEL: Record<ShipmentStage, string> = {
  conferred: 'Conferido',
  labeled: 'Etiquetado',
  collected: 'Coletado',
  shipped: 'Expedido',
  delivered: 'Entregue',
};

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

interface ShipmentInfo {
  id: string;
  shipment_number: string;
  status: string;
  carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

interface TrackingEvent {
  id: string;
  event_type: string;
  description: string;
  location: string | null;
  registered_by: string | null;
  occurred_at: string;
}

export default function OrderPicking() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [stageOpen, setStageOpen] = useState(false);
  const [stageOrder, setStageOrder] = useState<OrderRow | null>(null);
  const [stageForm, setStageForm] = useState({
    stage: 'conferred' as ShipmentStage,
    tracking_number: '',
    carrier: '',
    location: '',
    notes: '',
  });

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

  const { data: shipmentInfo } = useQuery({
    queryKey: ['order-shipment', stageOrder?.number],
    enabled: !!stageOrder?.number,
    queryFn: async (): Promise<{ shipment: ShipmentInfo | null; events: TrackingEvent[] }> => {
      const { data: ship } = await supabase
        .from('wms_shipments')
        .select('id, shipment_number, status, carrier, tracking_number, shipped_at, delivered_at')
        .eq('order_number', stageOrder!.number)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!ship) return { shipment: null, events: [] };
      const { data: events } = await supabase
        .from('delivery_tracking')
        .select('id, event_type, description, location, registered_by, occurred_at')
        .eq('shipment_id', ship.id)
        .order('occurred_at', { ascending: false });
      return { shipment: ship as ShipmentInfo, events: (events || []) as TrackingEvent[] };
    },
  });

  const stageMut = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('wms_update_shipment_stage', {
        p_order_id: orderId,
        p_stage: stageForm.stage,
        p_tracking_number: stageForm.tracking_number || null,
        p_carrier: stageForm.carrier || null,
        p_location: stageForm.location || null,
        p_notes: stageForm.notes || null,
      });
      if (error) throw error;
      return data as any;
    },
    onSuccess: (data: any) => {
      toastSuccess(`Expedição ${data?.shipment_number} → ${STAGE_LABEL[stageForm.stage]}`);
      qc.invalidateQueries({ queryKey: ['order-shipment'] });
      qc.invalidateQueries({ queryKey: ['orders-for-picking'] });
      setStageForm((p) => ({ ...p, notes: '' }));
    },
    onError: (err: any) => toastError(`Falha: ${err.message}`),
  });

  const openStageDialog = (o: OrderRow) => {
    setStageOrder(o);
    setStageForm({
      stage: o.stage === 'shipped' ? 'delivered' : 'conferred',
      tracking_number: '',
      carrier: '',
      location: '',
      notes: '',
    });
    setStageOpen(true);
  };

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
                  <TableCell colSpan={9} className="p-4">
                    <EmptyState
                      compact
                      title="Nada para separar agora"
                      description="Assim que um pedido tiver reservas confirmadas, ele aparecerá aqui para picking."
                    />
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openStageDialog(o)}
                          title="Atualizar tracking / etapa de expedição"
                        >
                          <ClipboardList className="h-3 w-3 mr-1" />
                          Tracking
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={stageOpen} onOpenChange={setStageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Tracking — Pedido {stageOrder?.number}
            </DialogTitle>
            <DialogDescription>
              {stageOrder?.client_name} · Registra a etapa da expedição (conferido, etiquetado, coletado...) e adiciona evento ao rastreamento. Isolado por empresa via RLS.
            </DialogDescription>
          </DialogHeader>

          {shipmentInfo?.shipment && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Expedição:</span> <span className="font-mono">{shipmentInfo.shipment.shipment_number}</span></div>
              <div><span className="text-muted-foreground">Status atual:</span> <Badge variant="outline">{STAGE_LABEL[shipmentInfo.shipment.status as ShipmentStage] || shipmentInfo.shipment.status}</Badge></div>
              <div><span className="text-muted-foreground">Transportadora:</span> {shipmentInfo.shipment.carrier || '—'}</div>
              <div><span className="text-muted-foreground">Tracking:</span> <span className="font-mono">{shipmentInfo.shipment.tracking_number || '—'}</span></div>
            </div>
          )}

          <div className="grid gap-3">
            <div>
              <Label>Nova etapa</Label>
              <Select value={stageForm.stage} onValueChange={(v) => setStageForm({ ...stageForm, stage: v as ShipmentStage })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="conferred"><CheckCircle className="h-3 w-3 inline mr-2" />Conferido</SelectItem>
                  <SelectItem value="labeled"><Tag className="h-3 w-3 inline mr-2" />Etiquetado</SelectItem>
                  <SelectItem value="collected"><Hand className="h-3 w-3 inline mr-2" />Coletado pela transportadora</SelectItem>
                  <SelectItem value="shipped"><Truck className="h-3 w-3 inline mr-2" />Expedido</SelectItem>
                  <SelectItem value="delivered"><PackageCheck className="h-3 w-3 inline mr-2" />Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Transportadora</Label>
                <Input value={stageForm.carrier} onChange={(e) => setStageForm({ ...stageForm, carrier: e.target.value })} placeholder="Ex.: Correios, Jadlog" />
              </div>
              <div>
                <Label>Código de rastreamento</Label>
                <Input value={stageForm.tracking_number} onChange={(e) => setStageForm({ ...stageForm, tracking_number: e.target.value })} placeholder="Ex.: BR123456789" />
              </div>
            </div>

            <div>
              <Label>Local / Doca</Label>
              <Input value={stageForm.location} onChange={(e) => setStageForm({ ...stageForm, location: e.target.value })} placeholder="Ex.: Doca 02, CD São Paulo" />
            </div>

            <div>
              <Label>Observação</Label>
              <Textarea rows={2} value={stageForm.notes} onChange={(e) => setStageForm({ ...stageForm, notes: e.target.value })} placeholder="Detalhes opcionais do evento" />
            </div>
          </div>

          {shipmentInfo && shipmentInfo.events.length > 0 && (
            <div className="border-t pt-3">
              <Label className="mb-2 block">Histórico de eventos</Label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {shipmentInfo.events.map((ev) => (
                  <div key={ev.id} className="text-xs border-l-2 border-primary/50 pl-2 py-1">
                    <div className="font-medium">{ev.description}</div>
                    <div className="text-muted-foreground">
                      {format(new Date(ev.occurred_at), 'dd/MM/yyyy HH:mm')}
                      {ev.location && ` · ${ev.location}`}
                      {ev.registered_by && ` · ${ev.registered_by}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStageOpen(false)}>Fechar</Button>
            <Button
              onClick={() => stageOrder && stageMut.mutate(stageOrder.id)}
              disabled={stageMut.isPending}
            >
              Registrar {STAGE_LABEL[stageForm.stage]}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
