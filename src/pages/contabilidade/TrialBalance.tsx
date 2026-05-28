import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportButton } from '@/components/shared/ExportButton';
import { getAccountTypeLabel } from '@/config/accounting';
import { useChartOfAccounts } from '@/hooks/useChartOfAccounts';
import { cn } from '@/lib/utils';
import { Scale } from 'lucide-react';
import { TrialBalanceChart } from '@/components/contabilidade/TrialBalanceChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ExportColumn } from '@/lib/exportUtils';
import type { TrialBalanceItem } from '@/types/accounting';

import { formatBRL } from '@/lib/formatters';
const typeColors: Record<string, string> = {
  asset: 'text-blue-600',
  liability: 'text-red-600',
  equity: 'text-purple-600',
  revenue: 'text-green-600',
  expense: 'text-orange-600',
};

const exportColumns: ExportColumn[] = [
  { key: 'accountCode', label: 'Código' },
  { key: 'accountName', label: 'Conta' },
  { key: 'type', label: 'Tipo', format: (v) => getAccountTypeLabel(String(v)) },
  { key: 'currentDebit', label: 'Saldo Atual Débito', format: (v) => formatBRL(Number(v)) },
  { key: 'currentCredit', label: 'Saldo Atual Crédito', format: (v) => formatBRL(Number(v)) },
];

export default function TrialBalancePage() {
  const { accounts, loading } = useChartOfAccounts();

  // Build trial balance from analytical accounts with non-zero balances
  const trialBalance = useMemo<TrialBalanceItem[]>(() => {
    return accounts
      .filter(a => a.isAnalytical && a.balance !== 0)
      .map(a => ({
        accountCode: a.code,
        accountName: a.name,
        type: a.type,
        previousDebit: 0,
        previousCredit: 0,
        periodDebit: a.nature === 'debit' ? Math.abs(a.balance) : 0,
        periodCredit: a.nature === 'credit' ? Math.abs(a.balance) : 0,
        currentDebit: a.nature === 'debit' ? Math.abs(a.balance) : 0,
        currentCredit: a.nature === 'credit' ? Math.abs(a.balance) : 0,
      }));
  }, [accounts]);

  const totals = useMemo(() => {
    return trialBalance.reduce(
      (acc, item) => ({
        previousDebit: acc.previousDebit + item.previousDebit,
        previousCredit: acc.previousCredit + item.previousCredit,
        periodDebit: acc.periodDebit + item.periodDebit,
        periodCredit: acc.periodCredit + item.periodCredit,
        currentDebit: acc.currentDebit + item.currentDebit,
        currentCredit: acc.currentCredit + item.currentCredit,
      }),
      { previousDebit: 0, previousCredit: 0, periodDebit: 0, periodCredit: 0, currentDebit: 0, currentCredit: 0 }
    );
  }, [trialBalance]);

  const isBalanced = Math.abs(totals.currentDebit - totals.currentCredit) < 0.01;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Balancete de Verificação</h1>
          <p className="text-muted-foreground">Verificação de saldos contábeis</p>
        </div>
        <ExportButton data={trialBalance as unknown as Record<string, unknown>[]} columns={exportColumns} filename="balancete_verificacao" />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Débitos Atuais</p>
            <p className="text-2xl font-bold text-blue-600">{formatBRL(totals.currentDebit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Créditos Atuais</p>
            <p className="text-2xl font-bold text-red-600">{formatBRL(totals.currentCredit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Equilíbrio</p>
                <p className="text-2xl font-bold">{formatBRL(Math.abs(totals.currentDebit - totals.currentCredit))}</p>
              </div>
              <Badge variant={isBalanced ? 'default' : 'destructive'} className={cn(isBalanced && 'bg-success text-success-foreground')}>
                <Scale className="h-3 w-3 mr-1" />
                {isBalanced ? 'Equilibrado' : 'Desequilibrado'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <TrialBalanceChart />

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4" />
            Balancete Analítico
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trialBalance.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead rowSpan={2}>Código</TableHead>
                    <TableHead rowSpan={2}>Conta</TableHead>
                    <TableHead rowSpan={2}>Tipo</TableHead>
                    <TableHead colSpan={2} className="text-center border-x">Saldo Anterior</TableHead>
                    <TableHead colSpan={2} className="text-center border-x">Movimento</TableHead>
                    <TableHead colSpan={2} className="text-center">Saldo Atual</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-right border-l">Débito</TableHead>
                    <TableHead className="text-right border-r">Crédito</TableHead>
                    <TableHead className="text-right border-l">Débito</TableHead>
                    <TableHead className="text-right border-r">Crédito</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialBalance.map((item) => (
                    <TableRow key={item.accountCode}>
                      <TableCell className="font-mono text-xs">{item.accountCode}</TableCell>
                      <TableCell>{item.accountName}</TableCell>
                      <TableCell><span className={cn('text-xs font-medium', typeColors[item.type])}>{getAccountTypeLabel(item.type)}</span></TableCell>
                      <TableCell className="text-right border-l">{item.previousDebit > 0 ? formatBRL(item.previousDebit) : '-'}</TableCell>
                      <TableCell className="text-right border-r">{item.previousCredit > 0 ? formatBRL(item.previousCredit) : '-'}</TableCell>
                      <TableCell className="text-right border-l">{item.periodDebit > 0 ? formatBRL(item.periodDebit) : '-'}</TableCell>
                      <TableCell className="text-right border-r">{item.periodCredit > 0 ? formatBRL(item.periodCredit) : '-'}</TableCell>
                      <TableCell className="text-right font-medium">{item.currentDebit > 0 ? formatBRL(item.currentDebit) : '-'}</TableCell>
                      <TableCell className="text-right font-medium">{item.currentCredit > 0 ? formatBRL(item.currentCredit) : '-'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={3}>TOTAIS</TableCell>
                    <TableCell className="text-right border-l">{formatBRL(totals.previousDebit)}</TableCell>
                    <TableCell className="text-right border-r">{formatBRL(totals.previousCredit)}</TableCell>
                    <TableCell className="text-right border-l">{formatBRL(totals.periodDebit)}</TableCell>
                    <TableCell className="text-right border-r">{formatBRL(totals.periodCredit)}</TableCell>
                    <TableCell className="text-right">{formatBRL(totals.currentDebit)}</TableCell>
                    <TableCell className="text-right">{formatBRL(totals.currentCredit)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado de balancete disponível</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
