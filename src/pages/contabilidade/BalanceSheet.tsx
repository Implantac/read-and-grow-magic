import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExportButton } from '@/components/shared/ExportButton';
import { cn } from '@/lib/utils';
import { Scale, Building2, Landmark, PiggyBank } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { EquityEvolutionChart } from '@/components/contabilidade/EquityEvolutionChart';
import { FinancialIndicatorsPanel } from '@/components/contabilidade/FinancialIndicatorsPanel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ExportColumn } from '@/lib/exportUtils';
import type { BalanceSheetItem } from '@/types/accounting';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const exportColumns: ExportColumn[] = [
  { key: 'code', label: 'Código' },
  { key: 'description', label: 'Descrição' },
  { key: 'currentPeriod', label: 'Período Atual', format: (v) => formatCurrency(Number(v)) },
  { key: 'previousPeriod', label: 'Período Anterior', format: (v) => formatCurrency(Number(v)) },
];

export default function BalanceSheetPage() {
  const [balanceSheet] = useState<BalanceSheetItem[]>([]);
  
  const assets = balanceSheet.filter((i) => i.section === 'asset');
  const liabilities = balanceSheet.filter((i) => i.section === 'liability');
  const equity = balanceSheet.filter((i) => i.section === 'equity');

  const totalAssets = assets.find((a) => a.code === '1')?.currentPeriod || 0;
  const totalLiabilities = liabilities.find((a) => a.code === '2')?.currentPeriod || 0;
  const totalEquity = equity.find((a) => a.code === '3')?.currentPeriod || 0;

  const renderSection = (title: string, icon: React.ReactNode, items: BalanceSheetItem[]) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Atual</TableHead>
                <TableHead className="text-right">Anterior</TableHead>
                <TableHead className="text-right">Var.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const variation = item.previousPeriod > 0
                  ? ((item.currentPeriod - item.previousPeriod) / item.previousPeriod * 100)
                  : 0;
                return (
                  <TableRow key={item.id} className={cn(item.isTotal && 'bg-muted/50 font-bold')}>
                    <TableCell style={{ paddingLeft: `${item.level * 20 + 16}px` }}>{item.description}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.currentPeriod)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.previousPeriod)}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn('text-xs', variation > 0 ? 'text-success' : variation < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                        {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Balanço Patrimonial</h1>
          <p className="text-muted-foreground">Posição patrimonial da empresa</p>
        </div>
        <ExportButton data={balanceSheet as unknown as Record<string, unknown>[]} columns={exportColumns} filename="balanco_patrimonial" />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ativo Total</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAssets)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Passivo Total</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalLiabilities)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Patrimônio Líquido</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalEquity)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Equilíbrio</p>
                <p className="text-lg font-bold">{formatCurrency(Math.abs(totalAssets - totalLiabilities - totalEquity))}</p>
              </div>
              <Badge className="bg-success text-success-foreground"><Scale className="h-3 w-3 mr-1" /> OK</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolution & Indicators */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EquityEvolutionChart />
        <FinancialIndicatorsPanel />
      </div>

      {/* Sections */}
      {renderSection('Ativo', <Building2 className="h-4 w-4 text-primary" />, assets)}
      {renderSection('Passivo', <Landmark className="h-4 w-4 text-destructive" />, liabilities)}
      {renderSection('Patrimônio Líquido', <PiggyBank className="h-4 w-4 text-primary" />, equity)}
    </div>
  );
}
