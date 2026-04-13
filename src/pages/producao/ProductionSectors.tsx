import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { useProductionSectors, ProductionSector } from '@/hooks/useProductionSectors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Search, Factory, Building2, Power, PowerOff, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

const emptySector: Partial<ProductionSector> = { code: '', name: '', responsible: '', sector_type: 'production', description: '', is_active: true };

export default function ProductionSectorsPage() {
  const { sectors, loading, create, update, remove } = useProductionSectors();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionSector | null>(null);
  const [form, setForm] = useState<Partial<ProductionSector>>(emptySector);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = sectors.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || s.sector_type === typeFilter;
    return matchSearch && matchType;
  });

  const totalActive = sectors.filter(s => s.is_active).length;
  const totalProduction = sectors.filter(s => s.sector_type === 'production').length;
  const totalSupport = sectors.filter(s => s.sector_type === 'support').length;

  const openNew = () => { setEditing(null); setForm(emptySector); setOpen(true); };
  const openEdit = (s: ProductionSector) => { setEditing(s); setForm(s); setOpen(true); };

  const handleSave = async () => {
    const ok = editing ? await update(editing.id, form) : await create(form);
    if (ok) setOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) { await remove(deleteId); setDeleteId(null); }
  };

  return (
    <PageContainer>
      <PageHeader title="Setores de Produção" description="Cadastro e gestão dos setores da fábrica" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: sectors.length, icon: Building2, color: 'text-primary' },
          { label: 'Ativos', value: totalActive, icon: Power, color: 'text-success' },
          { label: 'Produção', value: totalProduction, icon: Factory, color: 'text-info' },
          { label: 'Apoio', value: totalSupport, icon: Building2, color: 'text-warning' },
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

      {/* Filters & Action */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar setor por nome ou código..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="production">Produção</SelectItem>
            <SelectItem value="support">Apoio</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Setor</Button>
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
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Responsável</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-[100px] font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Factory className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Nenhum setor encontrado</p>
                    <p className="text-sm mt-1">Cadastre o primeiro setor para começar</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map(s => (
                <TableRow key={s.id} className="group">
                  <TableCell className="font-mono font-semibold text-primary">{s.code}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Badge variant={s.sector_type === 'production' ? 'default' : 'secondary'} className="gap-1">
                      {s.sector_type === 'production' ? <Factory className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                      {s.sector_type === 'production' ? 'Produção' : 'Apoio'}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.responsible || <span className="text-muted-foreground italic">Não definido</span>}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? 'default' : 'destructive'} className="gap-1">
                      {s.is_active ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                      {s.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <DialogTitle>{editing ? 'Editar Setor' : 'Novo Setor'}</DialogTitle>
            <DialogDescription>Preencha os dados do setor de produção</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Código *</Label><Input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="SET-001" /></div>
              <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Usinagem" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Responsável</Label><Input value={form.responsible || ''} onChange={e => setForm({ ...form, responsible: e.target.value })} placeholder="Nome do responsável" /></div>
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={form.sector_type || 'production'} onValueChange={v => setForm({ ...form, sector_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Produção</SelectItem>
                    <SelectItem value="support">Apoio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descrição do setor..." rows={3} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active ?? true} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label>Setor ativo</Label>
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
            <DialogDescription>Esta ação não pode ser desfeita. Deseja realmente excluir este setor?</DialogDescription>
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
