import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useOrders } from '@/hooks/useOrders';
import { useOrderLifecycle, checkProductionCompletion } from '@/hooks/useOrderLifecycle';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { supabase } from '@/integrations/supabase/client';
import { productionStatusConfig, priorityConfig } from '@/config/production';
import { Factory, Clock, CheckCircle, AlertTriangle, Search, Plus, Play, Pause, BarChart3, Users, Gauge, Bell, ShieldCheck, GanttChart } from 'lucide-react';
import { format, differenceInDays, parseISO, differenceInMinutes, addDays, startOfDay, endOfDay, max as dateMax, min as dateMin } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function PCPPanel() {
  const { orders: productionOrders, loading, refetch, update } = useProductionOrders();
  const { data: salesOrders } = useOrders();
  const { entries: timeEntries } = useTimeEntries();
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

  const today = new Date();
  const delayedOPs = productionOrders.filter(o => {
    if (!o.due_date || o.status === 'completed' || o.status === 'cancelled') return false;
    return differenceInDays(today, parseISO(o.due_date)) > 0;
  });

  const generateOPFromOrder = async (order: any) => {
    const items = order.items || [];
    if (items.length === 0) { toast({ title: 'Pedido sem itens', variant: 'destructive' }); return; }
    try {
      for (const item of items) {
        const opNumber = `OP-${format(new Date(), 'yyyyMMdd')}-${order.number}-${item.product_code}`;
        await supabase.from('production_orders').insert({
          order_number: opNumber, product_id: item.product_id, product_code: item.product_code,
          product_name: item.product_name, quantity: item.quantity, produced_quantity: 0, unit: 'UN',
          status: 'planned', priority: order.priority || 'medium', due_date: order.delivery_date,
          notes: `Gerada do pedido ${order.number}`,
        } as any);
      }
      lifecycle.mutate({ orderId: order.id, order, targetStatus: 'in_production', observation: `${items.length} OP(s) gerada(s)` });
      toast({ title: `${items.length} OP(s) gerada(s) do pedido ${order.number}` });
      await refetch();
      setGeneratingFor(null);
    } catch (e: any) { toast({ title: 'Erro ao gerar OP', description: e.message, variant: 'destructive' }); }
  };

  const handleStatusChange = async (op: any, newStatus: string) => {
    await update(op.id, {
      status: newStatus,
      ...(newStatus === 'in_progress' ? { start_date: new Date().toISOString() } : {}),
      ...(newStatus === 'completed' ? { completed_date: new Date().toISOString() } : {}),
    });
    if (newStatus === 'completed') {
      const orderNumMatch = op.order_number.match(/PED\d+/);
      if (orderNumMatch) {
        const salesOrder = (salesOrders || []).find(o => o.number === orderNumMatch[0]);
        if (salesOrder) await checkProductionCompletion(salesOrder.number, salesOrder.id);
      }
    }
  };

  // Productivity data
  const todayStr = new Date().toDateString();
  const todayEntries = timeEntries.filter(e => new Date(e.start_time).toDateString() === todayStr);
  const operators = [...new Set(todayEntries.map(e => e.operator))];
  const operatorData = operators.map(op => {
    const opEntries = todayEntries.filter(e => e.operator === op);
    const produced = opEntries.reduce((s, e) => s + e.produced_quantity, 0);
    const totalMin = opEntries.filter(e => e.end_time).reduce((s, e) => s + differenceInMinutes(new Date(e.end_time!), new Date(e.start_time)) - (e.paused_time || 0), 0);
    const pcsH = totalMin > 0 ? (produced / (totalMin / 60)) : 0;
    return { name: op.split(' ')[0], pcsH: Number(pcsH.toFixed(1)) };
  }).sort((a, b) => b.pcsH - a.pcsH).slice(0, 10);

  const statusPieData = Object.entries(statusCounts).map(([k, v]) => ({
    name: productionStatusConfig[k]?.label || k, value: v,
  }));
  const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--destructive))'];

  return (
    <PageContainer loading={loading}>
      <PageHeader title="Painel PCP" description="Planejamento e Controle de Produção — Visão integrada com pedidos" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard title="Total OPs" value={productionOrders.length} icon={<Factory className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Planejadas" value={statusCounts['planned'] || 0} icon={<Clock className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Em Produção" value={statusCounts['in_progress'] || 0} icon={<Factory className="h-5 w-5" />} accentColor="info" index={2} />
        <KPICard title="Finalizadas" value={statusCounts['completed'] || 0} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={3} />
        <KPICard title="Eficiência Geral" value={`${totalCapacity.toFixed(0)}%`} icon={<Gauge className="h-5 w-5" />} accentColor={totalCapacity >= 70 ? 'success' : 'warning'} index={4} />
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="flex-wrap">
          <TabsTrigger value="orders">Ordens de Produção</TabsTrigger>
          <TabsTrigger value="gantt"><GanttChart className="h-4 w-4 mr-1" /> Timeline</TabsTrigger>
          <TabsTrigger value="demand">Demanda Comercial ({ordersAwaitingProduction.length})</TabsTrigger>
          <TabsTrigger value="capacity">Capacidade {delayedOPs.length > 0 && <Badge variant="destructive" className="ml-1 h-5 text-[10px]">{delayedOPs.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="productivity">Produtividade</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
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
                  <TableHead>Nº OP</TableHead><TableHead>Produto</TableHead><TableHead>Qtde</TableHead>
                  <TableHead>Produzido</TableHead><TableHead>%</TableHead><TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead><TableHead>Prazo</TableHead><TableHead className="text-right">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
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
                        <TableCell><div className="flex items-center gap-2"><Progress value={pct} className="h-2 w-16" /><span className="text-xs">{pct.toFixed(0)}%</span></div></TableCell>
                        <TableCell><Badge className={cn('text-xs', sc.color)}>{sc.label}</Badge></TableCell>
                        <TableCell><Badge className={cn('text-xs', pc.color)}>{pc.label}</Badge></TableCell>
                        <TableCell><div className="flex items-center gap-1">{o.due_date ? format(new Date(o.due_date), 'dd/MM/yyyy') : '-'}{isDelayed && <AlertTriangle className="h-3 w-3 text-destructive" />}</div></TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {o.status === 'planned' && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(o, 'in_progress')}><Play className="h-3 w-3 mr-1" /> Iniciar</Button>}
                            {o.status === 'in_progress' && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(o, 'paused')}><Pause className="h-3 w-3 mr-1" /> Pausar</Button>
                                <Button size="sm" className="h-7 text-xs" onClick={() => handleStatusChange(o, 'completed')}><CheckCircle className="h-3 w-3 mr-1" /> Finalizar</Button>
                              </>
                            )}
                            {o.status === 'paused' && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(o, 'in_progress')}><Play className="h-3 w-3 mr-1" /> Retomar</Button>}
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

        <TabsContent value="gantt" className="mt-4">
          <GanttTimeline orders={productionOrders} />
        </TabsContent>

        <TabsContent value="demand" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Pedidos Aguardando Produção</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nº Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead><TableHead>Entrega</TableHead><TableHead>Prioridade</TableHead>
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
                      <TableCell><Badge className={cn('text-xs', priorityConfig[o.priority]?.color)}>{priorityConfig[o.priority]?.label || o.priority}</Badge></TableCell>
                      <TableCell className="text-right"><Button size="sm" onClick={() => setGeneratingFor(o)}><Plus className="h-3 w-3 mr-1" /> Gerar OP</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capacity" className="mt-4 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Carga por Centro de Trabalho</CardTitle></CardHeader>
            <CardContent>
              {workCenterData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={workCenterData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis /><Tooltip />
                    <Bar dataKey="ordens" fill="hsl(var(--primary))" name="Ordens" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pendente" fill="hsl(var(--warning))" name="Qtde Pendente" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados de carga produtiva</p>}
            </CardContent>
          </Card>
          {delayedOPs.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> OPs Atrasadas ({delayedOPs.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {delayedOPs.map(o => (
                    <div key={o.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <div className="flex items-center gap-3"><span className="font-mono font-medium">{o.order_number}</span><span className="text-muted-foreground">{o.product_name}</span></div>
                      <Badge variant="destructive" className="text-xs">{differenceInDays(today, parseISO(o.due_date!))} dias de atraso</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="productivity" className="mt-4 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Produtividade por Operador (peças/h)</CardTitle></CardHeader>
              <CardContent>
                {operatorData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={operatorData}>
                      <XAxis dataKey="name" fontSize={11} /><YAxis /><Tooltip />
                      <Bar dataKey="pcsH" fill="hsl(var(--primary))" name="Peças/h" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">Sem apontamentos hoje</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Distribuição por Status</CardTitle></CardHeader>
              <CardContent>
                {statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                        {statusPieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4 space-y-4">
          {delayedOPs.length === 0 && (
            <Card><CardContent className="py-12 text-center"><ShieldCheck className="h-12 w-12 mx-auto text-success mb-4" /><p className="text-lg font-medium">Nenhum alerta ativo</p><p className="text-sm text-muted-foreground">Todas as OPs estão dentro do prazo</p></CardContent></Card>
          )}
          {delayedOPs.map(o => (
            <Card key={o.id} className="border-l-4 border-l-destructive">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div><p className="font-medium">{o.order_number} — {o.product_name}</p><p className="text-sm text-muted-foreground">{differenceInDays(today, parseISO(o.due_date!))} dias de atraso</p></div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(o, 'in_progress')}><Play className="h-3 w-3 mr-1" /> Priorizar</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Generate OP Dialog */}
      {generatingFor && (
        <Dialog open={!!generatingFor} onOpenChange={() => setGeneratingFor(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Gerar OPs do Pedido {generatingFor.number}</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Cliente: <strong>{generatingFor.client_name}</strong></p>
              <p className="text-sm text-muted-foreground">Itens: <strong>{generatingFor.items?.length || 0}</strong></p>
              <p className="text-sm">Será gerada uma OP para cada item do pedido.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGeneratingFor(null)}>Cancelar</Button>
              <Button onClick={() => generateOPFromOrder(generatingFor)}>Gerar OPs</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </PageContainer>
  );
}
