import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConferenceRecords, useCreateConference } from '@/hooks/useOrderFlow';
import { useOrders } from '@/hooks/useOrders';
import { CheckCircle, Clock, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const conferenceStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-warning/10 text-warning' },
  in_progress: { label: 'Em Conferência', color: 'bg-info/10 text-info' },
  completed: { label: 'Concluída', color: 'bg-success/10 text-success' },
  divergent: { label: 'Divergente', color: 'bg-destructive/10 text-destructive' },
  approved: { label: 'Aprovada', color: 'bg-success/10 text-success' },
};

export default function ConferenceQueue() {
  const { data: conferences, isLoading } = useConferenceRecords();

  const statusCounts = (conferences || []).reduce((acc: Record<string, number>, c: any) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <PageContainer>
      <PageHeader title="Fila de Conferência" description="Validação de itens antes do faturamento" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          <div><p className="text-2xl font-bold">{conferences?.length || 0}</p><p className="text-xs text-muted-foreground">Total</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-warning" />
          <div><p className="text-2xl font-bold">{statusCounts['pending'] || 0}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div><p className="text-2xl font-bold">{statusCounts['divergent'] || 0}</p><p className="text-xs text-muted-foreground">Divergentes</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-success" />
          <div><p className="text-2xl font-bold">{(statusCounts['completed'] || 0) + (statusCounts['approved'] || 0)}</p><p className="text-xs text-muted-foreground">Concluídas</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Conferências</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Conferidos</TableHead>
              <TableHead>Divergentes</TableHead>
              <TableHead>Conferente</TableHead>
              <TableHead>Data</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : !conferences?.length ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma conferência na fila</TableCell></TableRow>
              ) : conferences.map((c: any) => {
                const sc = conferenceStatusConfig[c.status] || { label: c.status, color: '' };
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">{c.conference_number}</TableCell>
                    <TableCell><Badge variant="outline" className={cn('font-medium border', sc.color)}>{sc.label}</Badge></TableCell>
                    <TableCell>{c.total_items}</TableCell>
                    <TableCell>{c.checked_items}</TableCell>
                    <TableCell>{c.divergent_items > 0 ? <span className="text-destructive font-medium">{c.divergent_items}</span> : 0}</TableCell>
                    <TableCell>{c.conferee || '-'}</TableCell>
                    <TableCell>{format(new Date(c.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
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
