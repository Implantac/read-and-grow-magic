import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { ExportButton } from '@/components/shared/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useMaterialConsumptions, MaterialConsumptionRow } from '@/hooks/useMaterialConsumptions';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PackageMinus, Search, Package, Eye, Plus, CheckCircle, AlertTriangle, MapPin, Box } from 'lucide-react';

export default function MaterialConsumptionPage() {
  const { consumptions, loading, refetch, update } = useMaterialConsumptions();
  const { orders } = useProductionOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [consumeOpen, setConsumeOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<MaterialConsumptionRow | null>(null);
  const [consumeQty, setConsumeQty] = useState(0);
  const [form, setForm] = useState({
    production_order_id: '', component_code: '', component_name: '',
    expected_quantity: 0, unit: 'UN', batch: '', location: '',
  });

  const activeOrders = orders.filter(o => ['planned', 'in_progress', 'paused'].includes(o.status));
  const orderNumbers = [...new Set(consumptions.map(c => c.order_number))];

  const filtered = useMemo(() => consumptions.filter(c => {
    const matchSearch = !searchTerm ||
      c.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.component_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.component_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchOrder = orderFilter === 'all' || c.order_number === orderFilter;
    return matchSearch && matchOrder;
  }), [consumptions, searchTerm, orderFilter]);

  const totalExpected = consumptions.reduce((s, c) => s + c.expected_quantity, 0);
  const totalConsumed = consumptions.reduce((s, c) => s + c.consumed_quantity, 0);
  const pendingItems = consumptions.filter(c => c.consumed_quantity < c.expected_quantity).length;
  const consumptionRate = totalExpected > 0 ? Math.round((totalConsumed / totalExpected) * 100) : 0;

  const handleCreate = async () => {
    if (!form.production_order_id || !form.component_code || !form.component_name) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    const order = orders.find(o => o.id === form.production_order_id);
    const { error } = await (supabase as any).from('material_consumptions').insert({
      production_order_id: form.production_order_id,
      order_number: order?.order_number || '',
      component_code: form.component_code,
      component_name: form.component_name,
      expected_quantity: form.expected_quantity,
      consumed_quantity: 0,
      unit: form.unit,
      batch: form.batch || null,
      location: form.location || null,
    });
    if (error) { toast.error('Erro ao registrar'); console.error(error); return; }
    toast.success('Consumo registrado');
    setCreateOpen(false);
    setForm({ production_order_id: '', component_code: '', component_name: '', expected_quantity: 0, unit: 'UN', batch: '', location: '' });
    await refetch();
  };

  const handleConsume = async () => {
    if (!selected || consumeQty <= 0) return;
    const newConsumed = selected.consumed_quantity + consumeQty;
    await update(selected.id, {
      consumed_quantity: newConsumed,
      consumed_at: new Date().toISOString(),
      consumed_by: 'Operador',
    });
    toast.success(`${consumeQty} ${selected.unit} consumidos`);
    setConsumeOpen(false);
    setSelected(null);
  };

  const getStatus = (c: MaterialConsumptionRow) => {
    const pct = c.expected_quantity > 0 ? (c.consumed_quantity / c.expected_quantity) * 100 : 0;
    if (pct >= 100) return { label: 'Completo', variant: 'outline' as const };
    if (pct > 0) return { label: 'Parcial', variant: 'secondary' as const };
    return { label: 'Pendente', variant: 'destructive' as const };
  };

  return (
    <PageContainer loading={loading}>
      <PageHeader title="Consumo de Matéria-Prima" description="Registro e baixa de materiais integrado ao estoque">
        <ExportButton
          data={filtered as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'order_number', label: 'Ordem' }, { key: 'component_code', label: 'Código' },
            { key: 'component_name', label: 'Material' }, { key: 'expected_quantity', label: 'Qtd Esperada' },
            { key: 'consumed_quantity', label: 'Qtd Consumida' }, { key: 'unit', label: 'Unidade' },
          ]}
          filename="consumo_materiais"
        />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Registrar Consumo
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Total Esperado" value={totalExpected} subtitle="unidades" icon={<Package className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Total Consumido" value={totalConsumed} subtitle="unidades" icon={<PackageMinus className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Taxa de Consumo" value={`${consumptionRate}%`} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Itens Pendentes" value={pendingItems} icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" index={3} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por ordem, componente ou código..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={orderFilter} onValueChange={setOrderFilter}>
              <SelectTrigger className="w-full md:w-[220px]"><SelectValue placeholder="Ordem de Produção" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ordens</SelectItem>
                {orderNumbers.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><PackageMinus className="h-5 w-5" /> Registros de Consumo</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Ordem</TableHead><TableHead>Componente</TableHead><TableHead>Esperado</TableHead>
              <TableHead>Consumido</TableHead><TableHead>Progresso</TableHead><TableHead>Lote</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</TableCell></TableRow>
              ) : filtered.map(c => {
                const status = getStatus(c);
                const progress = c.expected_quantity > 0 ? Math.round((c.consumed_quantity / c.expected_quantity) * 100) : 0;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-sm">{c.order_number}</TableCell>
                    <TableCell>
                      <p className="font-medium">{c.component_name}</p>
                      <p className="text-xs text-muted-foreground">{c.component_code}</p>
                    </TableCell>
                    <TableCell>{c.expected_quantity} {c.unit}</TableCell>
                    <TableCell>{c.consumed_quantity} {c.unit}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="w-20 h-2" />
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Box className="h-3 w-3 text-muted-foreground" />
                        {c.batch || '-'}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setSelected(c); setDetailsOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {c.consumed_quantity < c.expected_quantity && (
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelected(c);
                            setConsumeQty(c.expected_quantity - c.consumed_quantity);
                            setConsumeOpen(true);
                          }}>
                            <PackageMinus className="h-4 w-4 mr-1" /> Consumir
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

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes do Consumo</DialogTitle></DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Ordem de Produção</p><p className="font-medium">{selected.order_number}</p></div>
              <div><p className="text-sm text-muted-foreground">Componente</p><p className="font-medium">{selected.component_name}</p><p className="text-xs text-muted-foreground">{selected.component_code}</p></div>
              <div><p className="text-sm text-muted-foreground">Quantidade Esperada</p><p className="font-medium">{selected.expected_quantity} {selected.unit}</p></div>
              <div><p className="text-sm text-muted-foreground">Quantidade Consumida</p><p className="font-medium">{selected.consumed_quantity} {selected.unit}</p></div>
              <div><p className="text-sm text-muted-foreground">Lote</p><p className="font-medium">{selected.batch || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">Localização</p><div className="flex items-center gap-1"><MapPin className="h-3 w-3" /><p className="font-medium">{selected.location || '-'}</p></div></div>
              <div><p className="text-sm text-muted-foreground">Consumido Por</p><p className="font-medium">{selected.consumed_by || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">Data/Hora</p><p className="font-medium">{selected.consumed_at ? format(new Date(selected.consumed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}</p></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetailsOpen(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consume Dialog */}
      <Dialog open={consumeOpen} onOpenChange={setConsumeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Consumo</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selected.component_name}</p>
                <p className="text-sm text-muted-foreground">{selected.component_code}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Esperado</p><p className="font-medium">{selected.expected_quantity} {selected.unit}</p></div>
                <div><p className="text-sm text-muted-foreground">Já Consumido</p><p className="font-medium">{selected.consumed_quantity} {selected.unit}</p></div>
              </div>
              <div>
                <Label>Quantidade a Consumir</Label>
                <Input type="number" min={0} max={selected.expected_quantity - selected.consumed_quantity} value={consumeQty} onChange={e => setConsumeQty(Number(e.target.value))} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Máximo: {selected.expected_quantity - selected.consumed_quantity} {selected.unit}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsumeOpen(false)}>Cancelar</Button>
            <Button onClick={handleConsume}>Confirmar Consumo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Registro de Consumo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ordem de Produção *</Label>
              <Select value={form.production_order_id} onValueChange={v => setForm(f => ({ ...f, production_order_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a OP" /></SelectTrigger>
                <SelectContent>
                  {activeOrders.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.order_number} — {o.product_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Código do Componente *</Label><Input value={form.component_code} onChange={e => setForm(f => ({ ...f, component_code: e.target.value }))} placeholder="MAT-001" /></div>
              <div><Label>Nome do Componente *</Label><Input value={form.component_name} onChange={e => setForm(f => ({ ...f, component_name: e.target.value }))} placeholder="Tecido algodão" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Quantidade Esperada</Label><Input type="number" value={form.expected_quantity} onChange={e => setForm(f => ({ ...f, expected_quantity: Number(e.target.value) }))} /></div>
              <div><Label>Unidade</Label>
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UN">UN</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="LT">LT</SelectItem>
                    <SelectItem value="PC">PC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Lote</Label><Input value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} placeholder="L2024-01" /></div>
            </div>
            <div><Label>Localização</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Almoxarifado A3" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
