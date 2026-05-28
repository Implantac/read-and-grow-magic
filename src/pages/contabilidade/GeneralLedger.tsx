import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExportButton } from '@/components/shared/ExportButton';
import { AdvancedFilters, type FilterField } from '@/components/shared/AdvancedFilters';
import { useChartOfAccounts } from '@/hooks/useChartOfAccounts';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { cn } from '@/lib/utils';
import { BookOpen } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ExportColumn } from '@/lib/exportUtils';
import type { LedgerEntry } from '@/types/accounting';

import { formatBRL, formatDate } from '@/lib/formatters';
const exportColumns: ExportColumn[] = [
  { key: 'date', label: 'Data' },
  { key: 'journalNumber', label: 'Lançamento' },
  { key: 'description', label: 'Descrição' },
  { key: 'debit', label: 'Débito', format: (v) => formatBRL(Number(v)) },
  { key: 'credit', label: 'Crédito', format: (v) => formatBRL(Number(v)) },
  { key: 'balance', label: 'Saldo', format: (v) => formatBRL(Number(v)) },
];

const ledgerFilterFields: FilterField[] = [
  { key: 'dateFrom', label: 'Data Inicial', type: 'date' },
  { key: 'dateTo', label: 'Data Final', type: 'date' },
];

export default function GeneralLedgerPage() {
  const { accounts, loading: loadingAccounts } = useChartOfAccounts();
  const { entries: journalEntries, loading: loadingEntries } = useJournalEntries();
  const analyticalAccounts = accounts.filter((a) => a.isAnalytical);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Auto-select first account when loaded
  useMemo(() => {
    if (analyticalAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(analyticalAccounts[0].code);
    }
  }, [analyticalAccounts, selectedAccount]);

  const account = accounts.find((a) => a.code === selectedAccount);

  // Build ledger entries from journal entries for selected account
  const ledgerEntries = useMemo(() => {
    if (!account) return [];
    
    const entries: LedgerEntry[] = [];
    let runningBalance = 0;

    // Get all posted journal entries that have lines for this account
    const relevantEntries = journalEntries
      .filter(je => je.status === 'posted')
      .flatMap(je => 
        je.lines
          .filter(line => line.accountCode === selectedAccount)
          .map(line => ({
            id: line.id,
            date: je.date,
            journalNumber: je.number,
            description: line.description || je.description,
            debit: line.debit,
            credit: line.credit,
          }))
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    for (const entry of relevantEntries) {
      if (account.nature === 'debit') {
        runningBalance += entry.debit - entry.credit;
      } else {
        runningBalance += entry.credit - entry.debit;
      }
      entries.push({ ...entry, balance: runningBalance });
    }

    return entries;
  }, [journalEntries, selectedAccount, account]);

  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter((e) => {
      if (filters.dateFrom && e.date < filters.dateFrom) return false;
      if (filters.dateTo && e.date > filters.dateTo) return false;
      return true;
    });
  }, [ledgerEntries, filters]);

  const totalDebits = filteredEntries.reduce((s, e) => s + e.debit, 0);
  const totalCredits = filteredEntries.reduce((s, e) => s + e.credit, 0);
  const finalBalance = filteredEntries[filteredEntries.length - 1]?.balance || 0;

  const loading = loadingAccounts || loadingEntries;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-16" />
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
          <h1 className="text-2xl font-bold text-foreground">Razão Contábil</h1>
          <p className="text-muted-foreground">Movimentação detalhada por conta</p>
        </div>
        <ExportButton data={filteredEntries as unknown as Record<string, unknown>[]} columns={exportColumns} filename={`razao_${selectedAccount}`} />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 max-w-md">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {analyticalAccounts.length > 0 ? (
                    analyticalAccounts.map((a) => (
                      <SelectItem key={a.code} value={a.code}>{a.code} - {a.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>Nenhuma conta disponível</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <AdvancedFilters fields={ledgerFilterFields} values={filters} onChange={setFilters} onClear={() => setFilters({})} />
            {account && (
              <div className="flex gap-4 text-sm">
                <div><span className="text-muted-foreground">Natureza:</span> <Badge variant="outline">{account.nature === 'debit' ? 'Devedora' : 'Credora'}</Badge></div>
                <div><span className="text-muted-foreground">Saldo Atual:</span> <span className="font-bold">{formatBRL(finalBalance)}</span></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Débitos</p><p className="text-2xl font-bold text-blue-600">{formatBRL(totalDebits)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Créditos</p><p className="text-2xl font-bold text-red-600">{formatBRL(totalCredits)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Saldo Final</p><p className="text-2xl font-bold">{formatBRL(finalBalance)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            {account ? `${account.code} - ${account.name}` : 'Selecione uma conta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEntries.length > 0 ? (
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
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell className="font-mono text-xs">{entry.journalNumber}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-right">{entry.debit > 0 ? formatBRL(entry.debit) : '-'}</TableCell>
                    <TableCell className="text-right">{entry.credit > 0 ? formatBRL(entry.credit) : '-'}</TableCell>
                    <TableCell className={cn('text-right font-medium', entry.balance < 0 && 'text-destructive')}>
                      {formatBRL(entry.balance)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell colSpan={3}>TOTAIS</TableCell>
                  <TableCell className="text-right">{formatBRL(totalDebits)}</TableCell>
                  <TableCell className="text-right">{formatBRL(totalCredits)}</TableCell>
                  <TableCell className="text-right">{formatBRL(finalBalance)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma movimentação encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
