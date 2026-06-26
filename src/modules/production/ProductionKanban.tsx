import { useState, useMemo, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Input } from '@/ui/base/input';
import { Skeleton } from '@/ui/base/skeleton';
import { KPICard } from '@/shared/components/KPICard';
import { useProductionOrders } from '@/hooks/production/useProductionOrders';
import { useProductionTimeLogs } from '@/hooks/production/useProductionTimeLogs';
import { useOutsourcingOrders } from '@/hooks/production/useOutsourcingOrders';
import { usePCPIntelligence } from '@/hooks/production/usePCPIntelligence';
import { useTechnicalSheets } from '@/hooks/production/useTechnicalSheets';
import { useSupplyStock } from '@/hooks/inventory/useSupplyStock';
import { useProductionCapacity } from '@/hooks/production/useProductionCapacity';
import { useWorkCenters } from '@/hooks/production/useWorkCenters';
import { supabase } from '@/integrations/supabase/client';
import { formatBRL, formatNumber } from '@/lib/formatters';
import { WarModeService } from '@/lib/pcpServices';
import { cn } from '@/lib/utils';
import { parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import {
  Activity, AlertTriangle, Factory, Layers, ListOrdered, PackageX, RefreshCw,
  Search, Star, Swords, TrendingUp, Truck,
} from 'lucide-react';

import { KANBAN_COLUMNS, VALID_TRANSITIONS, STATUS_LABELS } from './kanban/constants';
import { KanbanCard } from './kanban/KanbanCard';
import { WarModeDialog } from './kanban/WarModeDialog';
import { SequenceDialog } from './kanban/SequenceDialog';
import { BottleneckDialog } from './kanban/BottleneckDialog';


export default function ProductionKanban() {
  const { orders, loading, update, refetch } = useProductionOrders();
  const timeLogs = useProductionTimeLogs();
  const { orders: outsourcingOrders, lateOrders: lateOutsourcing } = useOutsourcingOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [wipLimits, setWipLimits] = useState<Record<string, number>>({});

  // Dialog state
  const [warModeOpen, setWarModeOpen] = useState(false);
  const [warModeResult, setWarModeResult] = useState<any>(null);
  const [warModeLoading, setWarModeLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [sequenceOpen, setSequenceOpen] = useState(false);
  const [sequenceResult, setSequenceResult] = useState<any>(null);
  const [sequenceLoading, setSequenceLoading] = useState(false);
  const [applyingSequence, setApplyingSequence] = useState(false);
  const [bottleneckData, setBottleneckData] = useState<any>(null);
  const [bottleneckLoading, setBottleneckLoading] = useState(false);
  const [bottleneckOpen, setBottleneckOpen] = useState(false);

  // Preserve original hook calls to keep cache warmups identical.
  useTechnicalSheets();
  useSupplyStock();
  const { capacities } = useProductionCapacity();
  const { workCenters } = useWorkCenters();
  const intelligence = usePCPIntelligence();

  const [productCosts, setProductCosts] = useState<Record<string, number>>({});

  // Fetch product costs for WIP calculation
  useEffect(() => {
    const productIds = [...new Set(orders.map(o => o.product_id).filter(Boolean))];
    if (productIds.length === 0) return;
    (async () => {
      const { data } = await supabase.from('products').select('id, cost_price').in('id', productIds as string[]);
      if (data) {
        const map: Record<string, number> = {};
        data.forEach((p: any) => { map[p.id] = Number(p.cost_price) || 0; });
        setProductCosts(map);
      }
    })();
  }, [orders]);

  // Realtime
  const kanbanCompanyId = useEnterpriseStore((s) => s.activeCompanyId);
  useEffect(() => {
    if (!kanbanCompanyId) return;
    const channel = supabase
      .channel(`kanban-realtime:${kanbanCompanyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_orders', filter: `company_id=eq.${kanbanCompanyId}` }, () => { refetch(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch, kanbanCompanyId]);

  // Load WIP limits
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from('kanban_limits').select('*');
      if (data) {
        const map: Record<string, number> = {};
        data.forEach((r: any) => { map[r.column_name] = r.wip_limit; });
        setWipLimits(map);
      }
    })();
  }, []);

  const sectors = useMemo(
    () => [...new Set(orders.map(o => o.sector || o.work_center).filter(Boolean))],
    [orders],
  );

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status === 'cancelled' || o.status === 'draft') return false;
      const term = searchTerm.toLowerCase();
      const matchSearch = !term ||
        o.order_number.toLowerCase().includes(term) ||
        o.product_name.toLowerCase().includes(term) ||
        (o.client_name || '').toLowerCase().includes(term);
      const matchSector = sectorFilter === 'all' || o.sector === sectorFilter || o.work_center === sectorFilter;
      const matchPriority = priorityFilter === 'all' || o.priority === priorityFilter;
      return matchSearch && matchSector && matchPriority;
    });
  }, [orders, searchTerm, sectorFilter, priorityFilter]);

  const outsourcingByOP = useMemo(() => {
    const map: Record<string, typeof outsourcingOrders> = {};
    outsourcingOrders.forEach(oo => {
      if (!map[oo.production_order_id]) map[oo.production_order_id] = [];
      map[oo.production_order_id].push(oo);
    });
    return map;
  }, [outsourcingOrders]);

  const columns = useMemo(() => {
    const pMap: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return KANBAN_COLUMNS.map(col => ({
      ...col,
      items: filteredOrders.filter(o => o.status === col.key)
        .sort((a, b) => {
          if ((b.priority_score || 0) !== (a.priority_score || 0)) return (b.priority_score || 0) - (a.priority_score || 0);
          const pDiff = (pMap[a.priority] ?? 9) - (pMap[b.priority] ?? 9);
          if (pDiff !== 0) return pDiff;
          if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          return 0;
        }),
      wipLimit: wipLimits[col.key] || 0,
    }));
  }, [filteredOrders, wipLimits]);

  const lateCount = orders.filter(o => o.due_date && differenceInDays(new Date(), parseISO(o.due_date)) > 0 && !['completed', 'cancelled'].includes(o.status)).length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length;
  const outsourcedCount = orders.filter(o => o.status === 'outsourced').length;
  const completedToday = orders.filter(o => o.status === 'completed' && o.completed_date && new Date(o.completed_date).toDateString() === new Date().toDateString()).length;
  const waitingMaterialCount = orders.filter(o => o.status === 'waiting_material').length;

  const capacityLoad = useMemo(() => {
    const load: Record<string, { name: string; capacity: number; allocated: number }> = {};
    workCenters.filter(wc => wc.is_active).forEach(wc => {
      load[wc.id] = { name: wc.name, capacity: wc.capacity, allocated: 0 };
    });
    orders.filter(o => ['planned', 'in_progress', 'waiting_material'].includes(o.status)).forEach(o => {
      const wcId = (o as any).work_center_id;
      if (wcId && load[wcId]) load[wcId].allocated += o.quantity;
    });
    return load;
  }, [workCenters, orders]);

  const wipMetrics = useMemo(() => {
    const wipStatuses = ['planned', 'waiting_material', 'in_progress', 'outsourced', 'finishing', 'paused'];
    const wipOrders = orders.filter(o => wipStatuses.includes(o.status));
    const totalQty = wipOrders.reduce((s, o) => s + (o.quantity - o.produced_quantity), 0);
    const totalCost = wipOrders.reduce((s, o) => {
      const unitCost = o.product_id ? (productCosts[o.product_id] || 0) : 0;
      return s + (o.quantity - o.produced_quantity) * unitCost;
    }, 0);

    const byColumn: Record<string, { count: number; qty: number; cost: number }> = {};
    wipOrders.forEach(o => {
      if (!byColumn[o.status]) byColumn[o.status] = { count: 0, qty: 0, cost: 0 };
      const remaining = o.quantity - o.produced_quantity;
      const unitCost = o.product_id ? (productCosts[o.product_id] || 0) : 0;
      byColumn[o.status].count++;
      byColumn[o.status].qty += remaining;
      byColumn[o.status].cost += remaining * unitCost;
    });

    return { totalOrders: wipOrders.length, totalQty, totalCost, byColumn };
  }, [orders, productCosts]);

  const moveOrder = useCallback(async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    const wcId = order && (order as any).work_center_id;
    if (wcId && capacityLoad[wcId]) {
      const cl = capacityLoad[wcId];
      if (cl.allocated + (order?.quantity || 0) > cl.capacity) {
        toast.warning(`⚠️ Capacidade excedida no centro "${cl.name}"`, {
          description: `Alocado: ${cl.allocated + (order?.quantity || 0)} / Capacidade: ${cl.capacity}. Operação permitida, mas requer atenção.`,
        });
      }
    }

    const updates: any = { status: newStatus };
    if (newStatus === 'in_progress' || newStatus === 'outsourced') updates.start_date = updates.start_date || new Date().toISOString();
    if (newStatus === 'completed') updates.completed_date = new Date().toISOString();
    await update(orderId, updates);
  }, [update, orders, capacityLoad]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newStatus = destination.droppableId;
    const order = orders.find(o => o.id === draggableId);
    if (!order || order.status === newStatus) return;

    if (!VALID_TRANSITIONS[order.status]?.includes(newStatus)) {
      toast.error(`Transição inválida: "${STATUS_LABELS[order.status] || order.status}" → "${STATUS_LABELS[newStatus] || newStatus}"`, {
        description: `De "${STATUS_LABELS[order.status]}" você pode ir para: ${(VALID_TRANSITIONS[order.status] || []).map(s => STATUS_LABELS[s] || s).join(', ') || 'nenhum'}.`,
      });
      return;
    }

    const wipLimit = wipLimits[newStatus];
    if (wipLimit && wipLimit > 0) {
      const currentCount = orders.filter(o => o.status === newStatus).length;
      if (currentCount >= wipLimit) {
        toast.warning(`Limite WIP atingido para "${STATUS_LABELS[newStatus]}"`, {
          description: `Máximo de ${wipLimit} OPs. Remova uma antes de adicionar.`,
        });
        return;
      }
    }

    await moveOrder(draggableId, newStatus);
    toast.success(`OP ${order.order_number} movida para ${STATUS_LABELS[newStatus]}`);
  }, [orders, moveOrder, wipLimits]);

  const suggestions = useMemo(() => {
    const list: { icon: string; text: string; severity: 'critical' | 'warning' | 'info' }[] = [];

    orders.filter(o => o.due_date && differenceInDays(new Date(), parseISO(o.due_date)) > 0 && !['completed', 'cancelled'].includes(o.status))
      .slice(0, 3).forEach(o => {
        list.push({ icon: '🔴', text: `OP ${o.order_number} atrasada ${differenceInDays(new Date(), parseISO(o.due_date))}d → priorizar`, severity: 'critical' });
      });

    lateOutsourcing.slice(0, 2).forEach(oo => {
      list.push({ icon: '🟠', text: `Fornecedor ${oo.supplier_name} em atraso → risco de parada`, severity: 'warning' });
    });

    orders.filter(o => o.status === 'waiting_material').slice(0, 2).forEach(o => {
      list.push({ icon: '📦', text: `OP ${o.order_number} aguardando material → verificar estoque`, severity: 'info' });
    });

    Object.values(capacityLoad).forEach(cl => {
      const pct = cl.capacity > 0 ? (cl.allocated / cl.capacity) * 100 : 0;
      if (pct > 100) {
        list.push({ icon: '🔴', text: `Centro "${cl.name}" com ${pct.toFixed(0)}% de carga (${cl.allocated}/${cl.capacity}) → sobrecarga`, severity: 'critical' });
      } else if (pct >= 85) {
        list.push({ icon: '🟡', text: `Centro "${cl.name}" com ${pct.toFixed(0)}% de carga → próximo do limite`, severity: 'warning' });
      }
    });

    columns.forEach(col => {
      if (col.wipLimit > 0 && col.items.length >= col.wipLimit * 0.9 && col.items.length < col.wipLimit) {
        list.push({ icon: '⚡', text: `"${col.label}" próximo do limite WIP (${col.items.length}/${col.wipLimit})`, severity: 'warning' });
      }
    });

    if (wipMetrics.totalCost > 0) {
      Object.entries(wipMetrics.byColumn).forEach(([status, data]) => {
        if (data.count > 10) {
          const statusLabel = KANBAN_COLUMNS.find(c => c.key === status)?.label || status;
          list.push({ icon: '🏭', text: `${statusLabel}: ${data.count} OPs com ${data.qty} un em WIP (${formatBRL(data.cost)})`, severity: 'warning' });
        }
      });
    }

    return list;
  }, [orders, lateOutsourcing, columns, capacityLoad, wipMetrics]);

  // ---- Actions ----
  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('pcp-priority', { body: { action: 'recalculate' } });
      if (error) throw error;
      toast.success(`Prioridades recalculadas: ${data.ordersUpdated} OPs atualizadas`);
      await refetch();
    } catch (e: any) {
      toast.error('Erro ao recalcular prioridades');
      console.error(e);
    } finally {
      setRecalculating(false);
    }
  };

  const handleWarMode = async () => {
    setWarModeLoading(true);
    try {
      const localResult = WarModeService.execute(orders, intelligence.materialNeeds, capacities);
      const { data, error } = await supabase.functions.invoke('pcp-priority', { body: { action: 'war_mode', confirm: false } });
      if (error) throw error;
      setWarModeResult({
        ...data,
        kanbanReorg: localResult.kanbanReorg,
        criticalAlerts: localResult.criticalAlerts,
        summary: localResult.summary,
      });
      setWarModeOpen(true);
    } catch (e: any) {
      toast.error('Erro ao executar Modo Guerra');
      console.error(e);
    } finally {
      setWarModeLoading(false);
    }
  };

  const handleConfirmWarMode = async () => {
    setWarModeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pcp-priority', { body: { action: 'war_mode', confirm: true } });
      if (error) throw error;
      toast.success(`Modo Guerra aplicado: ${data.priorityChanges?.length || 0} OPs repriorizadas`);
      setWarModeOpen(false);
      setWarModeResult(null);
      await refetch();
    } catch {
      toast.error('Erro ao aplicar Modo Guerra');
    } finally {
      setWarModeLoading(false);
    }
  };

  const handleOptimizeSequence = async () => {
    setSequenceLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pcp-schedule', { body: { action: 'suggest' } });
      if (error) throw error;
      setSequenceResult(data);
      setSequenceOpen(true);
    } catch (e: any) {
      toast.error('Erro ao otimizar sequência');
      console.error(e);
    } finally {
      setSequenceLoading(false);
    }
  };

  const handleApplySequence = async () => {
    setApplyingSequence(true);
    try {
      const { data, error } = await supabase.functions.invoke('pcp-schedule', { body: { action: 'apply' } });
      if (error) throw error;
      toast.success(`Sequência aplicada: ${data.ordersUpdated} OPs atualizadas`);
      setSequenceOpen(false);
      setSequenceResult(null);
      await refetch();
    } catch {
      toast.error('Erro ao aplicar sequência');
    } finally {
      setApplyingSequence(false);
    }
  };

  const handleBottleneckAnalysis = async () => {
    setBottleneckLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pcp-bottlenecks');
      if (error) throw error;
      setBottleneckData(data);
      setBottleneckOpen(true);
    } catch (e: any) {
      toast.error('Erro ao analisar gargalos');
      console.error(e);
    } finally {
      setBottleneckLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-64 mb-4" />
        <div className="grid grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-96" />)}</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Kanban de Produção" description="Arraste as OPs entre colunas — priorização automática, WIP limits e Modo Guerra">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRecalculate} disabled={recalculating}>
            <RefreshCw className={cn('h-4 w-4 mr-1', recalculating && 'animate-spin')} />
            Recalcular
          </Button>
          <Button variant="destructive" size="sm" onClick={handleWarMode} disabled={warModeLoading}>
            <Swords className="h-4 w-4 mr-1" />
            Modo Guerra
          </Button>
          <Button variant="secondary" size="sm" onClick={handleOptimizeSequence} disabled={sequenceLoading}>
            <ListOrdered className={cn('h-4 w-4 mr-1', sequenceLoading && 'animate-pulse')} />
            Otimizar Sequência
          </Button>
          <Button variant="outline" size="sm" onClick={handleBottleneckAnalysis} disabled={bottleneckLoading}>
            <Activity className={cn('h-4 w-4 mr-1', bottleneckLoading && 'animate-pulse')} />
            Gargalos
          </Button>
        </div>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard title="Em Produção" value={inProgressCount} icon={<Factory className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Aguardando Material" value={waitingMaterialCount} icon={<PackageX className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Terceirizado" value={outsourcedCount} icon={<Truck className="h-5 w-5" />} accentColor="info" index={2} />
        <KPICard title="Atrasadas" value={lateCount} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={3} />
        <KPICard title="Concluídas Hoje" value={completedToday} icon={<TrendingUp className="h-5 w-5" />} accentColor="success" index={4} />
      </div>

      {/* WIP Panel */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">WIP — Material em Processo</span>
            <Badge variant="outline" className="ml-auto text-[10px]">{wipMetrics.totalOrders} OPs</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{formatNumber(wipMetrics.totalQty)}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Unidades em Processo</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-400">R$ {formatNumber(wipMetrics.totalCost, 0)}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Custo Estimado WIP</p>
            </div>
            {Object.entries(wipMetrics.byColumn).slice(0, 2).map(([status, data]) => {
              const label = KANBAN_COLUMNS.find(c => c.key === status)?.label || status;
              return (
                <div key={status} className="text-center">
                  <p className="text-lg font-bold text-foreground">{data.count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase truncate">{label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Sugestões Inteligentes</span>
            </div>
            <div className="space-y-1">
              {suggestions.map((s, i) => (
                <p key={i} className={cn(
                  'text-xs',
                  s.severity === 'critical' ? 'text-destructive font-medium'
                    : s.severity === 'warning' ? 'text-warning' : 'text-muted-foreground'
                )}>
                  {s.icon} {s.text}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-border/50">
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
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {columns.map(col => {
            const Icon = col.icon;
            const isOverWip = col.wipLimit > 0 && col.items.length >= col.wipLimit;
            const isNearWip = col.wipLimit > 0 && col.items.length >= col.wipLimit * 0.9 && !isOverWip;
            return (
              <div key={col.key} className="space-y-2">
                <div className={cn(
                  'flex items-center gap-2 p-2.5 rounded-xl border-t-2 bg-gradient-to-b',
                  col.gradient, col.border,
                  isOverWip && 'ring-2 ring-destructive/40'
                )}>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-xs">{col.label}</span>
                  <Badge className={cn('ml-auto text-[10px] font-bold', col.badge)}>
                    {col.items.length}
                    {col.wipLimit > 0 && <span className="opacity-60">/{col.wipLimit}</span>}
                  </Badge>
                  {isOverWip && <span className="text-[10px] text-destructive">⚠</span>}
                  {isNearWip && <span className="text-[10px] text-warning">⚡</span>}
                </div>

                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'space-y-2 min-h-[200px] rounded-xl p-1.5 transition-colors duration-200',
                        snapshot.isDraggingOver && 'bg-primary/5 ring-2 ring-primary/20 ring-dashed',
                        isOverWip && snapshot.isDraggingOver && 'ring-destructive/30 bg-destructive/5'
                      )}
                    >
                      {col.items.map((order, index) => (
                        <Draggable key={order.id} draggableId={order.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn('transition-shadow', snapshot.isDragging && 'z-50')}
                            >
                              <KanbanCard
                                order={order}
                                dragHandleProps={provided.dragHandleProps}
                                isDragging={snapshot.isDragging}
                                columnKey={col.key}
                                onMove={moveOrder}
                                outsourcingData={outsourcingByOP[order.id]}
                                timeLogs={timeLogs}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {col.items.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center text-[11px] text-muted-foreground py-10 border border-dashed rounded-xl opacity-50">
                          Arraste OPs aqui
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <WarModeDialog
        open={warModeOpen}
        onOpenChange={setWarModeOpen}
        result={warModeResult}
        loading={warModeLoading}
        onConfirm={handleConfirmWarMode}
      />

      <SequenceDialog
        open={sequenceOpen}
        onOpenChange={setSequenceOpen}
        result={sequenceResult}
        applying={applyingSequence}
        onApply={handleApplySequence}
      />

      <BottleneckDialog
        open={bottleneckOpen}
        onOpenChange={setBottleneckOpen}
        data={bottleneckData}
      />
    </PageContainer>
  );
}
