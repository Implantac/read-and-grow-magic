import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { useTMS } from '@/hooks/operational/useTMSQuery';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusLabels: Record<string, string> = { planned: 'Planejada', in_transit: 'Em Trânsito', completed: 'Concluída', cancelled: 'Cancelada' };
const statusColors: Record<string, string> = { planned: 'secondary', in_transit: 'default', completed: 'outline', cancelled: 'destructive' };

const Routes = () => {
  const { routes, routesLoading: loading, createRoute: create, updateRoute: update, carriers, vehicles } = useTMS();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ route_number: '', carrier_id: '', vehicle_id: '', driver_name: '', planned_date: '', total_stops: '0', notes: '' });

  const filtered = routes.filter(r =>
    r.routeNumber.toLowerCase().includes(search.toLowerCase()) || r.driverName.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    const num = `RT-${format(new Date(), 'yyyyMMdd')}-${String(routes.length + 1).padStart(3, '0')}`;
    setForm({ route_number: num, carrier_id: '', vehicle_id: '', driver_name: '', planned_date: format(new Date(), 'yyyy-MM-dd'), total_stops: '0', notes: '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.route_number || !form.planned_date) { toast.error('Número e data são obrigatórios'); return; }
    const payload = { ...form, total_stops: Number(form.total_stops), carrier_id: form.carrier_id || null, vehicle_id: form.vehicle_id || null };
    const ok = await create(payload);
    if (ok) setDialogOpen(false);
  };

  const startRoute = async (id: string) => {
    await update({ id, updates: { status: 'in_transit', departure_time: new Date().toISOString() } });
  };

  const completeRoute = async (id: string) => {
    await update({ id, updates: { status: 'completed', arrival_time: new Date().toISOString() } });
  };

  if (loading) return <PageLoading />;

  return (
    <PageContainer>
      <PageHeader title="Rotas de Entrega" description="Planejamento e acompanhamento de rotas">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Rota</Button>
      </PageHeader>

      <div className="flex items-center gap-2 mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rota</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Paradas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma rota cadastrada</TableCell></TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono font-bold">{r.routeNumber}</TableCell>
                <TableCell>{r.plannedDate}</TableCell>
                <TableCell>{r.driverName || '-'}</TableCell>
                <TableCell>{r.completedStops}/{r.totalStops}</TableCell>
                <TableCell><Badge variant={statusColors[r.status] as any}>{statusLabels[r.status] || r.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button asChild size="sm" variant="ghost"><a href={`/tms/rotas/${r.id}/planejamento`}>Planejar</a></Button>
                    {r.status === 'planned' && <Button size="sm" variant="outline" onClick={() => startRoute(r.id)}>Iniciar</Button>}
                    {r.status === 'in_transit' && <Button size="sm" onClick={() => completeRoute(r.id)}>Concluir</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Rota</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Número</Label><Input value={form.route_number} onChange={e => setForm(f => ({ ...f, route_number: e.target.value }))} /></div>
              <div><Label>Data</Label><Input type="date" value={form.planned_date} onChange={e => setForm(f => ({ ...f, planned_date: e.target.value }))} /></div>
            </div>
            <div><Label>Transportadora</Label>
              <Select value={form.carrier_id} onValueChange={v => setForm(f => ({ ...f, carrier_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{carriers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Veículo</Label>
              <Select value={form.vehicle_id} onValueChange={v => setForm(f => ({ ...f, vehicle_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate} - {v.driverName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Motorista</Label><Input value={form.driver_name} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} /></div>
              <div><Label>Paradas</Label><Input type="number" value={form.total_stops} onChange={e => setForm(f => ({ ...f, total_stops: e.target.value }))} /></div>
            </div>
            <Button onClick={handleSave}>Criar Rota</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Routes;
