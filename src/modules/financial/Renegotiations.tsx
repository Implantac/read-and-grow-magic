import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useRenegotiations } from '@/hooks/financial/useRenegotiations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { formatBRL } from '@/lib/formatters';
const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  approved: { label: 'Aprovada', variant: 'default' },
  active: { label: 'Ativa', variant: 'default' },
  completed: { label: 'Concluída', variant: 'outline' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

export default function Renegotiations() {
  const { data: renegotiations = [], isLoading } = useRenegotiations();

  if (isLoading) return <PageLoading message="Carregando renegociações..." />;

  return (
    <PageContainer>
      <PageHeader title="Renegociações" description="Gerencie renegociações de títulos vencidos">
        <Button className="gap-2"><Plus className="h-4 w-4" />Nova Renegociação</Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Valor Original</TableHead>
                <TableHead className="text-right">Novo Valor</TableHead>
                <TableHead>Parcelas</TableHead>
                <TableHead>Juros</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renegotiations.map(r => {
                const st = statusMap[r.status] || { label: r.status, variant: 'secondary' as const };
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.client_name}</TableCell>
                    <TableCell className="text-right">{formatBRL(Number(r.original_total))}</TableCell>
                    <TableCell className="text-right font-medium">{formatBRL(Number(r.new_total))}</TableCell>
                    <TableCell>{r.installments}x</TableCell>
                    <TableCell>{Number(r.interest_rate).toFixed(1)}%</TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                    <TableCell>{format(new Date(r.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  </TableRow>
                );
              })}
              {renegotiations.length === 0 && (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nenhuma renegociação registrada
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
