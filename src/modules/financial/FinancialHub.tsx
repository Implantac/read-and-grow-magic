import { useMemo, useState } from 'react';
import { toastError } from '@/lib/toastHelpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Badge } from '@/ui/base/badge';
import { Skeleton } from '@/ui/base/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { ArrowDownCircle, ArrowUpCircle, Wallet, Banknote, QrCode, CreditCard, Receipt, FileCheck, ArrowLeftRight, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { useBankAccounts } from '@/hooks/financial/useBankAccounts';
import { useFinancialLedger, useCreateManualLedger } from '@/hooks/financial/useFinancialLedger';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/shared/components/EmptyState';

import { formatBRL, formatDate } from '@/lib/formatters';
type QuickAction = 'receive' | 'pay' | null;

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'cash', label: 'Dinheiro', icon: Banknote },
  { value: 'credit_card', label: 'Cartão Crédito', icon: CreditCard },
  { value: 'debit_card', label: 'Cartão Débito', icon: CreditCard },
  { value: 'boleto', label: 'Boleto', icon: Receipt },
  { value: 'transfer', label: 'Transferência', icon: ArrowLeftRight },
  { value: 'check', label: 'Cheque', icon: FileCheck },
];

export default function FinancialHub() {
  const { data: accounts = [], isLoading: loadingAccounts } = useBankAccounts();
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [search, setSearch] = useState('');
  const filterAccount = selectedAccount === 'all' ? undefined : selectedAccount;
  const { data: ledger = [], isLoading: loadingLedger } = useFinancialLedger({ from: monthStart, bank_account_id: filterAccount });
  const createLedger = useCreateManualLedger();

  const [action, setAction] = useState<QuickAction>(null);
  const [form, setForm] = useState({ amount: '', method: 'pix', description: '', account_id: '' });

  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + Number(a.balance || 0), 0), [accounts]);

  const monthInflow = useMemo(() => ledger.filter(l => l.type === 'inflow').reduce((s, l) => s + Number(l.amount), 0), [ledger]);
  const monthOutflow = useMemo(() => ledger.filter(l => l.type === 'outflow').reduce((s, l) => s + Number(l.amount), 0), [ledger]);
  const monthNet = monthInflow - monthOutflow;

  const todayInflow = useMemo(() => ledger.filter(l => l.type === 'inflow' && l.entry_date === today).reduce((s, l) => s + Number(l.amount), 0), [ledger, today]);
  const todayOutflow = useMemo(() => ledger.filter(l => l.type === 'outflow' && l.entry_date === today).reduce((s, l) => s + Number(l.amount), 0), [ledger, today]);

  const filteredLedger = useMemo(() => {
    if (!search.trim()) return ledger;
    const s = search.toLowerCase();
    return ledger.filter(l => l.description?.toLowerCase().includes(s) || l.reference?.toLowerCase().includes(s));
  }, [ledger, search]);

  const openAction = (type: QuickAction) => {
    setAction(type);
    setForm({ amount: '', method: 'pix', description: '', account_id: accounts[0]?.id || '' });
  };

  const submitQuickAction = async () => {
    const amount = parseFloat(form.amount.replace(',', '.'));
    if (!amount || amount <= 0) {
      toastError('Valor inválido');
      return;
    }
    if (!form.account_id) {
      toastError('Selecione uma conta bancária');
      return;
    }
    if (!form.description.trim()) {
      toastError('Informe uma descrição');
      return;
    }
    await createLedger.mutateAsync({
      entry_date: today,
      type: action === 'receive' ? 'inflow' : 'outflow',
      amount,
      description: form.description,
      bank_account_id: form.account_id,
      category_id: null,
      source: 'manual',
      source_id: null,
      payment_method: form.method,
      reference: null,
      notes: null,
    } as any);
    setAction(null);
  };

  if (loadingAccounts) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Saldo */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Saldo total disponível</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{formatBRL(totalBalance)}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                <span className="flex items-center gap-1 text-emerald-500">
                  <TrendingUp className="h-4 w-4" /> Hoje +{formatBRL(todayInflow)}
                </span>
                <span className="flex items-center gap-1 text-rose-500">
                  <TrendingDown className="h-4 w-4" /> Hoje -{formatBRL(todayOutflow)}
                </span>
                <Badge variant="outline">{accounts.filter(a => a.active).length} contas ativas</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={() => openAction('receive')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <ArrowDownCircle className="h-5 w-5 mr-2" /> Receber agora
              </Button>
              <Button size="lg" onClick={() => openAction('pay')} variant="destructive">
                <ArrowUpCircle className="h-5 w-5 mr-2" /> Pagar agora
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs do mês */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Entradas no mês</p>
            <p className="text-2xl font-bold text-emerald-500">{formatBRL(monthInflow)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Saídas no mês</p>
            <p className="text-2xl font-bold text-rose-500">{formatBRL(monthOutflow)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Resultado do mês</p>
            <p className={cn('text-2xl font-bold', monthNet >= 0 ? 'text-emerald-500' : 'text-rose-500')}>{formatBRL(monthNet)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Contas + Extrato */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4" /> Contas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => setSelectedAccount('all')}
              className={cn('w-full flex justify-between items-center p-3 rounded-lg border text-left hover:bg-accent/30 transition', selectedAccount === 'all' && 'border-primary bg-accent/20')}
            >
              <span className="font-medium">Todas as contas</span>
              <span className="font-bold">{formatBRL(totalBalance)}</span>
            </button>
            {accounts.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedAccount(a.id)}
                className={cn('w-full flex justify-between items-center p-3 rounded-lg border text-left hover:bg-accent/30 transition', selectedAccount === a.id && 'border-primary bg-accent/20')}
              >
                <div>
                  <p className="font-medium text-sm">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.bank_name}</p>
                </div>
                <span className={cn('font-bold text-sm', Number(a.balance) < 0 && 'text-destructive')}>{formatBRL(Number(a.balance))}</span>
              </button>
            ))}
            {accounts.length === 0 && (
              <EmptyState compact icon={Wallet} title="Nenhuma conta cadastrada" description="Cadastre contas bancárias para começar a movimentar." />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base">Extrato em tempo real</CardTitle>
              <div className="relative w-64">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 h-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingLedger ? (
              <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : filteredLedger.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Nenhuma movimentação no período"
                description="Registre uma entrada ou saída para começar a alimentar o extrato em tempo real."
              />
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {filteredLedger.map((l) => (
                  <div key={l.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn('h-9 w-9 rounded-full flex items-center justify-center shrink-0', l.type === 'inflow' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                        {l.type === 'inflow' ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{l.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(l.entry_date)}
                          {l.payment_method && <> · {l.payment_method.toUpperCase()}</>}
                          {l.source !== 'manual' && <> · {l.source}</>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn('font-bold', l.type === 'inflow' ? 'text-emerald-500' : 'text-rose-500')}>
                        {l.type === 'inflow' ? '+' : '-'} {formatBRL(Number(l.amount))}
                      </p>
                      {l.reconciled && <Badge variant="outline" className="text-[10px] mt-0.5">conciliado</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Dialog (POS-style) */}
      <Dialog open={action !== null} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {action === 'receive' ? <><ArrowDownCircle className="h-5 w-5 text-emerald-500" /> Receber agora</> : <><ArrowUpCircle className="h-5 w-5 text-rose-500" /> Pagar agora</>}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Valor</Label>
              <Input
                autoFocus
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0,00"
                className="text-3xl h-16 text-center font-bold"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Forma</Label>
              <div className="grid grid-cols-4 gap-2">
                {PAYMENT_METHODS.map(m => {
                  const Icon = m.icon;
                  const active = form.method === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setForm({ ...form, method: m.value })}
                      className={cn('flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition', active ? 'border-primary bg-primary/10' : 'hover:bg-accent/30')}
                    >
                      <Icon className="h-5 w-5" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Conta</Label>
              <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.active).map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name} — {formatBRL(Number(a.balance))}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={action === 'receive' ? 'Ex: Recebimento avulso' : 'Ex: Pagamento avulso'} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancelar</Button>
            <Button
              onClick={submitQuickAction}
              disabled={createLedger.isPending}
              className={action === 'receive' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
              variant={action === 'pay' ? 'destructive' : 'default'}
            >
              {createLedger.isPending ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
