import { useState } from 'react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';

export const CostDialog = ({
  routeId, current, onClose, onSubmit,
}: {
  routeId: string;
  current: any;
  onClose: () => void;
  onSubmit: (payload: any) => void;
}) => {
  const toStr = (v: any) => (v == null ? '' : String(v));
  const [form, setForm] = useState({
    fuel_liters: toStr(current?.fuel_liters),
    fuel_cost: toStr(current?.fuel_cost),
    toll_cost: toStr(current?.toll_cost),
    driver_cost: toStr(current?.driver_cost),
    maintenance_cost: toStr(current?.maintenance_cost),
    other_cost: toStr(current?.other_cost),
    total_distance_km: toStr(current?.total_distance_km),
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const num = (s: string) => (s ? Number(s.replace(',', '.')) || 0 : 0);

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Custos da rota</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Combustível (L)</Label><Input value={form.fuel_liters} onChange={(e) => set('fuel_liters', e.target.value)} /></div>
        <div><Label>Combustível (R$)</Label><Input value={form.fuel_cost} onChange={(e) => set('fuel_cost', e.target.value)} /></div>
        <div><Label>Pedágios (R$)</Label><Input value={form.toll_cost} onChange={(e) => set('toll_cost', e.target.value)} /></div>
        <div><Label>Motorista (R$)</Label><Input value={form.driver_cost} onChange={(e) => set('driver_cost', e.target.value)} /></div>
        <div><Label>Manutenção (R$)</Label><Input value={form.maintenance_cost} onChange={(e) => set('maintenance_cost', e.target.value)} /></div>
        <div><Label>Outros (R$)</Label><Input value={form.other_cost} onChange={(e) => set('other_cost', e.target.value)} /></div>
        <div className="col-span-2"><Label>Distância total (km)</Label><Input value={form.total_distance_km} onChange={(e) => set('total_distance_km', e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSubmit({
          route_id: routeId,
          fuel_liters: num(form.fuel_liters),
          fuel_cost: num(form.fuel_cost),
          toll_cost: num(form.toll_cost),
          driver_cost: num(form.driver_cost),
          maintenance_cost: num(form.maintenance_cost),
          other_cost: num(form.other_cost),
          total_distance_km: num(form.total_distance_km),
        })}>Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
};
