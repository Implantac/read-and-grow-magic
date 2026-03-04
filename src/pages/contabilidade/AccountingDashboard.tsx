import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  ExternalLink,
  FileDown,
  Loader2,
} from 'lucide-react';
import { EquityEvolutionChart } from '@/components/contabilidade/EquityEvolutionChart';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Tooltip as RechartsTooltip,
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
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const handleExportPDF = useCallback(async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`painel-executivo-contabil-${selectedPeriod}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  }, [selectedPeriod]);

  const current = periodData[selectedPeriod];
  const compare = comparePeriod && comparePeriod !== 'none' ? periodData[comparePeriod] : null;

  const kpis = useMemo(() => [
    {
      title: 'Receita Bruta',
      tooltip: 'Soma de todas as vendas antes de deduções (impostos, devoluções). Fonte: DRE.',
      value: formatCompact(current.revenue),
      compareValue: compare ? formatCompact(compare.revenue) : null,
      variation: compare ? calcVariation(current.revenue, compare.revenue) : null,
      icon: DollarSign,
      color: 'text-chart-2',
      drillTo: '/contabilidade/dre',
    },
    {
      title: 'Lucro Líquido',
      tooltip: 'Receita total menos todas as despesas, impostos e custos. Resultado final da DRE.',
      value: formatCompact(current.netIncome),
      compareValue: compare ? formatCompact(compare.netIncome) : null,
      variation: compare ? calcVariation(current.netIncome, compare.netIncome) : null,
      icon: TrendingUp,
      color: 'text-success',
      drillTo: '/contabilidade/dre',
    },
    {
      title: 'Ativo Total',
      tooltip: 'Soma de todos os bens e direitos da empresa (circulante + não circulante). Fonte: Balanço.',
      value: formatCompact(current.totalAssets),
      compareValue: compare ? formatCompact(compare.totalAssets) : null,
      variation: compare ? calcVariation(current.totalAssets, compare.totalAssets) : null,
      icon: BarChart3,
      color: 'text-chart-1',
      drillTo: '/contabilidade/balanco',
    },
    {
      title: 'Patrimônio Líquido',
      tooltip: 'Ativo Total menos Passivo Total. Representa o valor contábil pertencente aos sócios.',
      value: formatCompact(current.totalEquity),
      compareValue: compare ? formatCompact(compare.totalEquity) : null,
      variation: compare ? calcVariation(current.totalEquity, compare.totalEquity) : null,
      icon: PiggyBank,
      color: 'text-chart-5',
      drillTo: '/contabilidade/balanco',
    },
    {
      title: 'Margem Bruta',
      tooltip: 'Fórmula: (Receita − CMV) ÷ Receita × 100. Mede eficiência na produção/compra.',
      value: `${current.grossMargin}%`,
      compareValue: compare ? `${compare.grossMargin}%` : null,
      variation: compare ? current.grossMargin - compare.grossMargin : null,
      icon: Percent,
      color: 'text-chart-2',
      isAbsolute: true,
      drillTo: '/contabilidade/dre',
    },
    {
      title: 'Margem Líquida',
      tooltip: 'Fórmula: Lucro Líquido ÷ Receita × 100. Mede quanto de cada real vendido vira lucro.',
      value: `${current.netMargin}%`,
      compareValue: compare ? `${compare.netMargin}%` : null,
      variation: compare ? current.netMargin - compare.netMargin : null,
      icon: Percent,
      color: 'text-chart-4',
      isAbsolute: true,
      drillTo: '/contabilidade/dre',
    },
    {
      title: 'Liquidez Corrente',
      tooltip: 'Fórmula: Ativo Circulante ÷ Passivo Circulante. Acima de 1 indica capacidade de pagar dívidas de curto prazo.',
      value: `${current.liquidezCorrente.toFixed(2)}x`,
      compareValue: compare ? `${compare.liquidezCorrente.toFixed(2)}x` : null,
      variation: compare ? calcVariation(current.liquidezCorrente, compare.liquidezCorrente) : null,
      icon: Scale,
      color: 'text-success',
      drillTo: '/contabilidade/balanco',
    },
    {
      title: 'ROE',
      tooltip: 'Fórmula: Lucro Líquido ÷ Patrimônio Líquido × 100. Mede o retorno sobre o capital dos sócios.',
      value: `${current.roe}%`,
      compareValue: compare ? `${compare.roe}%` : null,
      variation: compare ? current.roe - compare.roe : null,
      icon: ArrowUpRight,
      color: 'text-chart-1',
      isAbsolute: true,
      drillTo: '/contabilidade/balanco',
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPDF} disabled={isExporting} className="gap-2">
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Exportar PDF
          </Button>
          <PeriodSelector
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            compareValue={comparePeriod}
            onCompareChange={setComparePeriod}
          />
        </div>
      </div>

      <div ref={dashboardRef} className="space-y-6">

      {/* KPI Cards */}
      <TooltipProvider delayDuration={200}>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <UITooltip key={kpi.title}>
                <TooltipTrigger asChild>
                  <Card
                    className="cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-primary/20"
                    onClick={() => navigate(kpi.drillTo)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">{kpi.title}</p>
                        <div className="flex items-center gap-1">
                          <Icon className={cn('h-4 w-4', kpi.color)} />
                          <ExternalLink className="h-3 w-3 text-muted-foreground/50" />
                        </div>
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
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px] text-center">
                  <p className="text-xs">{kpi.tooltip}</p>
                </TooltipContent>
              </UITooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Journal Entries Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-primary/20" onClick={() => navigate('/contabilidade/lancamentos')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lançamentos</p>
              <p className="text-2xl font-bold">{current.totalEntries}</p>
            </div>
            <Badge variant="outline">Total</Badge>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-primary/20" onClick={() => navigate('/contabilidade/lancamentos')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Contabilizados</p>
              <p className="text-2xl font-bold text-success">{current.postedEntries}</p>
            </div>
            <Badge className="bg-success/10 text-success border-success/30" variant="outline">Postados</Badge>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-primary/20" onClick={() => navigate('/contabilidade/lancamentos')}>
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
        <Card className="cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-primary/20" onClick={() => navigate('/contabilidade/balanco')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">Composição do Ativo <ExternalLink className="h-3 w-3 text-muted-foreground/50" /></CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={current.assetPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {current.assetPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-primary/20" onClick={() => navigate('/contabilidade/balanco')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">Composição Passivo + PL <ExternalLink className="h-3 w-3 text-muted-foreground/50" /></CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={current.liabilityPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {current.liabilityPie.map((_, i) => <Cell key={i} fill={COLORS[i + 2]} />)}
                </Pie>
                <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
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
