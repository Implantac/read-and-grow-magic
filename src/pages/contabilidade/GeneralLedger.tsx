import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExportButton } from '@/components/shared/ExportButton';
import { AdvancedFilters, type FilterField } from '@/components/shared/AdvancedFilters';
import { mockChartOfAccounts, generateLedgerEntries } from '@/data/accountingMockData';
import { cn } from '@/lib/utils';
import { BookOpen, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ExportColumn } from '@/lib/exportUtils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const exportColumns: ExportColumn[] = [
  { key: 'date', label: 'Data' },
  { key: 'journalNumber', label: 'Lançamento' },
  { key: 'description', label: 'Descrição' },
  { key: 'debit', label: 'Débito', format: (v) => formatCurrency(Number(v)) },
  { key: 'credit', label: 'Crédito', format: (v) => formatCurrency(Number(v)) },
  { key: 'balance', label: 'Saldo', format: (v) => formatCurrency(Number(v)) },
];

const ledgerFilterFields: FilterField[] = [
  { key: 'dateFrom', label: 'Data Inicial', type: 'date' },
  { key: 'dateTo', label: 'Data Final', type: 'date' },
];

export default function GeneralLedgerPage() {
  const analyticalAccounts = mockChartOfAccounts.filter((a) => a.isAnalytical);
  const [selectedAccount, setSelectedAccount] = useState(analyticalAccounts[0]?.code || '');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const account = mockChartOfAccounts.find((a) => a.code === selectedAccount);
  const allEntries = generateLedgerEntries(selectedAccount);

  const entries = useMemo(() => {
    return allEntries.filter((e) => {
      if (filters.dateFrom && e.date < filters.dateFrom) return false;
      if (filters.dateTo && e.date > filters.dateTo) return false;
      return true;
    });
  }, [allEntries, filters]);

  const totalDebits = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredits = entries.reduce((s, e) => s + e.credit, 0);
  const finalBalance = entries[entries.length - 1]?.balance || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Razão Contábil</h1>
          <p className="text-muted-foreground">Movimentação detalhada por conta</p>
        </div>
        <ExportButton data={entries as unknown as Record<string, unknown>[]} columns={exportColumns} filename={`razao_${selectedAccount}`} />
      </div>

      {/* Account Selector + Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 max-w-md">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {analyticalAccounts.map((a) => (
                    <SelectItem key={a.code} value={a.code}>
                      {a.code} - {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AdvancedFilters
              fields={ledgerFilterFields}
              values={filters}
              onChange={setFilters}
              onClear={() => setFilters({})}
            />
            {account && (
              <div className="flex gap-4 text-sm">
                <div><span className="text-muted-foreground">Natureza:</span> <Badge variant="outline">{account.nature === 'debit' ? 'Devedora' : 'Credora'}</Badge></div>
                <div><span className="text-muted-foreground">Saldo Atual:</span> <span className="font-bold">{formatCurrency(finalBalance)}</span></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Débitos</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(totalDebits)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Créditos</p><p className="text-2xl font-bold text-red-600">{formatCurrency(totalCredits)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Saldo Final</p><p className="text-2xl font-bold">{formatCurrency(finalBalance)}</p></CardContent></Card>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            {account ? `${account.code} - ${account.name}` : 'Selecione uma conta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Lançamento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Débito</TableHead>
                <TableHead className="text-right">Crédito</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} className={entry.journalNumber === 'Saldo Anterior' ? 'bg-muted/50 font-medium' : ''}>
                  <TableCell>{new Date(entry.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="font-mono text-xs">{entry.journalNumber}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell className="text-right">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</TableCell>
                  <TableCell className="text-right">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</TableCell>
                  <TableCell className={cn('text-right font-medium', entry.balance < 0 && 'text-destructive')}>
                    {formatCurrency(entry.balance)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell colSpan={3}>TOTAIS</TableCell>
                <TableCell className="text-right">{formatCurrency(totalDebits)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totalCredits)}</TableCell>
                <TableCell className="text-right">{formatCurrency(finalBalance)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
