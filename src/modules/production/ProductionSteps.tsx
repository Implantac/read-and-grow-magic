import { useState, useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Switch } from '@/ui/base/switch';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Progress } from '@/ui/base/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { useProductionSteps, useProductionOrderSteps } from '@/hooks/production/useProductionSteps';
import { useProductionOrders } from '@/hooks/production/useProductionOrders';
import { Plus, Pencil, Trash2, GripVertical, Layers, Factory, Search, Play, CheckCircle, Clock, User, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/ui/base/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProductionStepsPage() {
  const { steps, loading, createStep, updateStep, deleteStep } = useProductionSteps();
  const { orders } = useProductionOrders();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', sequence: 0, estimated_time_minutes: 0, sector: '', is_active: true });

  // Per-OP steps tracking
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const { orderSteps, loading: orderStepsLoading, updateOrderStep, generateStepsForOrder } = useProductionOrderSteps(selectedOrderId || undefined);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedStepIds, setSelectedStepIds] = useState<string[]>([]);
  const [generateOrderId, setGenerateOrderId] = useState('');

  const activeOrders = useMemo(() =>
    orders.filter(o => ['planned', 'in_progress', 'paused'].includes(o.status)),
    [orders]
  );

  const totalEstimatedTime = steps.reduce((s, st) => s + st.estimated_time_minutes, 0);
  const activeStepsCount = steps.filter(s => s.is_active).length;
  const sectors = [...new Set(steps.map(s => s.sector).filter(Boolean))];

  const openNew = () => {
    setEditingStep(null);
    setForm({ name: '', code: '', description: '', sequence: (steps.length + 1) * 10, estimated_time_minutes: 30, sector: '', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (step: any) => {
    setEditingStep(step);
    setForm({ name: step.name, code: step.code, description: step.description || '', sequence: step.sequence, estimated_time_minutes: step.estimated_time_minutes, sector: step.sector || '', is_active: step.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) return;
    if (editingStep) await updateStep(editingStep.id, form);
    else await createStep(form);
    setDialogOpen(false);
  };

  const openGenerate = () => {
    setSelectedStepIds(steps.filter(s => s.is_active).map(s => s.id));
    setGenerateOrderId('');
    setGenerateDialogOpen(true);
  };

  const handleGenerate = async () => {
    if (!generateOrderId || selectedStepIds.length === 0) {
      toast.error('Selecione a OP e pelo menos uma etapa');
      return;
    }
    const order = orders.find(o => o.id === generateOrderId);
    if (!order) return;
    await generateStepsForOrder(generateOrderId, order.quantity, selectedStepIds);
    setGenerateDialogOpen(false);
    setSelectedOrderId(generateOrderId);
  };

  const handleStepStatusChange = async (stepId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'in_progress') updates.started_at = new Date().toISOString();
    if (newStatus === 'completed') updates.completed_at = new Date().toISOString();
    await updateOrderStep(stepId, updates);
    toast.success(`Etapa ${newStatus === 'completed' ? 'concluída' : newStatus === 'in_progress' ? 'iniciada' : 'atualizada'}`);
  };

  if (loading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-64" />
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Etapas de Produção" description="Defina o fluxo produtivo e acompanhe a execução por OP">
        <Button variant="outline" onClick={openGenerate}><ArrowRight className="h-4 w-4 mr-2" /> Gerar Etapas p/ OP</Button>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nova Etapa</Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Etapas Cadastradas" value={steps.length} icon={<Layers className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Ativas" value={activeStepsCount} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="Setores" value={sectors.length} icon={<Factory className="h-5 w-5" />} accentColor="info" index={2} />
        <KPICard title="Tempo Total" value={`${totalEstimatedTime} min`} icon={<Clock className="h-5 w-5" />} accentColor="warning" index={3} />
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">📋 Catálogo de Etapas</TabsTrigger>
          <TabsTrigger value="tracking">🔄 Acompanhar Etapas da OP</TabsTrigger>
        </TabsList>

        {/* ---- CATALOG TAB ---- */}
        <TabsContent value="catalog" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Fluxo Produtivo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Nome</TableHead><TableHead>Código</TableHead>
                  <TableHead>Setor</TableHead><TableHead>Tempo Est.</TableHead>
                  <TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {steps.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma etapa cadastrada</TableCell></TableRow>
                  ) : steps.map((s) => (
                    <TableRow key={s.id} className={!s.is_active ? 'opacity-50' : ''}>
                      <TableCell><GripVertical className="h-4 w-4 text-muted-foreground" /></TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.code}</TableCell>
                      <TableCell>{s.sector || '-'}</TableCell>
                      <TableCell>{s.estimated_time_minutes} min</TableCell>
                      <TableCell><Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? 'Ativa' : 'Inativa'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteStep(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- TRACKING TAB ---- */}
        <TabsContent value="tracking" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Factory className="h-5 w-5 text-muted-foreground" />
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione uma Ordem de Produção..." /></SelectTrigger>
                  <SelectContent>
                    {activeOrders.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.order_number} — {o.product_name} ({o.produced_quantity}/{o.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {selectedOrderId && (
            orderStepsLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
            ) : orderSteps.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nenhuma etapa gerada para esta OP</p>
                  <p className="text-sm text-muted-foreground mb-4">Clique em "Gerar Etapas p/ OP" para criar o fluxo produtivo</p>
                  <Button onClick={() => { setGenerateOrderId(selectedOrderId); setSelectedStepIds(steps.filter(s => s.is_active).map(s => s.id)); setGenerateDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Gerar Etapas Agora
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Progress overview */}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progresso das etapas</span>
                          <span className="font-bold">
                            {orderSteps.filter(s => s.status === 'completed').length}/{orderSteps.length} concluídas
                          </span>
                        </div>
                        <Progress value={(orderSteps.filter(s => s.status === 'completed').length / orderSteps.length) * 100} className="h-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Steps list */}
                {orderSteps.map((step, idx) => {
                  const stepProgress = step.quantity_pending > 0
                    ? ((step.quantity_produced / (step.quantity_produced + step.quantity_pending)) * 100)
                    : (step.status === 'completed' ? 100 : 0);

                  return (
                    <Card key={step.id} className={cn(
                      'transition-all',
                      step.status === 'completed' && 'border-success/50 bg-success/5',
                      step.status === 'in_progress' && 'border-primary/50 bg-primary/5',
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Step number */}
                          <div className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shrink-0',
                            step.status === 'completed' ? 'bg-success/20 text-success' :
                            step.status === 'in_progress' ? 'bg-primary/20 text-primary' :
                            'bg-muted text-muted-foreground'
                          )}>
                            {step.status === 'completed' ? '✓' : idx + 1}
                          </div>

                          {/* Step info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{step.step_name || `Etapa ${step.sequence}`}</p>
                              {step.step_sector && <Badge variant="outline" className="text-[10px]">📍 {step.step_sector}</Badge>}
                              <Badge variant={
                                step.status === 'completed' ? 'default' :
                                step.status === 'in_progress' ? 'default' : 'secondary'
                              } className="text-[10px]">
                                {step.status === 'completed' ? '✅ Concluída' :
                                 step.status === 'in_progress' ? '🔄 Em andamento' : '⏳ Pendente'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                              {step.responsible && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {step.responsible}</span>}
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Est: {step.estimated_time_minutes}min</span>
                              {step.realized_time_minutes > 0 && <span>Real: {step.realized_time_minutes}min</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Progress value={stepProgress} className="w-32 h-2" />
                              <span className="text-xs">{step.quantity_produced}/{step.quantity_produced + step.quantity_pending} peças</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 shrink-0">
                            {step.status === 'pending' && (
                              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleStepStatusChange(step.id, 'in_progress')}>
                                <Play className="h-3 w-3 mr-1" /> Iniciar
                              </Button>
                            )}
                            {step.status === 'in_progress' && (
                              <Button size="sm" className="h-8 text-xs" onClick={() => handleStepStatusChange(step.id, 'completed')}>
                                <CheckCircle className="h-3 w-3 mr-1" /> Concluir
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Step Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingStep ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Corte" /></div>
              <div><Label>Código</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Ex: corte" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Setor</Label><Input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} placeholder="Ex: Corte" /></div>
              <div><Label>Tempo Estimado (min)</Label><Input type="number" value={form.estimated_time_minutes} onChange={e => setForm({ ...form, estimated_time_minutes: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label>Etapa ativa</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingStep ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Steps for OP Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Gerar Etapas para Ordem de Produção</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ordem de Produção</Label>
              <Select value={generateOrderId} onValueChange={setGenerateOrderId}>
                <SelectTrigger><SelectValue placeholder="Selecione a OP" /></SelectTrigger>
                <SelectContent>
                  {activeOrders.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.order_number} — {o.product_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Etapas a incluir</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {steps.filter(s => s.is_active).map(s => (
                  <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStepIds.includes(s.id)}
                      onChange={e => {
                        if (e.target.checked) setSelectedStepIds(ids => [...ids, s.id]);
                        else setSelectedStepIds(ids => ids.filter(id => id !== s.id));
                      }}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.sector || 'Sem setor'} — {s.estimated_time_minutes}min</p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{selectedStepIds.length} etapas selecionadas</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleGenerate}>Gerar {selectedStepIds.length} Etapas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
