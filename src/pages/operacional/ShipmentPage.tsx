import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useShipmentOrders } from '@/hooks/useOrderFlow';
import { Truck, Clock, CheckCircle, Package, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const shipmentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-warning/10 text-warning' },
  loading: { label: 'Em Carregamento', color: 'bg-info/10 text-info' },
  dispatched: { label: 'Despachado', color: 'bg-primary/10 text-primary' },
  in_transit: { label: 'Em Trânsito', color: 'bg-info/10 text-info' },
  delivered: { label: 'Entregue', color: 'bg-success/10 text-success' },
  returned: { label: 'Devolvido', color: 'bg-destructive/10 text-destructive' },
};

export default function ShipmentPage() {
  const { data: shipments, isLoading } = useShipmentOrders();

  const statusCounts = (shipments || []).reduce((acc: Record<string, number>, s: any) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <PageContainer>
      <PageHeader title="Expedição & Entregas" description="Controle de despacho, rastreamento e confirmação de entrega" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Truck className="h-8 w-8 text-primary" />
          <div><p className="text-2xl font-bold">{shipments?.length || 0}</p><p className="text-xs text-muted-foreground">Total Expedições</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-warning" />
          <div><p className="text-2xl font-bold">{statusCounts['pending'] || 0}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <MapPin className="h-8 w-8 text-info" />
          <div><p className="text-2xl font-bold">{statusCounts['in_transit'] || 0}</p><p className="text-xs text-muted-foreground">Em Trânsito</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-success" />
          <div><p className="text-2xl font-bold">{statusCounts['delivered'] || 0}</p><p className="text-xs text-muted-foreground">Entregues</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Expedições</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nº Expedição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Transportadora</TableHead>
              <TableHead>Volumes</TableHead>
              <TableHead>Peso (kg)</TableHead>
              <TableHead>Rastreio</TableHead>
              <TableHead>Prev. Entrega</TableHead>
              <TableHead>Frete</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : !shipments?.length ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma expedição registrada</TableCell></TableRow>
              ) : shipments.map((s: any) => {
                const sc = shipmentStatusConfig[s.status] || { label: s.status, color: '' };
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">{s.shipment_number}</TableCell>
                    <TableCell><Badge variant="outline" className={cn('font-medium border', sc.color)}>{sc.label}</Badge></TableCell>
                    <TableCell>{s.carrier || '-'}</TableCell>
                    <TableCell>{s.volumes}</TableCell>
                    <TableCell>{s.total_weight?.toFixed(1)}</TableCell>
                    <TableCell className="font-mono text-xs">{s.tracking_code || '-'}</TableCell>
                    <TableCell>{s.expected_delivery ? format(new Date(s.expected_delivery), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell>{s.freight_type} - R$ {s.freight_cost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
