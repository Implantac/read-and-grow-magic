import { useState } from 'react';
import { Plus, FolderTree } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Card, CardContent } from '@/ui/base/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/ui/base/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { useCostCenters, useCreateCostCenter } from '@/hooks/system/useCostCenters';

export default function CostCenters() {
  const { data: centers = [], isLoading } = useCostCenters();
  const createMut = useCreateCostCenter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '' });

  const handleSubmit = () => {
    if (!form.code || !form.name) return;
    createMut.mutate(form, { onSuccess: () => { setOpen(false); setForm({ code: '', name: '' }); } });
  };

  if (isLoading) return <PageLoading message="Carregando centros de custo..." />;

  return (
    <PageContainer>
      <PageHeader title="Centros de Custo" description="Gerencie centros de custo para análise financeira">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Novo Centro</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Centro de Custo</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Código *</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="CC-001" /></div>
                <div className="grid gap-2"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Administrativo" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMut.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {centers.map(cc => (
                <TableRow key={cc.id}>
                  <TableCell className="font-mono">{cc.code}</TableCell>
                  <TableCell className="font-medium">{cc.name}</TableCell>
                  <TableCell><Badge variant={cc.active ? 'default' : 'secondary'}>{cc.active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                </TableRow>
              ))}
              {centers.length === 0 && (
                <TableRow><TableCell colSpan={3} className="p-0">
                  <EmptyState
                    icon={FolderTree}
                    title="Nenhum centro de custo cadastrado"
                    description="Cadastre centros de custo para segmentar despesas por área, filial ou projeto e habilitar rateios contábeis."
                    action={{ label: 'Novo Centro de Custo', onClick: () => setOpen(true), icon: Plus }}
                  />
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
