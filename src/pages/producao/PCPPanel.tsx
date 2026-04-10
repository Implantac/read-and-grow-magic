import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useOrders } from '@/hooks/useOrders';
import { useOrderLifecycle, checkProductionCompletion } from '@/hooks/useOrderLifecycle';
import { supabase } from '@/integrations/supabase/client';
import { productionStatusConfig, priorityConfig } from '@/config/production';
import { Factory, Clock, CheckCircle, AlertTriangle, Search, Plus, Play, Pause, BarChart3 } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PCPPanel() {
  const { orders: productionOrders, loading, refetch, update } = useProductionOrders();
  const { data: salesOrders } = useOrders();
  const lifecycle = useOrderLifecycle();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [generatingFor, setGeneratingFor] = useState<any>(null);
  const { toast } = useToast();

  const filtered = productionOrders.filter(o => {
    const matchSearch = !search || o.order_number.toLowerCase().includes(search.toLowerCase()) || o.product_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = productionOrders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const totalCapacity = productionOrders.length > 0
    ? productionOrders.reduce((s, o) => s + (o.produced_quantity / Math.max(o.quantity, 1)), 0) / productionOrders.length * 100
    : 0;

  const ordersAwaitingProduction = (salesOrders || []).filter(o => o.status === 'awaiting_production' || o.status === 'confirmed');

  // Workload by work center
  const workCenterLoad = productionOrders
    .filter(o => o.status === 'in_progress' || o.status === 'planned')
    .reduce((acc: Record<string, { count: number; totalQty: number }>, o) => {
      const wc = o.work_center || 'Sem setor';
      if (!acc[wc]) acc[wc] = { count: 0, totalQty: 0 };
      acc[wc].count++;
      acc[wc].totalQty += o.quantity - o.produced_quantity;
      return acc;
    }, {});
  const workCenterData = Object.entries(workCenterLoad).map(([name, v]) => ({ name, ordens: v.count, pendente: v.totalQty }));

  // Delayed OPs
  const today = new Date();
  const delayedOPs = productionOrders.filter(o => {
    if (!o.due_date || o.status === 'completed' || o.status === 'cancelled') return false;
    return differenceInDays(today, parseISO(o.due_date)) > 0;
  });

  const generateOPFromOrder = async (order: any) => {
    const items = order.items || [];
    if (items.length === 0) {
      toast({ title: 'Pedido sem itens', variant: 'destructive' });
      return;
    }

    try {
      for (const item of items) {
        const opNumber = `OP-${format(new Date(), 'yyyyMMdd')}-${order.number}-${item.product_code}`;
        await supabase.from('production_orders').insert({
          order_number: opNumber,
          product_id: item.product_id,
          product_code: item.product_code,
          product_name: item.product_name,
          quantity: item.quantity,
          produced_quantity: 0,
          unit: 'UN',
          status: 'planned',
          priority: order.priority || 'medium',
          due_date: order.delivery_date,
          notes: `Gerada do pedido ${order.number}`,
        } as any);
      }

      // Update order status via lifecycle
      lifecycle.mutate({
        orderId: order.id,
        order,
        targetStatus: 'in_production',
        observation: `${items.length} OP(s) gerada(s)`,
      });

      toast({ title: `${items.length} OP(s) gerada(s) do pedido ${order.number}` });
      await refetch();
      setGeneratingFor(null);
    } catch (e: any) {
      toast({ title: 'Erro ao gerar OP', description: e.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (op: any, newStatus: string) => {
    await update(op.id, {
      status: newStatus,
      ...(newStatus === 'in_progress' ? { start_date: new Date().toISOString() } : {}),
      ...(newStatus === 'completed' ? { completed_date: new Date().toISOString() } : {}),
    });

    // When completing a production order, check if all OPs for the sales order are done
    if (newStatus === 'completed') {
      const orderNumMatch = op.order_number.match(/PED\d+/);
      if (orderNumMatch) {
        const salesOrder = (salesOrders || []).find(o => o.number === orderNumMatch[0]);
        if (salesOrder) {
          await checkProductionCompletion(salesOrder.number, salesOrder.id);
        }
      }
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Painel PCP" description="Planejamento e Controle de Produção - Visão integrada com pedidos" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Factory className="h-7 w-7 text-primary" />
          <div><p className="text-2xl font-bold">{productionOrders.length}</p><p className="text-xs text-muted-foreground">Total OPs</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-7 w-7 text-warning" />
          <div><p className="text-2xl font-bold">{statusCounts['planned'] || 0}</p><p className="text-xs text-muted-foreground">Planejadas</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Factory className="h-7 w-7 text-info" />
          <div><p className="text-2xl font-bold">{statusCounts['in_progress'] || 0}</p><p className="text-xs text-muted-foreground">Em Produção</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="h-7 w-7 text-success" />
          <div><p className="text-2xl font-bold">{statusCounts['completed'] || 0}</p><p className="text-xs text-muted-foreground">Finalizadas</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Eficiência Geral</p>
          <p className="text-2xl font-bold">{totalCapacity.toFixed(0)}%</p>
          <Progress value={totalCapacity} className="mt-2 h-2" />
        </CardContent></Card>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Ordens de Produção</TabsTrigger>
          <TabsTrigger value="demand">Demanda Comercial ({ordersAwaitingProduction.length})</TabsTrigger>
          <TabsTrigger value="capacity">Capacidade {delayedOPs.length > 0 && <Badge variant="destructive" className="ml-1 h-5 text-[10px]">{delayedOPs.length}</Badge>}</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar OP..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(productionStatusConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nº OP</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtde</TableHead>
                  <TableHead>Produzido</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8">Carregando...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma OP encontrada</TableCell></TableRow>
                  ) : filtered.map(o => {
                    const pct = o.quantity > 0 ? (o.produced_quantity / o.quantity) * 100 : 0;
                    const sc = productionStatusConfig[o.status] || { label: o.status, color: '' };
                    const pc = priorityConfig[o.priority] || { label: o.priority, color: '' };
                    const isDelayed = o.due_date && differenceInDays(today, parseISO(o.due_date)) > 0 && o.status !== 'completed' && o.status !== 'cancelled';
                    return (
                      <TableRow key={o.id} className={cn(isDelayed && 'bg-destructive/5')}>
                        <TableCell className="font-mono font-medium">{o.order_number}</TableCell>
                        <TableCell>{o.product_name}</TableCell>
                        <TableCell>{o.quantity} {o.unit}</TableCell>
                        <TableCell>{o.produced_quantity} {o.unit}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-2 w-16" />
                            <span className="text-xs">{pct.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge className={cn('text-xs', sc.color)}>{sc.label}</Badge></TableCell>
                        <TableCell><Badge className={cn('text-xs', pc.color)}>{pc.label}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {o.due_date ? format(new Date(o.due_date), 'dd/MM/yyyy') : '-'}
                            {isDelayed && <AlertTriangle className="h-3 w-3 text-destructive" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {o.status === 'planned' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(o, 'in_progress')}>
                                <Play className="h-3 w-3 mr-1" /> Iniciar
                              </Button>
                            )}
                            {o.status === 'in_progress' && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(o, 'paused')}>
                                  <Pause className="h-3 w-3 mr-1" /> Pausar
                                </Button>
                                <Button size="sm" className="h-7 text-xs" onClick={() => handleStatusChange(o, 'completed')}>
                                  <CheckCircle className="h-3 w-3 mr-1" /> Finalizar
                                </Button>
                              </>
                            )}
                            {o.status === 'paused' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(o, 'in_progress')}>
                                <Play className="h-3 w-3 mr-1" /> Retomar
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
        </TabsContent>

        <TabsContent value="demand" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Pedidos Aguardando Produção</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {ordersAwaitingProduction.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum pedido aguardando produção</TableCell></TableRow>
                  ) : ordersAwaitingProduction.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono">{o.number}</TableCell>
                      <TableCell>{o.client_name}</TableCell>
                      <TableCell>{o.items?.length || 0} itens</TableCell>
                      <TableCell>R$ {o.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{o.delivery_date ? format(new Date(o.delivery_date), 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', priorityConfig[o.priority]?.color)}>
                          {priorityConfig[o.priority]?.label || o.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => setGeneratingFor(o)}>
                          <Plus className="h-3 w-3 mr-1" /> Gerar OP
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capacity" className="mt-4 space-y-6">
          {/* Workload chart */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Carga por Centro de Trabalho</CardTitle></CardHeader>
            <CardContent>
              {workCenterData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={workCenterData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ordens" fill="hsl(var(--primary))" name="Ordens" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pendente" fill="hsl(var(--warning))" name="Qtde Pendente" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados de carga produtiva</p>}
            </CardContent>
          </Card>

          {/* Delayed OPs */}
          {delayedOPs.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> OPs Atrasadas ({delayedOPs.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {delayedOPs.map(o => (
                    <div key={o.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-medium">{o.order_number}</span>
                        <span className="text-muted-foreground">{o.product_name}</span>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {differenceInDays(today, parseISO(o.due_date!))} dias de atraso
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Generate OP confirmation dialog */}
      <Dialog open={!!generatingFor} onOpenChange={() => setGeneratingFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Ordem de Produção</DialogTitle>
          </DialogHeader>
          {generatingFor && (
            <div className="space-y-3">
              <p className="text-sm">Criar OPs para o pedido <strong>{generatingFor.number}</strong> ({generatingFor.client_name})?</p>
              <div className="text-sm space-y-1">
                {(generatingFor.items || []).map((i: any) => (
                  <div key={i.id} className="flex justify-between">
                    <span>{i.product_name}</span>
                    <span className="font-mono">{i.quantity} un</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Será criada uma OP para cada item do pedido.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setGeneratingFor(null)}>Cancelar</Button>
            <Button onClick={() => generateOPFromOrder(generatingFor)} disabled={lifecycle.isPending}>
              <Plus className="h-4 w-4 mr-1" /> Gerar OPs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
