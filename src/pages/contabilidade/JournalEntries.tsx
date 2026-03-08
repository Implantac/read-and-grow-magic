import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ExportButton } from '@/components/shared/ExportButton';
import { AdvancedFilters, type FilterField } from '@/components/shared/AdvancedFilters';
import { getJournalStatusLabel } from '@/config/accounting';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { cn } from '@/lib/utils';
import { Plus, CheckCircle, Eye, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { JournalEntry } from '@/types/accounting';
import type { ExportColumn } from '@/lib/exportUtils';

const statusColors: Record<string, string> = {
  draft: 'bg-warning/10 text-warning border-warning/30',
  posted: 'bg-success/10 text-success border-success/30',
  reversed: 'bg-destructive/10 text-destructive border-destructive/30',
};

const exportColumns: ExportColumn[] = [
  { key: 'number', label: 'Número' },
  { key: 'date', label: 'Data' },
  { key: 'description', label: 'Descrição' },
  { key: 'totalDebit', label: 'Débito', format: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) },
  { key: 'totalCredit', label: 'Crédito', format: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) },
  { key: 'status', label: 'Status', format: (v) => getJournalStatusLabel(String(v)) },
  { key: 'createdBy', label: 'Criado por' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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
  const { entries: journalEntries, loading, postEntry } = useJournalEntries();
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
    { key: 'date', label: 'Data', sortable: true, render: (v) => new Date(String(v)).toLocaleDateString('pt-BR') },
    { key: 'description', label: 'Descrição', sortable: true },
    { key: 'totalDebit', label: 'Débito', sortable: true, className: 'text-right', render: (v) => formatCurrency(Number(v)) },
    { key: 'totalCredit', label: 'Crédito', sortable: true, className: 'text-right', render: (v) => formatCurrency(Number(v)) },
    {
      key: 'status', label: 'Status',
      render: (v) => (
        <Badge variant="outline" className={cn('text-xs', statusColors[String(v)])}>
          {getJournalStatusLabel(String(v))}
        </Badge>
      ),
    },
    { key: 'createdBy', label: 'Criado por' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lançamentos Contábeis</h1>
          <p className="text-muted-foreground">Registro de partidas dobradas</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={filteredEntries as unknown as Record<string, unknown>[]} columns={exportColumns} filename="lancamentos_contabeis" />
          <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Lançamento</Button>
        </div>
      </div>

      <AdvancedFilters fields={filterFields} values={filters} onChange={setFilters} onClear={() => setFilters({})} />

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total de Lançamentos</p><p className="text-2xl font-bold">{journalEntries.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Lançados</p><p className="text-2xl font-bold text-success">{totalPosted}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Rascunhos</p><p className="text-2xl font-bold text-warning">{totalDraft}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Valor Total Lançado</p><p className="text-2xl font-bold">{formatCurrency(totalValue)}</p></CardContent></Card>
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
                <div><span className="text-muted-foreground">Data:</span> {new Date(selectedEntry.date).toLocaleDateString('pt-BR')}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className={cn('ml-1', statusColors[selectedEntry.status])}>{getJournalStatusLabel(selectedEntry.status)}</Badge></div>
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
                      <TableCell className="text-right">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</TableCell>
                      <TableCell className="text-right">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell className="text-right">{formatCurrency(selectedEntry.totalDebit)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(selectedEntry.totalCredit)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="text-xs text-muted-foreground">Criado por {selectedEntry.createdBy} em {new Date(selectedEntry.createdAt).toLocaleString('pt-BR')}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
