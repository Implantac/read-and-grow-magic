import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { useProductionRoutes, useProductionRouteSteps, ProductionRouteRow, ProductionRouteStep } from '@/hooks/useProductionRoutes';
import { useProductionSectors } from '@/hooks/useProductionSectors';
import { useProductionResources } from '@/hooks/useProductionResources';
import { useProducts } from '@/hooks/useProducts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Search, Route, Clock, ChevronRight, X, ArrowDown, AlertTriangle, GitBranch, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

const emptyRoute: Partial<ProductionRouteRow> = { code: '', product_id: null, product_code: '', product_name: '', version: '1.0', description: '', is_active: true };

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

  const openNew = () => { setEditing(null); setForm(emptyRoute); setOpen(true); };
  const openEdit = (r: ProductionRouteRow) => { setEditing(r); setForm(r); setOpen(true); };

  const handleSave = async () => {
    const ok = editing ? await update(editing.id, form) : await create(form);
    if (ok) setOpen(false);
  };

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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Rotas', value: routes.length, icon: GitBranch, color: 'text-primary' },
          { label: 'Ativas', value: routes.filter(r => r.is_active).length, icon: Route, color: 'text-success' },
          { label: 'Produtos Vinc.', value: new Set(routes.map(r => r.product_id).filter(Boolean)).size, icon: Package, color: 'text-info' },
          { label: 'Tempo Médio', value: routes.length ? `${Math.round(routes.reduce((s, r) => s + r.total_time_minutes, 0) / routes.length)} min` : '0 min', icon: Clock, color: 'text-warning' },
        ].map((kpi, i) => (
          <Card key={i} className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar rota ou produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Rota</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Routes List */}
        <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
                <Route className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">Nenhuma rota cadastrada</p>
              </CardContent>
            </Card>
          ) : filtered.map(r => (
            <Card
              key={r.id}
              className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm ${selectedRoute === r.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50'}`}
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
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center py-20 text-muted-foreground">
                <ChevronRight className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-medium">Selecione uma rota</p>
                <p className="text-sm mt-1">Clique em uma rota à esquerda para ver e editar suas etapas</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Rota' : 'Nova Rota'}</DialogTitle>
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

      {/* Delete Confirmation */}
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

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg">Etapas da Rota</CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">{steps.length} etapas • Tempo total: {totalTime} min</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowAdd(!showAdd)} variant={showAdd ? 'secondary' : 'default'}>
            <Plus className="h-4 w-4 mr-1" />Etapa
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add Step Form */}
        {showAdd && (
          <div className="border border-dashed border-primary/30 rounded-lg p-4 mb-4 bg-primary/5">
            <p className="text-sm font-medium mb-3">Nova Etapa</p>
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

        {/* Steps Visual Flow */}
        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
        ) : steps.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma etapa definida</p>
            <p className="text-sm mt-1">Adicione a primeira etapa da rota</p>
          </div>
        ) : (
          <div className="space-y-0">
            {steps.map((s, i) => (
              <div key={s.id}>
                {/* Step Card */}
                <div className="relative flex items-stretch gap-3 group">
                  {/* Sequence indicator */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm">
                      {s.sequence}
                    </div>
                    {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 border rounded-lg p-3 mb-2 bg-card hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{s.step_name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {s.sector_name && <Badge variant="secondary" className="text-[10px] h-5">{s.sector_name}</Badge>}
                          {s.resource_name && <Badge variant="outline" className="text-[10px] h-5">{s.resource_name}</Badge>}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Setup: {s.setup_time_minutes}min • Op: {s.operation_time_minutes}min
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
