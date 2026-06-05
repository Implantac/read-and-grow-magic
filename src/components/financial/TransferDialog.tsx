import { useState } from 'react';
import { Button } from '@/ui/base/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/ui/base/dialog';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { ArrowLeftRight } from 'lucide-react';
import { useBankAccounts } from '@/hooks/financial/useBankAccounts';
import { useTransferBetweenAccounts } from '@/hooks/financial/useFinancialSettlements';

import { formatBRL } from '@/lib/formatters';
export function TransferDialog() {
  const { data: accounts = [] } = useBankAccounts();
  const transfer = useTransferBetweenAccounts();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const fromAcc = accounts.find(a => a.id === from);
  const numericAmount = Number(amount.replace(',', '.')) || 0;
  const insufficient = fromAcc && numericAmount > Number(fromAcc.balance);
  const canSubmit = from && to && from !== to && numericAmount > 0 && !insufficient;

  const handleSubmit = () => {
    if (!canSubmit) return;
    transfer.mutate(
      { fromAccount: from, toAccount: to, amount: numericAmount, description: description || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setFrom(''); setTo(''); setAmount(''); setDescription('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowLeftRight className="h-4 w-4" /> Transferir entre contas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferência entre contas</DialogTitle>
          <DialogDescription>
            Gera saída em uma conta e entrada em outra, ambas registradas no ledger.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Conta de origem</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {accounts.filter(a => a.active).map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} — {formatBRL(Number(a.balance))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Conta de destino</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {accounts.filter(a => a.active && a.id !== from).map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Valor</Label>
            <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
            {insufficient && (
              <p className="text-xs text-destructive">Saldo insuficiente. Disponível: {formatBRL(Number(fromAcc!.balance))}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Descrição (opcional)</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Transferência entre contas" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || transfer.isPending}>
            {transfer.isPending ? 'Transferindo…' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
