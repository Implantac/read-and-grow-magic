import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { productionStatusConfig, priorityConfig } from '@/config/production';
import { ListOrdered, AlertTriangle, Clock, Factory, Play, CheckCircle } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const priorityWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

export default function ProductionQueuePage() {
  const { orders, loading, update } = useProductionOrders();
  const [sectorFilter, setSectorFilter] = useState('all');

  const activeOrders = useMemo(() => {
    return orders
      .filter(o => ['planned', 'in_progress', 'paused'].includes(o.status))
      .filter(o => sectorFilter === 'all' || o.work_center === sectorFilter || o.sector === sectorFilter)
      .sort((a, b) => {
        // 1. Priority weight
        const pw = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (pw !== 0) return pw;
        // 2. Due date (earlier first)
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        if (da !== db) return da - db;
        // 3. Status (in_progress first)
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
        return 0;
      });
  }, [orders, sectorFilter]);

  const sectors = [...new Set(orders.map(o => o.work_center || o.sector).filter(Boolean))];
  const today = new Date();

  const handleStart = async (op: any) => {
    await update(op.id, { status: 'in_progress', start_date: new Date().toISOString() });
  };

  const handleComplete = async (op: any) => {
    await update(op.id, { status: 'completed', completed_date: new Date().toISOString() });
  };

  return (
    <PageContainer>
      <PageHeader title="Fila de Produção" description="Ordenação inteligente por prioridade, prazo e capacidade">
        <Select value={sectorFilter} onValueChange={setSectorFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Setor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Setores</SelectItem>
            {sectors.map(s => <SelectItem key={s} value={s!}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <ListOrdered className="h-7 w-7 text-primary" />
          <div><p className="text-2xl font-bold">{activeOrders.length}</p><p className="text-xs text-muted-foreground">Na Fila</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Factory className="h-7 w-7 text-info" />
          <div><p className="text-2xl font-bold">{activeOrders.filter(o => o.status === 'in_progress').length}</p><p className="text-xs text-muted-foreground">Produzindo</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-7 w-7 text-destructive" />
          <div><p className="text-2xl font-bold">{activeOrders.filter(o => o.due_date && differenceInDays(today, parseISO(o.due_date)) > 0).length}</p><p className="text-xs text-muted-foreground">Atrasadas</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-7 w-7 text-warning" />
          <div><p className="text-2xl font-bold">{activeOrders.filter(o => o.priority === 'urgent').length}</p><p className="text-xs text-muted-foreground">Urgentes</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ListOrdered className="h-5 w-5" /> Fila Ordenada por Prioridade</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Nº OP</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Qtde</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={11} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : activeOrders.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Fila de produção vazia</TableCell></TableRow>
              ) : activeOrders.map((o, idx) => {
                const pct = o.quantity > 0 ? (o.produced_quantity / o.quantity) * 100 : 0;
                const isDelayed = o.due_date && differenceInDays(today, parseISO(o.due_date)) > 0;
                const sc = productionStatusConfig[o.status] || { label: o.status, color: '' };
                const pc = priorityConfig[o.priority] || { label: o.priority, color: '' };
                return (
                  <TableRow key={o.id} className={cn(isDelayed && 'bg-destructive/5')}>
                    <TableCell className="font-bold text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-mono font-medium">{o.order_number}</TableCell>
                    <TableCell>{o.product_name}</TableCell>
                    <TableCell>{(o as any).client_name || '-'}</TableCell>
                    <TableCell>{o.produced_quantity}/{o.quantity} {o.unit}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-2 w-16" />
                        <span className="text-xs">{pct.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge className={cn('text-xs', pc.color)}>{pc.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {o.due_date ? format(new Date(o.due_date), 'dd/MM/yyyy') : '-'}
                        {isDelayed && <AlertTriangle className="h-3 w-3 text-destructive" />}
                      </div>
                    </TableCell>
                    <TableCell>{o.work_center || (o as any).sector || '-'}</TableCell>
                    <TableCell><Badge className={cn('text-xs', sc.color)}>{sc.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {o.status === 'planned' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStart(o)}>
                            <Play className="h-3 w-3 mr-1" /> Iniciar
                          </Button>
                        )}
                        {o.status === 'in_progress' && (
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleComplete(o)}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Finalizar
                          </Button>
                        )}
                      </div>
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
