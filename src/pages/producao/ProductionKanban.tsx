import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { productionStatusConfig, priorityConfig } from '@/config/production';
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/shared/KPICard';
import { ArrowRight, Clock, Factory, CheckCircle, Pause, AlertTriangle, Search, Filter, Package, TrendingUp } from 'lucide-react';
import { QRCodeOPButton } from '@/components/producao/QRCodeOP';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

const KANBAN_COLUMNS = [
  { key: 'planned', label: 'Fila / Planejada', icon: Clock, color: 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20' },
  { key: 'in_progress', label: 'Em Produção', icon: Factory, color: 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20' },
  { key: 'paused', label: 'Pausada', icon: Pause, color: 'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20' },
  { key: 'completed', label: 'Finalizada', icon: CheckCircle, color: 'border-green-400 bg-green-50/50 dark:bg-green-950/20' },
];

export default function ProductionKanban() {
  const { orders, loading, update } = useProductionOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const sectors = useMemo(() => [...new Set(orders.map(o => o.sector || o.work_center).filter(Boolean))], [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = !searchTerm ||
        o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchSector = sectorFilter === 'all' || o.sector === sectorFilter || o.work_center === sectorFilter;
      const matchPriority = priorityFilter === 'all' || o.priority === priorityFilter;
      return matchSearch && matchSector && matchPriority;
    });
  }, [orders, searchTerm, sectorFilter, priorityFilter]);

  const columns = useMemo(() => {
    return KANBAN_COLUMNS.map(col => ({
      ...col,
      items: filteredOrders.filter(o => o.status === col.key)
        .sort((a, b) => {
          const pMap: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
          const pDiff = (pMap[a.priority] ?? 9) - (pMap[b.priority] ?? 9);
          if (pDiff !== 0) return pDiff;
          // Secondary sort: due date (earliest first)
          if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          return 0;
        }),
    }));
  }, [filteredOrders]);

  const lateCount = orders.filter(o => o.due_date && differenceInDays(new Date(), parseISO(o.due_date)) > 0 && !['completed', 'cancelled'].includes(o.status)).length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length;
  const plannedCount = orders.filter(o => o.status === 'planned').length;
  const completedToday = orders.filter(o => o.status === 'completed' && o.completed_date && new Date(o.completed_date).toDateString() === new Date().toDateString()).length;

  const moveOrder = async (orderId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'in_progress') updates.start_date = new Date().toISOString();
    if (newStatus === 'completed') updates.completed_date = new Date().toISOString();
    await update(orderId, updates);
  };

  if (loading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-64 mb-4" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96" />)}</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Kanban de Produção" description="Visão do fluxo produtivo em tempo real — prioridade automática por urgência e prazo" />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Na Fila" value={plannedCount} icon={<Package className="h-5 w-5" />} accentColor="info" index={0} />
        <KPICard title="Em Produção" value={inProgressCount} icon={<Factory className="h-5 w-5" />} accentColor="primary" index={1} />
        <KPICard title="Atrasadas" value={lateCount} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={2} />
        <KPICard title="Concluídas Hoje" value={completedToday} icon={<TrendingUp className="h-5 w-5" />} accentColor="success" index={3} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar OP, produto ou cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Setor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Setores</SelectItem>
                {sectors.map(s => <SelectItem key={s!} value={s!}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">🔴 Urgente</SelectItem>
                <SelectItem value="high">🟠 Alta</SelectItem>
                <SelectItem value="medium">🔵 Média</SelectItem>
                <SelectItem value="low">⚪ Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map(col => {
          const Icon = col.icon;
          return (
            <div key={col.key} className="space-y-3">
              <div className={cn('flex items-center gap-2 p-3 rounded-lg border-t-4', col.color)}>
                <Icon className="h-5 w-5" />
                <span className="font-semibold">{col.label}</span>
                <Badge variant="secondary" className="ml-auto">{col.items.length}</Badge>
              </div>

              <div className="space-y-2 min-h-[200px]">
                {col.items.map(order => {
                  const progress = order.quantity > 0 ? (order.produced_quantity / order.quantity) * 100 : 0;
                  const isLate = order.due_date && differenceInDays(new Date(), parseISO(order.due_date)) > 0 && order.status !== 'completed';
                  const daysLate = order.due_date ? differenceInDays(new Date(), parseISO(order.due_date)) : 0;
                  const pCfg = priorityConfig[order.priority] || { label: order.priority, color: 'bg-gray-100 text-gray-800' };

                  return (
                    <Card key={order.id} className={cn('shadow-sm hover:shadow-md transition-all', isLate && 'border-destructive ring-1 ring-destructive/20')}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>
                          {isLate && (
                            <Badge variant="destructive" className="text-[10px] gap-1">
                              <AlertTriangle className="h-3 w-3" /> {daysLate}d atraso
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm leading-tight">{order.product_name}</p>
                        {order.client_name && <p className="text-xs text-muted-foreground">{order.client_name}</p>}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className={cn('text-[10px]', pCfg.color)}>{pCfg.label}</Badge>
                          {order.sector && <Badge variant="outline" className="text-[10px]">📍 {order.sector}</Badge>}
                          {order.color && <Badge variant="outline" className="text-[10px]">{order.color}</Badge>}
                          {order.size_grid && <Badge variant="outline" className="text-[10px]">{order.size_grid}</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.produced_quantity}/{order.quantity} {order.unit} ({progress.toFixed(0)}%)
                        </div>
                        <Progress value={progress} className="h-1.5" />
                        {order.due_date && (
                          <p className={cn('text-xs', isLate ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                            Entrega: {format(parseISO(order.due_date), 'dd/MM')}
                          </p>
                        )}

                        <div className="flex gap-1 pt-1 flex-wrap">
                          <QRCodeOPButton orderNumber={order.order_number} orderId={order.id} productName={order.product_name} batchCode={order.batch_code || undefined} />
                          {col.key === 'planned' && (
                            <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => moveOrder(order.id, 'in_progress')}>
                              <ArrowRight className="h-3 w-3 mr-1" /> Iniciar
                            </Button>
                          )}
                          {col.key === 'in_progress' && (
                            <>
                              <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => moveOrder(order.id, 'paused')}>
                                <Pause className="h-3 w-3 mr-1" /> Pausar
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => moveOrder(order.id, 'completed')}>
                                <CheckCircle className="h-3 w-3 mr-1" /> Finalizar
                              </Button>
                            </>
                          )}
                          {col.key === 'paused' && (
                            <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => moveOrder(order.id, 'in_progress')}>
                              <ArrowRight className="h-3 w-3 mr-1" /> Retomar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {col.items.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8 border border-dashed rounded-lg">
                    Nenhuma OP
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
