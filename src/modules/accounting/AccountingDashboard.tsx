import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Button } from '@/ui/base/button';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useAccountingDashboardData } from '@/hooks/accounting/useAccountingDashboard';
import { formatBRL } from '@/lib/formatters';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Skeleton } from '@/ui/base/skeleton';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function AccountingDashboard() {
  const { data: stats, isLoading, refetch } = useAccountingDashboardData();

  const totalEntries = stats?.total_entries || 0;
  const postedEntries = stats?.posted_entries || 0;
  const pendingEntries = stats?.pending_entries || 0;
  const postedValue = stats?.total_posted_value || 0;

  const revenueExpenseTrend = stats?.revenue_expense_trend || [];
  const monthlyEquityEvolution = stats?.monthly_equity_evolution || [];

  return (
    <PageContainer>
      <PageHeader title="Dashboard Contábil" description="Visão geral da saúde financeira e lançamentos">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard 
          title="Total de Lançamentos" 
          value={String(totalEntries)} 
          icon={<FileText className="h-5 w-5" />} 
          accentColor="primary" 
          index={0} 
        />
        <KPICard 
          title="Lançamentos Postados" 
          value={String(postedEntries)} 
          icon={<CheckCircle className="h-5 w-5" />} 
          accentColor="success" 
          index={1} 
        />
        <KPICard 
          title="Pendentes/Rascunho" 
          value={String(pendingEntries)} 
          icon={<Clock className="h-5 w-5" />} 
          accentColor="warning" 
          index={2} 
        />
        <KPICard 
          title="Valor Total Postado" 
          value={formatBRL(postedValue)} 
          icon={<DollarSign className="h-5 w-5" />} 
          accentColor="info" 
          index={3} 
        />

      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Receita vs Despesa (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueExpenseTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v/1000}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Receita" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="expense" name="Despesa" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Evolução do Patrimônio Líquido
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyEquityEvolution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v/1000}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Bar dataKey="value" name="Patrimônio" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
