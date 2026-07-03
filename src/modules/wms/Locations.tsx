import { useMemo, useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/ui/base/dialog';
import { Switch } from '@/ui/base/switch';
import { Warehouse, Layers, MapPin, Plus, Trash2 } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { useLocations, type Zone, type Location } from '@/hooks/wms/useLocations';

const statusColor: Record<string, string> = {
  empty: 'border-l-emerald-500',
  occupied: 'border-l-amber-500',
  reserved: 'border-l-blue-500',
  blocked: 'border-l-destructive',
  maintenance: 'border-l-muted-foreground',
};

export default function LocationsPage() {
  const { warehouses, zones, locations, loading, createWarehouse, createZone, createLocation, deleteLocation, deleteZone } = useLocations();
  const [selectedWh, setSelectedWh] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const wId = selectedWh ?? warehouses[0]?.id ?? null;
  const filteredZones = useMemo(() => zones.filter(z => z.warehouse_id === wId), [zones, wId]);
  const zId = selectedZone && filteredZones.some(z => z.id === selectedZone) ? selectedZone : filteredZones[0]?.id ?? null;
  const filteredLocations = useMemo(() => locations.filter(l => l.zone_id === zId), [locations, zId]);

  const totalLocs = locations.length;
  const occupied = locations.filter(l => l.status === 'occupied').length;
  const blocked = locations.filter(l => l.status === 'blocked').length;
  const occupancy = totalLocs > 0 ? Math.round((occupied / totalLocs) * 100) : 0;

  return (
    <PageContainer loading={loading}>
      <PageHeader title="Endereços de Armazenagem" description="Gestão hierárquica de armazéns, zonas e endereços (bins) com RLS por empresa" />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Armazéns" value={warehouses.length} icon={Warehouse} index={0} />
        <KPICard title="Zonas" value={zones.length} icon={Layers} index={1} />
        <KPICard title="Endereços" value={totalLocs} icon={MapPin} index={2} />
        <KPICard title="Ocupação" value={`${occupancy}%`} icon={MapPin} index={3} color={occupancy > 85 ? 'warning' : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Warehouses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Warehouse className="h-4 w-4" /> Armazéns</CardTitle>
            <WarehouseDialog onCreate={createWarehouse} />
          </CardHeader>
          <CardContent className="space-y-2">
            {warehouses.length === 0 && <EmptyState compact icon={Warehouse} title="Sem armazéns" description="Cadastre o primeiro armazém para iniciar o mapeamento de endereços." />}
            {warehouses.map(w => (
              <button
                key={w.id}
                onClick={() => { setSelectedWh(w.id); setSelectedZone(null); }}
                className={`w-full text-left rounded-md border p-3 transition hover:bg-muted/50 ${wId === w.id ? 'border-primary bg-muted/40' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{w.code} — {w.name}</p>
                    {w.manager && <p className="text-xs text-muted-foreground">Resp.: {w.manager}</p>}
                  </div>
                  <Badge variant={w.status === 'active' ? 'default' : 'secondary'}>{w.status}</Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Zones */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Layers className="h-4 w-4" /> Zonas</CardTitle>
            <ZoneDialog warehouseId={wId} onCreate={createZone} />
          </CardHeader>
          <CardContent className="space-y-2">
            {!wId && <p className="text-sm text-muted-foreground">Selecione um armazém.</p>}
            {wId && filteredZones.length === 0 && <EmptyState compact icon={Layers} title="Sem zonas" description="Divida o armazém em zonas (picking, bulk, refrigerada) para organizar operações." />}
            {filteredZones.map(z => (
              <div key={z.id} className={`rounded-md border p-3 transition hover:bg-muted/50 cursor-pointer ${zId === z.id ? 'border-primary bg-muted/40' : ''}`} onClick={() => setSelectedZone(z.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedZone(z.id); }}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium">{z.code} — {z.name}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{z.zone_type}</Badge>
                      {z.is_picking_zone && <Badge variant="secondary" className="text-xs">Picking</Badge>}
                      {z.is_bulk_zone && <Badge variant="secondary" className="text-xs">Bulk</Badge>}
                      {z.temperature_range && <Badge variant="outline" className="text-xs">{z.temperature_range}</Badge>}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteZone(z.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

            ))}
          </CardContent>
        </Card>

        {/* Locations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" /> Endereços (Bins)</CardTitle>
            <LocationDialog zoneId={zId} onCreate={createLocation} />
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {!zId && <p className="text-sm text-muted-foreground">Selecione uma zona.</p>}
            {zId && filteredLocations.length === 0 && <EmptyState compact icon={MapPin} title="Sem endereços" description="Crie bins/posições para armazenar produtos com precisão." />}
            {filteredLocations.map(l => (
              <div key={l.id} className={`rounded-md border-l-4 border bg-card p-3 ${statusColor[l.status] || 'border-l-muted'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{l.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {[l.street, l.column_code, l.level_code, l.position_code].filter(Boolean).join('-') || l.location_type}
                    </p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{l.status}</Badge>
                      {l.abc_classification && <Badge variant="secondary" className="text-xs">ABC: {l.abc_classification}</Badge>}
                      {!l.active && <Badge variant="destructive" className="text-xs">Inativo</Badge>}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteLocation(l.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {blocked > 0 && (
        <p className="text-xs text-muted-foreground">⚠ {blocked} endereço(s) bloqueado(s) requer(em) atenção.</p>
      )}
    </PageContainer>
  );
}

function WarehouseDialog({ onCreate }: { onCreate: (p: any) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', manager: '', address: '', type: 'central' });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Armazém</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Armazém</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Código *</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
          <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Tipo</Label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="central">Central</SelectItem>
                <SelectItem value="regional">Regional</SelectItem>
                <SelectItem value="filial">Filial</SelectItem>
                <SelectItem value="terceirizado">Terceirizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Responsável</Label><Input value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} /></div>
          <div><Label>Endereço</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => { if (!form.code || !form.name) return; onCreate(form); setOpen(false); setForm({ code: '', name: '', manager: '', address: '', type: 'central' }); }}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ZoneDialog({ warehouseId, onCreate }: { warehouseId: string | null; onCreate: (p: Partial<Zone>) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ code: '', name: '', zone_type: 'picking', is_picking_zone: true, is_bulk_zone: false, temperature_range: '', priority: 1 });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline" disabled={!warehouseId}><Plus className="h-3 w-3 mr-1" /> Zona</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Zona</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Código *</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
          <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Tipo</Label>
            <Select value={form.zone_type} onValueChange={v => setForm({ ...form, zone_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="picking">Picking</SelectItem>
                <SelectItem value="bulk">Bulk</SelectItem>
                <SelectItem value="reserve">Reserva</SelectItem>
                <SelectItem value="quarantine">Quarentena</SelectItem>
                <SelectItem value="returns">Devoluções</SelectItem>
                <SelectItem value="cold">Refrigerada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3"><Switch checked={form.is_picking_zone} onCheckedChange={v => setForm({ ...form, is_picking_zone: v })} /><Label>Zona de Picking</Label></div>
          <div className="flex items-center gap-3"><Switch checked={form.is_bulk_zone} onCheckedChange={v => setForm({ ...form, is_bulk_zone: v })} /><Label>Zona Bulk</Label></div>
          <div><Label>Temperatura (opcional)</Label><Input placeholder="ex: 2-8°C" value={form.temperature_range} onChange={e => setForm({ ...form, temperature_range: e.target.value })} /></div>
          <div><Label>Prioridade</Label><Input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => { if (!form.code || !form.name || !warehouseId) return; onCreate({ ...form, warehouse_id: warehouseId }); setOpen(false); }}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LocationDialog({ zoneId, onCreate }: { zoneId: string | null; onCreate: (p: Partial<Location>) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ code: '', street: '', column_code: '', level_code: '', position_code: '', location_type: 'shelf', max_weight: '', max_volume: '', abc_classification: '' });

  const autoCode = () => {
    const parts = [form.street, form.column_code, form.level_code, form.position_code].filter(Boolean);
    if (parts.length >= 2) setForm({ ...form, code: parts.join('-') });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline" disabled={!zoneId}><Plus className="h-3 w-3 mr-1" /> Endereço</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Endereço (Bin)</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div><Label>Rua</Label><Input value={form.street} onBlur={autoCode} onChange={e => setForm({ ...form, street: e.target.value })} /></div>
            <div><Label>Coluna</Label><Input value={form.column_code} onBlur={autoCode} onChange={e => setForm({ ...form, column_code: e.target.value })} /></div>
            <div><Label>Nível</Label><Input value={form.level_code} onBlur={autoCode} onChange={e => setForm({ ...form, level_code: e.target.value })} /></div>
            <div><Label>Posição</Label><Input value={form.position_code} onBlur={autoCode} onChange={e => setForm({ ...form, position_code: e.target.value })} /></div>
          </div>
          <div><Label>Código *</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="auto-gerado de Rua-Coluna-Nível-Posição" /></div>
          <div><Label>Tipo</Label>
            <Select value={form.location_type} onValueChange={v => setForm({ ...form, location_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="shelf">Prateleira</SelectItem>
                <SelectItem value="pallet">Pallet</SelectItem>
                <SelectItem value="bin">Bin</SelectItem>
                <SelectItem value="floor">Chão</SelectItem>
                <SelectItem value="rack">Rack</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Peso máx (kg)</Label><Input type="number" value={form.max_weight} onChange={e => setForm({ ...form, max_weight: e.target.value })} /></div>
            <div><Label>Volume máx (m³)</Label><Input type="number" value={form.max_volume} onChange={e => setForm({ ...form, max_volume: e.target.value })} /></div>
          </div>
          <div><Label>Classificação ABC</Label>
            <Select value={form.abc_classification || 'none'} onValueChange={v => setForm({ ...form, abc_classification: v === 'none' ? '' : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem classificação</SelectItem>
                <SelectItem value="A">A (alto giro)</SelectItem>
                <SelectItem value="B">B (médio giro)</SelectItem>
                <SelectItem value="C">C (baixo giro)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => {
            if (!form.code || !zoneId) return;
            onCreate({
              ...form,
              zone_id: zoneId,
              max_weight: form.max_weight ? Number(form.max_weight) : null,
              max_volume: form.max_volume ? Number(form.max_volume) : null,
            });
            setOpen(false);
          }}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
