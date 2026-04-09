import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { KPICard } from '@/components/shared/KPICard';
import { ExportButton } from '@/components/shared/ExportButton';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MoreHorizontal, Pencil, Trash2, Users, Target, DollarSign } from 'lucide-react';
import { useSalesReps, useCreateSalesRep, useUpdateSalesRep, useDeleteSalesRep, type DbSalesRep } from '@/hooks/useSalesReps';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function SalesRepsPage() {
  const { data: reps = [], isLoading } = useSalesReps();
  const createRep = useCreateSalesRep();
  const updateRep = useUpdateSalesRep();
  const deleteRep = useDeleteSalesRep();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<DbSalesRep | null>(null);
  const [formData, setFormData] = useState({
    name: '', code: '', email: '', phone: '', region: '', micro_region: '',
    commission_rate: '5', monthly_target: '0', status: 'active',
  });

  const resetForm = () => {
    setFormData({ name: '', code: '', email: '', phone: '', region: '', micro_region: '', commission_rate: '5', monthly_target: '0', status: 'active' });
    setSelected(null);
  };

  const openEdit = (rep: DbSalesRep) => {
    setSelected(rep);
    setFormData({
      name: rep.name, code: rep.code, email: rep.email || '', phone: rep.phone || '',
      region: rep.region || '', micro_region: rep.micro_region || '',
      commission_rate: rep.commission_rate.toString(), monthly_target: rep.monthly_target.toString(),
      status: rep.status,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) return toast({ title: 'Nome e código obrigatórios', variant: 'destructive' });
    const payload: any = {
      name: formData.name, code: formData.code, email: formData.email || null,
      phone: formData.phone || null, region: formData.region || null,
      micro_region: formData.micro_region || null,
      commission_rate: parseFloat(formData.commission_rate) || 5,
      monthly_target: parseFloat(formData.monthly_target) || 0,
      status: formData.status,
    };
    if (selected) {
      await updateRep.mutateAsync({ id: selected.id, ...payload });
    } else {
      await createRep.mutateAsync(payload);
    }
    setIsFormOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (selected) await deleteRep.mutateAsync(selected.id);
    setIsDeleteOpen(false);
    setSelected(null);
  };

  const totalTarget = reps.reduce((s, r) => s + r.monthly_target, 0);
  const totalSales = reps.reduce((s, r) => s + r.total_sales, 0);
  const activeReps = reps.filter(r => r.status === 'active').length;

  const columns: Column<DbSalesRep>[] = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'region', label: 'Região', render: (_v, r) => r.region || '—' },
    { key: 'commission_rate', label: 'Comissão', render: (_v, r) => `${r.commission_rate}%` },
    { key: 'monthly_target', label: 'Meta Mensal', render: (_v, r) => fmt(r.monthly_target) },
    { key: 'total_sales', label: 'Vendas Total', render: (_v, r) => fmt(r.total_sales) },
    { key: 'status', label: 'Status', render: (_v, r) => (
      <Badge variant={r.status === 'active' ? 'default' : 'secondary'}>
        {r.status === 'active' ? 'Ativo' : 'Inativo'}
      </Badge>
    )},
    {
      key: 'id', label: '', render: (_v, r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => openEdit(r)}><Pencil className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => { setSelected(r); setIsDeleteOpen(true); }}><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) return <PageLoading />;

  return (
    <PageContainer>
      <PageHeader title="Representantes Comerciais" description="Gestão de equipe de vendas, carteiras e metas">
        <ExportButton data={reps as any} columns={[
          { key: 'code', label: 'Código' }, { key: 'name', label: 'Nome' },
          { key: 'region', label: 'Região' }, { key: 'commission_rate', label: 'Comissão %' },
          { key: 'monthly_target', label: 'Meta Mensal' }, { key: 'status', label: 'Status' },
        ]} filename="representantes" />
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }} size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Representante</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4 mb-6 mt-6">
        <KPICard index={0} title="Total Representantes" value={reps.length.toString()} icon={<Users className="h-5 w-5" />} accentColor="primary" />
        <KPICard index={1} title="Ativos" value={activeReps.toString()} icon={<Users className="h-5 w-5" />} accentColor="success" />
        <KPICard index={2} title="Meta Total Mês" value={fmt(totalTarget)} icon={<Target className="h-5 w-5" />} accentColor="info" />
        <KPICard index={3} title="Vendas Total" value={fmt(totalSales)} icon={<DollarSign className="h-5 w-5" />} accentColor="accent" />
      </div>

      <DataTable columns={columns} data={reps} searchPlaceholder="Buscar representante..." />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar Representante' : 'Novo Representante'}</DialogTitle>
            <DialogDescription>Dados do representante comercial</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome *</Label><Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Código *</Label><Input value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Região</Label><Input value={formData.region} onChange={e => setFormData(p => ({ ...p, region: e.target.value }))} /></div>
              <div><Label>Micro-Região</Label><Input value={formData.micro_region} onChange={e => setFormData(p => ({ ...p, micro_region: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Comissão (%)</Label><Input type="number" value={formData.commission_rate} onChange={e => setFormData(p => ({ ...p, commission_rate: e.target.value }))} /></div>
              <div><Label>Meta Mensal (R$)</Label><Input type="number" value={formData.monthly_target} onChange={e => setFormData(p => ({ ...p, monthly_target: e.target.value }))} /></div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createRep.isPending || updateRep.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir representante?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
