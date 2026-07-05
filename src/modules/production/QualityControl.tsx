import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { useQualityInspections } from '@/hooks/production/useQualityInspections';
import { useProductionOrders } from '@/hooks/production/useProductionOrders';
import { useProductionSteps } from '@/hooks/production/useProductionSteps';
import { KPICard } from '@/shared/components/KPICard';
import { Plus, ShieldCheck, AlertTriangle, CheckCircle, XCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/ui/base/skeleton';
import { toSafeNumber } from '@/lib/numericValidation';

const defectCategories = ['Costura irregular', 'Mancha no tecido', 'Estampa desalinhada', 'Bordado com falha', 'Medida incorreta', 'Acabamento ruim', 'Furo no tecido', 'Cor diferente', 'Outro'];
const severityConfig: Record<string, { label: string; color: string }> = {
  minor: { label: 'Menor', color: 'bg-yellow-100 text-yellow-800' },
  major: { label: 'Maior', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Crítico', color: 'bg-red-100 text-red-800' },
};

export default function QualityControlPage() {
  const { inspections, loading, create } = useQualityInspections();
  const { orders } = useProductionOrders();
  const { steps } = useProductionSteps();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    production_order_id: '', step_id: '', inspector: '', approved_quantity: 0,
    rejected_quantity: 0, defect_reason: '', defect_category: '', severity: 'minor',
    corrective_action: '', notes: '',
  });

  const activeOrders = orders.filter(o => ['in_progress', 'planned'].includes(o.status));

  const totalApproved = inspections.reduce((s, i) => s + i.approved_quantity, 0);
  const totalRejected = inspections.reduce((s, i) => s + i.rejected_quantity, 0);
  const defectRate = (totalApproved + totalRejected) > 0 ? ((totalRejected / (totalApproved + totalRejected)) * 100).toFixed(1) : '0';

  const filtered = inspections.filter(i =>
    !search || i.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    i.inspector?.toLowerCase().includes(search.toLowerCase()) ||
    i.defect_category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.production_order_id || !form.inspector) return;
    await create({
      ...form,
      step_id: form.step_id || null,
      defect_reason: form.defect_reason || null,
      defect_category: form.defect_category || null,
      corrective_action: form.corrective_action || null,
      notes: form.notes || null,
    } as any);
    setDialogOpen(false);
    setForm({ production_order_id: '', step_id: '', inspector: '', approved_quantity: 0, rejected_quantity: 0, defect_reason: '', defect_category: '', severity: 'minor', corrective_action: '', notes: '' });
  };

  if (loading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Controle de Qualidade" description="Registro de inspeções, aprovações e defeitos">
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nova Inspeção</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Inspeções" value={inspections.length} icon={<ShieldCheck className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Aprovadas" value={totalApproved} subtitle="peças" icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="Rejeitadas" value={totalRejected} subtitle="peças" icon={<XCircle className="h-5 w-5" />} accentColor="warning" index={2} />
        <KPICard title="Taxa de Defeito" value={`${defectRate}%`} icon={<AlertTriangle className="h-5 w-5" />} accentColor="info" index={3} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Inspeções</CardTitle>
            <div className="relative flex-1 max-w-sm ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title={search ? 'Nenhuma inspeção encontrada' : 'Nenhuma inspeção registrada'}
              description={search
                ? 'Ajuste a busca ou limpe o filtro para ver todas as inspeções.'
                : 'Registre inspeções para acompanhar aprovações, rejeições e taxa de defeito.'}
              action={search
                ? { label: 'Limpar busca', onClick: () => setSearch(''), variant: 'outline' }
                : { label: 'Nova Inspeção', onClick: () => setDialogOpen(true), icon: Plus }}
            />
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>OP</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Inspetor</TableHead>
                <TableHead>Aprovadas</TableHead>
                <TableHead>Rejeitadas</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Data</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map(i => {
                  const sev = severityConfig[i.severity] || { label: i.severity, color: '' };
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono">{i.order_number || '-'}</TableCell>
                      <TableCell>{i.step_name || '-'}</TableCell>
                      <TableCell>{i.inspector}</TableCell>
                      <TableCell className="text-green-600 font-medium">{i.approved_quantity}</TableCell>
                      <TableCell className="text-destructive font-medium">{i.rejected_quantity}</TableCell>
                      <TableCell>{i.defect_category || '-'}</TableCell>
                      <TableCell><Badge className={sev.color}>{sev.label}</Badge></TableCell>
                      <TableCell>{format(new Date(i.inspection_date), 'dd/MM/yyyy HH:mm')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Inspeção de Qualidade</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Ordem de Produção</Label>
              <Select value={form.production_order_id} onValueChange={v => setForm({ ...form, production_order_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a OP" /></SelectTrigger>
                <SelectContent>
                  {activeOrders.map(o => <SelectItem key={o.id} value={o.id}>{o.order_number} - {o.product_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Etapa</Label>
              <Select value={form.step_id} onValueChange={v => setForm({ ...form, step_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  {steps.filter(s => s.is_active).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Inspetor</Label><Input value={form.inspector} onChange={e => setForm({ ...form, inspector: e.target.value })} /></div>
              <div><Label>Severidade</Label>
                <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Menor</SelectItem>
                    <SelectItem value="major">Maior</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Peças Aprovadas</Label><Input type="number" value={form.approved_quantity} onChange={e => setForm({ ...form, approved_quantity: toSafeNumber(e.target.value) })} /></div>
              <div><Label>Peças Rejeitadas</Label><Input type="number" value={form.rejected_quantity} onChange={e => setForm({ ...form, rejected_quantity: toSafeNumber(e.target.value) })} /></div>
            </div>
            <div><Label>Categoria do Defeito</Label>
              <Select value={form.defect_category} onValueChange={v => setForm({ ...form, defect_category: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {defectCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Motivo do Defeito</Label><Textarea value={form.defect_reason} onChange={e => setForm({ ...form, defect_reason: e.target.value })} /></div>
            <div><Label>Ação Corretiva</Label><Textarea value={form.corrective_action} onChange={e => setForm({ ...form, corrective_action: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
