import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';

export type OSForm = {
  production_order_id: string; supplier_name: string; supplier_id: string;
  service_description: string; sent_date: string; expected_return_date: string;
  quantity_sent: number; unit_cost: number; notes: string;
};

type Props = {
  open: boolean; onOpenChange: (v: boolean) => void;
  form: OSForm; setForm: React.Dispatch<React.SetStateAction<OSForm>>;
  activeOPs: Array<{ id: string; order_number: string; product_name: string; quantity: number }>;
  suppliers: Array<{ id: string; name: string }>;
  onCreate: () => void;
};

export function CreateOSDialog({ open, onOpenChange, form, setForm, activeOPs, suppliers, onCreate }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova Ordem de Serviço Terceirizada</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Ordem de Produção</Label>
            <Select value={form.production_order_id} onValueChange={v => setForm(f => ({ ...f, production_order_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione a OP..." /></SelectTrigger>
              <SelectContent>
                {activeOPs.map(op => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.order_number} — {op.product_name} ({op.quantity} un)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fornecedor</Label>
            <Select value={form.supplier_id} onValueChange={v => {
              const sup = suppliers.find(s => s.id === v);
              setForm(f => ({ ...f, supplier_id: v, supplier_name: sup?.name || '' }));
            }}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {!form.supplier_id && (
              <Input placeholder="Ou digite o nome..." value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} className="mt-2" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data Envio</Label>
              <Input type="date" value={form.sent_date} onChange={e => setForm(f => ({ ...f, sent_date: e.target.value }))} />
            </div>
            <div>
              <Label>Previsão Retorno</Label>
              <Input type="date" value={form.expected_return_date} onChange={e => setForm(f => ({ ...f, expected_return_date: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantidade</Label>
              <Input type="number" value={form.quantity_sent} onChange={e => setForm(f => ({ ...f, quantity_sent: +e.target.value }))} />
            </div>
            <div>
              <Label>Custo Unitário</Label>
              <Input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: +e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Descrição do Serviço</Label>
            <Textarea value={form.service_description} onChange={e => setForm(f => ({ ...f, service_description: e.target.value }))} />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onCreate} disabled={!form.production_order_id || !form.supplier_name}>
            Criar OS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
