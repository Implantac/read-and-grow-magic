import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/base/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { toastError, toastSuccess } from '@/lib/toastHelpers';
import { Plus } from 'lucide-react';
import { toLocalInput, type Dock } from './types';

export function NewAppointmentDialog({ docks, onCreated }: { docks: Dock[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    dock_id: '',
    carrier_name: '',
    plate: '',
    operation_type: 'inbound',
    scheduled_start: toLocalInput(new Date()),
    scheduled_end: toLocalInput(new Date(Date.now() + 60 * 60 * 1000)),
    linked_order: '',
    notes: '',
  });

  async function createAppt() {
    if (!form.dock_id || !form.scheduled_start || !form.scheduled_end) {
      toastError('Preencha doca e janela de horário');
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const { data: company } = await supabase.rpc('get_user_company_id', {
      _user_id: userData.user?.id as string,
    });
    const payload = {
      ...form,
      scheduled_start: new Date(form.scheduled_start).toISOString(),
      scheduled_end: new Date(form.scheduled_end).toISOString(),
      status: 'scheduled',
      company_id: company as unknown as string,
    } as never;
    const { error } = await supabase.from('yard_appointments').insert(payload);
    if (error) { toastError('Erro ao criar agendamento', error.message); return; }
    toastSuccess('Agendamento criado');
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Novo Agendamento</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo agendamento de doca</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Doca</Label>
            <Select value={form.dock_id} onValueChange={(v) => setForm({ ...form, dock_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {docks.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <Label>Pedido / Referência</Label>
              <Input value={form.linked_order} onChange={(e) => setForm({ ...form, linked_order: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Transportadora</Label>
              <Input value={form.carrier_name} onChange={(e) => setForm({ ...form, carrier_name: e.target.value })} />
            </div>
            <div>
              <Label>Placa</Label>
              <Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início</Label>
              <Input type="datetime-local" value={form.scheduled_start} onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })} />
            </div>
            <div>
              <Label>Fim</Label>
              <Input type="datetime-local" value={form.scheduled_end} onChange={(e) => setForm({ ...form, scheduled_end: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button onClick={createAppt}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
