import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProductionSteps } from '@/hooks/useProductionSteps';
import { Plus, Pencil, Trash2, GripVertical, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductionStepsPage() {
  const { steps, loading, createStep, updateStep, deleteStep } = useProductionSteps();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', sequence: 0, estimated_time_minutes: 0, sector: '', is_active: true });

  const openNew = () => {
    setEditingStep(null);
    setForm({ name: '', code: '', description: '', sequence: (steps.length + 1) * 10, estimated_time_minutes: 30, sector: '', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (step: any) => {
    setEditingStep(step);
    setForm({ name: step.name, code: step.code, description: step.description || '', sequence: step.sequence, estimated_time_minutes: step.estimated_time_minutes, sector: step.sector || '', is_active: step.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) return;
    if (editingStep) {
      await updateStep(editingStep.id, form);
    } else {
      await createStep(form);
    }
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-64" />
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Etapas de Produção" description="Configure o fluxo produtivo por etapas (corte, costura, estamparia, etc.)">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nova Etapa</Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Fluxo Produtivo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Tempo Est. (min)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {steps.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma etapa cadastrada</TableCell></TableRow>
              ) : steps.map((s) => (
                <TableRow key={s.id} className={!s.is_active ? 'opacity-50' : ''}>
                  <TableCell><GripVertical className="h-4 w-4 text-muted-foreground" /></TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.code}</TableCell>
                  <TableCell>{s.sector || '-'}</TableCell>
                  <TableCell>{s.estimated_time_minutes} min</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? 'Ativa' : 'Inativa'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteStep(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingStep ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Corte" /></div>
              <div><Label>Código</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Ex: corte" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Setor</Label><Input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} placeholder="Ex: Corte" /></div>
              <div><Label>Tempo Estimado (min)</Label><Input type="number" value={form.estimated_time_minutes} onChange={e => setForm({ ...form, estimated_time_minutes: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label>Etapa ativa</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingStep ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
