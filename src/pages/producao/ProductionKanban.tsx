import { useState, useMemo, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useOutsourcingOrders } from '@/hooks/useOutsourcingOrders';
import { priorityConfig } from '@/config/production';
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/shared/KPICard';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowRight, Clock, Factory, CheckCircle, Pause, AlertTriangle,
  Search, Package, TrendingUp, GripVertical, User, Calendar,
  PackageX, Truck, Wrench, Star
} from 'lucide-react';
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
  const { orders: outsourcingOrders, lateOrders: lateOutsourcing } = useOutsourcingOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('kanban-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_orders' }, () => { refetch(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

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
          const pMap: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
          const pDiff = (pMap[a.priority] ?? 9) - (pMap[b.priority] ?? 9);
          if (pDiff !== 0) return pDiff;
          if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          return 0;
        }),
    }));
  }, [filteredOrders]);

  const lateCount = orders.filter(o => o.due_date && differenceInDays(new Date(), parseISO(o.due_date)) > 0 && !['completed', 'cancelled'].includes(o.status)).length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length;
  const outsourcedCount = orders.filter(o => o.status === 'outsourced').length;
  const completedToday = orders.filter(o => o.status === 'completed' && o.completed_date && new Date(o.completed_date).toDateString() === new Date().toDateString()).length;
  const waitingMaterialCount = orders.filter(o => o.status === 'waiting_material').length;

  const moveOrder = useCallback(async (orderId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'in_progress' || newStatus === 'outsourced') updates.start_date = updates.start_date || new Date().toISOString();
    if (newStatus === 'completed') updates.completed_date = new Date().toISOString();
    await update(orderId, updates);
  }, [update]);

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
      const from = statusLabels[order.status] || order.status;
      const to = statusLabels[newStatus] || newStatus;
      toast.error(`Transição inválida: "${from}" → "${to}"`, {
        description: `De "${from}" você pode ir para: ${(VALID_TRANSITIONS[order.status] || []).map(s => statusLabels[s] || s).join(', ') || 'nenhum'}.`,
      });
      return;
    }

    await moveOrder(draggableId, newStatus);
    toast.success(`OP ${order.order_number} movida para ${statusLabels[newStatus]}`);
  }, [orders, moveOrder]);

  // Suggestions
  const suggestions = useMemo(() => {
    const list: { icon: string; text: string; severity: 'critical' | 'warning' | 'info' }[] = [];
    
    orders.filter(o => o.due_date && differenceInDays(new Date(), parseISO(o.due_date)) > 0 && !['completed', 'cancelled'].includes(o.status))
      .slice(0, 3).forEach(o => {
        list.push({ icon: '🔴', text: `OP ${o.order_number} atrasada → priorizar`, severity: 'critical' });
      });

    lateOutsourcing.slice(0, 2).forEach(oo => {
      list.push({ icon: '🟠', text: `Fornecedor ${oo.supplier_name} em atraso → risco de parada`, severity: 'warning' });
    });

    // Orders waiting_material too long
    orders.filter(o => o.status === 'waiting_material').slice(0, 2).forEach(o => {
      list.push({ icon: '📦', text: `OP ${o.order_number} aguardando material → verificar estoque`, severity: 'info' });
    });

    return list;
  }, [orders, lateOutsourcing]);

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
      <PageHeader title="Kanban de Produção" description="Arraste as OPs entre colunas — visão completa com terceirização e materiais" />

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
            return (
              <div key={col.key} className="space-y-2">
                <div className={cn(
                  'flex items-center gap-2 p-2.5 rounded-xl border-t-2 bg-gradient-to-b',
                  col.gradient, col.border
                )}>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-xs">{col.label}</span>
                  <Badge className={cn('ml-auto text-[10px] font-bold', col.badge)}>{col.items.length}</Badge>
                </div>

                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'space-y-2 min-h-[200px] rounded-xl p-1.5 transition-colors duration-200',
                        snapshot.isDraggingOver && 'bg-primary/5 ring-2 ring-primary/20 ring-dashed'
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
}

function KanbanCard({ order, dragHandleProps, isDragging, columnKey, onMove, outsourcingData }: KanbanCardProps) {
  const progress = order.quantity > 0 ? (order.produced_quantity / order.quantity) * 100 : 0;
  const isLate = order.due_date && differenceInDays(new Date(), parseISO(order.due_date)) > 0 && order.status !== 'completed';
  const daysLate = order.due_date ? differenceInDays(new Date(), parseISO(order.due_date)) : 0;
  const pCfg = priorityConfig[order.priority] || { label: order.priority, color: 'bg-gray-100 text-gray-800' };
  const hasOutsourcing = outsourcingData && outsourcingData.length > 0;
  const outsourcingLate = outsourcingData?.some(o => o.expected_return_date && new Date(o.expected_return_date) < new Date() && o.status !== 'returned');

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
