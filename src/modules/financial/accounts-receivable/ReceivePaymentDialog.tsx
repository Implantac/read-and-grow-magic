import { CheckCircle } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { formatBRL } from '@/lib/formatters';
import type { PaymentMethod } from '@/types/financial';
import { paymentMethods } from './helpers';

export type ReceivePaymentForm = {
  amount: string; interest: string; penalty: string; discount: string;
  paymentMethod: PaymentMethod; bankAccountId: string; notes: string; paymentDate: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  account: {
    description: string; client_name: string;
    amount: number | string; original_amount?: number | string | null; open_amount?: number | string | null;
  } | null;
  payForm: ReceivePaymentForm;
  setPayForm: (f: ReceivePaymentForm) => void;
  bankAccounts: Array<{ id: string; name: string }>;
  onConfirm: () => void;
  isPending: boolean;
};

export function ReceivePaymentDialog({ open, onOpenChange, account, payForm, setPayForm, bankAccounts, onConfirm, isPending }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Registrar Recebimento</DialogTitle></DialogHeader>
        {account && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted p-4">
              <p className="font-medium">{account.description}</p>
              <p className="text-sm text-muted-foreground">{account.client_name}</p>
              <div className="mt-2 flex justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Original</p>
                  <p className="font-medium">{formatBRL(Number(account.original_amount ?? account.amount))}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Em Aberto</p>
                  <p className="text-xl font-bold text-primary">{formatBRL(Number(account.open_amount ?? account.amount))}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Valor Recebido *</Label>
                <Input type="number" step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Juros</Label>
                <Input type="number" step="0.01" value={payForm.interest} onChange={(e) => setPayForm({ ...payForm, interest: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Multa</Label>
                <Input type="number" step="0.01" value={payForm.penalty} onChange={(e) => setPayForm({ ...payForm, penalty: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Desconto</Label>
                <Input type="number" step="0.01" value={payForm.discount} onChange={(e) => setPayForm({ ...payForm, discount: e.target.value })} />
              </div>
            </div>

            <div className="rounded-md border p-3 bg-accent/50">
              <p className="text-xs text-muted-foreground">Total Líquido</p>
              <p className="text-lg font-bold">
                {formatBRL(
                  (parseFloat(payForm.amount) || 0) + (parseFloat(payForm.interest) || 0) + (parseFloat(payForm.penalty) || 0) - (parseFloat(payForm.discount) || 0)
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Forma de Recebimento *</Label>
                <Select value={payForm.paymentMethod} onValueChange={(v) => setPayForm({ ...payForm, paymentMethod: v as PaymentMethod })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(paymentMethods).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Conta Bancária *</Label>
                <Select value={payForm.bankAccountId} onValueChange={(v) => setPayForm({ ...payForm, bankAccountId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Data do Recebimento *</Label>
                <Input type="date" value={payForm.paymentDate} onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Observações</Label>
              <Textarea value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} className="h-16" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={isPending} className="gap-2">
            <CheckCircle className="h-4 w-4" />Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
