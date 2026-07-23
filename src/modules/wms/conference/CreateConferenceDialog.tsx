import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { toSafeNumber } from '@/lib/numericValidation';

export interface NewConfState { referenceNumber: string; operator: string; conferenceType: string }
export interface NewItemState { product_code: string; product_name: string; expected_qty: number }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  newConf: NewConfState;
  setNewConf: (fn: (p: NewConfState) => NewConfState) => void;
  newItems: NewItemState[];
  setNewItems: (arr: NewItemState[]) => void;
  onCreate: () => void;
}

export function CreateConferenceDialog({ open, onOpenChange, newConf, setNewConf, newItems, setNewItems, onCreate }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Nova Conferência</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Referência</Label>
              <Input value={newConf.referenceNumber} onChange={e => setNewConf(p => ({ ...p, referenceNumber: e.target.value }))} placeholder="Nº pedido/recebimento" />
            </div>
            <div>
              <Label>Operador</Label>
              <Input value={newConf.operator} onChange={e => setNewConf(p => ({ ...p, operator: e.target.value }))} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={newConf.conferenceType} onValueChange={v => setNewConf(p => ({ ...p, conferenceType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="blind">Cega</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Itens</Label>
            {newItems.map((item, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mt-2">
                <Input placeholder="Código" value={item.product_code} onChange={e => { const arr = [...newItems]; arr[i].product_code = e.target.value; setNewItems(arr); }} />
                <Input placeholder="Nome" value={item.product_name} onChange={e => { const arr = [...newItems]; arr[i].product_name = e.target.value; setNewItems(arr); }} />
                <Input type="number" placeholder="Qtd esperada" value={item.expected_qty || ''} onChange={e => { const arr = [...newItems]; arr[i].expected_qty = toSafeNumber(e.target.value); setNewItems(arr); }} />
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setNewItems([...newItems, { product_code: '', product_name: '', expected_qty: 0 }])}>
              + Adicionar Item
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onCreate}>Criar Conferência</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
