import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExportButton } from '@/components/shared/ExportButton';
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';
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
import type { ExportColumn } from '@/lib/exportUtils';
import type { DREItem } from '@/types/accounting';

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
  const [dreData] = useState<DREItem[]>([]);

  const revenue = dreData.find((d) => d.code === '1')?.currentPeriod || 0;
  const grossProfit = dreData.find((d) => d.code === '5')?.currentPeriod || 0;
  const netIncome = dreData.find((d) => d.code === '9')?.currentPeriod || 0;
  const grossMargin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : '0.0';
  const netMargin = revenue > 0 ? ((netIncome / revenue) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Demonstração do Resultado (DRE)</h1>
          <p className="text-muted-foreground">Análise de receitas e despesas</p>
        </div>
        <ExportButton data={dreData as unknown as Record<string, unknown>[]} columns={exportColumns} filename="dre" />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Receita Bruta</p>
            <p className="text-2xl font-bold">{formatCurrency(revenue)}</p>
            <div className="flex items-center gap-1 text-xs text-success mt-1">
              <ArrowUpRight className="h-3 w-3" /> 0.0%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Lucro Bruto</p>
            <p className="text-2xl font-bold">{formatCurrency(grossProfit)}</p>
            <p className="text-xs text-muted-foreground mt-1">Margem: {grossMargin}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Lucro Líquido</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(netIncome)}</p>
            <p className="text-xs text-muted-foreground mt-1">Margem: {netMargin}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Variação Lucro</p>
            <p className="text-2xl font-bold text-success">+0.0%</p>
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
            {dreData.length > 0 ? (
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
                  {dreData.map((item) => (
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
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum dado de DRE disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Empty chart placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
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
