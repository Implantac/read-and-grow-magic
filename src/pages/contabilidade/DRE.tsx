import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExportButton } from '@/components/shared/ExportButton';
import { mockDRE } from '@/data/accountingMockData';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MarginTrendChart } from '@/components/contabilidade/MarginTrendChart';
import { ExpenseBreakdownChart } from '@/components/contabilidade/ExpenseBreakdownChart';
import { RevenueExpenseTrendChart } from '@/components/contabilidade/RevenueExpenseTrendChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ExportColumn } from '@/lib/exportUtils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const exportColumns: ExportColumn[] = [
  { key: 'code', label: 'Código' },
  { key: 'description', label: 'Descrição' },
  { key: 'currentPeriod', label: 'Período Atual', format: (v) => formatCurrency(Number(v)) },
  { key: 'previousPeriod', label: 'Período Anterior', format: (v) => formatCurrency(Number(v)) },
  { key: 'variation', label: 'Variação %', format: (v) => `${Number(v).toFixed(2)}%` },
];

export default function DREPage() {
  const revenue = mockDRE.find((d) => d.code === '1')!;
  const grossProfit = mockDRE.find((d) => d.code === '5')!;
  const netIncome = mockDRE.find((d) => d.code === '9')!;
  const grossMargin = ((grossProfit.currentPeriod / revenue.currentPeriod) * 100).toFixed(1);
  const netMargin = ((netIncome.currentPeriod / revenue.currentPeriod) * 100).toFixed(1);

  const chartData = mockDRE
    .filter((d) => d.isTotal)
    .map((d) => ({
      name: d.description.replace(/[()=\-]/g, '').trim().substring(0, 20),
      atual: d.currentPeriod,
      anterior: d.previousPeriod,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Demonstração do Resultado (DRE)</h1>
          <p className="text-muted-foreground">Período: Janeiro/2024</p>
        </div>
        <ExportButton data={mockDRE as unknown as Record<string, unknown>[]} columns={exportColumns} filename="dre" />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Receita Bruta</p>
            <p className="text-2xl font-bold">{formatCurrency(revenue.currentPeriod)}</p>
            <div className="flex items-center gap-1 text-xs text-success mt-1">
              <ArrowUpRight className="h-3 w-3" /> {revenue.variation.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Lucro Bruto</p>
            <p className="text-2xl font-bold">{formatCurrency(grossProfit.currentPeriod)}</p>
            <p className="text-xs text-muted-foreground mt-1">Margem: {grossMargin}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Lucro Líquido</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(netIncome.currentPeriod)}</p>
            <p className="text-xs text-muted-foreground mt-1">Margem: {netMargin}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Variação Lucro</p>
            <p className="text-2xl font-bold text-success">+{netIncome.variation.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">vs período anterior</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* DRE Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Demonstração do Resultado</CardTitle>
          </CardHeader>
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
                {mockDRE.map((item) => (
                  <TableRow key={item.id} className={cn(item.isTotal && 'bg-muted/50 font-bold')}>
                    <TableCell style={{ paddingLeft: `${item.level * 24 + 16}px` }}>{item.description}</TableCell>
                    <TableCell className={cn('text-right', item.currentPeriod < 0 && 'text-destructive')}>
                      {formatCurrency(item.currentPeriod)}
                    </TableCell>
                    <TableCell className={cn('text-right', item.previousPeriod < 0 && 'text-destructive')}>
                      {formatCurrency(item.previousPeriod)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn('text-xs', item.variation > 0 ? 'text-success' : 'text-destructive')}>
                        {item.variation > 0 ? '+' : ''}{item.variation.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparativo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="atual" name="Atual" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="anterior" name="Anterior" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MarginTrendChart />
        <ExpenseBreakdownChart />
      </div>

      <RevenueExpenseTrendChart />
    </div>
  );
}
