import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { useProductionLines, ProductionLine } from '@/hooks/useProductionLines';
import { useProductionSectors } from '@/hooks/useProductionSectors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Search, Layers, Gauge, Users, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const shiftLabels: Record<string, string> = { morning: 'Manhã', afternoon: 'Tarde', night: 'Noite', integral: 'Integral' };
const shiftColors: Record<string, string> = { morning: 'bg-amber-500/10 text-amber-600', afternoon: 'bg-blue-500/10 text-blue-600', night: 'bg-indigo-500/10 text-indigo-600', integral: 'bg-emerald-500/10 text-emerald-600' };

const emptyLine: Partial<ProductionLine> = { code: '', name: '', sector_id: null, capacity_per_hour: 0, shift: 'integral', responsible: '', description: '', is_active: true };

export default function ProductionLinesPage() {
  const { lines, loading, create, update, remove } = useProductionLines();
  const { activeSectors } = useProductionSectors();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionLine | null>(null);
  const [form, setForm] = useState<Partial<ProductionLine>>(emptyLine);
  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = lines.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.code.toLowerCase().includes(search.toLowerCase());
    const matchShift = shiftFilter === 'all' || l.shift === shiftFilter;
    return matchSearch && matchShift;
  });

  const totalCapacity = lines.reduce((sum, l) => sum + l.capacity_per_hour, 0);
  const activeLines = lines.filter(l => l.is_active).length;

  const openNew = () => { setEditing(null); setForm(emptyLine); setOpen(true); };
  const openEdit = (l: ProductionLine) => { setEditing(l); setForm(l); setOpen(true); };

  const handleSave = async () => {
    const ok = editing ? await update(editing.id, form) : await create(form);
    if (ok) setOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) { await remove(deleteId); setDeleteId(null); }
  };

  return (
    <PageContainer>
      <PageHeader title="Linhas Produtivas" description="Cadastro das linhas de produção vinculadas aos setores" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Linhas', value: lines.length, icon: Layers, color: 'text-primary' },
          { label: 'Ativas', value: activeLines, icon: Layers, color: 'text-success' },
          { label: 'Cap. Total/h', value: totalCapacity.toLocaleString('pt-BR'), icon: Gauge, color: 'text-info' },
          { label: 'Setores Vinc.', value: new Set(lines.map(l => l.sector_id).filter(Boolean)).size, icon: Users, color: 'text-warning' },
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
          <Input placeholder="Buscar linha por nome ou código..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={shiftFilter} onValueChange={setShiftFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Turno" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os turnos</SelectItem>
            <SelectItem value="morning">Manhã</SelectItem>
            <SelectItem value="afternoon">Tarde</SelectItem>
            <SelectItem value="night">Noite</SelectItem>
            <SelectItem value="integral">Integral</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Linha</Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Código</TableHead>
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">Setor</TableHead>
                <TableHead className="font-semibold">Turno</TableHead>
                <TableHead className="font-semibold">Cap./Hora</TableHead>
                <TableHead className="font-semibold">Responsável</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-[100px] font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Nenhuma linha encontrada</p>
                    <p className="text-sm mt-1">Cadastre a primeira linha produtiva</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map(l => (
                <TableRow key={l.id} className="group">
                  <TableCell className="font-mono font-semibold text-primary">{l.code}</TableCell>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.sector_name || <span className="text-muted-foreground italic">—</span>}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${shiftColors[l.shift] || ''}`}>
                      {shiftLabels[l.shift] || l.shift}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-semibold">{l.capacity_per_hour}</span>
                    <span className="text-muted-foreground text-xs ml-1">un/h</span>
                  </TableCell>
                  <TableCell>{l.responsible || <span className="text-muted-foreground italic">—</span>}</TableCell>
                  <TableCell><Badge variant={l.is_active ? 'default' : 'destructive'}>{l.is_active ? 'Ativa' : 'Inativa'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Linha' : 'Nova Linha'}</DialogTitle>
            <DialogDescription>Cadastre ou edite uma linha produtiva</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Código *</Label><Input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="LIN-001" /></div>
              <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Linha de Montagem 1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Setor</Label>
                <Select value={form.sector_id || ''} onValueChange={v => setForm({ ...form, sector_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{activeSectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Turno</Label>
                <Select value={form.shift || 'integral'} onValueChange={v => setForm({ ...form, shift: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Manhã</SelectItem>
                    <SelectItem value="afternoon">Tarde</SelectItem>
                    <SelectItem value="night">Noite</SelectItem>
                    <SelectItem value="integral">Integral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Capacidade/Hora</Label><Input type="number" value={form.capacity_per_hour || 0} onChange={e => setForm({ ...form, capacity_per_hour: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Responsável</Label><Input value={form.responsible || ''} onChange={e => setForm({ ...form, responsible: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={(form as any).description || ''} onChange={e => setForm({ ...form, description: e.target.value } as any)} rows={2} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active ?? true} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label>Linha ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.code || !form.name}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Confirmar Exclusão</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita. Deseja realmente excluir esta linha?</DialogDescription>
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
