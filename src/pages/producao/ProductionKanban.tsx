import { useState, useMemo, useCallback } from 'react';
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
import { priorityConfig } from '@/config/production';
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/shared/KPICard';
import {
  ArrowRight, Clock, Factory, CheckCircle, Pause, AlertTriangle,
  Search, Package, TrendingUp, GripVertical, User, Calendar
} from 'lucide-react';
import { QRCodeOPButton } from '@/components/producao/QRCodeOP';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const KANBAN_COLUMNS = [
  { key: 'planned', label: 'Fila / Planejada', icon: Clock, gradient: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/40', badge: 'bg-blue-500/20 text-blue-300' },
  { key: 'in_progress', label: 'Em Produção', icon: Factory, gradient: 'from-amber-500/10 to-yellow-600/5', border: 'border-amber-500/40', badge: 'bg-amber-500/20 text-amber-300' },
  { key: 'paused', label: 'Pausada', icon: Pause, gradient: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-500/40', badge: 'bg-orange-500/20 text-orange-300' },
  { key: 'completed', label: 'Finalizada', icon: CheckCircle, gradient: 'from-emerald-500/10 to-green-600/5', border: 'border-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-300' },
];

export default function ProductionKanban() {
  const { orders, loading, update } = useProductionOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

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
  const plannedCount = orders.filter(o => o.status === 'planned').length;
  const completedToday = orders.filter(o => o.status === 'completed' && o.completed_date && new Date(o.completed_date).toDateString() === new Date().toDateString()).length;

  const moveOrder = useCallback(async (orderId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'in_progress') updates.start_date = new Date().toISOString();
    if (newStatus === 'completed') updates.completed_date = new Date().toISOString();
    await update(orderId, updates);
  }, [update]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newStatus = destination.droppableId;
    const order = orders.find(o => o.id === draggableId);
    if (!order || order.status === newStatus) return;

    // Validate transitions
    const validTransitions: Record<string, string[]> = {
      planned: ['in_progress'],
      in_progress: ['paused', 'completed'],
      paused: ['in_progress'],
      completed: [],
    };
    if (!validTransitions[order.status]?.includes(newStatus)) {
      toast.error(`Não é possível mover de "${order.status}" para "${newStatus}"`);
      return;
    }

    await moveOrder(draggableId, newStatus);
    toast.success(`OP ${order.order_number} movida para ${KANBAN_COLUMNS.find(c => c.key === newStatus)?.label}`);
  }, [orders, moveOrder]);

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
      <PageHeader title="Kanban de Produção" description="Arraste as OPs entre colunas para atualizar o status — prioridade automática por urgência e prazo" />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Na Fila" value={plannedCount} icon={<Package className="h-5 w-5" />} accentColor="info" index={0} />
        <KPICard title="Em Produção" value={inProgressCount} icon={<Factory className="h-5 w-5" />} accentColor="primary" index={1} />
        <KPICard title="Atrasadas" value={lateCount} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={2} />
        <KPICard title="Concluídas Hoje" value={completedToday} icon={<TrendingUp className="h-5 w-5" />} accentColor="success" index={3} />
      </div>

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

      {/* Kanban Board with DnD */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {columns.map(col => {
            const Icon = col.icon;
            return (
              <div key={col.key} className="space-y-3">
                {/* Column header */}
                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border-t-2 bg-gradient-to-b',
                  col.gradient, col.border
                )}>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold text-sm">{col.label}</span>
                  <Badge className={cn('ml-auto text-xs font-bold', col.badge)}>{col.items.length}</Badge>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'space-y-2 min-h-[200px] rounded-xl p-2 transition-colors duration-200',
                        snapshot.isDraggingOver && 'bg-primary/5 ring-2 ring-primary/20 ring-dashed'
                      )}
                    >
                      {col.items.map((order, index) => (
                        <Draggable key={order.id} draggableId={order.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                'transition-shadow',
                                snapshot.isDragging && 'z-50'
                              )}
                            >
                              <KanbanCard
                                order={order}
                                dragHandleProps={provided.dragHandleProps}
                                isDragging={snapshot.isDragging}
                                columnKey={col.key}
                                onMove={moveOrder}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {col.items.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center text-sm text-muted-foreground py-12 border border-dashed rounded-xl opacity-60">
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
}

function KanbanCard({ order, dragHandleProps, isDragging, columnKey, onMove }: KanbanCardProps) {
  const progress = order.quantity > 0 ? (order.produced_quantity / order.quantity) * 100 : 0;
  const isLate = order.due_date && differenceInDays(new Date(), parseISO(order.due_date)) > 0 && order.status !== 'completed';
  const daysLate = order.due_date ? differenceInDays(new Date(), parseISO(order.due_date)) : 0;
  const pCfg = priorityConfig[order.priority] || { label: order.priority, color: 'bg-gray-100 text-gray-800' };

  const priorityIndicator: Record<string, string> = {
    urgent: 'border-l-red-500',
    high: 'border-l-orange-500',
    medium: 'border-l-blue-500',
    low: 'border-l-gray-400',
  };

  return (
    <Card className={cn(
      'shadow-sm hover:shadow-lg transition-all duration-200 border-l-4 group',
      priorityIndicator[order.priority] || 'border-l-gray-400',
      isLate && 'ring-1 ring-destructive/30',
      isDragging && 'shadow-2xl ring-2 ring-primary/40 rotate-[1deg] scale-[1.02]'
    )}>
      <CardContent className="p-3 space-y-2">
        {/* Header row with drag handle */}
        <div className="flex items-center gap-1.5">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity -ml-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-mono text-xs text-muted-foreground flex-1">{order.order_number}</span>
          {isLate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="destructive" className="text-[10px] gap-0.5 px-1.5">
                    <AlertTriangle className="h-3 w-3" /> {daysLate}d
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Atrasada há {daysLate} dia(s)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Product name */}
        <p className="font-medium text-sm leading-tight">{order.product_name}</p>

        {/* Client & sector */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {order.client_name && (
            <span className="flex items-center gap-0.5 truncate">
              <User className="h-3 w-3" /> {order.client_name}
            </span>
          )}
          {order.sector && (
            <Badge variant="outline" className="text-[10px] shrink-0">{order.sector}</Badge>
          )}
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1 flex-wrap">
          <Badge className={cn('text-[10px]', pCfg.color)}>{pCfg.label}</Badge>
          {order.color && <Badge variant="outline" className="text-[10px]">🎨 {order.color}</Badge>}
          {order.size_grid && <Badge variant="outline" className="text-[10px]">{order.size_grid}</Badge>}
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{order.produced_quantity}/{order.quantity} {order.unit}</span>
            <span className="font-semibold">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Due date */}
        {order.due_date && (
          <p className={cn('text-xs flex items-center gap-1', isLate ? 'text-destructive font-medium' : 'text-muted-foreground')}>
            <Calendar className="h-3 w-3" />
            {format(parseISO(order.due_date), 'dd/MM/yyyy')}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-1 pt-1 flex-wrap">
          <QRCodeOPButton orderNumber={order.order_number} orderId={order.id} productName={order.product_name} batchCode={order.batch_code || undefined} />
          {columnKey === 'planned' && (
            <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => onMove(order.id, 'in_progress')}>
              <ArrowRight className="h-3 w-3 mr-1" /> Iniciar
            </Button>
          )}
          {columnKey === 'in_progress' && (
            <>
              <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => onMove(order.id, 'paused')}>
                <Pause className="h-3 w-3 mr-1" /> Pausar
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => onMove(order.id, 'completed')}>
                <CheckCircle className="h-3 w-3 mr-1" /> Finalizar
              </Button>
            </>
          )}
          {columnKey === 'paused' && (
            <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => onMove(order.id, 'in_progress')}>
              <ArrowRight className="h-3 w-3 mr-1" /> Retomar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
