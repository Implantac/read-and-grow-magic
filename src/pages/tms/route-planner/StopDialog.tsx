import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { toastError, toastSuccess } from '@/lib/toastHelpers';
import { lookupCep, geocodeAddress } from '@/lib/geocode';

export const StopDialog = ({
  routeId, nextSeq, onClose, onSubmit,
}: {
  routeId: string;
  nextSeq: number;
  onClose: () => void;
  onSubmit: (payload: any) => void;
}) => {
  const [form, setForm] = useState({
    address: '', city: '', state: '', zip_code: '',
    weight: '', volume: '', stop_type: 'delivery', planned_eta: '', notes: '',
    latitude: '', longitude: '',
    time_window_start: '', time_window_end: '', service_minutes: '10',
  });
  const [geocoding, setGeocoding] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const onCepBlur = async () => {
    if (!form.zip_code || form.zip_code.replace(/\D/g, '').length !== 8) return;
    setCepLoading(true);
    try {
      const r = await lookupCep(form.zip_code);
      if (r) {
        setForm((p) => ({
          ...p,
          city: p.city || r.city || '',
          state: p.state || r.state || '',
          address: p.address || [r.street, r.neighborhood].filter(Boolean).join(', '),
        }));
      }
    } finally {
      setCepLoading(false);
    }
  };

  const onGeocode = async () => {
    if (!form.address.trim() && !form.zip_code) {
      toastError(null, 'Informe endereço ou CEP antes de buscar coordenadas.');
      return;
    }
    setGeocoding(true);
    try {
      const r = await geocodeAddress({
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip_code,
      });
      if (!r) {
        toastError(null, 'Não foi possível localizar este endereço.');
        return;
      }
      setForm((p) => ({
        ...p,
        latitude: r.latitude.toFixed(6),
        longitude: r.longitude.toFixed(6),
      }));
      toastSuccess('Coordenadas encontradas', r.displayName);
    } finally {
      setGeocoding(false);
    }
  };

  const submit = () => {
    if (!form.address.trim()) return;
    onSubmit({
      route_id: routeId,
      sequence: nextSeq,
      stop_type: form.stop_type,
      address: form.address.trim(),
      city: form.city || null,
      state: form.state || null,
      zip_code: form.zip_code || null,
      latitude: form.latitude ? Number(form.latitude.replace(',', '.')) : null,
      longitude: form.longitude ? Number(form.longitude.replace(',', '.')) : null,
      weight: form.weight ? Number(form.weight.replace(',', '.')) : 0,
      volume: form.volume ? Number(form.volume.replace(',', '.')) : 0,
      planned_eta: form.planned_eta ? new Date(form.planned_eta).toISOString() : null,
      time_window_start: form.time_window_start || null,
      time_window_end: form.time_window_end || null,
      service_minutes: form.service_minutes ? Math.max(0, parseInt(form.service_minutes, 10) || 0) : 10,
      notes: form.notes || null,
    });
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Nova parada</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Tipo</Label>
          <Select value={form.stop_type} onValueChange={(v) => set('stop_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="delivery">Entrega</SelectItem>
              <SelectItem value="pickup">Coleta</SelectItem>
              <SelectItem value="depot">Depósito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Endereço *</Label>
          <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
          <div><Label>UF</Label><Input maxLength={2} value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase())} /></div>
          <div>
            <Label>CEP {cepLoading && <Loader2 className="inline h-3 w-3 ml-1 animate-spin" />}</Label>
            <Input value={form.zip_code} onChange={(e) => set('zip_code', e.target.value)} onBlur={onCepBlur} />
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div><Label>Latitude</Label><Input value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="-23.5505" /></div>
          <div><Label>Longitude</Label><Input value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="-46.6333" /></div>
          <Button type="button" variant="outline" size="sm" onClick={onGeocode} disabled={geocoding}>
            {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Peso (kg)</Label><Input value={form.weight} onChange={(e) => set('weight', e.target.value)} /></div>
          <div><Label>Volume (m³)</Label><Input value={form.volume} onChange={(e) => set('volume', e.target.value)} /></div>
        </div>
        <div>
          <Label>ETA prevista</Label>
          <Input type="datetime-local" value={form.planned_eta} onChange={(e) => set('planned_eta', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label>Janela início</Label>
            <Input type="time" value={form.time_window_start} onChange={(e) => set('time_window_start', e.target.value)} />
          </div>
          <div>
            <Label>Janela fim</Label>
            <Input type="time" value={form.time_window_end} onChange={(e) => set('time_window_end', e.target.value)} />
          </div>
          <div>
            <Label>Serviço (min)</Label>
            <Input type="number" min={0} value={form.service_minutes} onChange={(e) => set('service_minutes', e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Notas</Label>
          <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit}>Adicionar</Button>
      </DialogFooter>
    </DialogContent>
  );
};
