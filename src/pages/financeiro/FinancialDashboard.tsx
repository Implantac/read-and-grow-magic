import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatBRL, formatDate } from '@/lib/formatters';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, ReferenceLine,
} from 'recharts';
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, AlertTriangle,
  Sparkles, Target, RefreshCw, ArrowRight,
} from 'lucide-react';
import { useBankAccounts } from '@/hooks/financial/useBankAccounts';
import { useFinancialLedger, type LedgerEntryRow } from '@/hooks/financial/useFinancialLedger';
import { useFinancialCategories } from '@/hooks/financial/useFinancialCategories';
import { useFinancialInsights } from '@/hooks/financial/useFinancialInsights';
import { useAccountsReceivable } from '@/hooks/financial/useAccountsReceivable';
import { useAccountsPayable } from '@/hooks/financial/useAccountsPayable';

const fmtCompact = (v: number) =>
  new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(v ?? 0);
const fmtDate = (s: string) => formatDate(s);
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

type RangePreset = '30' | 'mtd' | '90';

function getRange(preset: RangePreset): { from: string; to: string; label: string } {
  const today = new Date();
  const to = isoDay(today);
  if (preset === 'mtd') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: isoDay(first), to, label: 'Mês atual' };
  }
  if (preset === '90') {
    const d = new Date(today); d.setDate(d.getDate() - 90);
    return { from: isoDay(d), to, label: 'Últimos 90 dias' };
  }
  const d = new Date(today); d.setDate(d.getDate() - 30);
  return { from: isoDay(d), to, label: 'Últimos 30 dias' };
}

const SEVERITY_BADGE: Record<string, { bg: string; label: string }> = {
  critical: { bg: 'bg-destructive text-destructive-foreground', label: 'Crítico' },
  high: { bg: 'bg-destructive/80 text-destructive-foreground', label: 'Alto' },
  medium: { bg: 'bg-warning/80 text-warning-foreground', label: 'Médio' },
  low: { bg: 'bg-muted text-muted-foreground', label: 'Baixo' },
};

export default function FinancialDashboard() {
  const [preset, setPreset] = useState<RangePreset>('30');
  const range = useMemo(() => getRange(preset), [preset]);

  const { data: banks = [], isLoading: loadingBanks } = useBankAccounts();
  const { data: categories = [] } = useFinancialCategories();
  const { data: ledger = [], isLoading: loadingLedger, refetch: refetchLedger } =
    useFinancialLedger({ from: range.from, to: range.to });
  const { data: insights, isLoading: loadingInsights, refetch: refetchInsights } = useFinancialInsights();
  const { data: receivables = [] } = useAccountsReceivable();
  const { data: payables = [] } = useAccountsPayable();

  const currentBalance = useMemo(
    () => banks.reduce((s, b) => s + Number(b.balance ?? 0), 0),
    [banks],
  );

  const { inflow, outflow, net } = useMemo(() => {
    let i = 0, o = 0;
    for (const e of ledger) {
      if (e.type === 'inflow') i += Number(e.amount); else o += Number(e.amount);
    }
    return { inflow: i, outflow: o, net: i - o };
  }, [ledger]);

  const cashflowSeries = useMemo(() => {
    const map = new Map<string, { date: string; entradas: number; saidas: number; saldo: number; label: string }>();
    const start = new Date(range.from);
    const end = new Date(range.to);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const k = isoDay(d);
      map.set(k, {
        date: k, entradas: 0, saidas: 0, saldo: 0,
        label: new Date(k).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      });
    }
    for (const e of ledger) {
      const k = e.entry_date.slice(0, 10);
      const row = map.get(k);
      if (!row) continue;
      if (e.type === 'inflow') row.entradas += Number(e.amount);
      else row.saidas += Number(e.amount);
    }
    let acc = 0;
    return Array.from(map.values()).map(r => {
      acc += r.entradas - r.saidas;
      return { ...r, saldo: acc };
    });
  }, [ledger, range]);

  const categoryPie = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of ledger) {
      if (e.type !== 'outflow') continue;
      const cat = categories.find(c => c.id === e.category_id);
      const name = cat?.name ?? 'Sem categoria';
      m.set(name, (m.get(name) ?? 0) + Number(e.amount));
    }
    return Array.from(m.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [ledger, categories]);

  const PIE_COLORS = [
    'hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))',
    'hsl(var(--success))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted-foreground))',
  ];

  const projection = useMemo(() => {
    const today = new Date();
    const todayIso = isoDay(today);
    const limits = [30, 60, 90].map(d => {
      const x = new Date(today); x.setDate(x.getDate() + d);
      return { days: d, iso: isoDay(x) };
    });
    const rec = receivables.filter((r: any) => (r.status ?? 'pending') !== 'paid');
    const pay = payables.filter((p: any) => (p.status ?? 'pending') !== 'paid');
    const sumIn = (limit: string) =>
      rec.filter((r: any) => {
        const d = (r.dueDate ?? r.due_date ?? '').slice(0, 10);
        return d >= todayIso && d <= limit;
      }).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
    const sumOut = (limit: string) =>
      pay.filter((p: any) => {
        const d = (p.dueDate ?? p.due_date ?? '').slice(0, 10);
        return d >= todayIso && d <= limit;
      }).reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);
    return limits.map(l => ({
      label: `${l.days}d`,
      saldo: currentBalance + sumIn(l.iso) - sumOut(l.iso),
      entradas: sumIn(l.iso),
      saidas: sumOut(l.iso),
    }));
  }, [receivables, payables, currentBalance]);

  const projected30 = projection[0]?.saldo ?? currentBalance;
  const handleRefresh = () => { refetchLedger(); refetchInsights(); };

  if (loadingBanks && loadingLedger) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Painel Financeiro Executivo"
        description={`Visão consolidada do ledger · ${range.label}`}
      >
        <Select value={preset} onValueChange={(v) => setPreset(v as RangePreset)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="mtd">Mês atual</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Saldo Atual" value={formatBRL(currentBalance)}
          subtitle={`${banks.length} contas ativas`}
          icon={<Wallet className="h-5 w-5" />} tone={currentBalance < 0 ? 'danger' : 'primary'} />
        <KpiCard title="Entradas" value={formatBRL(inflow)} subtitle={range.label}
          icon={<ArrowDownCircle className="h-5 w-5" />} tone="success" />
        <KpiCard title="Saídas" value={formatBRL(outflow)} subtitle={range.label}
          icon={<ArrowUpCircle className="h-5 w-5" />} tone="warning" />
        <KpiCard title="Saldo Projetado 30d" value={formatBRL(projected30)}
          subtitle={`Líquido período: ${formatBRL(net)}`}
          icon={<TrendingUp className="h-5 w-5" />} tone={projected30 < 0 ? 'danger' : 'success'} />
      </div>

      {insights && (
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Saúde Financeira (IA)</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Score baseado em saldo, projeção e inadimplência reais
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-3xl font-bold leading-none">{insights.score}</div>
                <div className="text-xs text-muted-foreground">/100</div>
              </div>
              <Badge variant="outline" className="text-base px-3 py-1">{insights.scoreGrade}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {insights.insights.slice(0, 4).map((ins, i) => {
              const sev = SEVERITY_BADGE[ins.severity] ?? SEVERITY_BADGE.low;
              return (
                <div key={i} className="flex gap-3 rounded-lg border p-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{ins.title}</span>
                      <Badge className={`${sev.bg} text-[10px] px-1.5 py-0`}>{sev.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ins.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
      {loadingInsights && <Skeleton className="h-32" />}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fluxo de Caixa Real</CardTitle>
            <p className="text-xs text-muted-foreground">Saldo acumulado no período (ledger)</p>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  formatter={(v: any) => formatBRL(Number(v))}
                />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" fill="url(#gradSaldo)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Despesas por Categoria</CardTitle>
            <p className="text-xs text-muted-foreground">Top 7 do período</p>
          </CardHeader>
          <CardContent className="h-[320px]">
            {categoryPie.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sem despesas categorizadas no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {categoryPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatBRL(Number(v))}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Projeção de Saldo (Contas em aberto)
            </CardTitle>
            <p className="text-xs text-muted-foreground">Baseado em recebíveis e a pagar não liquidados</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/financeiro/fluxo">Ver fluxo completo <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {projection.map((p) => (
            <div key={p.label} className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">Em {p.label}</div>
              <div className={`mt-1 text-2xl font-bold ${p.saldo < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {formatBRL(p.saldo)}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="text-success">+ {formatBRL(p.entradas)}</div>
                <div className="text-destructive">− {formatBRL(p.saidas)}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <Tabs defaultValue="all">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">Movimentações do Ledger</CardTitle>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="in">Entradas</TabsTrigger>
                <TabsTrigger value="out">Saídas</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="all" className="mt-3"><LedgerTable rows={ledger} /></TabsContent>
            <TabsContent value="in" className="mt-3"><LedgerTable rows={ledger.filter(l => l.type === 'inflow')} /></TabsContent>
            <TabsContent value="out" className="mt-3"><LedgerTable rows={ledger.filter(l => l.type === 'outflow')} /></TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </PageContainer>
  );
}

function KpiCard({
  title, value, subtitle, icon, tone,
}: {
  title: string; value: string; subtitle?: string;
  icon: React.ReactNode; tone: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const toneCls = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
  }[tone];
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`mt-1 text-2xl font-bold ${tone === 'danger' ? 'text-destructive' : 'text-foreground'}`}>
              {value}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`rounded-lg p-2 ${toneCls}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function LedgerTable({ rows }: { rows: LedgerEntryRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Nenhuma movimentação no período.
      </div>
    );
  }
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Método</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 50).map((r) => (
            <TableRow key={r.id}>
              <TableCell className="text-sm">{fmtDate(r.entry_date)}</TableCell>
              <TableCell className="text-sm max-w-[360px] truncate">{r.description}</TableCell>
              <TableCell className="text-xs">
                <Badge variant="outline" className="capitalize">{r.source}</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{r.payment_method ?? '—'}</TableCell>
              <TableCell className={`text-right font-semibold ${r.type === 'inflow' ? 'text-success' : 'text-destructive'}`}>
                {r.type === 'inflow' ? '+' : '−'} {formatBRL(Number(r.amount))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > 50 && (
        <div className="border-t p-2 text-center text-xs text-muted-foreground">
          Exibindo 50 de {rows.length} lançamentos
        </div>
      )}
    </div>
  );
}
