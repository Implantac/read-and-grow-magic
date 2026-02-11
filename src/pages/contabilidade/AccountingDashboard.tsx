import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  DollarSign,
  Scale,
  BarChart3,
  PiggyBank,
  Percent,
} from 'lucide-react';
import { EquityEvolutionChart } from '@/components/contabilidade/EquityEvolutionChart';
import { MarginTrendChart } from '@/components/contabilidade/MarginTrendChart';
import { RevenueExpenseTrendChart } from '@/components/contabilidade/RevenueExpenseTrendChart';
import { ExpenseBreakdownChart } from '@/components/contabilidade/ExpenseBreakdownChart';
import { FinancialIndicatorsPanel } from '@/components/contabilidade/FinancialIndicatorsPanel';
import { TrialBalanceChart } from '@/components/contabilidade/TrialBalanceChart';
import { mockDRE, mockBalanceSheet, mockJournalEntries } from '@/data/accountingMockData';
import { revenueVsExpenseTrend, financialIndicators } from '@/data/accountingChartData';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatCompact = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function AccountingDashboard() {
  // DRE KPIs
  const revenue = mockDRE.find((d) => d.code === '1')!;
  const grossProfit = mockDRE.find((d) => d.code === '5')!;
  const netIncome = mockDRE.find((d) => d.code === '9')!;
  const grossMargin = ((grossProfit.currentPeriod / revenue.currentPeriod) * 100).toFixed(1);
  const netMargin = ((netIncome.currentPeriod / revenue.currentPeriod) * 100).toFixed(1);

  // Balance Sheet KPIs
  const totalAssets = mockBalanceSheet.find((a) => a.code === '1')!;
  const totalLiabilities = mockBalanceSheet.find((a) => a.code === '2')!;
  const totalEquity = mockBalanceSheet.find((a) => a.code === '3')!;

  // Journal entries stats
  const postedEntries = mockJournalEntries.filter((e) => e.status === 'posted').length;
  const draftEntries = mockJournalEntries.filter((e) => e.status === 'draft').length;
  const totalEntries = mockJournalEntries.length;

  // Latest period from trend
  const latestPeriod = revenueVsExpenseTrend[revenueVsExpenseTrend.length - 1];

  // Liquidity
  const liquidezCorrente = financialIndicators.find((i) => i.name === 'Liquidez Corrente')!;
  const roe = financialIndicators.find((i) => i.name === 'ROE')!;

  // Asset composition
  const assetPie = [
    { name: 'Ativo Circulante', value: 1450000 },
    { name: 'Ativo Não Circulante', value: 1400000 },
  ];

  const liabilityPie = [
    { name: 'Passivo Circulante', value: 850000 },
    { name: 'Passivo Não Circulante', value: 500000 },
    { name: 'Patrimônio Líquido', value: 1500000 },
  ];

  const kpis = [
    {
      title: 'Receita Bruta',
      value: formatCompact(revenue.currentPeriod),
      variation: revenue.variation,
      icon: DollarSign,
      color: 'text-chart-2',
    },
    {
      title: 'Lucro Líquido',
      value: formatCompact(netIncome.currentPeriod),
      variation: netIncome.variation,
      icon: TrendingUp,
      color: 'text-success',
    },
    {
      title: 'Ativo Total',
      value: formatCompact(totalAssets.currentPeriod),
      variation: ((totalAssets.currentPeriod - totalAssets.previousPeriod) / totalAssets.previousPeriod * 100),
      icon: BarChart3,
      color: 'text-chart-1',
    },
    {
      title: 'Patrimônio Líquido',
      value: formatCompact(totalEquity.currentPeriod),
      variation: ((totalEquity.currentPeriod - totalEquity.previousPeriod) / totalEquity.previousPeriod * 100),
      icon: PiggyBank,
      color: 'text-chart-5',
    },
    {
      title: 'Margem Bruta',
      value: `${grossMargin}%`,
      variation: null,
      icon: Percent,
      color: 'text-chart-2',
    },
    {
      title: 'Margem Líquida',
      value: `${netMargin}%`,
      variation: null,
      icon: Percent,
      color: 'text-chart-4',
    },
    {
      title: 'Liquidez Corrente',
      value: `${liquidezCorrente.value.toFixed(2)}x`,
      variation: ((liquidezCorrente.value - liquidezCorrente.previousValue) / liquidezCorrente.previousValue * 100),
      icon: Scale,
      color: 'text-success',
    },
    {
      title: 'ROE',
      value: `${roe.value}%`,
      variation: ((roe.value - roe.previousValue) / roe.previousValue * 100),
      icon: ArrowUpRight,
      color: 'text-chart-1',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel Executivo Contábil</h1>
        <p className="text-muted-foreground">Visão consolidada dos indicadores contábeis — Janeiro/2024</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <Icon className={cn('h-4 w-4', kpi.color)} />
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                {kpi.variation !== null && (
                  <div className={cn('flex items-center gap-1 text-xs mt-1', kpi.variation > 0 ? 'text-success' : 'text-destructive')}>
                    {kpi.variation > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.variation > 0 ? '+' : ''}{kpi.variation.toFixed(1)}%
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Journal Entries Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lançamentos</p>
              <p className="text-2xl font-bold">{totalEntries}</p>
            </div>
            <Badge variant="outline">Total</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Contabilizados</p>
              <p className="text-2xl font-bold text-success">{postedEntries}</p>
            </div>
            <Badge className="bg-success/10 text-success border-success/30" variant="outline">Postados</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rascunhos</p>
              <p className="text-2xl font-bold text-warning">{draftEntries}</p>
            </div>
            <Badge className="bg-warning/10 text-warning border-warning/30" variant="outline">Pendentes</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Revenue & Equity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueExpenseTrendChart />
        <EquityEvolutionChart />
      </div>

      {/* Charts Row 2: Margins & Expenses */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MarginTrendChart />
        <ExpenseBreakdownChart />
      </div>

      {/* Charts Row 3: Composition Pies & Trial Balance */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Composição do Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={assetPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {assetPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Composição Passivo + PL</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={liabilityPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {liabilityPie.map((_, i) => <Cell key={i} fill={COLORS[i + 2]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <TrialBalanceChart />
      </div>

      {/* Financial Indicators */}
      <FinancialIndicatorsPanel />
    </div>
  );
}
