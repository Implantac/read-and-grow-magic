import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { useTMS } from '@/hooks/operational/useTMSQuery';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { format } from 'date-fns';
import { ClipboardCheck } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';

const statusLabels: Record<string, string> = { pending: 'Pendente', delivered: 'Entregue', refused: 'Recusada', partial: 'Parcial' };
const statusColors: Record<string, string> = { pending: 'secondary', delivered: 'default', refused: 'destructive', partial: 'outline' };

const DeliveryProofPage = () => {
  const { proofs, proofsLoading: loading } = useTMS();

  if (loading) return <PageLoading />;

  return (
    <PageContainer>
      <PageHeader title="Comprovantes de Entrega" description="Provas de entrega com assinatura, foto e geolocalização" />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Recebido por</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Coordenadas</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proofs.length === 0 ? (
              <TableRow><TableCell colSpan={6}><EmptyState compact icon={ClipboardCheck} title="Sem comprovantes" description="Comprovantes com foto, assinatura e geolocalização serão exibidos após as entregas." /></TableCell></TableRow>
            ) : proofs.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-mono">{p.orderNumber || '-'}</TableCell>
                <TableCell>{p.customerName || '-'}</TableCell>
                <TableCell>{p.receivedBy || '-'}</TableCell>
                <TableCell>{p.deliveredAt ? format(new Date(p.deliveredAt), 'dd/MM/yyyy HH:mm') : '-'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {p.latitude && p.longitude ? `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}` : '-'}
                </TableCell>
                <TableCell><Badge variant={statusColors[p.status] as any}>{statusLabels[p.status] || p.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  );
};

export default DeliveryProofPage;
