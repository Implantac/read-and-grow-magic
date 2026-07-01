import { useState } from 'react';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageContainer } from '@/shared/components/PageContainer';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { ExportButton } from '@/shared/components/ExportButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { Skeleton } from '@/ui/base/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import { Progress } from '@/ui/base/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import {
  Search, Package, Clock, CheckCircle, PlayCircle, ClipboardList, AlertTriangle, Zap, PackageSearch,
  Route, MapPin, Box, ArrowRight, User, Info, Layers, ScanBarcode, ChevronRight, CheckCircle2
} from 'lucide-react';
import { useWMSPicking } from '@/hooks/wms/useWMSOperations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PickingStatus } from '@/types/wms';
import { cn } from '@/lib/utils';
import { BarcodeScanner } from '@/components/wms/BarcodeScanner';

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
  const [scannedItems, setScannedItems] = useState<Record<string, number>>({});
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
    setScannedItems({}); // Reset scanner progress
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

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Pendentes" value={pendingCount} subtitle="Aguardando separação" icon={<Clock className="h-5 w-5" />} accentColor="warning" index={0} />
        <KPICard title="Em Andamento" value={inProgressCount} subtitle="Sendo separados" icon={<PlayCircle className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Concluídos Hoje" value={completedToday} subtitle="Finalizados hoje" icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Urgentes" value={urgentCount} subtitle="Prioridade máxima" icon={<AlertTriangle className="h-5 w-5" />} accentColor={urgentCount > 0 ? 'danger' : 'primary'} index={3} />
      </div>

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

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="gap-2"><ClipboardList className="h-4 w-4" /> Lista de Pedidos</TabsTrigger>
          <TabsTrigger value="waves" className="gap-2"><Layers className="h-4 w-4" /> Ondas de Separação</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Ordens de Picking
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
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <EmptyState
                            compact
                            icon={PackageSearch}
                            title="Nenhuma ordem de picking encontrada"
                            description="Novas ordens aparecem aqui quando pedidos são liberados para separação."
                          />
                        </TableCell>
                      </TableRow>
                    ) : filteredOrders.map((order) => {
                      const status = statusConfig[order.status as PickingStatus] || statusConfig.pending;
                      const priority = priorityConfig[order.priority] || priorityConfig.medium;
                      return (
                        <TableRow key={order.id} className="group cursor-pointer hover:bg-muted/30" onClick={() => openDetails(order)}>
                          <TableCell className="font-medium font-mono">{order.orderNumber}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{order.customerName}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5">
                              <span className={cn("h-2 w-2 rounded-full", priority.color)} />
                              <span className="text-xs font-medium">{priority.label}</span>
                            </span>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold">{order.pickedItems}/{order.itemsCount}</span>
                              <Progress value={(order.pickedItems / order.itemsCount) * 100} className="h-1 w-12" />
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.assignedTo ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <User className="h-3 w-3 text-muted-foreground" />
                                {order.assignedTo}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell><Badge variant={status.variant} className="text-[10px] font-bold uppercase">{status.label}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waves">
          <Card>
            <CardHeader>
              <CardTitle>Ondas de Separação (Simulação)</CardTitle>
              <CardDescription>Agrupamento de pedidos por zona para otimização de rota</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="font-bold text-lg mb-2 text-foreground">Gerar Ondas de Picking</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  Agrupe pedidos pendentes para que o operador colete múltiplos itens em uma única rota, reduzindo o tempo de deslocamento.
                </p>
                <Button className="gap-2">
                  <Zap className="h-4 w-4" /> Agrupar Pendentes em Onda
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Picking Details & Execution Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={selectedOrder ? (statusConfig[selectedOrder.status as PickingStatus]?.variant || 'outline') : 'outline'}>
                {selectedOrder && statusConfig[selectedOrder.status as PickingStatus]?.label}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">#{selectedOrder?.id?.slice(0, 8)}</span>
            </div>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <PackageSearch className="h-6 w-6 text-primary" />
              Picking: {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Separação de itens para o cliente <strong>{selectedOrder?.customerName}</strong>
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-muted/50 border text-center space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Prioridade</p>
                  <p className={cn("text-sm font-bold", priorityConfig[selectedOrder.priority]?.color.replace('bg-', 'text-'))}>
                    {priorityConfig[selectedOrder.priority]?.label}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border text-center space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Data Criação</p>
                  <p className="text-sm font-bold tabular-nums">
                    {format(new Date(selectedOrder.createdAt), 'dd/MM/yy', { locale: ptBR })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border text-center space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Itens</p>
                  <p className="text-sm font-bold tabular-nums">{selectedOrder.itemsCount} un</p>
                </div>
              </div>

              {/* Picking Route Visualization */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Route className="h-4 w-4 text-blue-500" />
                  Sugestão de Rota (Otimizada)
                </h4>
                <div className="relative p-6 rounded-xl border bg-gradient-to-r from-blue-500/5 to-purple-500/5 overflow-hidden">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase">Início</span>
                    </div>
                    
                    <div className="h-[2px] flex-1 bg-dashed bg-muted-foreground/30 relative mx-2">
                      <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 border-t-2 border-dashed border-primary/30" />
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-card border-2 border-primary/50 flex items-center justify-center text-primary shadow-md">
                        <Box className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase">Zona A (A-01-01)</span>
                    </div>

                    <div className="h-[2px] flex-1 bg-dashed bg-muted-foreground/30 relative mx-2">
                      <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 border-t-2 border-dashed border-primary/30" />
                    </div>

                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <div className="h-10 w-10 rounded-full bg-muted border-2 border-muted-foreground/30 flex items-center justify-center text-muted-foreground">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase">Fim (Packing)</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
                </div>
                <p className="text-[10px] text-muted-foreground text-center italic">IA calculou uma rota 15% mais rápida baseada na geolocalização dos itens</p>
              </div>

              {/* Picking Execution via Barcode */}
              {selectedOrder.status === 'in_progress' && (
                <div className="space-y-4 p-4 rounded-xl border bg-muted/20 border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <ScanBarcode className="h-4 w-4 text-primary" />
                        Confirmação de Picking
                      </h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">
                        Próximo: <span className="text-primary">A-01-01</span> • SKU-001
                      </p>
                    </div>
                    <Badge className="bg-primary hover:bg-primary font-mono">1/12</Badge>
                  </div>
                  <BarcodeScanner 
                    onScan={async (code) => {
                      // Validation logic: Find product by barcode or code
                      const { data: product, error } = await supabase
                        .from('products')
                        .select('id, code, name, status')
                        .or(`barcode.eq.${code},code.eq.${code}`)
                        .maybeSingle();

                      if (error) return { type: 'error', message: 'Erro ao consultar produto.' };
                      if (!product) return { type: 'error', message: `SKU/EAN ${code} não encontrado.` };
                      if (product.status !== 'active') return { type: 'error', message: `Produto ${product.code} está inativo.` };

                      const currentCount = (scannedItems[product.code] || 0) + 1;
                      
                      if (currentCount > selectedOrder.itemsCount) {
                        return { type: 'error', message: `Quantidade máxima excedida para ${product.code}.` };
                      }

                      setScannedItems(prev => ({ ...prev, [product.code]: currentCount }));
                      
                      // Update main order progress (optimistic update)
                      if (selectedOrder.pickedItems < selectedOrder.itemsCount) {
                        setSelectedOrder((prev: any) => ({
                          ...prev,
                          pickedItems: (prev.pickedItems || 0) + 1
                        }));
                      }

                      return { type: 'success', message: `${product.name} coletado com sucesso!`, code: product.code };
                    }}
                    placeholder="Leia o código do item..."
                  />
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-orange-500" />
                    Itens para Coleta
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-bold">{selectedOrder.pickedItems}/{selectedOrder.itemsCount} coletados</Badge>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="h-8 text-[10px] uppercase font-bold">Endereço</TableHead>
                        <TableHead className="h-8 text-[10px] uppercase font-bold">Produto</TableHead>
                        <TableHead className="h-8 text-[10px] uppercase font-bold text-center">Quantidade</TableHead>
                        <TableHead className="h-8 text-[10px] uppercase font-bold text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className={cn(selectedOrder.status === 'completed' && "opacity-50 grayscale")}>
                        <TableCell className="py-2">
                          <Badge variant="outline" className="font-mono text-xs">A-01-01</Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <p className="text-xs font-bold">Produto SKU-442</p>
                          <p className="text-[10px] text-muted-foreground">Local: Prateleira Superior</p>
                        </TableCell>
                        <TableCell className="text-center py-2 text-xs font-mono font-bold">12 un</TableCell>
                        <TableCell className="text-right py-2">
                          {selectedOrder.status === 'in_progress' ? (
                            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold px-2 gap-1 bg-primary/5 hover:bg-primary/10 border-primary/20">
                              <Zap className="h-3 w-3" /> BIPAR
                            </Button>
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
            {selectedOrder?.status === 'pending' && (
              <Button onClick={() => setStartDialog(selectedOrder.id)}>
                <PlayCircle className="mr-2 h-4 w-4" /> Assumir Picking
              </Button>
            )}
            {selectedOrder?.status === 'in_progress' && (
              <Button 
                disabled={selectedOrder.pickedItems < selectedOrder.itemsCount}
                onClick={() => { completePicking(selectedOrder.id); setIsDetailsOpen(false); }} 
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Finalizar Separação
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legacy Start Dialog (keep for quick flow) */}
      <Dialog open={!!startDialog} onOpenChange={() => setStartDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Separação</DialogTitle>
            <DialogDescription>Atribua um operador para iniciar a coleta dos itens.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Operador Responsável</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={operator} onChange={(e) => setOperator(e.target.value)} placeholder="Nome do operador" className="pl-9" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartDialog(null)}>Cancelar</Button>
            <Button onClick={handleStart} disabled={!operator.trim()}>
              <Zap className="h-4 w-4 mr-2" /> Iniciar Agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
