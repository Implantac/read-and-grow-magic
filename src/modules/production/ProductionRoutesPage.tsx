import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { useProductionRoutes, useProductionRouteSteps, ProductionRouteRow, ProductionRouteStep } from '@/hooks/production/useProductionRoutes';
import { useProductionSectors } from '@/hooks/production/useProductionSectors';
import { useProductionResources } from '@/hooks/production/useProductionResources';
import { useProducts } from '@/hooks/inventory/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Search, Route, Clock, ChevronRight, X, AlertTriangle, GitBranch, Package, Timer, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

const emptyRoute: Partial<ProductionRouteRow> = { code: '', product_id: null, product_code: '', product_name: '', version: '1.0', description: '', is_active: true };

const kpiConfig = [
  { label: 'Total Rotas', icon: GitBranch, color: 'text-primary', ring: 'ring-primary/20' },
  { label: 'Ativas', icon: Route, color: 'text-success', ring: 'ring-success/20' },
  { label: 'Produtos Vinc.', icon: Package, color: 'text-info', ring: 'ring-info/20' },
  { label: 'Tempo Médio', icon: Clock, color: 'text-warning', ring: 'ring-warning/20' },
];

export default function ProductionRoutesPage() {
  const { routes, loading, create, update, remove } = useProductionRoutes();
  const { data: products = [] } = useProducts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionRouteRow | null>(null);
  const [form, setForm] = useState<Partial<ProductionRouteRow>>(emptyRoute);
  const [search, setSearch] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = routes.filter(r =>
    r.code.toLowerCase().includes(search.toLowerCase()) ||
    (r.product_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const kpiValues = [
    routes.length,
    routes.filter(r => r.is_active).length,
    new Set(routes.map(r => r.product_id).filter(Boolean)).size,
    routes.length ? `${Math.round(routes.reduce((s, r) => s + r.total_time_minutes, 0) / routes.length)} min` : '0 min',
  ];

  const openNew = () => { setEditing(null); setForm(emptyRoute); setOpen(true); };
  const openEdit = (r: ProductionRouteRow) => { setEditing(r); setForm(r); setOpen(true); };
  const handleSave = async () => { const ok = editing ? await update(editing.id, form) : await create(form); if (ok) setOpen(false); };

  const handleProductChange = (productId: string) => {
    const p = products.find(pr => pr.id === productId);
    setForm({ ...form, product_id: productId, product_code: p?.code || '', product_name: p?.name || '' });
  };

  const handleDelete = async () => {
    if (deleteId) { await remove(deleteId); if (selectedRoute === deleteId) setSelectedRoute(null); setDeleteId(null); }
  };

  return (
    <PageContainer>
      <PageHeader title="Rotas Produtivas" description="Defina a sequência de etapas para fabricação de cada produto" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpiConfig.map((kpi, i) => (
          <Card key={i} className="border-border/40 bg-card/80 backdrop-blur-sm hover-lift" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-11 w-11 rounded-xl bg-muted/60 flex items-center justify-center ${kpi.color} ring-2 ${kpi.ring}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{kpiValues[i]}</p>
                <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar rota ou produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openNew} className="shrink-0"><Plus className="h-4 w-4 mr-2" />Nova Rota</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Routes List */}
        <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <Card className="border-border/40">
              <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                <Route className="h-12 w-12 mb-3 opacity-20" />
                <p className="font-semibold">Nenhuma rota cadastrada</p>
              </CardContent>
            </Card>
          ) : filtered.map(r => (
            <Card
              key={r.id}
              className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${selectedRoute === r.id ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20' : 'border-border/40'}`}
              onClick={() => setSelectedRoute(r.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-primary">{r.code}</span>
                      <Badge variant="outline" className="text-[10px] h-5">v{r.version}</Badge>
                      {!r.is_active && <Badge variant="destructive" className="text-[10px] h-5">Inativa</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{r.product_name || 'Sem produto vinculado'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="gap-1 text-xs"><Clock className="h-3 w-3" />{r.total_time_minutes} min</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(r); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setDeleteId(r.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Route Steps Detail */}
        <div className="lg:col-span-2">
          {selectedRoute ? (
            <RouteStepsPanel routeId={selectedRoute} onClose={() => setSelectedRoute(null)} />
          ) : (
            <Card className="border-border/40 border-dashed">
              <CardContent className="flex flex-col items-center py-24 text-muted-foreground">
                <div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                  <ChevronRight className="h-8 w-8 opacity-30" />
                </div>
                <p className="font-semibold text-base">Selecione uma rota</p>
                <p className="text-sm mt-1">Clique em uma rota à esquerda para ver e editar suas etapas</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><GitBranch className="h-4 w-4 text-primary" /></div>
              {editing ? 'Editar Rota' : 'Nova Rota'}
            </DialogTitle>
            <DialogDescription>Configure a rota produtiva e vincule a um produto</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Código *</Label><Input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="ROT-001" /></div>
              <div className="space-y-1.5"><Label>Versão</Label><Input value={form.version || '1.0'} onChange={e => setForm({ ...form, version: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Produto</Label>
              <Select value={form.product_id || ''} onValueChange={handleProductChange}>
                <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.code}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Confirmar Exclusão</DialogTitle>
            <DialogDescription>Todas as etapas desta rota serão excluídas. Deseja continuar?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

/* ── Route Steps Panel with Visual Flow ── */
function RouteStepsPanel({ routeId, onClose }: { routeId: string; onClose: () => void }) {
  const { steps, loading, addStep, removeStep } = useProductionRouteSteps(routeId);
  const { activeSectors } = useProductionSectors();
  const { resources } = useProductionResources();
  const [showAdd, setShowAdd] = useState(false);
  const [newStep, setNewStep] = useState<Partial<ProductionRouteStep>>({ step_name: '', sequence: 1, sector_id: null, resource_id: null, setup_time_minutes: 0, operation_time_minutes: 0 });

  const handleAdd = async () => {
    const ok = await addStep({ ...newStep, sequence: steps.length + 1 });
    if (ok) {
      setShowAdd(false);
      setNewStep({ step_name: '', sequence: 1, sector_id: null, resource_id: null, setup_time_minutes: 0, operation_time_minutes: 0 });
    }
  };

  const totalTime = steps.reduce((s, st) => s + (st.setup_time_minutes || 0) + (st.operation_time_minutes || 0), 0);
  const totalSetup = steps.reduce((s, st) => s + (st.setup_time_minutes || 0), 0);
  const totalOp = steps.reduce((s, st) => s + (st.operation_time_minutes || 0), 0);

  return (
    <Card className="border-border/40">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Etapas da Rota
          </CardTitle>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />{steps.length} etapas</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="h-3 w-3" />Setup: {totalSetup}min</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Op: {totalOp}min</span>
            <Badge variant="secondary" className="text-xs font-mono">{totalTime} min total</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowAdd(!showAdd)} variant={showAdd ? 'secondary' : 'default'}>
            <Plus className="h-4 w-4 mr-1" />Etapa
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAdd && (
          <div className="border border-dashed border-primary/30 rounded-xl p-4 mb-4 bg-primary/5">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center"><Plus className="h-3 w-3 text-primary" /></div>
              Nova Etapa
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1"><Label className="text-xs">Nome da Etapa *</Label><Input value={newStep.step_name || ''} onChange={e => setNewStep({ ...newStep, step_name: e.target.value })} placeholder="Usinagem" /></div>
              <div className="space-y-1">
                <Label className="text-xs">Setor</Label>
                <Select value={newStep.sector_id || ''} onValueChange={v => setNewStep({ ...newStep, sector_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{activeSectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="space-y-1">
                <Label className="text-xs">Recurso</Label>
                <Select value={newStep.resource_id || ''} onValueChange={v => setNewStep({ ...newStep, resource_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{resources.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Setup (min)</Label><Input type="number" value={newStep.setup_time_minutes || 0} onChange={e => setNewStep({ ...newStep, setup_time_minutes: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label className="text-xs">Operação (min)</Label><Input type="number" value={newStep.operation_time_minutes || 0} onChange={e => setNewStep({ ...newStep, operation_time_minutes: Number(e.target.value) })} /></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!newStep.step_name}>Adicionar</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
        ) : steps.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="h-14 w-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-3">
              <GitBranch className="h-7 w-7 opacity-30" />
            </div>
            <p className="font-semibold">Nenhuma etapa definida</p>
            <p className="text-sm mt-1">Adicione a primeira etapa da rota</p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Horizontal Flow Summary */}
            {steps.length > 1 && (
              <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 px-1">
                {steps.map((s, i) => (
                  <div key={s.id} className="flex items-center shrink-0">
                    <div className="flex flex-col items-center">
                      <div className="h-9 px-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-1.5">
                        <span className="text-xs font-bold text-primary">{s.sequence}</span>
                        <span className="text-xs font-medium text-foreground whitespace-nowrap">{s.step_name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        {(s.setup_time_minutes || 0) + (s.operation_time_minutes || 0)}min
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-primary/40 shrink-0 mx-0.5" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Detailed Steps */}
            {steps.map((s, i) => (
              <div key={s.id}>
                <div className="relative flex items-stretch gap-3 group">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-primary/20">
                      {s.sequence}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/40 to-border mt-1" />
                    )}
                  </div>

                  <div className="flex-1 border border-border/40 rounded-xl p-3 mb-2 bg-card/60 hover:border-primary/30 hover:bg-card/80 transition-all shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{s.step_name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {s.sector_name && <Badge variant="secondary" className="text-[10px] h-5 gap-1">{s.sector_name}</Badge>}
                          {s.resource_name && <Badge variant="outline" className="text-[10px] h-5 gap-1">{s.resource_name}</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Timer className="h-3 w-3 text-amber-500" />
                            Setup: <span className="font-mono font-medium text-foreground">{s.setup_time_minutes}min</span>
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-500" />
                            Op: <span className="font-mono font-medium text-foreground">{s.operation_time_minutes}min</span>
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => removeStep(s.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
