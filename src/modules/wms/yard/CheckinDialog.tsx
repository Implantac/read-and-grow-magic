import { useState } from 'react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Textarea } from '@/ui/base/textarea';
import { LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function CheckinDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    plate: '', carrier_name: '', driver_name: '', driver_doc: '',
    vehicle_type: 'truck', operation_type: 'inbound', linked_order: '', notes: '',
  });
  const save = useMutation({
    mutationFn: async () => {
      if (!form.plate.trim()) throw new Error('Placa é obrigatória');
      const { data: prof } = await supabase.from('profiles').select('company_id').maybeSingle();
      const companyId = prof?.company_id;
      if (!companyId) throw new Error('Empresa não identificada');
      const { error } = await supabase.from('yard_vehicles').insert({
        ...form,
        plate: form.plate.toUpperCase().trim(),
        company_id: companyId,
        status: 'waiting',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Check-in realizado');
      qc.invalidateQueries({ queryKey: ['yard_vehicles'] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || 'Falha no check-in'),
  });

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Check-in de veículo</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Placa *</Label><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="ABC1D23" /></div>
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
          <div><Label>Transportadora</Label><Input value={form.carrier_name} onChange={(e) => setForm({ ...form, carrier_name: e.target.value })} /></div>
          <div><Label>Motorista</Label><Input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} /></div>
          <div><Label>Doc. motorista</Label><Input value={form.driver_doc} onChange={(e) => setForm({ ...form, driver_doc: e.target.value })} /></div>
          <div><Label>Pedido vinculado</Label><Input value={form.linked_order} onChange={(e) => setForm({ ...form, linked_order: e.target.value })} /></div>
        </div>
        <div><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
          <LogIn className="h-4 w-4" /> Registrar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
