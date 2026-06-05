import { useState } from 'react';
import { useProduction } from '@/hooks/production/useProduction';
import { useProductionOrderSteps } from '@/hooks/production/useProductionSteps';
import { useProductionLogs } from '@/hooks/production/useProductionLogs';

import { ExportButton } from '@/shared/components/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Progress } from '@/ui/base/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Factory, Search, Clock, PlayCircle, CheckCircle, Eye, Play, Pause,
  AlertTriangle, FileText, Calendar, Layers, History, Package
} from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { QRCodeOPButton } from '@/components/producao/QRCodeOP';
import { cn } from '@/lib/utils';
import { ProductionOrderRow } from '@/hooks/production/useProductionOrders';
import { StepProgressPipeline } from '@/components/producao/StepProgressPipeline';

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-muted-foreground' },
  medium: { label: 'Média', color: 'text-info' },
  high: { label: 'Alta', color: 'text-warning' },
  urgent: { label: 'Urgente', color: 'text-destructive' }
};

export default function ProductionOrdersPage() {
  const { orders, ordersLoading: loading, updateOrderStatus: updateOrder } = useProduction();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrderRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const completedCount = orders.filter(o => o.status === 'completed').length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length;
  const lateCount = orders.filter(o => o.due_date && differenceInDays(new Date(), parseISO(o.due_date)) > 0 && !['completed', 'cancelled'].includes(o.status)).length;
  const efficiency = orders.length > 0 ? ((completedCount / orders.length) * 100) : 0;

  const handleViewDetails = (order: ProductionOrderRow) => { setSelectedOrder(order); setDetailsOpen(true); };
  const handleStartProduction = async (order: ProductionOrderRow) => {
    await updateOrder({ id: order.id, status: 'in_progress' });
  };
  const handlePauseProduction = async (order: ProductionOrderRow) => {
    await updateOrder({ id: order.id, status: 'paused' });
  };
  const handleResumeProduction = async (order: ProductionOrderRow) => {
    await updateOrder({ id: order.id, status: 'in_progress' });
  };
  const handleCompleteProduction = async (order: ProductionOrderRow) => {
    await updateOrder({ id: order.id, status: 'completed' });
  };


  const getProgress = (o: ProductionOrderRow) => o.quantity > 0 ? Math.round((o.produced_quantity / o.quantity) * 100) : 0;
  const isLate = (o: ProductionOrderRow) => o.due_date && differenceInDays(new Date(), parseISO(o.due_date)) > 0 && !['completed', 'cancelled'].includes(o.status);

  return (
    <PageContainer loading={loading}>
      <PageHeader title="Ordens de Produção" description="Gestão completa das OPs com rastreabilidade total">
        <ExportButton
          data={filteredOrders as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'order_number', label: 'Nº Ordem' }, { key: 'product_name', label: 'Produto' },
            { key: 'quantity', label: 'Qtd' }, { key: 'produced_quantity', label: 'Produzido' },
            { key: 'status', label: 'Status' }, { key: 'priority', label: 'Prioridade' },
          ]}
          filename="ordens_producao"
        />
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Em Produção" value={inProgressCount} icon={<PlayCircle className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Na Fila" value={orders.filter(o => o.status === 'planned').length} icon={<Calendar className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Atrasadas" value={lateCount} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={2} />
        <KPICard title="Eficiência" value={`${efficiency.toFixed(0)}%`} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={3} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar OP, produto, código ou cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="planned">Planejado</SelectItem>
                <SelectItem value="in_progress">Em Produção</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Factory className="h-5 w-5" /> Ordens de Produção ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Ordem</TableHead><TableHead>Produto</TableHead><TableHead>Cliente</TableHead>
              <TableHead>Progresso</TableHead><TableHead>Etapas</TableHead><TableHead>Prazo</TableHead><TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const progress = getProgress(order);
                const late = isLate(order);
                const daysLate = order.due_date ? differenceInDays(new Date(), parseISO(order.due_date)) : 0;
                const pCfg = priorityConfig[order.priority] || { label: order.priority, color: '' };
                return (
                  <TableRow key={order.id} className={cn(late && 'bg-destructive/5')}>
                    <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                    <TableCell>
                      <div><p className="font-medium">{order.product_name}</p><p className="text-xs text-muted-foreground">{order.product_code}</p></div>
                    </TableCell>
                    <TableCell className="text-sm">{order.client_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={progress} className="w-16 h-2" />
                        <span className="text-xs text-muted-foreground">{order.produced_quantity}/{order.quantity}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StepProgressPipeline orderId={order.id} compact />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {late && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                        <span className={cn('text-sm', late && 'text-destructive font-medium')}>
                          {order.due_date ? format(parseISO(order.due_date), 'dd/MM', { locale: ptBR }) : '-'}
                        </span>
                        {late && <span className="text-[10px] text-destructive">({daysLate}d)</span>}
                      </div>
                    </TableCell>
                    <TableCell><span className={cn('font-medium text-sm', pCfg.color)}>{pCfg.label}</span></TableCell>
                    <TableCell><StatusBadge status={order.status} type="production" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <QRCodeOPButton orderNumber={order.order_number} orderId={order.id} productName={order.product_name} batchCode={order.batch_code || undefined} />
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)}><Eye className="h-4 w-4" /></Button>
                        {order.status === 'planned' && <Button variant="outline" size="sm" onClick={() => handleStartProduction(order)}><Play className="h-4 w-4 mr-1" />Iniciar</Button>}
                        {order.status === 'in_progress' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handlePauseProduction(order)}><Pause className="h-4 w-4" /></Button>
                            <Button variant="default" size="sm" onClick={() => handleCompleteProduction(order)}><CheckCircle className="h-4 w-4 mr-1" />Concluir</Button>
                          </>
                        )}
                        {order.status === 'paused' && <Button variant="outline" size="sm" onClick={() => handleResumeProduction(order)}><Play className="h-4 w-4 mr-1" />Retomar</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredOrders.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma ordem encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Enhanced Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedOrder && <OrderDetailContent order={selectedOrder} />}
          <DialogFooter><Button variant="outline" onClick={() => setDetailsOpen(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function OrderDetailContent({ order }: { order: ProductionOrderRow }) {
  const { orderSteps, loading: stepsLoading } = useProductionOrderSteps(order.id);
  const { logs, loading: logsLoading } = useProductionLogs(order.id);
  const progress = order.quantity > 0 ? (order.produced_quantity / order.quantity) * 100 : 0;
  const estimatedH = order.estimated_time_minutes > 0 ? (order.estimated_time_minutes / 60).toFixed(1) : '-';
  const realizedH = order.realized_time_minutes > 0 ? (order.realized_time_minutes / 60).toFixed(1) : '-';
  const timeEfficiency = order.estimated_time_minutes > 0 && order.realized_time_minutes > 0
    ? ((order.estimated_time_minutes / order.realized_time_minutes) * 100).toFixed(0) : '-';

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Factory className="h-5 w-5" /> OP {order.order_number}
          <StatusBadge status={order.status} type="production" />
        </DialogTitle>
      </DialogHeader>

      <Tabs defaultValue="overview" className="mt-2">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="steps">Etapas ({orderSteps.length})</TabsTrigger>
          <TabsTrigger value="logs">Histórico ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><p className="text-xs text-muted-foreground">Produto</p><p className="font-medium">{order.product_name}</p><p className="text-xs text-muted-foreground">{order.product_code}</p></div>
            <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-medium">{order.client_name || '-'}</p></div>
            <div><p className="text-xs text-muted-foreground">Setor</p><p className="font-medium">{order.sector || order.work_center || '-'}</p></div>
            <div><p className="text-xs text-muted-foreground">Operador</p><p className="font-medium">{order.operator || '-'}</p></div>
            <div><p className="text-xs text-muted-foreground">Data Início</p><p className="font-medium">{order.start_date ? format(parseISO(order.start_date), 'dd/MM/yyyy') : '-'}</p></div>
            <div><p className="text-xs text-muted-foreground">Prazo</p><p className="font-medium">{order.due_date ? format(parseISO(order.due_date), 'dd/MM/yyyy') : '-'}</p></div>
          </div>

          {/* Progress */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Produção: {order.produced_quantity} / {order.quantity} {order.unit}</span>
                <span className="font-semibold">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              {order.rejected_quantity > 0 && (
                <p className="text-xs text-destructive">⚠ {order.rejected_quantity} rejeitadas — {order.defect_notes || 'sem detalhes'}</p>
              )}
            </CardContent>
          </Card>

          {/* Step Pipeline */}
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Fluxo de Etapas</p>
              <StepProgressPipeline orderId={order.id} />
            </CardContent>
          </Card>

          {/* Time */}
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Estimado</p>
              <p className="text-xl font-bold">{estimatedH}h</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Realizado</p>
              <p className="text-xl font-bold">{realizedH}h</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Eficiência</p>
              <p className="text-xl font-bold">{timeEfficiency}%</p>
            </CardContent></Card>
          </div>

          {/* Extra info */}
          {(order.color || order.size_grid || order.model_variant || order.batch_code) && (
            <div className="flex gap-2 flex-wrap">
              {order.color && <Badge variant="outline">🎨 {order.color}</Badge>}
              {order.size_grid && <Badge variant="outline">📐 {order.size_grid}</Badge>}
              {order.model_variant && <Badge variant="outline">📦 {order.model_variant}</Badge>}
              {order.batch_code && <Badge variant="outline">🏷️ {order.batch_code}</Badge>}
            </div>
          )}

          {order.notes && (
            <div><p className="text-xs text-muted-foreground">Observações</p><p className="p-3 bg-muted rounded-lg text-sm">{order.notes}</p></div>
          )}
        </TabsContent>

        <TabsContent value="steps" className="mt-4">
          {stepsLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando etapas...</p>
          ) : orderSteps.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma etapa cadastrada para esta OP</p>
              <p className="text-xs">Use a tela "Etapas de Produção" para configurar</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {orderSteps.map((step, idx) => {
                const stepProgress = step.quantity_pending > 0 ? ((step.quantity_produced / (step.quantity_produced + step.quantity_pending)) * 100) : (step.status === 'completed' ? 100 : 0);
                return (
                  <Card key={step.id} className={cn(step.status === 'completed' && 'border-green-300 dark:border-green-800', step.status === 'in_progress' && 'border-primary')}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{step.step_name || `Etapa ${step.sequence}`}</p>
                          <Badge variant={step.status === 'completed' ? 'default' : step.status === 'in_progress' ? 'default' : 'secondary'} className="text-[10px]">
                            {step.status === 'completed' ? '✅ Concluída' : step.status === 'in_progress' ? '🔄 Em andamento' : '⏳ Pendente'}
                          </Badge>
                        </div>
                        {step.step_sector && <p className="text-xs text-muted-foreground">Setor: {step.step_sector}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={stepProgress} className="w-24 h-1.5" />
                          <span className="text-xs text-muted-foreground">{step.quantity_produced}/{step.quantity_produced + step.quantity_pending}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {step.responsible && <p>{step.responsible}</p>}
                        {step.realized_time_minutes > 0 && <p>{(step.realized_time_minutes / 60).toFixed(1)}h</p>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          {logsLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : logs.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum registro de histórico</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{log.event_type}: {log.description || '-'}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {log.operator && <span>👷 {log.operator}</span>}
                      {log.quantity > 0 && <span>📦 {log.quantity} peças</span>}
                      <span>{format(parseISO(log.created_at), 'dd/MM HH:mm')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
