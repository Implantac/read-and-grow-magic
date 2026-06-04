import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { useVehicles, useCarriers } from '@/hooks/wms/useTMS';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { formatNumber } from '@/lib/formatters';
const statusColors: Record<string, string> = { available: 'default', in_transit: 'secondary', maintenance: 'destructive' };
const statusLabels: Record<string, string> = { available: 'Disponível', in_transit: 'Em Trânsito', maintenance: 'Manutenção' };

const Vehicles = () => {
  const { vehicles, loading, create, update } = useVehicles();
  const { carriers } = useCarriers();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ carrier_id: '', plate: '', model: '', vehicle_type: 'truck', max_weight: '0', max_volume: '0', driver_name: '', driver_phone: '' });

  const filtered = vehicles.filter(v =>
    v.plate.toLowerCase().includes(search.toLowerCase()) || v.driverName.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing(null);
    setForm({ carrier_id: '', plate: '', model: '', vehicle_type: 'truck', max_weight: '0', max_volume: '0', driver_name: '', driver_phone: '' });
    setDialogOpen(true);
  };

  const openEdit = (v: any) => {
    setEditing(v);
    setForm({ carrier_id: v.carrierId, plate: v.plate, model: v.model, vehicle_type: v.vehicleType, max_weight: String(v.maxWeight), max_volume: String(v.maxVolume), driver_name: v.driverName, driver_phone: v.driverPhone });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.plate) { toast.error('Placa é obrigatória'); return; }
    const payload = { ...form, max_weight: Number(form.max_weight), max_volume: Number(form.max_volume), carrier_id: form.carrier_id || null };
    const ok = editing ? await update(editing.id, payload) : await create(payload);
    if (ok) setDialogOpen(false);
  };

  if (loading) return <PageLoading />;

  return (
    <PageContainer>
      <PageHeader title="Veículos e Frota" description="Gestão de veículos e motoristas">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Veículo</Button>
      </PageHeader>

      <div className="flex items-center gap-2 mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por placa ou motorista..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Capacidade (kg)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum veículo cadastrado</TableCell></TableRow>
            ) : filtered.map(v => (
              <TableRow key={v.id}>
                <TableCell className="font-mono font-bold">{v.plate}</TableCell>
                <TableCell>{v.model}</TableCell>
                <TableCell className="capitalize">{v.vehicleType}</TableCell>
                <TableCell>{v.driverName || '-'}</TableCell>
                <TableCell>{formatNumber(v.maxWeight)}</TableCell>
                <TableCell><Badge variant={statusColors[v.status] as any}>{statusLabels[v.status] || v.status}</Badge></TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Veículo</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Transportadora</Label>
              <Select value={form.carrier_id} onValueChange={v => setForm(f => ({ ...f, carrier_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{carriers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Placa</Label><Input value={form.plate} onChange={e => setForm(f => ({ ...f, plate: e.target.value }))} /></div>
              <div><Label>Modelo</Label><Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Peso Máx (kg)</Label><Input type="number" value={form.max_weight} onChange={e => setForm(f => ({ ...f, max_weight: e.target.value }))} /></div>
              <div><Label>Volume Máx (m³)</Label><Input type="number" value={form.max_volume} onChange={e => setForm(f => ({ ...f, max_volume: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Motorista</Label><Input value={form.driver_name} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} /></div>
              <div><Label>Tel. Motorista</Label><Input value={form.driver_phone} onChange={e => setForm(f => ({ ...f, driver_phone: e.target.value }))} /></div>
            </div>
            <Button onClick={handleSave}>{editing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Vehicles;
