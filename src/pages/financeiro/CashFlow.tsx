import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Download, Filter, Calendar } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { KPICard } from '@/components/shared/KPICard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCashFlowEntries } from '@/hooks/useCashFlow';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useAccountsPayable } from '@/hooks/useAccountsPayable';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isWithinInterval, eachMonthOfInterval, eachDayOfInterval, subMonths, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

import { formatBRL, formatBRLCompact } from '@/lib/formatters';
const chartConfig = {
  receitas: { label: 'Receitas', color: 'hsl(var(--success))' },
  despesas: { label: 'Despesas', color: 'hsl(var(--destructive))' },
  saldo: { label: 'Saldo', color: 'hsl(var(--primary))' },
};

const formatCompact = (value: number) =>
  formatBRLCompact(value);

export default function CashFlow() {
  const { data: entries = [], isLoading: loadingCF } = useCashFlowEntries();
  const { data: receivables = [], isLoading: loadingR } = useAccountsReceivable();
  const { data: payables = [], isLoading: loadingP } = useAccountsPayable();
  const [periodFilter, setPeriodFilter] = useState('month');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const now = new Date();

  const periodRange = useMemo(() => {
    switch (periodFilter) {
      case 'week': return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
      case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter': return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case 'year': return { start: startOfYear(now), end: endOfYear(now) };
      default: return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [periodFilter]);

  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const inPeriod = isWithinInterval(entryDate, periodRange);
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    return inPeriod && matchesType;
  });

  const totalIncome = filteredEntries.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0);
  const totalExpense = filteredEntries.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0);
  const currentBalance = entries.length > 0 ? Number(entries[entries.length - 1].balance) : 0;

  // Projected balance: current + pending receivables - pending payables (next 30d)
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + 30);
  const projectedIncome = receivables
    .filter(r => r.status !== 'paid' && r.status !== 'cancelled' && new Date(r.due_date) <= futureDate)
    .reduce((s, r) => s + Number(r.open_amount ?? r.amount), 0);
  const projectedExpense = payables
    .filter(p => p.status !== 'paid' && p.status !== 'cancelled' && new Date(p.due_date) <= futureDate)
    .reduce((s, p) => s + Number(p.open_amount ?? p.amount), 0);
  const projectedBalance = currentBalance + projectedIncome - projectedExpense;

  // Monthly trend chart data (last 6 months)
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
    return months.map(m => {
      const monthStart = startOfMonth(m);
      const monthEnd = endOfMonth(m);
      const monthEntries = entries.filter(e => {
        const d = new Date(e.date);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
      });
      return {
        month: format(m, 'MMM/yy', { locale: ptBR }),
        receitas: monthEntries.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0),
        despesas: monthEntries.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0),
      };
    });
  }, [entries]);

  // Expense by category
  const expenseByCat = useMemo(() => {
    const map = new Map<string, number>();
    filteredEntries.filter(e => e.type === 'expense').forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + Number(e.amount));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredEntries]);

  // Daily 30-day projection
  const dailyProjection = useMemo(() => {
    const days = eachDayOfInterval({ start: now, end: addDays(now, 30) });
    let runningBalance = currentBalance;
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayIncome = receivables
        .filter(r => r.status !== 'paid' && r.status !== 'cancelled' && r.due_date === dayStr)
        .reduce((s, r) => s + Number(r.open_amount ?? r.amount), 0);
      const dayExpense = payables
        .filter(p => p.status !== 'paid' && p.status !== 'cancelled' && p.due_date === dayStr)
        .reduce((s, p) => s + Number(p.open_amount ?? p.amount), 0);
      runningBalance = runningBalance + dayIncome - dayExpense;
      return {
        day: format(day, 'dd/MM', { locale: ptBR }),
        receitas: dayIncome,
        despesas: dayExpense,
        saldo: runningBalance,
      };
    });
  }, [currentBalance, receivables, payables]);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (loadingCF || loadingR || loadingP) return <PageLoading message="Carregando fluxo de caixa..." />;

  return (
    <PageContainer>
      <PageHeader title="Fluxo de Caixa" description="Acompanhe as movimentações financeiras">
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-40"><Calendar className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="quarter">Este Trimestre</SelectItem>
            <SelectItem value="year">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Saldo Atual" value={formatBRL(currentBalance)} icon={<Wallet className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Entradas (Período)" value={formatBRL(totalIncome)} icon={<TrendingUp className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="Saídas (Período)" value={formatBRL(totalExpense)} icon={<TrendingDown className="h-5 w-5" />} accentColor="danger" index={2} />
        <KPICard title="Saldo Projetado 30d" value={formatBRL(projectedBalance)} subtitle={`+${formatCompact(projectedIncome)} / -${formatCompact(projectedExpense)}`} icon={<Wallet className="h-5 w-5" />} accentColor={projectedBalance >= 0 ? 'info' : 'danger'} index={3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Evolução Mensal</CardTitle></CardHeader>
          <CardContent>
            {monthlyData.some(m => m.receitas > 0 || m.despesas > 0) ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => formatCompact(v)} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="receitas" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorReceitas)" strokeWidth={2} />
                    <Area type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorDespesas)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sem dados no período</div>
            )}
          </CardContent>
      </Card>

      {/* Daily 30-day Projection */}
      <Card>
        <CardHeader><CardTitle>Projeção Diária (30 dias)</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={{ ...chartConfig, saldo: { label: 'Saldo Projetado', color: 'hsl(var(--primary))' } }} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyProjection}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" interval={2} />
                <YAxis className="text-xs" tickFormatter={(v) => formatCompact(v)} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSaldo)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
          <CardHeader><CardTitle>Despesas por Categoria</CardTitle></CardHeader>
          <CardContent>
            {expenseByCat.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={expenseByCat} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expenseByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Nenhum dado</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Comparativo Mensal</CardTitle></CardHeader>
        <CardContent>
          {monthlyData.some(m => m.receitas > 0 || m.despesas > 0) ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => formatCompact(v)} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sem dados</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Movimentações</CardTitle>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="income">Entradas</SelectItem>
                <SelectItem value="expense">Saídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {entry.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                      <span className="font-medium">{entry.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>{entry.category}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.reference || '-'}</TableCell>
                  <TableCell className={`text-right font-medium ${entry.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                    {entry.type === 'income' ? '+' : '-'} {formatBRL(Number(entry.amount))}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatBRL(Number(entry.balance))}</TableCell>
                </TableRow>
              ))}
              {filteredEntries.length === 0 && (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nenhuma movimentação no período</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
