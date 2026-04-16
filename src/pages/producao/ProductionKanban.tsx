import { useState, useMemo, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useProductionTimeLogs, formatElapsed } from '@/hooks/useProductionTimeLogs';
import { useOutsourcingOrders } from '@/hooks/useOutsourcingOrders';
import { priorityConfig } from '@/config/production';
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/shared/KPICard';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowRight, Clock, Factory, CheckCircle, Pause, AlertTriangle,
  Search, Package, TrendingUp, GripVertical, User, Calendar,
  PackageX, Truck, Wrench, Star, Swords, RefreshCw, Zap, Shield, Lightbulb, ListOrdered,
  Play, Square, Timer, Activity, DollarSign, Layers
} from 'lucide-react';
import { usePCPIntelligence } from '@/hooks/usePCPIntelligence';
import { WarModeService, type WarModeResult as LocalWarModeResult } from '@/lib/pcpServices';
import { useTechnicalSheets } from '@/hooks/useTechnicalSheets';
import { useSupplyStock } from '@/hooks/useSupplyStock';
import { useProductionCapacity } from '@/hooks/useProductionCapacity';
import { useWorkCenters } from '@/hooks/useWorkCenters';
import { QRCodeOPButton } from '@/components/producao/QRCodeOP';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const KANBAN_COLUMNS = [
  { key: 'planned', label: 'Planejado', icon: Clock, gradient: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/40', badge: 'bg-blue-500/20 text-blue-300' },
  { key: 'waiting_material', label: 'Aguardando Material', icon: PackageX, gradient: 'from-purple-500/10 to-purple-600/5', border: 'border-purple-500/40', badge: 'bg-purple-500/20 text-purple-300' },
  { key: 'in_progress', label: 'Em Produção', icon: Factory, gradient: 'from-amber-500/10 to-yellow-600/5', border: 'border-amber-500/40', badge: 'bg-amber-500/20 text-amber-300' },
  { key: 'outsourced', label: 'Terceirizado', icon: Truck, gradient: 'from-indigo-500/10 to-indigo-600/5', border: 'border-indigo-500/40', badge: 'bg-indigo-500/20 text-indigo-300' },
  { key: 'finishing', label: 'Finalização', icon: Wrench, gradient: 'from-teal-500/10 to-teal-600/5', border: 'border-teal-500/40', badge: 'bg-teal-500/20 text-teal-300' },
  { key: 'completed', label: 'Concluído', icon: CheckCircle, gradient: 'from-emerald-500/10 to-green-600/5', border: 'border-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-300' },
];

const VALID_TRANSITIONS: Record<string, string[]> = {
  planned: ['waiting_material', 'in_progress', 'outsourced'],
  waiting_material: ['planned', 'in_progress'],
  in_progress: ['paused', 'outsourced', 'finishing', 'completed'],
  outsourced: ['in_progress', 'finishing'],
  paused: ['in_progress'],
  finishing: ['completed', 'in_progress'],
  completed: [],
};

export default function ProductionKanban() {
  const { orders, loading, update, refetch } = useProductionOrders();
  const timeLogs = useProductionTimeLogs();
  const { orders: outsourcingOrders, lateOrders: lateOutsourcing } = useOutsourcingOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [wipLimits, setWipLimits] = useState<Record<string, number>>({});
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

  const { sheets } = useTechnicalSheets();
  const { supplies } = useSupplyStock();
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
  useEffect(() => {
    const channel = supabase
      .channel('kanban-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_orders' }, () => { refetch(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

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

  const sectors = useMemo(() => [...new Set(orders.map(o => o.sector || o.work_center).filter(Boolean))], [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status === 'cancelled' || o.status === 'draft') return false;
      const matchSearch = !searchTerm ||
        o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchSector = sectorFilter === 'all' || o.sector === sectorFilter || o.work_center === sectorFilter;
      const matchPriority = priorityFilter === 'all' || o.priority === priorityFilter;
      return matchSearch && matchSector && matchPriority;
    });
  }, [orders, searchTerm, sectorFilter, priorityFilter]);

  // Map outsourcing data to OPs
  const outsourcingByOP = useMemo(() => {
    const map: Record<string, typeof outsourcingOrders> = {};
    outsourcingOrders.forEach(oo => {
      if (!map[oo.production_order_id]) map[oo.production_order_id] = [];
      map[oo.production_order_id].push(oo);
    });
    return map;
  }, [outsourcingOrders]);

  const columns = useMemo(() => {
    return KANBAN_COLUMNS.map(col => ({
      ...col,
      items: filteredOrders.filter(o => o.status === col.key)
        .sort((a, b) => {
          // Sort by priority_score first (desc), then by priority enum, then by due_date
          if ((b.priority_score || 0) !== (a.priority_score || 0)) return (b.priority_score || 0) - (a.priority_score || 0);
          const pMap: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
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

  // Capacity load per work center
  const capacityLoad = useMemo(() => {
    const load: Record<string, { name: string; capacity: number; allocated: number }> = {};
    workCenters.filter(wc => wc.is_active).forEach(wc => {
      load[wc.id] = { name: wc.name, capacity: wc.capacity, allocated: 0 };
    });
    orders.filter(o => ['planned', 'in_progress', 'waiting_material'].includes(o.status)).forEach(o => {
      const wcId = (o as any).work_center_id;
      if (wcId && load[wcId]) {
        load[wcId].allocated += o.quantity;
      }
    });
    return load;
  }, [workCenters, orders]);

  // WIP (Work In Progress) metrics
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
    // Capacity alert (non-blocking)
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

    const statusLabels: Record<string, string> = {};
    KANBAN_COLUMNS.forEach(c => { statusLabels[c.key] = c.label; });
    statusLabels['paused'] = 'Pausada';

    if (!VALID_TRANSITIONS[order.status]?.includes(newStatus)) {
      toast.error(`Transição inválida: "${statusLabels[order.status] || order.status}" → "${statusLabels[newStatus] || newStatus}"`, {
        description: `De "${statusLabels[order.status]}" você pode ir para: ${(VALID_TRANSITIONS[order.status] || []).map(s => statusLabels[s] || s).join(', ') || 'nenhum'}.`,
      });
      return;
    }

    // WIP limit check
    const wipLimit = wipLimits[newStatus];
    if (wipLimit && wipLimit > 0) {
      const currentCount = orders.filter(o => o.status === newStatus).length;
      if (currentCount >= wipLimit) {
        toast.warning(`Limite WIP atingido para "${statusLabels[newStatus]}"`, {
          description: `Máximo de ${wipLimit} OPs. Remova uma antes de adicionar.`,
        });
        return;
      }
    }

    await moveOrder(draggableId, newStatus);
    toast.success(`OP ${order.order_number} movida para ${statusLabels[newStatus]}`);
  }, [orders, moveOrder, wipLimits]);

  // Suggestions
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

    // Capacity alerts
    Object.values(capacityLoad).forEach(cl => {
      const pct = cl.capacity > 0 ? (cl.allocated / cl.capacity) * 100 : 0;
      if (pct > 100) {
        list.push({ icon: '🔴', text: `Centro "${cl.name}" com ${pct.toFixed(0)}% de carga (${cl.allocated}/${cl.capacity}) → sobrecarga`, severity: 'critical' });
      } else if (pct >= 85) {
        list.push({ icon: '🟡', text: `Centro "${cl.name}" com ${pct.toFixed(0)}% de carga → próximo do limite`, severity: 'warning' });
      }
    });

    // WIP limit warnings
    columns.forEach(col => {
      if (col.wipLimit > 0 && col.items.length >= col.wipLimit * 0.9 && col.items.length < col.wipLimit) {
        list.push({ icon: '⚡', text: `"${col.label}" próximo do limite WIP (${col.items.length}/${col.wipLimit})`, severity: 'warning' });
      }
    });

    // WIP excess alerts
    if (wipMetrics.totalCost > 0) {
      Object.entries(wipMetrics.byColumn).forEach(([status, data]) => {
        if (data.count > 10) {
          const statusLabel = KANBAN_COLUMNS.find(c => c.key === status)?.label || status;
          list.push({ icon: '🏭', text: `${statusLabel}: ${data.count} OPs com ${data.qty} un em WIP (R$ ${data.cost.toLocaleString('pt-BR', { minimumFractionDigits: 0 })})`, severity: 'warning' });
        }
      });
    }

    return list;
  }, [orders, lateOutsourcing, columns, capacityLoad, wipMetrics]);

  // Recalculate priorities
  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('pcp-priority', {
        body: { action: 'recalculate' },
      });
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

  // War Mode
  const handleWarMode = async () => {
    setWarModeLoading(true);
    try {
      // Use local WarModeService for rich analysis (kanbanReorg, criticalAlerts)
      const localResult = WarModeService.execute(orders, intelligence.materialNeeds, capacities);
      
      // Also call edge function for server-side score calculation
      const { data, error } = await supabase.functions.invoke('pcp-priority', {
        body: { action: 'war_mode', confirm: false },
      });
      if (error) throw error;
      
      // Merge: use edge function scores + local kanbanReorg and criticalAlerts
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
      const { data, error } = await supabase.functions.invoke('pcp-priority', {
        body: { action: 'war_mode', confirm: true },
      });
      if (error) throw error;
      toast.success(`Modo Guerra aplicado: ${data.priorityChanges?.length || 0} OPs repriorizadas`);
      setWarModeOpen(false);
      setWarModeResult(null);
      await refetch();
    } catch (e: any) {
      toast.error('Erro ao aplicar Modo Guerra');
    } finally {
      setWarModeLoading(false);
    }
  };

  // Optimize Sequence
  const handleOptimizeSequence = async () => {
    setSequenceLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pcp-schedule', {
        body: { action: 'suggest' },
      });
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
      const { data, error } = await supabase.functions.invoke('pcp-schedule', {
        body: { action: 'apply' },
      });
      if (error) throw error;
      toast.success(`Sequência aplicada: ${data.ordersUpdated} OPs atualizadas`);
      setSequenceOpen(false);
      setSequenceResult(null);
      await refetch();
    } catch (e: any) {
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
                <p key={i} className={cn('text-xs', s.severity === 'critical' ? 'text-destructive font-medium' : s.severity === 'warning' ? 'text-warning' : 'text-muted-foreground')}>
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

      {/* War Mode Dialog */}
      <Dialog open={warModeOpen} onOpenChange={setWarModeOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Swords className="h-5 w-5" /> Modo Guerra — Resultado da Análise
            </DialogTitle>
            <DialogDescription>
              Revisão completa de prioridades, movimentações sugeridas e alertas críticos.
            </DialogDescription>
          </DialogHeader>
          {warModeResult && (
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-4">
                <p className="text-sm font-medium">{warModeResult.summary}</p>

                {/* Critical Alerts */}
                {warModeResult.criticalAlerts?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-destructive">
                      <AlertTriangle className="h-4 w-4" /> Alertas Críticos
                    </h4>
                    <div className="space-y-1">
                      {warModeResult.criticalAlerts.map((alert: string, i: number) => (
                        <p key={i} className="text-xs text-destructive bg-destructive/10 p-2 rounded">🔴 {alert}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority changes */}
                {warModeResult.priorityChanges?.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Zap className="h-4 w-4 text-warning" /> Repriorização ({warModeResult.priorityChanges.length})
                    </h4>
                    <div className="space-y-1.5">
                      {warModeResult.priorityChanges.map((c: any, i: number) => (
                        <div key={i} className="p-2 rounded-lg bg-muted text-xs flex items-center justify-between">
                          <div>
                            <span className="font-mono font-medium">{c.order_number}</span>
                            <span className="text-muted-foreground ml-2">Score: {c.score}</span>
                            {c.factors?.length > 0 && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">{c.factors.join(' · ')}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px]">{c.oldPriority}</Badge>
                            <ArrowRight className="h-3 w-3" />
                            <Badge variant={c.newPriority === 'urgent' ? 'destructive' : 'default'} className="text-[10px]">{c.newPriority}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">✅ Todas as prioridades já estão corretas.</p>
                )}

                {/* Kanban Reorganization Suggestions */}
                {warModeResult.kanbanReorg?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <ArrowRight className="h-4 w-4 text-primary" /> Movimentações Sugeridas ({warModeResult.kanbanReorg.length})
                    </h4>
                    <div className="space-y-1.5">
                      {warModeResult.kanbanReorg.map((r: any, i: number) => (
                        <div key={i} className="p-2 rounded-lg bg-primary/5 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-mono font-medium">{r.opNumber}</span>
                            <span className="text-muted-foreground ml-2">→ {r.suggestedStatus}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{r.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarModeOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmWarMode} disabled={warModeLoading || !warModeResult?.priorityChanges?.length}>
              <Swords className="h-4 w-4 mr-1" />
              {warModeLoading ? 'Aplicando...' : 'Confirmar e Aplicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sequence Optimization Dialog */}
      <Dialog open={sequenceOpen} onOpenChange={setSequenceOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5 text-primary" /> Sequência Otimizada — Sugestão
            </DialogTitle>
            <DialogDescription>
              Agrupamento por similaridade de produto para reduzir trocas de setup.
            </DialogDescription>
          </DialogHeader>
          {sequenceResult && (
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="py-3 px-4 text-center">
                      <p className="text-2xl font-bold text-primary">{sequenceResult.totalOrders}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">OPs Sequenciadas</p>
                    </CardContent>
                  </Card>
                  <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="py-3 px-4 text-center">
                      <p className="text-2xl font-bold text-emerald-400">{sequenceResult.totalGroups}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Grupos Similares</p>
                    </CardContent>
                  </Card>
                  <Card className="border-warning/30 bg-warning/5">
                    <CardContent className="py-3 px-4 text-center">
                      <p className="text-2xl font-bold text-warning">{sequenceResult.setupReduction}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Redução Setup</p>
                    </CardContent>
                  </Card>
                </div>

                <p className="text-sm font-medium">{sequenceResult.summary}</p>

                <div className="space-y-1.5">
                  {sequenceResult.sequence?.map((s: any) => (
                    <div key={s.id} className={cn(
                      'p-2.5 rounded-lg text-xs flex items-center gap-3',
                      s.setup_change ? 'bg-warning/10 border border-warning/20' : 'bg-muted/50'
                    )}>
                      <span className="font-mono font-bold text-primary w-8 text-center">{s.sequence}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{s.order_number}</span>
                          <span className="text-muted-foreground truncate">{s.product_name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                          {s.color && <span>Cor: {s.color}</span>}
                          {s.model_variant && <span>Modelo: {s.model_variant}</span>}
                          {s.sector && <span>Setor: {s.sector}</span>}
                          {s.due_date && <span>Prazo: {format(parseISO(s.due_date), 'dd/MM')}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[9px] font-mono">{s.priority}</Badge>
                        <Badge variant="outline" className="text-[9px] font-mono">
                          <Shield className="h-2.5 w-2.5 mr-0.5" />{s.sequence_score}
                        </Badge>
                      </div>
                      {s.setup_change && (
                        <Badge className="text-[9px] bg-warning/20 text-warning shrink-0">🔧 Setup</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSequenceOpen(false)}>Fechar</Button>
            <Button onClick={handleApplySequence} disabled={applyingSequence || !sequenceResult?.sequence?.length}>
              <ListOrdered className="h-4 w-4 mr-1" />
              {applyingSequence ? 'Aplicando...' : 'Aplicar Sequência'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottleneck Dialog */}
      <Dialog open={bottleneckOpen} onOpenChange={setBottleneckOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-destructive" /> Gargalos da Produção
            </DialogTitle>
            <DialogDescription>
              Análise automática baseada em tempo real, etapas e filas de produção.
            </DialogDescription>
          </DialogHeader>
          {bottleneckData && (
            <ScrollArea className="max-h-[55vh] pr-4">
              <div className="space-y-4">
                <p className="text-sm font-medium">{bottleneckData.summary}</p>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="py-3 px-2">
                      <p className="text-2xl font-bold text-primary">{bottleneckData.totalEntriesAnalyzed}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Apontamentos</p>
                    </CardContent>
                  </Card>
                  <Card className="border-warning/30 bg-warning/5">
                    <CardContent className="py-3 px-2">
                      <p className="text-2xl font-bold text-warning">{bottleneckData.totalStepsAnalyzed}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Etapas</p>
                    </CardContent>
                  </Card>
                  <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="py-3 px-2">
                      <p className="text-2xl font-bold text-destructive">{bottleneckData.totalOrdersActive}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">OPs Ativas</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Work Center Bottlenecks */}
                {bottleneckData.workCenterBottlenecks?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Factory className="h-4 w-4 text-destructive" /> Centros com Maior Tempo Médio
                    </h4>
                    <div className="space-y-1.5">
                      {bottleneckData.workCenterBottlenecks.map((b: any, i: number) => (
                        <div key={i} className={cn(
                          'p-2.5 rounded-lg text-xs flex items-center justify-between',
                          i === 0 ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/50'
                        )}>
                          <div>
                            <span className="font-medium">{b.name}</span>
                            <span className="text-muted-foreground ml-2">({b.entries} registros)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={i === 0 ? 'destructive' : 'outline'} className="text-[10px]">
                              <Clock className="h-2.5 w-2.5 mr-0.5" /> {b.avgMinutes}min
                            </Badge>
                            {b.rejectRate > 0 && (
                              <Badge className="text-[10px] bg-warning/20 text-warning">
                                {b.rejectRate}% refugo
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step Bottlenecks */}
                {bottleneckData.stepBottlenecks?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-warning" /> Etapas que Excedem Estimativa
                    </h4>
                    <div className="space-y-1.5">
                      {bottleneckData.stepBottlenecks.map((s: any, i: number) => (
                        <div key={i} className={cn(
                          'p-2.5 rounded-lg text-xs flex items-center justify-between',
                          i === 0 ? 'bg-warning/10 border border-warning/20' : 'bg-muted/50'
                        )}>
                          <div>
                            <span className="font-medium">{s.name}</span>
                            <span className="text-muted-foreground ml-2">({s.entries} vezes)</span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            +{s.avgOverrunMin}min excedido
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Queue Bottlenecks */}
                {bottleneckData.queueBottlenecks?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <PackageX className="h-4 w-4 text-primary" /> Filas por Setor/Status
                    </h4>
                    <div className="space-y-1.5">
                      {bottleneckData.queueBottlenecks.map((q: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-lg text-xs flex items-center justify-between bg-muted/50">
                          <span className="font-medium">{q.name}</span>
                          <Badge variant="outline" className="text-[10px]">{q.queueSize} OPs</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBottleneckOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

interface KanbanCardProps {
  order: any;
  dragHandleProps: any;
  isDragging: boolean;
  columnKey: string;
  onMove: (id: string, status: string) => void;
  outsourcingData?: any[];
  timeLogs: ReturnType<typeof useProductionTimeLogs>;
}

function KanbanCard({ order, dragHandleProps, isDragging, columnKey, onMove, outsourcingData, timeLogs }: KanbanCardProps) {
  const progress = order.quantity > 0 ? (order.produced_quantity / order.quantity) * 100 : 0;
  const isLate = order.due_date && differenceInDays(new Date(), parseISO(order.due_date)) > 0 && order.status !== 'completed';
  const daysLate = order.due_date ? differenceInDays(new Date(), parseISO(order.due_date)) : 0;
  const pCfg = priorityConfig[order.priority] || { label: order.priority, color: 'bg-gray-100 text-gray-800' };
  const hasOutsourcing = outsourcingData && outsourcingData.length > 0;
  const outsourcingLate = outsourcingData?.some(o => o.expected_return_date && new Date(o.expected_return_date) < new Date() && o.status !== 'returned');
  const hasScore = order.priority_score > 0;

  const priorityIndicator: Record<string, string> = {
    urgent: 'border-l-red-500',
    high: 'border-l-orange-500',
    medium: 'border-l-blue-500',
    low: 'border-l-gray-400',
  };

  const nextActions: Record<string, { label: string; status: string; icon: any }[]> = {
    planned: [
      { label: 'Produzir', status: 'in_progress', icon: ArrowRight },
      { label: 'Aguardar Mat.', status: 'waiting_material', icon: PackageX },
    ],
    waiting_material: [
      { label: 'Produzir', status: 'in_progress', icon: ArrowRight },
    ],
    in_progress: [
      { label: 'Pausar', status: 'paused', icon: Pause },
      { label: 'Finalizar', status: 'finishing', icon: Wrench },
    ],
    outsourced: [
      { label: 'Retornou', status: 'in_progress', icon: ArrowRight },
      { label: 'Finalizar', status: 'finishing', icon: Wrench },
    ],
    paused: [
      { label: 'Retomar', status: 'in_progress', icon: ArrowRight },
    ],
    finishing: [
      { label: 'Concluir', status: 'completed', icon: CheckCircle },
    ],
    completed: [],
  };

  const actions = nextActions[columnKey] || [];

  return (
    <Card className={cn(
      'shadow-sm hover:shadow-md transition-all duration-200 border-l-[3px] group',
      priorityIndicator[order.priority] || 'border-l-gray-400',
      isLate && 'ring-1 ring-destructive/30 bg-destructive/5',
      outsourcingLate && 'ring-1 ring-warning/30',
      isDragging && 'shadow-2xl ring-2 ring-primary/40 rotate-[1deg] scale-[1.02]'
    )}>
      <CardContent className="p-2.5 space-y-1.5">
        {/* Header */}
        <div className="flex items-center gap-1">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground flex-1">{order.order_number}</span>
          {hasScore && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-[9px] h-4 px-1 font-mono">
                    <Shield className="h-2.5 w-2.5 mr-0.5" />{order.priority_score}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Score de prioridade: {order.priority_score}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isLate && (
            <Badge variant="destructive" className="text-[9px] gap-0.5 px-1 h-4">
              <AlertTriangle className="h-2.5 w-2.5" /> {daysLate}d
            </Badge>
          )}
          {outsourcingLate && !isLate && (
            <Badge className="text-[9px] gap-0.5 px-1 h-4 bg-warning/20 text-warning">
              <Truck className="h-2.5 w-2.5" /> Terc. atrasado
            </Badge>
          )}
        </div>

        {/* Product */}
        <p className="font-medium text-xs leading-tight truncate">{order.product_name}</p>

        {/* Meta */}
        <div className="flex items-center gap-1 flex-wrap">
          <Badge className={cn('text-[9px] h-4', pCfg.color)}>{pCfg.label}</Badge>
          {order.client_name && (
            <span className="text-[10px] text-muted-foreground truncate flex items-center gap-0.5">
              <User className="h-2.5 w-2.5" /> {order.client_name.split(' ')[0]}
            </span>
          )}
          {hasOutsourcing && (
            <Badge variant="outline" className="text-[9px] h-4"><Truck className="h-2.5 w-2.5 mr-0.5" />Terc.</Badge>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{order.produced_quantity}/{order.quantity}</span>
            <span className="font-semibold">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Due date */}
        {order.due_date && (
          <p className={cn('text-[10px] flex items-center gap-0.5', isLate ? 'text-destructive font-medium' : 'text-muted-foreground')}>
            <Calendar className="h-2.5 w-2.5" />
            {format(parseISO(order.due_date), 'dd/MM')}
          </p>
        )}

        {/* Timer Controls */}
        {!['completed', 'cancelled'].includes(columnKey) && (() => {
          const activeLog = timeLogs.getActiveLog(order.id);
          const pausedLog = timeLogs.getPausedLog(order.id);
          const totalFinished = timeLogs.getTotalElapsed(order.id);
          const isRunning = !!activeLog;
          const isPaused = !!pausedLog;

          return (
            <div className="space-y-1 pt-0.5">
              {(isRunning || isPaused || totalFinished > 0) && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Timer className="h-2.5 w-2.5" />
                  {isRunning && <span className="text-emerald-400 font-medium animate-pulse">● Rodando</span>}
                  {isPaused && <span className="text-warning font-medium">⏸ Pausado ({formatElapsed(pausedLog!.elapsed_seconds)})</span>}
                  {totalFinished > 0 && <span className="ml-auto">Total: {formatElapsed(totalFinished)}</span>}
                </div>
              )}
              <div className="flex gap-1">
                {!isRunning && !isPaused && (
                  <Button size="sm" variant="outline" className="text-[10px] h-6 flex-1 px-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                    onClick={() => timeLogs.startTimer(order.id)}>
                    <Play className="h-2.5 w-2.5 mr-0.5" /> Iniciar
                  </Button>
                )}
                {isRunning && (
                  <>
                    <Button size="sm" variant="outline" className="text-[10px] h-6 flex-1 px-1 text-warning border-warning/30 hover:bg-warning/10"
                      onClick={() => timeLogs.pauseTimer(order.id)}>
                      <Pause className="h-2.5 w-2.5 mr-0.5" /> Pausar
                    </Button>
                    <Button size="sm" variant="outline" className="text-[10px] h-6 flex-1 px-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => timeLogs.finishTimer(order.id)}>
                      <Square className="h-2.5 w-2.5 mr-0.5" /> Finalizar
                    </Button>
                  </>
                )}
                {isPaused && (
                  <>
                    <Button size="sm" variant="outline" className="text-[10px] h-6 flex-1 px-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                      onClick={() => timeLogs.resumeTimer(order.id)}>
                      <Play className="h-2.5 w-2.5 mr-0.5" /> Retomar
                    </Button>
                    <Button size="sm" variant="outline" className="text-[10px] h-6 flex-1 px-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => timeLogs.finishTimer(order.id)}>
                      <Square className="h-2.5 w-2.5 mr-0.5" /> Finalizar
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex gap-1 pt-0.5">
            {actions.map(a => {
              const ActionIcon = a.icon;
              return (
                <Button key={a.status} size="sm" variant="outline" className="text-[10px] h-6 flex-1 px-1" onClick={() => onMove(order.id, a.status)}>
                  <ActionIcon className="h-2.5 w-2.5 mr-0.5" /> {a.label}
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
