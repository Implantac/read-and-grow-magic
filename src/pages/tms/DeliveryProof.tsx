import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { useDeliveryProof } from '@/hooks/useTMS';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const statusLabels: Record<string, string> = { pending: 'Pendente', delivered: 'Entregue', refused: 'Recusada', partial: 'Parcial' };
const statusColors: Record<string, string> = { pending: 'secondary', delivered: 'default', refused: 'destructive', partial: 'outline' };

const DeliveryProofPage = () => {
  const { proofs, loading } = useDeliveryProof();

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
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum comprovante registrado</TableCell></TableRow>
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
