import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { useProductionRoutes, useProductionRouteSteps, ProductionRouteRow, ProductionRouteStep } from '@/hooks/useProductionRoutes';
import { useProductionSectors } from '@/hooks/useProductionSectors';
import { useProductionResources } from '@/hooks/useProductionResources';
import { useProducts, DbProduct } from '@/hooks/useProducts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Search, Route, ArrowRight, Clock, ChevronRight, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const emptyRoute: Partial<ProductionRouteRow> = { code: '', product_id: null, product_code: '', product_name: '', version: '1.0', description: '', is_active: true };

export default function ProductionRoutesPage() {
  const { routes, loading, create, update, remove } = useProductionRoutes();
  const { products } = useProducts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionRouteRow | null>(null);
  const [form, setForm] = useState<Partial<ProductionRouteRow>>(emptyRoute);
  const [search, setSearch] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

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

  return (
    <PageContainer>
      <PageHeader title="Rotas Produtivas" description="Defina a sequência de etapas para fabricação de cada produto" />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar rota ou produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Rota</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Editar Rota' : 'Nova Rota'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Código</Label><Input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
                <div><Label>Versão</Label><Input value={form.version || '1.0'} onChange={e => setForm({ ...form, version: e.target.value })} /></div>
              </div>
              <div>
                <Label>Produto</Label>
                <Select value={form.product_id || ''} onValueChange={handleProductChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Descrição</Label><Input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Routes List */}
        <div className="lg:col-span-1">
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center py-8 text-muted-foreground"><Route className="h-8 w-8 mb-2 opacity-50" />Nenhuma rota cadastrada</CardContent></Card>
          ) : filtered.map(r => (
            <Card
              key={r.id}
              className={`mb-2 cursor-pointer transition-colors hover:border-primary ${selectedRoute === r.id ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => setSelectedRoute(r.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm font-bold">{r.code}</p>
                    <p className="text-sm text-muted-foreground">{r.product_name || 'Sem produto'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{r.total_time_minutes} min</Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(r); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); remove(r.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
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
            <Card><CardContent className="flex flex-col items-center py-16 text-muted-foreground"><ChevronRight className="h-10 w-10 mb-3 opacity-30" /><p>Selecione uma rota para ver e editar suas etapas</p></CardContent></Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function RouteStepsPanel({ routeId, onClose }: { routeId: string; onClose: () => void }) {
  const { steps, loading, addStep, updateStep, removeStep } = useProductionRouteSteps(routeId);
  const { activeSectors } = useProductionSectors();
  const { resources } = useProductionResources();
  const [showAdd, setShowAdd] = useState(false);
  const [newStep, setNewStep] = useState<Partial<ProductionRouteStep>>({ step_name: '', sequence: (steps.length + 1), sector_id: null, resource_id: null, setup_time_minutes: 0, operation_time_minutes: 0 });

  const handleAdd = async () => {
    const ok = await addStep({ ...newStep, sequence: steps.length + 1 });
    if (ok) {
      setShowAdd(false);
      setNewStep({ step_name: '', sequence: steps.length + 2, sector_id: null, resource_id: null, setup_time_minutes: 0, operation_time_minutes: 0 });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Etapas da Rota</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4 mr-1" />Etapa</Button>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAdd && (
          <div className="border rounded-lg p-3 mb-4 bg-muted/30">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div><Label className="text-xs">Nome da Etapa</Label><Input value={newStep.step_name || ''} onChange={e => setNewStep({ ...newStep, step_name: e.target.value })} /></div>
              <div>
                <Label className="text-xs">Setor</Label>
                <Select value={newStep.sector_id || ''} onValueChange={v => setNewStep({ ...newStep, sector_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{activeSectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <Label className="text-xs">Recurso</Label>
                <Select value={newStep.resource_id || ''} onValueChange={v => setNewStep({ ...newStep, resource_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{resources.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Setup (min)</Label><Input type="number" value={newStep.setup_time_minutes || 0} onChange={e => setNewStep({ ...newStep, setup_time_minutes: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Operação (min)</Label><Input type="number" value={newStep.operation_time_minutes || 0} onChange={e => setNewStep({ ...newStep, operation_time_minutes: Number(e.target.value) })} /></div>
            </div>
            <Button size="sm" onClick={handleAdd}>Adicionar</Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : steps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhuma etapa definida. Adicione a primeira etapa.</div>
        ) : (
          <div className="space-y-2">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 -mt-2" />}
                <div className="flex-1 border rounded-lg p-3 flex items-center justify-between bg-background">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{s.sequence}</div>
                    <div>
                      <p className="font-medium text-sm">{s.step_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.sector_name || '—'} • {s.resource_name || '—'} • Setup: {s.setup_time_minutes}min • Op: {s.operation_time_minutes}min
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeStep(s.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
