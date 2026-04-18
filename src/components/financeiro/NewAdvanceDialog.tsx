import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useClients } from '@/hooks/useClients';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCreateAdvance } from '@/hooks/useFinancialAdvances';

export function NewAdvanceDialog() {
  const { data: accounts = [] } = useBankAccounts();
  const { data: clients = [] } = useClients();
  const { suppliers } = useSuppliers();
  const create = useCreateAdvance();

  const [open, setOpen] = useState(false);
  const [partyType, setPartyType] = useState<'client' | 'supplier'>('client');
  const [entityId, setEntityId] = useState('');
  const [amount, setAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const list = partyType === 'client' ? clients : suppliers;
  const selected: any = list.find((x: any) => x.id === entityId);
  const partyName = selected?.name ?? '';

  const numericAmount = Number(amount.replace(',', '.')) || 0;
  const canSubmit = entityId && numericAmount > 0 && bankAccountId;

  const handleSubmit = () => {
    if (!canSubmit) return;
    create.mutate(
      {
        party_type: partyType,
        client_id: partyType === 'client' ? entityId : null,
        supplier_id: partyType === 'supplier' ? entityId : null,
        party_name: partyName,
        amount: numericAmount,
        bank_account_id: bankAccountId,
        payment_method: paymentMethod,
        received_date: receivedDate,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setEntityId(''); setAmount(''); setNotes('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Novo adiantamento</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar adiantamento</DialogTitle>
          <DialogDescription>
            Adiantamentos de cliente entram como passivo (não viram receita) e a fornecedor como ativo.
            Ambos geram movimentação no ledger.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select value={partyType} onValueChange={(v: any) => { setPartyType(v); setEntityId(''); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Adiantamento de cliente (entrada)</SelectItem>
                <SelectItem value="supplier">Adiantamento a fornecedor (saída)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{partyType === 'client' ? 'Cliente' : 'Fornecedor'}</Label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {list.map((x: any) => (
                  <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Valor</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Data</Label>
              <Input type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Conta bancária</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.active).map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Método</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Observações</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || create.isPending}>
            {create.isPending ? 'Salvando…' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
