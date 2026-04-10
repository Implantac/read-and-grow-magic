import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStockReservations } from '@/hooks/useOrderFlow';
import { Package, Lock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const reservationStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-warning/10 text-warning' },
  reserved: { label: 'Reservado', color: 'bg-info/10 text-info' },
  picked: { label: 'Separado', color: 'bg-success/10 text-success' },
  released: { label: 'Liberado', color: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelado', color: 'bg-destructive/10 text-destructive' },
};

export default function SeparationQueue() {
  const { data: reservations, isLoading } = useStockReservations();

  const statusCounts = (reservations || []).reduce((acc: Record<string, number>, r: any) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <PageContainer>
      <PageHeader title="Fila de Separação" description="Reservas de estoque e romaneio de separação" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div><p className="text-2xl font-bold">{reservations?.length || 0}</p><p className="text-xs text-muted-foreground">Total Reservas</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Lock className="h-8 w-8 text-info" />
          <div><p className="text-2xl font-bold">{statusCounts['reserved'] || 0}</p><p className="text-xs text-muted-foreground">Reservados</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-success" />
          <div><p className="text-2xl font-bold">{statusCounts['picked'] || 0}</p><p className="text-xs text-muted-foreground">Separados</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <XCircle className="h-8 w-8 text-warning" />
          <div><p className="text-2xl font-bold">{statusCounts['pending'] || 0}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Reservas de Estoque</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Solicitado</TableHead>
              <TableHead>Reservado</TableHead>
              <TableHead>Separado</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : !reservations?.length ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma reserva na fila</TableCell></TableRow>
              ) : reservations.map((r: any) => {
                const sc = reservationStatusConfig[r.status] || { label: r.status, color: '' };
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.product_code}</TableCell>
                    <TableCell>{r.product_name}</TableCell>
                    <TableCell>{r.requested_qty}</TableCell>
                    <TableCell>{r.reserved_qty}</TableCell>
                    <TableCell>{r.picked_qty}</TableCell>
                    <TableCell>{r.location || '-'}</TableCell>
                    <TableCell><Badge variant="outline" className={cn('font-medium border', sc.color)}>{sc.label}</Badge></TableCell>
                    <TableCell>{format(new Date(r.created_at), 'dd/MM/yyyy')}</TableCell>
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
