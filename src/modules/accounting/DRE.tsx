import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { ExportButton } from '@/shared/components/ExportButton';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { MarginTrendChart } from '@/components/accounting/MarginTrendChart';
import { ExpenseBreakdownChart } from '@/components/accounting/ExpenseBreakdownChart';
import { RevenueExpenseTrendChart } from '@/components/accounting/RevenueExpenseTrendChart';
import { useAccountsReceivable } from '@/hooks/financial/useAccountsReceivable';
import { useAccountsPayable } from '@/hooks/financial/useAccountsPayable';
import { formatBRL, formatBRLCompact } from '@/lib/formatters';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/ui/base/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useState } from 'react';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, format, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ExportColumn } from '@/lib/exportUtils';

const formatCompact = (value: number) =>
  formatBRLCompact(value);

export default function DREPage() {
  const { data: receivables = [], isLoading: loadingR } = useAccountsReceivable();
  const { data: payables = [], isLoading: loadingP } = useAccountsPayable();
  const [period, setPeriod] = useState('current');

  const now = new Date();

  const periodRange = useMemo(() => {
    switch (period) {
      case 'previous': return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'quarter': return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'semester': return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case 'year': return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) };
      default: return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period]);

  const prevRange = useMemo(() => {
    const diff = periodRange.end.getTime() - periodRange.start.getTime();
    const prevEnd = new Date(periodRange.start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diff);
    return { start: prevStart, end: prevEnd };
  }, [periodRange]);

  const computeDRE = (range: { start: Date; end: Date }) => {
    const paidRec = receivables.filter(r => (r as any).status === 'paid' && (r as any).payment_date && isWithinInterval(new Date((r as any).payment_date), range));
    const paidPay = payables.filter(p => (p as any).status === 'paid' && (p as any).payment_date && isWithinInterval(new Date((p as any).payment_date), range));

    const revenue = paidRec.reduce((s, r) => s + Number((r as any).paid_amount ?? (r as any).amount), 0);
    const costCategories = ['Fornecedores'];
    const costs = paidPay.filter(p => costCategories.includes((p as any).category)).reduce((s, p) => s + Number((p as any).paid_amount ?? (p as any).amount), 0);
    const grossProfit = revenue - costs;
    const opex = paidPay.filter(p => !costCategories.includes((p as any).category)).reduce((s, p) => s + Number((p as any).paid_amount ?? (p as any).amount), 0);

    const netProfit = grossProfit - opex;

    // Breakdown by category
    const expenseBreakdown = new Map<string, number>();
    paidPay.forEach(p => expenseBreakdown.set((p as any).category, (expenseBreakdown.get((p as any).category) || 0) + Number((p as any).paid_amount ?? (p as any).amount)));

    return { revenue, costs, grossProfit, opex, netProfit, expenseBreakdown };
  };

  const current = useMemo(() => computeDRE(periodRange), [receivables, payables, periodRange]);
  const previous = useMemo(() => computeDRE(prevRange), [receivables, payables, prevRange]);

  const variation = (cur: number, prev: number) => prev !== 0 ? ((cur - prev) / Math.abs(prev)) * 100 : cur > 0 ? 100 : 0;

  const dreRows = [
    { id: '1', description: 'Receita Bruta', current: current.revenue, previous: previous.revenue, level: 0, isTotal: true },
    { id: '2', description: '(-) Custo dos Produtos/Serviços', current: -current.costs, previous: -previous.costs, level: 1, isTotal: false },
    { id: '3', description: '= Lucro Bruto', current: current.grossProfit, previous: previous.grossProfit, level: 0, isTotal: true },
    { id: '4', description: '(-) Despesas Operacionais', current: -current.opex, previous: -previous.opex, level: 1, isTotal: false },
    ...Array.from(current.expenseBreakdown.entries())
      .filter(([cat]) => cat !== 'Fornecedores')
      .map(([cat, val], i) => ({
        id: `4.${i}`,
        description: `   ${cat}`,
        current: -val,
        previous: -(previous.expenseBreakdown.get(cat) || 0),
        level: 2,
        isTotal: false,
      })),
    { id: '5', description: '= Lucro Líquido', current: current.netProfit, previous: previous.netProfit, level: 0, isTotal: true },
  ];

  const grossMargin = current.revenue > 0 ? (current.grossProfit / current.revenue * 100).toFixed(1) : '0.0';
  const netMargin = current.revenue > 0 ? (current.netProfit / current.revenue * 100).toFixed(1) : '0.0';
  const revenueVar = variation(current.revenue, previous.revenue);
  const profitVar = variation(current.netProfit, previous.netProfit);

  // Monthly comparison chart
  const monthlyComparison = useMemo(() => {
    const months = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
    return months.map(m => {
      const ms = startOfMonth(m);
      const me = endOfMonth(m);
      const rev = receivables.filter(r => (r as any).status === 'paid' && (r as any).payment_date && isWithinInterval(new Date((r as any).payment_date), { start: ms, end: me })).reduce((s, r) => s + Number((r as any).paid_amount ?? (r as any).amount), 0);
      const exp = payables.filter(p => (p as any).status === 'paid' && (p as any).payment_date && isWithinInterval(new Date((p as any).payment_date), { start: ms, end: me })).reduce((s, p) => s + Number((p as any).paid_amount ?? (p as any).amount), 0);

      return { month: format(m, 'MMM/yy', { locale: ptBR }), receitas: rev, despesas: exp, lucro: rev - exp };
    });
  }, [receivables, payables]);

  const exportColumns: ExportColumn[] = [
    { key: 'description', label: 'Descrição' },
    { key: 'current', label: 'Período Atual', format: (v) => formatBRL(Number(v)) },
    { key: 'previous', label: 'Período Anterior', format: (v) => formatBRL(Number(v)) },
    { key: 'variation', label: 'Variação %' },
  ];
  const exportData = dreRows.map(r => ({ ...r, variation: `${variation(r.current, r.previous).toFixed(1)}%` }));

  if (loadingR || loadingP) return <PageLoading message="Carregando DRE..." />;

  return (
    <PageContainer>
      <PageHeader title="Demonstração do Resultado (DRE)" description="Análise gerencial de receitas e despesas">
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Mês Atual</SelectItem>
              <SelectItem value="previous">Mês Anterior</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="semester">Semestre</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
          <ExportButton data={exportData as unknown as Record<string, unknown>[]} columns={exportColumns} filename="dre" />
        </div>
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Receita Bruta</p>
            <p className="text-2xl font-bold">{formatBRL(current.revenue)}</p>
            <div className={cn('flex items-center gap-1 text-xs mt-1', revenueVar >= 0 ? 'text-success' : 'text-destructive')}>
              {revenueVar >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(revenueVar).toFixed(1)}% vs anterior
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Lucro Bruto</p>
            <p className="text-2xl font-bold">{formatBRL(current.grossProfit)}</p>
            <p className="text-xs text-muted-foreground mt-1">Margem: {grossMargin}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Lucro Líquido</p>
            <p className={cn('text-2xl font-bold', current.netProfit >= 0 ? 'text-success' : 'text-destructive')}>{formatBRL(current.netProfit)}</p>
            <p className="text-xs text-muted-foreground mt-1">Margem: {netMargin}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Variação Lucro</p>
            <p className={cn('text-2xl font-bold', profitVar >= 0 ? 'text-success' : 'text-destructive')}>
              {profitVar >= 0 ? '+' : ''}{profitVar.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">vs período anterior</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* DRE Table */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Demonstração do Resultado</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Atual</TableHead>
                  <TableHead className="text-right">Anterior</TableHead>
                  <TableHead className="text-right">Var. %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dreRows.map((item) => {
                  const var_ = variation(item.current, item.previous);
                  return (
                    <TableRow key={item.id} className={cn(item.isTotal && 'bg-muted/50 font-bold')}>
                      <TableCell style={{ paddingLeft: `${item.level * 24 + 16}px` }}>{item.description}</TableCell>
                      <TableCell className={cn('text-right', item.current < 0 && 'text-destructive')}>{formatBRL(item.current)}</TableCell>
                      <TableCell className={cn('text-right', item.previous < 0 && 'text-destructive')}>{formatBRL(item.previous)}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn('text-xs', var_ > 0 ? 'text-success' : var_ < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                          {var_ > 0 ? '+' : ''}{var_.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {dreRows.length <= 2 && current.revenue === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum dado realizado no período</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Comparison chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Comparativo Mensal</CardTitle></CardHeader>
          <CardContent>
            {monthlyComparison.some(m => m.receitas > 0 || m.despesas > 0) ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="month" type="category" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Legend />
                  <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">Nenhum dado disponível</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MarginTrendChart />
        <ExpenseBreakdownChart />
      </div>

      <RevenueExpenseTrendChart />
    </PageContainer>
  );
}
