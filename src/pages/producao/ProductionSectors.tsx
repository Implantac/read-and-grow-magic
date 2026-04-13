import { useState } from 'react';
import PageContainer from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { useProductionSectors, ProductionSector } from '@/hooks/useProductionSectors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, Factory } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const emptySector: Partial<ProductionSector> = { code: '', name: '', responsible: '', sector_type: 'production', description: '', is_active: true };

export default function ProductionSectorsPage() {
  const { sectors, loading, create, update, remove } = useProductionSectors();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionSector | null>(null);
  const [form, setForm] = useState<Partial<ProductionSector>>(emptySector);
  const [search, setSearch] = useState('');

  const filtered = sectors.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditing(null); setForm(emptySector); setOpen(true); };
  const openEdit = (s: ProductionSector) => { setEditing(s); setForm(s); setOpen(true); };

  const handleSave = async () => {
    const ok = editing
      ? await update(editing.id, form)
      : await create(form);
    if (ok) setOpen(false);
  };

  return (
    <PageContainer>
      <PageHeader title="Setores de Produção" description="Cadastro e gestão dos setores da fábrica" />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar setor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Setor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Editar Setor' : 'Novo Setor'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Código</Label><Input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
                <div><Label>Nome</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Responsável</Label><Input value={form.responsible || ''} onChange={e => setForm({ ...form, responsible: e.target.value })} /></div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.sector_type || 'production'} onValueChange={v => setForm({ ...form, sector_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Produção</SelectItem>
                      <SelectItem value="support">Apoio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Descrição</Label><Input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
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
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground"><Factory className="h-8 w-8 mx-auto mb-2 opacity-50" />Nenhum setor cadastrado</TableCell></TableRow>
              ) : filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono font-medium">{s.code}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant={s.sector_type === 'production' ? 'default' : 'secondary'}>{s.sector_type === 'production' ? 'Produção' : 'Apoio'}</Badge></TableCell>
                  <TableCell>{s.responsible || '—'}</TableCell>
                  <TableCell><Badge variant={s.is_active ? 'default' : 'destructive'}>{s.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
