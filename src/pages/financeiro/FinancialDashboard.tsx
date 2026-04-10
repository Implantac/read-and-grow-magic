import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { KPICard } from '@/components/shared/KPICard';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useAccountsPayable } from '@/hooks/useAccountsPayable';
import { useCashFlowEntries } from '@/hooks/useCashFlow';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Wallet, Users, Building2, BarChart3 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { format, differenceInDays, eachMonthOfInterval, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatCompact = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value);

const AGING_BUCKETS = [
  { label: '1-7 dias', min: 1, max: 7, color: 'hsl(var(--chart-1))' },
  { label: '8-15 dias', min: 8, max: 15, color: 'hsl(var(--chart-2))' },
  { label: '16-30 dias', min: 16, max: 30, color: 'hsl(var(--chart-3))' },
  { label: '31-60 dias', min: 31, max: 60, color: 'hsl(var(--chart-4))' },
  { label: '+60 dias', min: 61, max: 9999, color: 'hsl(var(--chart-5))' },
];

export default function FinancialDashboard() {
  const { data: receivables = [], isLoading: loadingR } = useAccountsReceivable();
  const { data: payables = [], isLoading: loadingP } = useAccountsPayable();
  const { data: cashFlow = [], isLoading: loadingCF } = useCashFlowEntries();
  const { data: bankAccounts = [], isLoading: loadingBA } = useBankAccounts();

  const now = new Date();

  // KPIs
  const totalReceivable = receivables.filter(r => r.status !== 'paid' && r.status !== 'cancelled').reduce((s, r) => s + Number(r.open_amount ?? r.amount), 0);
  const totalPayable = payables.filter(p => p.status !== 'paid' && p.status !== 'cancelled').reduce((s, p) => s + Number(p.open_amount ?? p.amount), 0);
  const overdueReceivable = receivables.filter(r => r.status !== 'paid' && r.status !== 'cancelled' && new Date(r.due_date) < now).reduce((s, r) => s + Number(r.open_amount ?? r.amount), 0);
  const overduePayable = payables.filter(p => p.status !== 'paid' && p.status !== 'cancelled' && new Date(p.due_date) < now).reduce((s, p) => s + Number(p.open_amount ?? p.amount), 0);

  const totalBankBalance = bankAccounts.filter(b => b.active).reduce((s, b) => s + Number(b.balance), 0);
  const netPosition = totalReceivable - totalPayable;

  // Projected 30d
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + 30);
  const proj30Income = receivables.filter(r => r.status !== 'paid' && r.status !== 'cancelled' && new Date(r.due_date) <= futureDate).reduce((s, r) => s + Number(r.open_amount ?? r.amount), 0);
  const proj30Expense = payables.filter(p => p.status !== 'paid' && p.status !== 'cancelled' && new Date(p.due_date) <= futureDate).reduce((s, p) => s + Number(p.open_amount ?? p.amount), 0);
  const projectedBalance = totalBankBalance + proj30Income - proj30Expense;

  // Aging List
  const overdueItems = receivables.filter(r => r.status !== 'paid' && r.status !== 'cancelled' && new Date(r.due_date) < now);
  const agingData = AGING_BUCKETS.map(bucket => {
    const items = overdueItems.filter(r => {
      const days = differenceInDays(now, new Date(r.due_date));
      return days >= bucket.min && days <= bucket.max;
    });
    return { name: bucket.label, value: items.reduce((s, r) => s + Number(r.open_amount ?? r.amount), 0), count: items.length, color: bucket.color };
  });

  // Top devedores
  const clientDebts = new Map<string, { name: string; total: number; count: number }>();
  overdueItems.forEach(r => {
    const existing = clientDebts.get(r.client_name) || { name: r.client_name, total: 0, count: 0 };
    existing.total += Number(r.open_amount ?? r.amount);
    existing.count += 1;
    clientDebts.set(r.client_name, existing);
  });
  const topDebtors = Array.from(clientDebts.values()).sort((a, b) => b.total - a.total).slice(0, 5);

  // Despesas por categoria
  const catMap = new Map<string, number>();
  payables.filter(p => p.status !== 'cancelled').forEach(p => catMap.set(p.category, (catMap.get(p.category) || 0) + Number(p.amount)));
  const expenseByCategory = Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Monthly revenue trend
  const monthlyRevenue = useMemo(() => {
    const months = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
    return months.map(m => {
      const ms = startOfMonth(m);
      const me = endOfMonth(m);
      const received = receivables.filter(r => r.status === 'paid' && r.payment_date && isWithinInterval(new Date(r.payment_date), { start: ms, end: me })).reduce((s, r) => s + Number(r.paid_amount ?? r.amount), 0);
      const paid = payables.filter(p => p.status === 'paid' && p.payment_date && isWithinInterval(new Date(p.payment_date), { start: ms, end: me })).reduce((s, p) => s + Number(p.paid_amount ?? p.amount), 0);
      return { month: format(m, 'MMM/yy', { locale: ptBR }), receitas: received, despesas: paid, lucro: received - paid };
    });
  }, [receivables, payables]);

  // DRE Gerencial simplificado
  const dreData = useMemo(() => {
    const paidReceivables = receivables.filter(r => r.status === 'paid');
    const paidPayables = payables.filter(p => p.status === 'paid');
    const totalRevenue = paidReceivables.reduce((s, r) => s + Number(r.paid_amount ?? r.amount), 0);
    const totalCosts = paidPayables.filter(p => p.category === 'Fornecedores').reduce((s, p) => s + Number(p.paid_amount ?? p.amount), 0);
    const grossProfit = totalRevenue - totalCosts;
    const totalExpenses = paidPayables.filter(p => p.category !== 'Fornecedores').reduce((s, p) => s + Number(p.paid_amount ?? p.amount), 0);
    const netProfit = grossProfit - totalExpenses;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;
    return { totalRevenue, totalCosts, grossProfit, totalExpenses, netProfit, grossMargin, netMargin };
  }, [receivables, payables]);

  if (loadingR || loadingP || loadingCF || loadingBA) return <PageLoading message="Carregando dashboard financeiro..." />;

  return (
    <PageContainer>
      <PageHeader title="Dashboard Financeiro" description="Visão gerencial completa do financeiro" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <KPICard title="Saldo Bancário" value={formatCompact(totalBankBalance)} subtitle={`${bankAccounts.filter(b => b.active).length} contas`} icon={<Building2 className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="A Receber" value={formatCompact(totalReceivable)} subtitle={`${receivables.filter(r => r.status !== 'paid' && r.status !== 'cancelled').length} títulos`} icon={<TrendingUp className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="A Pagar" value={formatCompact(totalPayable)} subtitle={`${payables.filter(p => p.status !== 'paid' && p.status !== 'cancelled').length} títulos`} icon={<TrendingDown className="h-5 w-5" />} accentColor="warning" index={2} />
        <KPICard title="Inadimplência" value={formatCompact(overdueReceivable)} subtitle={`${overdueItems.length} vencidos`} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={3} />
        <KPICard title="Posição Líquida" value={formatCompact(netPosition)} subtitle="Receber - Pagar" icon={<DollarSign className="h-5 w-5" />} accentColor={netPosition >= 0 ? 'success' : 'danger'} index={4} />
        <KPICard title="Projeção 30d" value={formatCompact(projectedBalance)} subtitle="Saldo projetado" icon={<Wallet className="h-5 w-5" />} accentColor={projectedBalance >= 0 ? 'info' : 'danger'} index={5} />
        <KPICard title="CP Vencido" value={formatCompact(overduePayable)} subtitle="Fornecedores" icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" index={6} />
        <KPICard title="Lucro Estimado" value={formatCompact(monthlyRevenue.length > 0 ? monthlyRevenue[monthlyRevenue.length - 1].lucro : 0)} subtitle="Mês atual" icon={<BarChart3 className="h-5 w-5" />} accentColor="primary" index={7} />
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader><CardTitle className="text-base">Receitas vs Despesas (últimos 6 meses)</CardTitle></CardHeader>
        <CardContent>
          {monthlyRevenue.some(m => m.receitas > 0 || m.despesas > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">Sem dados realizados</div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Aging List - Inadimplência</CardTitle></CardHeader>
          <CardContent>
            {agingData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={agingData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="value" name="Valor Vencido" radius={[4, 4, 0, 0]}>
                    {agingData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">Nenhuma inadimplência</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Despesas por Categoria</CardTitle></CardHeader>
          <CardContent>
            {expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={expenseByCategory} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">Nenhum dado</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts Summary */}
      {bankAccounts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Contas Bancárias</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map(ba => (
                  <TableRow key={ba.id}>
                    <TableCell className="font-medium">{ba.name}</TableCell>
                    <TableCell>{ba.bank_name}</TableCell>
                    <TableCell className="capitalize">{ba.account_type}</TableCell>
                    <TableCell className={`text-right font-medium ${Number(ba.balance) >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(Number(ba.balance))}</TableCell>
                    <TableCell><Badge variant={ba.active ? 'default' : 'secondary'}>{ba.active ? 'Ativa' : 'Inativa'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Top Clientes Devedores</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Títulos</TableHead>
                <TableHead className="text-right">Total em Atraso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topDebtors.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-right">{d.count}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">{formatCurrency(d.total)}</TableCell>
                </TableRow>
              ))}
              {topDebtors.length === 0 && (
                <TableRow><TableCell colSpan={3} className="h-20 text-center text-muted-foreground">Nenhum cliente inadimplente</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
