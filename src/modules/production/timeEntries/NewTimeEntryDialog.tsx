import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Play } from 'lucide-react';
import type { NewEntryForm } from './constants';

interface ActiveOrder {
  id: string;
  order_number: string;
  product_name: string;
  produced_quantity: number;
  quantity: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activeOrders: ActiveOrder[];
  form: NewEntryForm;
  setForm: (f: NewEntryForm) => void;
  onSubmit: () => void;
}

export function NewTimeEntryDialog({ open, onOpenChange, activeOrders, form, setForm, onSubmit }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Apontamento</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Operador *</label>
            <Input value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })} placeholder="Nome do operador" />
          </div>
          <div>
            <label className="text-sm font-medium">Ordem de Produção *</label>
            <Select value={form.orderId} onValueChange={v => setForm({ ...form, orderId: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione uma OP" /></SelectTrigger>
              <SelectContent>
                {activeOrders.map(o => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.order_number} — {o.product_name} ({o.produced_quantity}/{o.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Operação / Etapa *</label>
            <Input value={form.operationName} onChange={e => setForm({ ...form, operationName: e.target.value })} placeholder="Ex: Corte, Costura, Estamparia" />
          </div>
          <div>
            <label className="text-sm font-medium">Centro de Trabalho</label>
            <Input value={form.workCenter} onChange={e => setForm({ ...form, workCenter: e.target.value })} placeholder="Ex: Setor A" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={!form.orderId || !form.operationName || !form.operator}>
            <Play className="h-4 w-4 mr-2" /> Iniciar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
