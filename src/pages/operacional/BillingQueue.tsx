import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBillingQueue, useUpdateBillingStatus } from '@/hooks/useOrderFlow';
import { FileText, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const billingStatusConfig: Record<string, { label: string; color: string }> = {
  awaiting_billing: { label: 'Aguardando', color: 'bg-warning/10 text-warning' },
  in_billing: { label: 'Em Faturamento', color: 'bg-info/10 text-info' },
  billed_partial: { label: 'Faturado Parcial', color: 'bg-accent text-accent-foreground' },
  billed_full: { label: 'Faturado Total', color: 'bg-success/10 text-success' },
  rejected: { label: 'Rejeitado', color: 'bg-destructive/10 text-destructive' },
};

export default function BillingQueuePage() {
  const { data: items, isLoading } = useBillingQueue();
  const updateStatus = useUpdateBillingStatus();

  const statusCounts = (items || []).reduce((acc: Record<string, number>, i: any) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  const totalPending = (items || []).filter((i: any) => i.status === 'awaiting_billing').reduce((s: number, i: any) => s + (i.pending_amount || 0), 0);

  return (
    <PageContainer>
      <PageHeader title="Fila de Faturamento" description="Pedidos prontos para emissão de nota fiscal" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div><p className="text-2xl font-bold">{items?.length || 0}</p><p className="text-xs text-muted-foreground">Total na Fila</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-warning" />
          <div><p className="text-2xl font-bold">{statusCounts['awaiting_billing'] || 0}</p><p className="text-xs text-muted-foreground">Aguardando</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-success" />
          <div><p className="text-2xl font-bold">{(statusCounts['billed_full'] || 0) + (statusCounts['billed_partial'] || 0)}</p><p className="text-xs text-muted-foreground">Faturados</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-primary" />
          <div><p className="text-2xl font-bold">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p><p className="text-xs text-muted-foreground">Valor Pendente</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Fila de Faturamento</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Faturado</TableHead>
              <TableHead>Pendente</TableHead>
              <TableHead>Nota</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : !items?.length ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum item na fila de faturamento</TableCell></TableRow>
              ) : items.map((item: any) => {
                const sc = billingStatusConfig[item.status] || { label: item.status, color: '' };
                return (
                  <TableRow key={item.id}>
                    <TableCell><Badge variant="outline" className={cn('font-medium border', sc.color)}>{sc.label}</Badge></TableCell>
                    <TableCell>{item.billing_type === 'full' ? 'Total' : 'Parcial'}</TableCell>
                    <TableCell>R$ {item.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>R$ {item.billed_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>R$ {item.pending_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{item.invoice_number || '-'}</TableCell>
                    <TableCell>{format(new Date(item.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">
                      {item.status === 'awaiting_billing' && (
                        <Button size="sm" onClick={() => updateStatus.mutate({ id: item.id, status: 'in_billing' })}>
                          Iniciar
                        </Button>
                      )}
                    </TableCell>
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
