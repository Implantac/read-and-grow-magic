import { useState } from 'react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Textarea } from '@/ui/base/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Dock } from './types';

export function AppointmentDialog({ docks, onClose }: { docks: Dock[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    dock_id: '', carrier_name: '', plate: '', operation_type: 'inbound',
    scheduled_start: '', scheduled_end: '', linked_order: '', notes: '',
  });
  const save = useMutation({
    mutationFn: async () => {
      if (!form.dock_id || !form.scheduled_start || !form.scheduled_end) throw new Error('Doca e horários são obrigatórios');
      const { data: prof } = await supabase.from('profiles').select('company_id').maybeSingle();
      const companyId = prof?.company_id;
      if (!companyId) throw new Error('Empresa não identificada');
      const { error } = await supabase.from('yard_appointments').insert({
        ...form,
        plate: form.plate ? form.plate.toUpperCase().trim() : null,
        company_id: companyId,
        status: 'scheduled',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Agendamento criado');
      qc.invalidateQueries({ queryKey: ['yard_appointments'] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || 'Falha ao agendar'),
  });

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Novo agendamento de doca</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Doca *</Label>
            <Select value={form.dock_id} onValueChange={(v) => setForm({ ...form, dock_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {docks.map((d) => <SelectItem key={d.id} value={d.id}>{d.name || d.code || d.id.slice(0, 6)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Operação</Label>
            <Select value={form.operation_type} onValueChange={(v) => setForm({ ...form, operation_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inbound">Recebimento</SelectItem>
                <SelectItem value="outbound">Expedição</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Início *</Label><Input type="datetime-local" value={form.scheduled_start} onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })} /></div>
          <div><Label>Fim *</Label><Input type="datetime-local" value={form.scheduled_end} onChange={(e) => setForm({ ...form, scheduled_end: e.target.value })} /></div>
          <div><Label>Transportadora</Label><Input value={form.carrier_name} onChange={(e) => setForm({ ...form, carrier_name: e.target.value })} /></div>
          <div><Label>Placa</Label><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} /></div>
          <div className="col-span-2"><Label>Pedido vinculado</Label><Input value={form.linked_order} onChange={(e) => setForm({ ...form, linked_order: e.target.value })} /></div>
        </div>
        <div><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>Agendar</Button>
      </DialogFooter>
    </DialogContent>
  );
}
