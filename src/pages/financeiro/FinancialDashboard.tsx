import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { KPICard } from '@/components/shared/KPICard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useAccountsPayable } from '@/hooks/useAccountsPayable';
import { useCashFlowEntries } from '@/hooks/useCashFlow';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Clock, Users, Wallet, BarChart3 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { format, differenceInDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
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

  if (loadingR || loadingP || loadingCF) return <PageLoading message="Carregando dashboard financeiro..." />;

  const now = new Date();

  // KPIs
  const totalReceivable = receivables.filter(r => r.status !== 'paid' && r.status !== 'cancelled').reduce((s, r) => s + Number(r.amount), 0);
  const totalPayable = payables.filter(p => p.status !== 'paid' && p.status !== 'cancelled').reduce((s, p) => s + Number(p.amount), 0);
  const overdueReceivable = receivables.filter(r => r.status === 'overdue' || (r.status === 'pending' && new Date(r.due_date) < now)).reduce((s, r) => s + Number(r.amount), 0);
  const overduePayable = payables.filter(p => p.status === 'overdue' || (p.status === 'pending' && new Date(p.due_date) < now)).reduce((s, p) => s + Number(p.amount), 0);
  const receivedTotal = receivables.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0);
  const paidTotal = payables.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const netCash = receivedTotal - paidTotal;

  // Aging List
  const overdueItems = receivables.filter(r => r.status !== 'paid' && r.status !== 'cancelled' && new Date(r.due_date) < now);
  const agingData = AGING_BUCKETS.map(bucket => {
    const items = overdueItems.filter(r => {
      const days = differenceInDays(now, new Date(r.due_date));
      return days >= bucket.min && days <= bucket.max;
    });
    return { name: bucket.label, value: items.reduce((s, r) => s + Number(r.amount), 0), count: items.length, color: bucket.color };
  });

  // Top devedores
  const clientDebts = new Map<string, { name: string; total: number; count: number }>();
  overdueItems.forEach(r => {
    const existing = clientDebts.get(r.client_name) || { name: r.client_name, total: 0, count: 0 };
    existing.total += Number(r.amount);
    existing.count += 1;
    clientDebts.set(r.client_name, existing);
  });
  const topDebtors = Array.from(clientDebts.values()).sort((a, b) => b.total - a.total).slice(0, 5);

  // Despesas por categoria
  const catMap = new Map<string, number>();
  payables.forEach(p => {
    catMap.set(p.category, (catMap.get(p.category) || 0) + Number(p.amount));
  });
  const expenseByCategory = Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <PageContainer>
      <PageHeader title="Dashboard Financeiro" description="Visão gerencial completa do financeiro" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="A Receber" value={formatCompact(totalReceivable)} subtitle={`${receivables.filter(r => r.status === 'pending').length} títulos`} icon={<TrendingUp className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="A Pagar" value={formatCompact(totalPayable)} subtitle={`${payables.filter(p => p.status === 'pending').length} títulos`} icon={<TrendingDown className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Inadimplência" value={formatCompact(overdueReceivable)} subtitle={`${overdueItems.length} títulos vencidos`} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={2} />
        <KPICard title="Saldo Líquido" value={formatCompact(netCash)} subtitle="Recebido - Pago" icon={<Wallet className="h-5 w-5" />} accentColor={netCash >= 0 ? 'success' : 'danger'} index={3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Aging List Chart */}
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
                    {agingData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">Nenhuma inadimplência</div>
            )}
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        <Card>
          <CardHeader><CardTitle className="text-base">Despesas por Categoria</CardTitle></CardHeader>
          <CardContent>
            {expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={expenseByCategory} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expenseByCategory.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
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

      {/* Top Devedores */}
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
