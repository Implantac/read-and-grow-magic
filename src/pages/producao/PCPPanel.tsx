import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useOrders } from '@/hooks/useOrders';
import { productionStatusConfig, priorityConfig } from '@/config/production';
import { Factory, Clock, CheckCircle, AlertTriangle, Search, Calendar, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function PCPPanel() {
  const { orders: productionOrders, loading } = useProductionOrders();
  const { data: salesOrders } = useOrders();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const ordersAwaitingProduction = (salesOrders || []).filter(o => o.status === 'awaiting_production' || o.status === 'in_production');

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
          <TabsTrigger value="demand">Demanda Comercial</TabsTrigger>
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
                  <TableHead>Setor</TableHead>
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
                    return (
                      <TableRow key={o.id}>
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
                        <TableCell>{o.due_date ? format(new Date(o.due_date), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>{o.work_center || '-'}</TableCell>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Prioridade</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {ordersAwaitingProduction.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum pedido aguardando produção</TableCell></TableRow>
                  ) : ordersAwaitingProduction.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono">{o.number}</TableCell>
                      <TableCell>{o.client_name}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-warning/10 text-warning">{o.status}</Badge></TableCell>
                      <TableCell>R$ {o.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{o.delivery_date ? format(new Date(o.delivery_date), 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell>{o.priority}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
