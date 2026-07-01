import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Skeleton } from '@/ui/base/skeleton';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { ExportButton } from '@/shared/components/ExportButton';
import { AdvancedFilters, type FilterField } from '@/shared/components/AdvancedFilters';
import { getJournalStatusLabel } from '@/config/accounting';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { useAccounting } from '@/hooks/accounting/useAccounting';
import { cn } from '@/lib/utils';
import { Plus, CheckCircle, Eye, BookOpen, FileText, Clock } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import type { JournalEntry } from '@/types/accounting';
import type { ExportColumn } from '@/lib/exportUtils';

import { formatBRL, formatDate, formatDateTime, formatNumber } from '@/lib/formatters';
import { EmptyState } from '@/shared/components/EmptyState';


const exportColumns: ExportColumn[] = [
  { key: 'number', label: 'Número' },
  { key: 'date', label: 'Data' },
  { key: 'description', label: 'Descrição' },
  { key: 'totalDebit', label: 'Débito', format: (v) => formatBRL(Number(v)) },
  { key: 'totalCredit', label: 'Crédito', format: (v) => formatBRL(Number(v)) },
  { key: 'status', label: 'Status', format: (v) => getJournalStatusLabel(String(v)) },
  { key: 'createdBy', label: 'Criado por' },
];

const filterFields: FilterField[] = [
  {
    key: 'status', label: 'Status', type: 'select',
    options: [
      { value: 'draft', label: 'Rascunho' },
      { value: 'posted', label: 'Lançado' },
      { value: 'reversed', label: 'Estornado' },
    ],
  },
  { key: 'dateFrom', label: 'Data Inicial', type: 'date' },
  { key: 'dateTo', label: 'Data Final', type: 'date' },
  { key: 'createdBy', label: 'Criado por', type: 'text', placeholder: 'Nome do criador...' },
];

export default function JournalEntriesPage() {
  const { journalEntries, journalEntriesLoading: loading, postEntry } = useAccounting();
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filteredEntries = useMemo(() => {
    return journalEntries.filter((e) => {
      if (filters.status && e.status !== filters.status) return false;
      if (filters.dateFrom && e.date < filters.dateFrom) return false;
      if (filters.dateTo && e.date > filters.dateTo) return false;
      if (filters.createdBy && !e.createdBy.toLowerCase().includes(filters.createdBy.toLowerCase())) return false;
      return true;
    });
  }, [journalEntries, filters]);

  const totalPosted = filteredEntries.filter((e) => e.status === 'posted').length;
  const totalDraft = filteredEntries.filter((e) => e.status === 'draft').length;
  const totalValue = filteredEntries.filter((e) => e.status === 'posted').reduce((s, e) => s + e.totalDebit, 0);

  const columns: Column<JournalEntry>[] = [
    { key: 'number', label: 'Número', sortable: true },
    { key: 'date', label: 'Data', sortable: true, render: (v) => formatDate(String(v)) },
    { key: 'description', label: 'Descrição', sortable: true },
    { key: 'totalDebit', label: 'Débito', sortable: true, className: 'text-right', render: (v) => formatBRL(Number(v)) },
    { key: 'totalCredit', label: 'Crédito', sortable: true, className: 'text-right', render: (v) => formatBRL(Number(v)) },
    {
      key: 'status', label: 'Status',
      render: (v) => (
        <StatusBadge status={String(v)} type="accounting" />
      ),
    },
    { key: 'createdBy', label: 'Criado por' },
  ];

  return (
    <PageContainer loading={loading}>
      <PageHeader title="Lançamentos Contábeis" description="Registro de partidas dobradas">
        <ExportButton data={filteredEntries as unknown as Record<string, unknown>[]} columns={exportColumns} filename="lancamentos_contabeis" />
        <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Lançamento</Button>
      </PageHeader>

      <AdvancedFilters fields={filterFields} values={filters} onChange={setFilters} onClear={() => setFilters({})} />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Total de Lançamentos" value={String(journalEntries.length)} icon={<BookOpen className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Lançados" value={String(totalPosted)} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="Rascunhos" value={String(totalDraft)} icon={<Clock className="h-5 w-5" />} accentColor="warning" index={2} />
        <KPICard title="Valor Total Lançado" value={formatBRL(totalValue)} icon={<FileText className="h-5 w-5" />} accentColor="info" index={3} />
      </div>

      <Card>
        <CardContent className="p-6">
          {filteredEntries.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredEntries}
              searchPlaceholder="Buscar lançamento..."
              actions={(row) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedEntry(row)}><Eye className="h-4 w-4" /></Button>
                  {row.status === 'draft' && (
                    <Button variant="ghost" size="icon" className="text-success" onClick={() => postEntry(row.id)}><CheckCircle className="h-4 w-4" /></Button>
                  )}
                </div>
              )}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum lançamento encontrado</p>
              <p className="text-sm">Clique em "Novo Lançamento" para começar</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lançamento {selectedEntry?.number}</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Data:</span> {formatDate(selectedEntry.date)}</div>
                <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={selectedEntry.status} type="accounting" className="ml-1" /></div>
                <div className="col-span-2"><span className="text-muted-foreground">Descrição:</span> {selectedEntry.description}</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEntry.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono text-xs">{line.accountCode} - {line.accountName}</TableCell>
                      <TableCell>{line.description}</TableCell>
                      <TableCell className="text-right">{line.debit > 0 ? formatBRL(line.debit) : '-'}</TableCell>
                      <TableCell className="text-right">{line.credit > 0 ? formatBRL(line.credit) : '-'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell className="text-right">{formatBRL(selectedEntry.totalDebit)}</TableCell>
                    <TableCell className="text-right">{formatBRL(selectedEntry.totalCredit)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="text-xs text-muted-foreground">Criado por {selectedEntry.createdBy} em {formatDateTime(selectedEntry.createdAt)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
