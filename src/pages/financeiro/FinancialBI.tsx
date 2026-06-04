import { useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFinancialLedger } from '@/hooks/useFinancialLedger';
import { useBankAccounts } from '@/hooks/financial/useBankAccounts';
import { useFinancialInsights } from '@/hooks/useFinancialInsights';
import { useLatestHealthScore } from '@/hooks/useFinancialIntelligence';
import { useAccountsReceivable } from '@/hooks/financial/useAccountsReceivable';
import { useAccountsPayable } from '@/hooks/financial/useAccountsPayable';
import { Wallet, TrendingUp, TrendingDown, Activity, Brain, RefreshCw } from 'lucide-react';
import { formatBRL, formatDate } from '@/lib/formatters';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { useComputeIntelligence } from '@/hooks/useFinancialIntelligence';

const fmtFull = (v: number) => formatBRL(v);

const PALETTE = ['hsl(var(--primary))', 'hsl(var(--accent))', '#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#eab308', '#06b6d4'];

export default function FinancialBI() {
  const { data: ledger = [], isLoading: ll } = useFinancialLedger();
  const { data: banks = [] } = useBankAccounts();
  const { data: insights } = useFinancialInsights();
  const { data: health } = useLatestHealthScore();
  const { data: receivables = [] } = useAccountsReceivable();
  const { data: payables = [] } = useAccountsPayable();
  const compute = useComputeIntelligence();

  const totalBalance = useMemo(() => banks.reduce((s, b) => s + Number(b.balance ?? 0), 0), [banks]);

  const last30 = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const map = new Map<string, { date: string; in: number; out: number }>();
    for (let i = 30; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      map.set(k, { date: k.slice(5), in: 0, out: 0 });
    }
    ledger.forEach(l => {
      const k = l.entry_date?.slice(0, 10);
      const row = map.get(k);
      if (!row) return;
      if (l.type === 'inflow') row.in += Number(l.amount);
      else row.out += Number(l.amount);
    });
    return Array.from(map.values());
  }, [ledger]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    ledger.filter(l => l.type === 'outflow').forEach(l => {
      const cat = (l as any).category_name || l.source || 'Outros';
      m.set(cat, (m.get(cat) ?? 0) + Number(l.amount));
    });
    return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [ledger]);

  const projection = useMemo(() => {
    const now = new Date();
    const day = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    let bal = totalBalance;
    const points = [{ day: 'Hoje', balance: bal }];
    for (let i = 1; i <= 90; i++) {
      const dStr = day(i);
      const inflow = receivables.filter(r => r.status === 'pending' && r.due_date?.slice(0, 10) === dStr)
        .reduce((s, r) => s + Number(r.amount), 0);
      const outflow = payables.filter(p => p.status === 'pending' && p.due_date?.slice(0, 10) === dStr)
        .reduce((s, p) => s + Number(p.amount), 0);
      bal += inflow - outflow;
      if (i === 30 || i === 60 || i === 90) points.push({ day: `+${i}d`, balance: bal });
    }
    return points;
  }, [totalBalance, receivables, payables]);

  const inflow30 = last30.reduce((s, d) => s + d.in, 0);
  const outflow30 = last30.reduce((s, d) => s + d.out, 0);

  if (ll) {
    return (
      <PageContainer>
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-80" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="BI Financeiro" description="Visão executiva em tempo real — saldo, fluxo, projeção e categorias">
        <Button variant="outline" size="sm" onClick={() => compute.mutate()} disabled={compute.isPending} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${compute.isPending ? 'animate-spin' : ''}`} /> Recomputar IA
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Saldo Total" value={formatBRL(totalBalance)} subtitle={`${banks.length} contas ativas`} icon={<Wallet className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Entradas (30d)" value={formatBRL(inflow30)} subtitle="Ledger consolidado" icon={<TrendingUp className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="Saídas (30d)" value={formatBRL(outflow30)} subtitle={`Líquido: ${formatBRL(inflow30 - outflow30)}`} icon={<TrendingDown className="h-5 w-5" />} accentColor="warning" index={2} />
        <KPICard
          title="Score Financeiro"
          value={health?.score_total ? `${health.score_total} (${health.score_grade})` : (insights?.scoreGrade ?? '—')}
          subtitle={health?.cash_runway_days ? `Runway: ${health.cash_runway_days}d` : 'IA Financeira'}
          icon={<Brain className="h-5 w-5" />}
          accentColor="primary"
          index={3}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Fluxo de caixa — últimos 30 dias</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={last30}>
                <defs>
                  <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => formatBRL(v)} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(v: number) => fmtFull(v)} />
                <Area type="monotone" dataKey="in" name="Entradas" stroke="hsl(var(--primary))" fill="url(#gIn)" />
                <Area type="monotone" dataKey="out" name="Saídas" stroke="hsl(var(--destructive))" fill="url(#gOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Projeção 30/60/90</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projection}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => formatBRL(v)} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(v: number) => fmtFull(v)} />
                <Bar dataKey="balance" name="Saldo projetado" radius={[8, 8, 0, 0]}>
                  {projection.map((p, i) => (
                    <Cell key={i} fill={p.balance < 0 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Despesas por categoria</CardTitle></CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Sem despesas no ledger ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                    {byCategory.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Últimas movimentações no ledger</CardTitle></CardHeader>
          <CardContent>
            {ledger.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Nenhum lançamento registrado ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.slice(0, 10).map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{formatDate(l.entry_date)}</TableCell>
                      <TableCell className="text-sm">{l.description}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{l.source}</Badge></TableCell>
                      <TableCell className={`text-right font-mono text-sm ${l.type === 'inflow' ? 'text-green-500' : 'text-red-500'}`}>
                        {l.type === 'inflow' ? '+' : '-'} {fmtFull(Number(l.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
