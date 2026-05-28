import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOutsourcingOrders, type OutsourcingOrderRow } from '@/hooks/useOutsourcingOrders';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import { outsourcingStatusConfig } from '@/config/production';
import { KanbanService } from '@/lib/pcpServices';
import { Truck, AlertTriangle, Plus, Calendar, DollarSign, Package, Clock, CheckCircle, Search, BarChart3, TrendingUp } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatBRL, formatNumber } from '@/lib/formatters';

export default function OutsourcingPage() {
  const { orders: outsourcingOrders, loading, create, update, remove, lateOrders } = useOutsourcingOrders();
  const { orders: productionOrders, update: updateOP } = useProductionOrders();
  const { suppliers } = useSuppliers();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OutsourcingOrderRow | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form state
  const [form, setForm] = useState({
    production_order_id: '',
    supplier_name: '',
    supplier_id: '',
    service_description: '',
    sent_date: format(new Date(), 'yyyy-MM-dd'),
    expected_return_date: '',
    quantity_sent: 0,
    unit_cost: 0,
    notes: '',
  });

  const resetForm = () => setForm({
    production_order_id: '', supplier_name: '', supplier_id: '', service_description: '',
    sent_date: format(new Date(), 'yyyy-MM-dd'), expected_return_date: '', quantity_sent: 0, unit_cost: 0, notes: '',
  });

  const activeOPs = productionOrders.filter(o => !['completed', 'cancelled'].includes(o.status));

  const filtered = useMemo(() => outsourcingOrders.filter(o => {
    const matchSearch = !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  }), [outsourcingOrders, search, statusFilter]);

  const totalCost = outsourcingOrders.reduce((s, o) => s + (o.total_cost || 0), 0);
  const pendingCount = outsourcingOrders.filter(o => o.status !== 'returned').length;
  const returnedCount = outsourcingOrders.filter(o => o.status === 'returned').length;

  const handleCreate = async () => {
    const selectedOP = activeOPs.find(o => o.id === form.production_order_id);
    if (!selectedOP) return;

    const orderNumber = `OS-${format(new Date(), 'yyyyMMdd')}-${selectedOP.order_number.slice(-4)}`;
    const totalCost = form.quantity_sent * form.unit_cost;

    const success = await create({
      ...form,
      order_number: orderNumber,
      total_cost: totalCost,
      supplier_id: form.supplier_id || null,
    } as any);

    if (success) {
      // Move OP to outsourced status
      await updateOP(form.production_order_id, { status: 'outsourced' });
      setShowCreateDialog(false);
      resetForm();
    }
  };

  const handleStatusChange = async (order: OutsourcingOrderRow, newStatus: string) => {
    const updates: Partial<OutsourcingOrderRow> = { status: newStatus };
    if (newStatus === 'returned') {
      updates.actual_return_date = new Date().toISOString().split('T')[0];
      // Move production order back to in_progress
      await updateOP(order.production_order_id, { status: 'in_progress' });
    }
    await update(order.id, updates);
  };

  const handleReceive = async (order: OutsourcingOrderRow, returnedQty: number, rejectedQty: number) => {
    await update(order.id, {
      status: 'returned',
      actual_return_date: new Date().toISOString().split('T')[0],
      quantity_returned: returnedQty,
      quantity_rejected: rejectedQty,
    });
    await updateOP(order.production_order_id, { status: 'finishing' });
    setEditingOrder(null);
  };

  const supplierMetrics = useMemo(() => KanbanService.calculateSupplierMetrics(outsourcingOrders), [outsourcingOrders]);

  return (
    <PageContainer loading={loading}>
      <PageHeader title="Terceirização" description="Controle de ordens enviadas para fornecedores terceirizados" />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Em Andamento" value={pendingCount} icon={<Truck className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Atrasadas" value={lateOrders.length} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={1} />
        <KPICard title="Retornadas" value={returnedCount} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Custo Total" value={`${formatBRL(totalCost)}`} icon={<DollarSign className="h-5 w-5" />} accentColor="warning" index={3} />
      </div>

      {/* Late alerts */}
      {lateOrders.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Fornecedores em Atraso</span>
            </div>
            <div className="space-y-1">
              {lateOrders.map(o => (
                <p key={o.id} className="text-xs text-destructive">
                  🔴 {o.supplier_name} — OS {o.order_number} — {differenceInDays(new Date(), new Date(o.expected_return_date!))} dias de atraso
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Ordens de Serviço</TabsTrigger>
          <TabsTrigger value="metrics">Métricas de Fornecedores</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {/* Filters + Create */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar OS ou fornecedor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    {Object.entries(outsourcingStatusConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Nova OS Terceirizada
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº OS</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>OP Vinculada</TableHead>
                    <TableHead>Qtde</TableHead>
                    <TableHead>Envio</TableHead>
                    <TableHead>Prev. Retorno</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma OS encontrada</TableCell></TableRow>
                  ) : filtered.map(o => {
                    const isLate = o.expected_return_date && new Date(o.expected_return_date) < new Date() && o.status !== 'returned';
                    const sc = outsourcingStatusConfig[isLate ? 'late' : o.status] || { label: o.status, color: '' };
                    const linkedOP = productionOrders.find(p => p.id === o.production_order_id);
                    return (
                      <TableRow key={o.id} className={cn(isLate && 'bg-destructive/5')}>
                        <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                        <TableCell>{o.supplier_name}</TableCell>
                        <TableCell className="font-mono text-xs">{linkedOP?.order_number || '-'}</TableCell>
                        <TableCell>{o.quantity_sent}</TableCell>
                        <TableCell>{format(new Date(o.sent_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {o.expected_return_date ? format(new Date(o.expected_return_date), 'dd/MM/yyyy') : '-'}
                            {isLate && <AlertTriangle className="h-3 w-3 text-destructive" />}
                          </div>
                        </TableCell>
                        <TableCell><Badge className={cn('text-xs', sc.color)}>{sc.label}</Badge></TableCell>
                        <TableCell>R$ {(o.total_cost || formatNumber(0), 2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {o.status === 'sent' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(o, 'in_production')}>
                                Em Produção
                              </Button>
                            )}
                            {(o.status === 'sent' || o.status === 'in_production') && (
                              <Button size="sm" className="h-7 text-xs" onClick={() => setEditingOrder(o)}>
                                Receber
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

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5" /> Performance de Fornecedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supplierMetrics.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado de fornecedor disponível ainda.</p>
              ) : (
                <div className="space-y-4">
                  {supplierMetrics.map(sm => (
                    <Card key={sm.supplierName} className="border-border/50">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-sm">{sm.supplierName}</h4>
                            <p className="text-xs text-muted-foreground">{sm.totalOrders} OS total · {sm.returnedOnTime} no prazo · {sm.returnedLate} atrasadas</p>
                          </div>
                          <Badge className={cn('text-xs', sm.onTimeRate >= 80 ? 'bg-green-500/20 text-green-400' : sm.onTimeRate >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400')}>
                            {sm.onTimeRate}% no prazo
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Taxa Pontualidade</p>
                            <Progress value={sm.onTimeRate} className="h-2 mt-1" />
                            <p className="text-xs font-medium mt-0.5">{sm.onTimeRate}%</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Atraso Médio</p>
                            <p className="text-lg font-bold">{sm.avgDelayDays}d</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Qualidade</p>
                            <Progress value={sm.avgQualityRate} className="h-2 mt-1" />
                            <p className="text-xs font-medium mt-0.5">{sm.avgQualityRate}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Ordem de Serviço Terceirizada</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ordem de Produção</Label>
              <Select value={form.production_order_id} onValueChange={v => setForm(f => ({ ...f, production_order_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a OP..." /></SelectTrigger>
                <SelectContent>
                  {activeOPs.map(op => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.order_number} — {op.product_name} ({op.quantity} un)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Select value={form.supplier_id} onValueChange={v => {
                const sup = suppliers.find(s => s.id === v);
                setForm(f => ({ ...f, supplier_id: v, supplier_name: sup?.name || '' }));
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {!form.supplier_id && (
                <Input placeholder="Ou digite o nome..." value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} className="mt-2" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Envio</Label>
                <Input type="date" value={form.sent_date} onChange={e => setForm(f => ({ ...f, sent_date: e.target.value }))} />
              </div>
              <div>
                <Label>Previsão Retorno</Label>
                <Input type="date" value={form.expected_return_date} onChange={e => setForm(f => ({ ...f, expected_return_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantidade</Label>
                <Input type="number" value={form.quantity_sent} onChange={e => setForm(f => ({ ...f, quantity_sent: +e.target.value }))} />
              </div>
              <div>
                <Label>Custo Unitário</Label>
                <Input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: +e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Descrição do Serviço</Label>
              <Textarea value={form.service_description} onChange={e => setForm(f => ({ ...f, service_description: e.target.value }))} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.production_order_id || !form.supplier_name}>
              Criar OS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      {editingOrder && (
        <ReceiveDialog order={editingOrder} onClose={() => setEditingOrder(null)} onReceive={handleReceive} />
      )}
    </PageContainer>
  );
}

function ReceiveDialog({ order, onClose, onReceive }: { order: OutsourcingOrderRow; onClose: () => void; onReceive: (o: OutsourcingOrderRow, returned: number, rejected: number) => void }) {
  const [returnedQty, setReturnedQty] = useState(order.quantity_sent);
  const [rejectedQty, setRejectedQty] = useState(0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Receber OS {order.order_number}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Fornecedor: <strong>{order.supplier_name}</strong></p>
          <p className="text-sm text-muted-foreground">Quantidade enviada: <strong>{order.quantity_sent}</strong></p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Qtde Retornada</Label>
              <Input type="number" value={returnedQty} onChange={e => setReturnedQty(+e.target.value)} />
            </div>
            <div>
              <Label>Qtde Rejeitada</Label>
              <Input type="number" value={rejectedQty} onChange={e => setRejectedQty(+e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onReceive(order, returnedQty, rejectedQty)}>Confirmar Recebimento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
