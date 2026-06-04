import { useMemo, useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { useAccountsReceivable } from '@/hooks/financial/useAccountsReceivable';
import { useAccountsPayable } from '@/hooks/financial/useAccountsPayable';
import { useCompensateAccounts } from '@/hooks/useSettlement';

import { formatBRL, formatDate } from '@/lib/formatters';
const fmt = (v: number) =>
  formatBRL(Number(v) || 0);

export default function FinancialOffset() {
  const { data: receivables = [] } = useAccountsReceivable();
  const { data: payables = [] } = useAccountsPayable();
  const compensate = useCompensateAccounts();

  const openR = useMemo(() => receivables.filter((r) => r.status !== 'paid' && r.status !== 'cancelled'), [receivables]);
  const openP = useMemo(() => payables.filter((p) => p.status !== 'paid' && p.status !== 'cancelled'), [payables]);

  const [recvId, setRecvId] = useState('');
  const [payId, setPayId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const recv = receivables.find((r) => r.id === recvId);
  const pay = payables.find((p) => p.id === payId);

  const recvOpen = recv ? Math.max(Number(recv.amount) - Number(recv.paid_amount || 0), 0) : 0;
  const payOpen = pay ? Math.max(Number(pay.amount) - Number(pay.paid_amount || 0), 0) : 0;
  const max = Math.min(recvOpen, payOpen);

  const handleSubmit = async () => {
    const amt = parseFloat(amount.replace(',', '.'));
    if (!recvId || !payId || !amt || amt <= 0) return;
    await compensate.mutateAsync({ receivable_id: recvId, payable_id: payId, amount: amt, notes });
    setRecvId(''); setPayId(''); setAmount(''); setNotes('');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Compensação Financeira"
        description="Compense uma conta a receber com uma conta a pagar do mesmo parceiro — sem movimentar caixa."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Conta a Receber</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={recvId} onValueChange={setRecvId}>
              <SelectTrigger><SelectValue placeholder="Selecione um título a receber" /></SelectTrigger>
              <SelectContent>
                {openR.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.client_name} • {fmt(Math.max(Number(r.amount) - Number(r.paid_amount || 0), 0))} • {r.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {recv && (
              <div className="rounded-md border p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Cliente:</span><strong>{recv.client_name}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Vence:</span><span>{formatDate(recv.due_date)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Em aberto:</span><Badge>{fmt(recvOpen)}</Badge></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Conta a Pagar</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={payId} onValueChange={setPayId}>
              <SelectTrigger><SelectValue placeholder="Selecione um título a pagar" /></SelectTrigger>
              <SelectContent>
                {openP.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.supplier} • {fmt(Math.max(Number(p.amount) - Number(p.paid_amount || 0), 0))} • {p.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {pay && (
              <div className="rounded-md border p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Fornecedor:</span><strong>{pay.supplier}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Vence:</span><span>{formatDate(pay.due_date)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Em aberto:</span><Badge>{fmt(payOpen)}</Badge></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5" />Aplicar compensação</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[200px_1fr_auto]">
          <div>
            <Label className="text-xs">Valor a compensar</Label>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Máx. ${fmt(max)}`} />
          </div>
          <div>
            <Label className="text-xs">Observações</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSubmit} disabled={!recvId || !payId || !amount || compensate.isPending}>
              {compensate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Compensar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
