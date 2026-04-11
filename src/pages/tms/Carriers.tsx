import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { useCarriers } from '@/hooks/useTMS';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const Carriers = () => {
  const { carriers, loading, create, update, remove } = useCarriers();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ code: '', name: '', document: '', contact_name: '', phone: '', email: '', address: '', notes: '' });

  const filtered = carriers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing(null);
    setForm({ code: '', name: '', document: '', contact_name: '', phone: '', email: '', address: '', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ code: c.code, name: c.name, document: c.document, contact_name: c.contactName, phone: c.phone, email: c.email, address: c.address, notes: c.notes });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name) { toast.error('Código e nome são obrigatórios'); return; }
    const ok = editing
      ? await update(editing.id, form)
      : await create(form);
    if (ok) setDialogOpen(false);
  };

  if (loading) return <PageLoading />;

  return (
    <PageContainer>
      <PageHeader title="Transportadoras" description="Gestão de transportadoras e parceiros logísticos">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Transportadora</Button>
      </PageHeader>

      <div className="flex items-center gap-2 mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma transportadora cadastrada</TableCell></TableRow>
            ) : filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-mono">{c.code}</TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.document}</TableCell>
                <TableCell>{c.contactName}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell><Badge variant={c.active ? 'default' : 'secondary'}>{c.active ? 'Ativa' : 'Inativa'}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} Transportadora</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Código</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CNPJ</Label><Input value={form.document} onChange={e => setForm(f => ({ ...f, document: e.target.value }))} /></div>
              <div><Label>Contato</Label><Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div><Label>Endereço</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <Button onClick={handleSave}>{editing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Carriers;
