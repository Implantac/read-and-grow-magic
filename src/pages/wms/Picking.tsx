import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { ExportButton } from '@/components/shared/ExportButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Package, Clock, CheckCircle, PlayCircle, ClipboardList, AlertTriangle, Zap, PackageSearch,
  Route, MapPin, Box, ArrowRight, User, Info, Layers
} from 'lucide-react';
import { useWMSPicking } from '@/hooks/useWMSOperations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PickingStatus } from '@/types/wms';
import { cn } from '@/lib/utils';

const statusConfig: Record<PickingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  assigned: { label: 'Atribuído', variant: 'default' },
  in_progress: { label: 'Em Andamento', variant: 'default' },
  completed: { label: 'Concluído', variant: 'outline' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-muted-foreground' },
  medium: { label: 'Média', color: 'bg-blue-500' },
  high: { label: 'Alta', color: 'bg-yellow-500' },
  urgent: { label: 'Urgente', color: 'bg-destructive' },
};

export default function PickingPage() {
  const { orders, loading, startPicking, completePicking } = useWMSPicking();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [startDialog, setStartDialog] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [operator, setOperator] = useState('');

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress' || o.status === 'assigned').length;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const completedToday = orders.filter(o => o.status === 'completed' && o.completedAt?.startsWith(todayStr)).length;
  const urgentCount = orders.filter(o => o.priority === 'urgent' && o.status !== 'completed').length;

  const handleStart = async () => {
    if (!startDialog || !operator.trim()) return;
    await startPicking(startDialog, operator);
    setStartDialog(null);
    setOperator('');
    setIsDetailsOpen(false);
  };

  const openDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  return (
    <PageContainer>
      <PageHeader title="Picking" description="Separação de pedidos para expedição">
        <ExportButton
          data={filteredOrders as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'orderNumber', label: 'Nº Ordem' },
            { key: 'customerName', label: 'Cliente' },
            { key: 'priority', label: 'Prioridade' },
            { key: 'status', label: 'Status' },
            { key: 'assignedTo', label: 'Operador' },
          ]}
          filename="picking_wms"
        />
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Pendentes" value={pendingCount} subtitle="Aguardando separação" icon={<Clock className="h-5 w-5" />} accentColor="warning" index={0} />
        <KPICard title="Em Andamento" value={inProgressCount} subtitle="Sendo separados" icon={<PlayCircle className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Concluídos Hoje" value={completedToday} subtitle="Finalizados hoje" icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Urgentes" value={urgentCount} subtitle="Prioridade máxima" icon={<AlertTriangle className="h-5 w-5" />} accentColor={urgentCount > 0 ? 'danger' : 'primary'} index={3} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por número ou cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="assigned">Atribuído</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Ordens de Picking
            {orders.length > 0 && <Badge variant="secondary" className="ml-2">Integrado com Pedidos</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <PackageSearch className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Nenhuma ordem de picking encontrada
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.map((order) => {
                  const status = statusConfig[order.status as PickingStatus] || statusConfig.pending;
                  const priority = priorityConfig[order.priority] || priorityConfig.medium;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium font-mono">{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${priority.color}`} />
                          {priority.label}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">{order.pickedItems}/{order.itemsCount}</TableCell>
                      <TableCell>{order.assignedTo || '-'}</TableCell>
                      <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.status === 'pending' && (
                          <Button size="sm" onClick={() => setStartDialog(order.id)} className="gap-1">
                            <PlayCircle className="h-4 w-4" /> Iniciar
                          </Button>
                        )}
                        {order.status === 'in_progress' && (
                          <Button size="sm" variant="outline" onClick={() => completePicking(order.id)} className="gap-1">
                            <CheckCircle className="h-4 w-4" /> Concluir
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Start Dialog */}
      <Dialog open={!!startDialog} onOpenChange={() => setStartDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Iniciar Separação</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label>Operador Responsável</Label>
            <Input value={operator} onChange={(e) => setOperator(e.target.value)} placeholder="Nome do operador" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartDialog(null)}>Cancelar</Button>
            <Button onClick={handleStart} disabled={!operator.trim()}>Iniciar Picking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
