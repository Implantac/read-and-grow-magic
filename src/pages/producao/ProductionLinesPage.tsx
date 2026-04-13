import { useState } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { useProductionLines, ProductionLine } from '@/hooks/useProductionLines';
import { useProductionSectors } from '@/hooks/useProductionSectors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const shiftLabels: Record<string,string> = { morning: 'Manhã', afternoon: 'Tarde', night: 'Noite', integral: 'Integral' };

const emptyLine: Partial<ProductionLine> = { code: '', name: '', sector_id: null, capacity_per_hour: 0, shift: 'integral', responsible: '', is_active: true };

export default function ProductionLinesPage() {
  const { lines, loading, create, update, remove } = useProductionLines();
  const { activeSectors } = useProductionSectors();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionLine | null>(null);
  const [form, setForm] = useState<Partial<ProductionLine>>(emptyLine);
  const [search, setSearch] = useState('');

  const filtered = lines.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.code.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setEditing(null); setForm(emptyLine); setOpen(true); };
  const openEdit = (l: ProductionLine) => { setEditing(l); setForm(l); setOpen(true); };

  const handleSave = async () => {
    const ok = editing ? await update(editing.id, form) : await create(form);
    if (ok) setOpen(false);
  };

  return (
    <PageContainer>
      <PageHeader title="Linhas Produtivas" description="Cadastro das linhas de produção vinculadas aos setores" />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar linha..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Linha</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Editar Linha' : 'Nova Linha'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Código</Label><Input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
                <div><Label>Nome</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Setor</Label>
                  <Select value={form.sector_id || ''} onValueChange={v => setForm({ ...form, sector_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{activeSectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
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
                <div><Label>Capacidade/Hora</Label><Input type="number" value={form.capacity_per_hour || 0} onChange={e => setForm({ ...form, capacity_per_hour: Number(e.target.value) })} /></div>
                <div><Label>Responsável</Label><Input value={form.responsible || ''} onChange={e => setForm({ ...form, responsible: e.target.value })} /></div>
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
                <TableHead>Setor</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Cap./Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground"><Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />Nenhuma linha cadastrada</TableCell></TableRow>
              ) : filtered.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono font-medium">{l.code}</TableCell>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.sector_name || '—'}</TableCell>
                  <TableCell>{shiftLabels[l.shift] || l.shift}</TableCell>
                  <TableCell>{l.capacity_per_hour}</TableCell>
                  <TableCell><Badge variant={l.is_active ? 'default' : 'destructive'}>{l.is_active ? 'Ativa' : 'Inativa'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
