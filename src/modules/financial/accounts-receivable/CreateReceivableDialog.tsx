import { Plus } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/ui/base/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { financialCategories } from '@/config/financial';
import { formatBRL } from '@/lib/formatters';

export type ReceivableFormData = {
  description: string; clientId: string; category: string; amount: string;
  dueDate: string; invoiceNumber: string; notes: string; installments: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  formData: ReceivableFormData;
  setFormData: (d: ReceivableFormData) => void;
  clients: Array<{ id: string; name: string }>;
  onSubmit: () => void;
  isPending: boolean;
};

export function CreateReceivableDialog({ open, onOpenChange, formData, setFormData, clients, onSubmit, isPending }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Nova Conta</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova Conta a Receber</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Descrição *</Label>
            <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição da conta" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Cliente *</Label>
              <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{financialCategories.filter(c => c.type === 'income').map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Valor Total *</Label>
              <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0,00" />
            </div>
            <div className="grid gap-2">
              <Label>Vencimento *</Label>
              <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Parcelas</Label>
              <Select value={formData.installments} onValueChange={(v) => setFormData({ ...formData, installments: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {parseInt(formData.installments) > 1 && formData.amount && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Parcelamento: {formData.installments}x de {formatBRL(parseFloat(formData.amount) / parseInt(formData.installments))}</p>
              <p className="text-muted-foreground">Parcelas com vencimento mensal a partir de {formData.dueDate}</p>
            </div>
          )}
          <div className="grid gap-2">
            <Label>Número da Nota</Label>
            <Input value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} placeholder="NF-0000" />
          </div>
          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Observações adicionais" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
