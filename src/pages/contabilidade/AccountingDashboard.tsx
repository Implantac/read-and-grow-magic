import { useState, useMemo } from 'react';
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
import { PeriodSelector } from '@/components/contabilidade/PeriodSelector';
import { periodData } from '@/data/accountingChartData';
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

function calcVariation(current: number, previous: number) {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export default function AccountingDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('jan-24');
  const [comparePeriod, setComparePeriod] = useState('dez-23');

  const current = periodData[selectedPeriod];
  const compare = comparePeriod && comparePeriod !== 'none' ? periodData[comparePeriod] : null;

  const kpis = useMemo(() => [
    {
      title: 'Receita Bruta',
      value: formatCompact(current.revenue),
      compareValue: compare ? formatCompact(compare.revenue) : null,
      variation: compare ? calcVariation(current.revenue, compare.revenue) : null,
      icon: DollarSign,
      color: 'text-chart-2',
    },
    {
      title: 'Lucro Líquido',
      value: formatCompact(current.netIncome),
      compareValue: compare ? formatCompact(compare.netIncome) : null,
      variation: compare ? calcVariation(current.netIncome, compare.netIncome) : null,
      icon: TrendingUp,
      color: 'text-success',
    },
    {
      title: 'Ativo Total',
      value: formatCompact(current.totalAssets),
      compareValue: compare ? formatCompact(compare.totalAssets) : null,
      variation: compare ? calcVariation(current.totalAssets, compare.totalAssets) : null,
      icon: BarChart3,
      color: 'text-chart-1',
    },
    {
      title: 'Patrimônio Líquido',
      value: formatCompact(current.totalEquity),
      compareValue: compare ? formatCompact(compare.totalEquity) : null,
      variation: compare ? calcVariation(current.totalEquity, compare.totalEquity) : null,
      icon: PiggyBank,
      color: 'text-chart-5',
    },
    {
      title: 'Margem Bruta',
      value: `${current.grossMargin}%`,
      compareValue: compare ? `${compare.grossMargin}%` : null,
      variation: compare ? current.grossMargin - compare.grossMargin : null,
      icon: Percent,
      color: 'text-chart-2',
      isAbsolute: true,
    },
    {
      title: 'Margem Líquida',
      value: `${current.netMargin}%`,
      compareValue: compare ? `${compare.netMargin}%` : null,
      variation: compare ? current.netMargin - compare.netMargin : null,
      icon: Percent,
      color: 'text-chart-4',
      isAbsolute: true,
    },
    {
      title: 'Liquidez Corrente',
      value: `${current.liquidezCorrente.toFixed(2)}x`,
      compareValue: compare ? `${compare.liquidezCorrente.toFixed(2)}x` : null,
      variation: compare ? calcVariation(current.liquidezCorrente, compare.liquidezCorrente) : null,
      icon: Scale,
      color: 'text-success',
    },
    {
      title: 'ROE',
      value: `${current.roe}%`,
      compareValue: compare ? `${compare.roe}%` : null,
      variation: compare ? current.roe - compare.roe : null,
      icon: ArrowUpRight,
      color: 'text-chart-1',
      isAbsolute: true,
    },
  ], [current, compare]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Executivo Contábil</h1>
          <p className="text-muted-foreground">Visão consolidada dos indicadores contábeis — {current.label}</p>
        </div>
        <PeriodSelector
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
          compareValue={comparePeriod}
          onCompareChange={setComparePeriod}
        />
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
                {kpi.compareValue && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Anterior: {kpi.compareValue}
                  </p>
                )}
                {kpi.variation !== null && (
                  <div className={cn('flex items-center gap-1 text-xs mt-1', kpi.variation > 0 ? 'text-success' : kpi.variation < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                    {kpi.variation > 0 ? <TrendingUp className="h-3 w-3" /> : kpi.variation < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                    {kpi.variation > 0 ? '+' : ''}{kpi.variation.toFixed(1)}{(kpi as any).isAbsolute ? 'pp' : '%'}
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
              <p className="text-2xl font-bold">{current.totalEntries}</p>
            </div>
            <Badge variant="outline">Total</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Contabilizados</p>
              <p className="text-2xl font-bold text-success">{current.postedEntries}</p>
            </div>
            <Badge className="bg-success/10 text-success border-success/30" variant="outline">Postados</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rascunhos</p>
              <p className="text-2xl font-bold text-warning">{current.draftEntries}</p>
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
                <Pie data={current.assetPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {current.assetPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
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
                <Pie data={current.liabilityPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {current.liabilityPie.map((_, i) => <Cell key={i} fill={COLORS[i + 2]} />)}
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
