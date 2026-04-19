import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, QrCode, Banknote, CreditCard, Receipt, ArrowLeftRight, FileCheck, Wallet, Loader2 } from 'lucide-react';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useFinancialAdvances } from '@/hooks/useFinancialAdvances';
import { useSettleAccount, type PaymentSplit } from '@/hooks/useSettlement';
import { useUseAdvance } from '@/hooks/useFinancialSettlements';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

export type SettlementTarget = {
  source_type: 'receivable' | 'payable';
  source_id: string;
  description: string;
  party_name: string;
  party_id?: string | null;        // client_id ou supplier_id (para usar adiantamento)
  amount_total: number;
  paid_amount?: number;
};

const METHODS: { value: PaymentSplit['payment_method']; label: string; icon: any }[] = [
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'cash', label: 'Dinheiro', icon: Banknote },
  { value: 'credit_card', label: 'Crédito', icon: CreditCard },
  { value: 'debit_card', label: 'Débito', icon: CreditCard },
  { value: 'transfer', label: 'Transferência', icon: ArrowLeftRight },
  { value: 'boleto', label: 'Boleto', icon: Receipt },
  { value: 'check', label: 'Cheque', icon: FileCheck },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: SettlementTarget | null;
  onSettled?: () => void;
}

export function SettlementDialog({ open, onOpenChange, target, onSettled }: Props) {
  const { data: accounts = [] } = useBankAccounts();
  const { data: advances = [] } = useFinancialAdvances(
    target?.source_type === 'receivable' ? 'client' : 'supplier'
  );
  const settle = useSettleAccount();
  const useAdv = useUseAdvance();

  const open_amount = useMemo(
    () => Math.max((target?.amount_total ?? 0) - (target?.paid_amount ?? 0), 0),
    [target]
  );

  const [splits, setSplits] = useState<PaymentSplit[]>([]);
  const [interest, setInterest] = useState('0');
  const [penalty, setPenalty] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [advanceId, setAdvanceId] = useState<string>('');
  const [advanceAmount, setAdvanceAmount] = useState('');

  // Reset on open
  useEffect(() => {
    if (open && target) {
      setSplits([
        { payment_method: 'pix', amount: open_amount, bank_account_id: accounts[0]?.id ?? null },
      ]);
      setInterest('0'); setPenalty('0'); setDiscount('0');
      setDate(new Date().toISOString().slice(0, 10));
      setNotes('');
      setAdvanceId('');
      setAdvanceAmount('');
    }
  }, [open, target?.source_id]); // eslint-disable-line

  const totalSplits = splits.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const totalSettled =
    totalSplits + (parseFloat(interest) || 0) + (parseFloat(penalty) || 0) - (parseFloat(discount) || 0);
  const principal = totalSettled - (parseFloat(interest) || 0) - (parseFloat(penalty) || 0) + (parseFloat(discount) || 0);

  const partyAdvances = useMemo(
    () =>
      advances.filter(
        (a) =>
          a.remaining_amount > 0 &&
          (a.client_id === target?.party_id || a.supplier_id === target?.party_id)
      ),
    [advances, target?.party_id]
  );

  if (!target) return null;

  const addSplit = () => {
    const remaining = Math.max(open_amount - totalSplits, 0);
    setSplits([...splits, { payment_method: 'cash', amount: remaining, bank_account_id: accounts[0]?.id ?? null }]);
  };
  const removeSplit = (i: number) => setSplits(splits.filter((_, idx) => idx !== i));
  const updateSplit = (i: number, patch: Partial<PaymentSplit>) =>
    setSplits(splits.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const fillRemaining = (i: number) => {
    const others = splits.reduce((s, x, idx) => (idx === i ? s : s + (Number(x.amount) || 0)), 0);
    updateSplit(i, { amount: Math.max(open_amount - others, 0) });
  };

  const handleConfirm = async () => {
    if (totalSplits <= 0) return;
    await settle.mutateAsync({
      source_type: target.source_type,
      source_id: target.source_id,
      splits: splits.filter((s) => Number(s.amount) > 0),
      settlement_date: date,
      interest: parseFloat(interest) || 0,
      penalty: parseFloat(penalty) || 0,
      discount: parseFloat(discount) || 0,
      notes: notes || undefined,
    });
    onSettled?.();
    onOpenChange(false);
  };

  const handleApplyAdvance = async () => {
    if (!advanceId || !target.party_id) return;
    const amt = parseFloat(advanceAmount.replace(',', '.'));
    if (!amt || amt <= 0) return;
    await useAdv.mutateAsync({
      advanceId,
      sourceType: target.source_type,
      sourceId: target.source_id,
      amount: amt,
    });
    setAdvanceId(''); setAdvanceAmount('');
    onSettled?.();
  };

  const isReceivable = target.source_type === 'receivable';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReceivable ? '💰 Receber' : '💸 Pagar'} — {target.party_name}
          </DialogTitle>
          <DialogDescription>
            {target.description} • Em aberto: <strong className="text-foreground">{fmt(open_amount)}</strong>
            {target.paid_amount && target.paid_amount > 0 ? <> • Já pago: {fmt(target.paid_amount)}</> : null}
          </DialogDescription>
        </DialogHeader>

        {/* Adiantamentos disponíveis */}
        {partyAdvances.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wallet className="h-4 w-4" />
              Adiantamentos disponíveis ({partyAdvances.length})
            </div>
            <div className="grid gap-2 md:grid-cols-[1fr_140px_auto]">
              <Select value={advanceId} onValueChange={setAdvanceId}>
                <SelectTrigger><SelectValue placeholder="Selecione um adiantamento" /></SelectTrigger>
                <SelectContent>
                  {partyAdvances.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {fmt(a.remaining_amount)} • {new Date(a.received_date).toLocaleDateString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Valor a usar" inputMode="decimal" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} />
              <Button size="sm" variant="secondary" disabled={!advanceId || useAdv.isPending} onClick={handleApplyAdvance}>
                Aplicar
              </Button>
            </div>
          </div>
        )}

        {/* Splits */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">Formas de pagamento</Label>
            <Button size="sm" variant="outline" onClick={addSplit}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>

          {splits.map((split, idx) => (
            <div key={idx} className="rounded-lg border p-3 space-y-2 bg-card">
              <div className="grid grid-cols-7 gap-2">
                {METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = split.payment_method === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => updateSplit(idx, { payment_method: m.value })}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-md border p-2 text-[11px] font-medium transition',
                        active ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
                <Input
                  inputMode="decimal"
                  placeholder="Valor"
                  value={String(split.amount)}
                  onChange={(e) => updateSplit(idx, { amount: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                />
                <Select
                  value={split.bank_account_id ?? ''}
                  onValueChange={(v) => updateSplit(idx, { bank_account_id: v || null })}
                >
                  <SelectTrigger><SelectValue placeholder="Conta bancária" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" onClick={() => fillRemaining(idx)} title="Preencher saldo restante">
                  =
                </Button>
                <Button size="sm" variant="ghost" disabled={splits.length === 1} onClick={() => removeSplit(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Ajustes */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Juros</Label>
            <Input inputMode="decimal" value={interest} onChange={(e) => setInterest(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Multa</Label>
            <Input inputMode="decimal" value={penalty} onChange={(e) => setPenalty(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Desconto</Label>
            <Input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Observações</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
          </div>
        </div>

        {/* Resumo */}
        <div className="rounded-lg border bg-muted/40 p-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Soma das formas:</span><strong>{fmt(totalSplits)}</strong></div>
          <div className="flex justify-between"><span>Total liquidado:</span><strong>{fmt(totalSettled)}</strong></div>
          <div className="flex justify-between text-base">
            <span>Saldo após baixa:</span>
            <Badge variant={open_amount - principal <= 0.01 ? 'default' : 'secondary'}>
              {fmt(Math.max(open_amount - principal, 0))}
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={settle.isPending || totalSplits <= 0}>
            {settle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isReceivable ? 'Confirmar Recebimento' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
