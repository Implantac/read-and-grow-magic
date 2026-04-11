import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductionCapacity } from '@/hooks/useProductionCapacity';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Gauge, Factory, Users, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ProductionCapacityPage() {
  const { capacities, loading, create, update, remove } = useProductionCapacity();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ sector: '', machine: '', operator_name: '', shift: 'diurno', capacity_per_hour: 0, max_hours_per_day: 8, current_load_pct: 0, is_active: true, notes: '' });

  const openNew = () => { setEditing(null); setForm({ sector: '', machine: '', operator_name: '', shift: 'diurno', capacity_per_hour: 0, max_hours_per_day: 8, current_load_pct: 0, is_active: true, notes: '' }); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ sector: c.sector, machine: c.machine || '', operator_name: c.operator_name || '', shift: c.shift, capacity_per_hour: c.capacity_per_hour, max_hours_per_day: c.max_hours_per_day, current_load_pct: c.current_load_pct, is_active: c.is_active, notes: c.notes || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.sector) return;
    if (editing) await update(editing.id, form);
    else await create(form);
    setDialogOpen(false);
  };

  // Aggregate by sector
  const sectorData = capacities.reduce((acc: Record<string, { total: number; used: number; count: number }>, c) => {
    if (!acc[c.sector]) acc[c.sector] = { total: 0, used: 0, count: 0 };
    const dailyCap = c.capacity_per_hour * c.max_hours_per_day;
    acc[c.sector].total += dailyCap;
    acc[c.sector].used += dailyCap * (c.current_load_pct / 100);
    acc[c.sector].count++;
    return acc;
  }, {});
  const chartData = Object.entries(sectorData).map(([sector, v]) => ({
    sector,
    capacidade: v.total,
    utilizado: Math.round(v.used),
    pct: v.total > 0 ? Math.round((v.used / v.total) * 100) : 0,
  }));

  const totalCapDaily = capacities.reduce((s, c) => s + c.capacity_per_hour * c.max_hours_per_day, 0);
  const avgLoad = capacities.length > 0 ? capacities.reduce((s, c) => s + c.current_load_pct, 0) / capacities.length : 0;

  if (loading) return <PageContainer><Skeleton className="h-10 w-64" /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="Capacidade Produtiva" description="Setor, máquinas, operadores e turnos">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Cadastrar</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3"><Factory className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{Object.keys(sectorData).length}</p><p className="text-xs text-muted-foreground">Setores</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Users className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold">{capacities.length}</p><p className="text-xs text-muted-foreground">Recursos</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Gauge className="h-8 w-8 text-yellow-500" /><div><p className="text-2xl font-bold">{totalCapDaily}</p><p className="text-xs text-muted-foreground">Cap. Diária (un)</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{avgLoad.toFixed(0)}%</p><p className="text-xs text-muted-foreground">Carga Média</p></div></CardContent></Card>
      </div>

      {chartData.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Capacidade por Setor</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="sector" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="capacidade" fill="hsl(var(--primary))" name="Capacidade" />
                <Bar dataKey="utilizado" fill="hsl(var(--destructive))" name="Utilizado" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Setor</TableHead>
              <TableHead>Máquina</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Cap./Hora</TableHead>
              <TableHead>Horas/Dia</TableHead>
              <TableHead>Carga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {capacities.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma capacidade cadastrada</TableCell></TableRow>
              ) : capacities.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.sector}</TableCell>
                  <TableCell>{c.machine || '-'}</TableCell>
                  <TableCell>{c.operator_name || '-'}</TableCell>
                  <TableCell>{c.shift}</TableCell>
                  <TableCell>{c.capacity_per_hour}</TableCell>
                  <TableCell>{c.max_hours_per_day}h</TableCell>
                  <TableCell><div className="flex items-center gap-2"><Progress value={c.current_load_pct} className="h-2 w-16" /><span className="text-xs">{c.current_load_pct}%</span></div></TableCell>
                  <TableCell><Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} Capacidade</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Setor *</Label><Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} /></div>
            <div><Label>Máquina</Label><Input value={form.machine} onChange={e => setForm(f => ({ ...f, machine: e.target.value }))} /></div>
            <div><Label>Operador</Label><Input value={form.operator_name} onChange={e => setForm(f => ({ ...f, operator_name: e.target.value }))} /></div>
            <div><Label>Turno</Label>
              <Select value={form.shift} onValueChange={v => setForm(f => ({ ...f, shift: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diurno">Diurno</SelectItem>
                  <SelectItem value="noturno">Noturno</SelectItem>
                  <SelectItem value="integral">Integral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Cap./Hora</Label><Input type="number" value={form.capacity_per_hour} onChange={e => setForm(f => ({ ...f, capacity_per_hour: +e.target.value }))} /></div>
            <div><Label>Horas/Dia</Label><Input type="number" value={form.max_hours_per_day} onChange={e => setForm(f => ({ ...f, max_hours_per_day: +e.target.value }))} /></div>
            <div><Label>Carga Atual (%)</Label><Input type="number" value={form.current_load_pct} onChange={e => setForm(f => ({ ...f, current_load_pct: +e.target.value }))} /></div>
            <div className="flex items-center gap-2 pt-6"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Ativo</Label></div>
          </div>
          <DialogFooter><Button onClick={handleSave}>{editing ? 'Salvar' : 'Criar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
