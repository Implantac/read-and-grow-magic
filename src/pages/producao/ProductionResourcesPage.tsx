import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { useProductionResources, ProductionResource } from '@/hooks/useProductionResources';
import { useProductionSectors } from '@/hooks/useProductionSectors';
import { useProductionLines } from '@/hooks/useProductionLines';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Search, Wrench } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const typeLabels: Record<string,string> = { machine: 'Máquina', operator: 'Operador', workstation: 'Posto de Trabalho' };
const statusLabels: Record<string,string> = { available: 'Disponível', running: 'Em Uso', maintenance: 'Manutenção', inactive: 'Inativo' };
const statusColors: Record<string,'default'|'secondary'|'destructive'|'outline'> = { available: 'default', running: 'secondary', maintenance: 'destructive', inactive: 'outline' };

const emptyResource: Partial<ProductionResource> = { code: '', name: '', resource_type: 'machine', sector_id: null, line_id: null, capacity_per_hour: 0, cost_per_hour: 0, status: 'available', is_active: true };

export default function ProductionResourcesPage() {
  const { resources, loading, create, update, remove } = useProductionResources();
  const { activeSectors } = useProductionSectors();
  const { lines } = useProductionLines();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionResource | null>(null);
  const [form, setForm] = useState<Partial<ProductionResource>>(emptyResource);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = resources.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.resource_type === typeFilter;
    return matchSearch && matchType;
  });

  const openNew = () => { setEditing(null); setForm(emptyResource); setOpen(true); };
  const openEdit = (r: ProductionResource) => { setEditing(r); setForm(r); setOpen(true); };

  const handleSave = async () => {
    const ok = editing ? await update(editing.id, form) : await create(form);
    if (ok) setOpen(false);
  };

  return (
    <PageContainer>
      <PageHeader title="Recursos Produtivos" description="Máquinas, operadores e postos de trabalho" />

      <Tabs value={typeFilter} onValueChange={setTypeFilter} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="machine">Máquinas</TabsTrigger>
          <TabsTrigger value="operator">Operadores</TabsTrigger>
          <TabsTrigger value="workstation">Postos</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar recurso..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Recurso</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Editar Recurso' : 'Novo Recurso'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Código</Label><Input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
                <div><Label>Nome</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.resource_type || 'machine'} onValueChange={v => setForm({ ...form, resource_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="machine">Máquina</SelectItem>
                      <SelectItem value="operator">Operador</SelectItem>
                      <SelectItem value="workstation">Posto de Trabalho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Setor</Label>
                  <Select value={form.sector_id || ''} onValueChange={v => setForm({ ...form, sector_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{activeSectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Linha</Label>
                  <Select value={form.line_id || ''} onValueChange={v => setForm({ ...form, line_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{lines.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Capacidade/Hora</Label><Input type="number" value={form.capacity_per_hour || 0} onChange={e => setForm({ ...form, capacity_per_hour: Number(e.target.value) })} /></div>
                <div><Label>Custo/Hora (R$)</Label><Input type="number" step="0.01" value={form.cost_per_hour || 0} onChange={e => setForm({ ...form, cost_per_hour: Number(e.target.value) })} /></div>
              </div>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Linha</TableHead>
                <TableHead>Cap./h</TableHead>
                <TableHead>R$/h</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground"><Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />Nenhum recurso cadastrado</TableCell></TableRow>
              ) : filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-medium">{r.code}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell><Badge variant="outline">{typeLabels[r.resource_type] || r.resource_type}</Badge></TableCell>
                  <TableCell>{r.sector_name || '—'}</TableCell>
                  <TableCell>{r.line_name || '—'}</TableCell>
                  <TableCell>{r.capacity_per_hour}</TableCell>
                  <TableCell>R$ {r.cost_per_hour.toFixed(2)}</TableCell>
                  <TableCell><Badge variant={statusColors[r.status] || 'outline'}>{statusLabels[r.status] || r.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageContainer>
  );
}
