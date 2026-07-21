import { useMemo, useState } from 'react';
import { Download, AlertTriangle, CheckCircle2, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Badge } from '@/ui/base/badge';
import { Skeleton } from '@/ui/base/skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/ui/base/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/ui/base/select';
import { supabase } from '@/integrations/supabase/client';
import { useBankChannelReconcile, type CanalKey } from '@/hooks/financial/useBankChannelReconcile';
import { toCSV, downloadCSV } from '@/shared/utils/csv';

const CANAL_LABEL: Record<CanalKey, string> = {
  atacado: 'Atacado',
  varejo: 'Varejo',
  ecommerce: 'E-commerce',
  outros: 'Outros',
  sem_canal: 'Sem canal',
};

const fmt = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function isoDaysAgo(d: number) {
  const x = new Date(); x.setDate(x.getDate() - d);
  return x.toISOString().slice(0, 10);
}

export default function ConciliacaoBancariaCanal() {
  const [from, setFrom] = useState(isoDaysAgo(30));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [bankAccountId, setBankAccountId] = useState<string>('all');

  const { data: accounts = [] } = useQuery({
    queryKey: ['bank-accounts-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, name, bank_name')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data, isLoading } = useBankChannelReconcile({
    from, to,
    bankAccountId: bankAccountId === 'all' ? null : bankAccountId,
  });

  const kpis = useMemo(() => {
    if (!data) return null;
    return [
      { label: 'Entradas Banco', value: fmt(data.bankInflow), tone: 'positive' as const },
      { label: 'Saídas Banco', value: fmt(data.bankOutflow), tone: 'negative' as const },
      { label: 'Resultado Banco', value: fmt(data.bankNet), tone: 'neutral' as const },
      { label: 'Divergência', value: fmt(data.divergenceAbs), tone: data.divergenceAbs > 0.01 ? 'warn' : 'ok' as const },
    ];
  }, [data]);

  const exportCSV = () => {
    if (!data) return;
    const rows = data.channels.map((r) => ({
      Canal: CANAL_LABEL[r.canal],
      Entradas: r.ledgerInflow.toFixed(2),
      Saidas: r.ledgerOutflow.toFixed(2),
      Liquido: r.ledgerNet.toFixed(2),
      Conciliado: r.ledgerReconciled.toFixed(2),
      Pendente: r.ledgerPending.toFixed(2),
      Lancamentos: r.entries,
    }));
    downloadCSV(`conciliacao-canal-${from}_${to}.csv`, toCSV(rows));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Conciliação Bancária por Canal"
        subtitle="Extrato bancário × ledger financeiro consolidado por Atacado / Varejo / E-commerce"
        icon={Building2}
      />

      <Card className="p-4 flex flex-wrap items-end gap-3">
        <div>
          <Label>De</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label>Até</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="min-w-[220px]">
          <Label>Conta bancária</Label>
          <Select value={bankAccountId} onValueChange={setBankAccountId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {accounts.map((a: any) => (
                <SelectItem key={a.id} value={a.id}>{a.name} — {a.bank_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <Button variant="outline" onClick={exportCSV} disabled={!data}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {kpis!.map((k) => (
              <Card key={k.label} className="p-4">
                <div className="text-sm text-muted-foreground">{k.label}</div>
                <div className={`text-2xl font-semibold ${
                  k.tone === 'positive' ? 'text-emerald-500'
                  : k.tone === 'negative' ? 'text-red-500'
                  : k.tone === 'warn' ? 'text-amber-500'
                  : k.tone === 'ok' ? 'text-emerald-500'
                  : ''
                }`}>{k.value}</div>
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Resumo do extrato bancário</div>
              <div className="flex gap-2 text-sm">
                <Badge variant="outline">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                  Conciliado: {fmt(data.bankMatched)}
                </Badge>
                <Badge variant="outline">
                  <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                  Sem match: {fmt(data.bankUnmatched)}
                </Badge>
                <Badge variant="secondary">{data.bankTxCount} lançamentos</Badge>
              </div>
            </div>

            {data.channels.length === 0 ? (
              <EmptyState
                title="Sem lançamentos no período"
                description="Ajuste o período ou a conta bancária selecionada."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead className="text-right">Entradas</TableHead>
                    <TableHead className="text-right">Saídas</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                    <TableHead className="text-right">Conciliado</TableHead>
                    <TableHead className="text-right">Pendente</TableHead>
                    <TableHead className="text-right">Lançamentos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.channels.map((r) => {
                    const pctPend = r.ledgerReconciled + r.ledgerPending > 0
                      ? (r.ledgerPending / (r.ledgerReconciled + r.ledgerPending)) * 100
                      : 0;
                    return (
                      <TableRow key={r.canal}>
                        <TableCell className="font-medium">{CANAL_LABEL[r.canal]}</TableCell>
                        <TableCell className="text-right text-emerald-500">{fmt(r.ledgerInflow)}</TableCell>
                        <TableCell className="text-right text-red-500">{fmt(r.ledgerOutflow)}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(r.ledgerNet)}</TableCell>
                        <TableCell className="text-right">{fmt(r.ledgerReconciled)}</TableCell>
                        <TableCell className="text-right">
                          <span className={pctPend > 20 ? 'text-amber-500 font-medium' : ''}>
                            {fmt(r.ledgerPending)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{r.entries}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>

          {data.divergenceAbs > 0.01 && (
            <Card className="p-4 border-amber-500/40 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">Divergência entre extrato e ledger: {fmt(data.divergenceAbs)}</div>
                  <div className="text-muted-foreground">
                    Confira lançamentos bancários sem match ({fmt(data.bankUnmatched)}) e ledger pendente por canal.
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </PageContainer>
  );
}
