import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ExportButton } from '@/components/shared/ExportButton';
import { mockJournalEntries, getJournalStatusLabel } from '@/data/accountingMockData';
import { cn } from '@/lib/utils';
import { BookOpen, Plus, FileText, CheckCircle, XCircle, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

export default function JournalEntriesPage() {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const totalPosted = mockJournalEntries.filter((e) => e.status === 'posted').length;
  const totalDraft = mockJournalEntries.filter((e) => e.status === 'draft').length;
  const totalValue = mockJournalEntries.filter((e) => e.status === 'posted').reduce((s, e) => s + e.totalDebit, 0);

  const columns: Column<JournalEntry>[] = [
    { key: 'number', label: 'Número', sortable: true },
    { key: 'date', label: 'Data', sortable: true, render: (v) => new Date(String(v)).toLocaleDateString('pt-BR') },
    { key: 'description', label: 'Descrição', sortable: true },
    {
      key: 'totalDebit', label: 'Débito', sortable: true, className: 'text-right',
      render: (v) => formatCurrency(Number(v)),
    },
    {
      key: 'totalCredit', label: 'Crédito', sortable: true, className: 'text-right',
      render: (v) => formatCurrency(Number(v)),
    },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lançamentos Contábeis</h1>
          <p className="text-muted-foreground">Registro de partidas dobradas</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={mockJournalEntries as unknown as Record<string, unknown>[]} columns={exportColumns} filename="lancamentos_contabeis" />
          <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Lançamento</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total de Lançamentos</p><p className="text-2xl font-bold">{mockJournalEntries.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Lançados</p><p className="text-2xl font-bold text-success">{totalPosted}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Rascunhos</p><p className="text-2xl font-bold text-warning">{totalDraft}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Valor Total Lançado</p><p className="text-2xl font-bold">{formatCurrency(totalValue)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={mockJournalEntries}
            searchPlaceholder="Buscar lançamento..."
            actions={(row) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setSelectedEntry(row)}><Eye className="h-4 w-4" /></Button>
                {row.status === 'draft' && (
                  <Button variant="ghost" size="icon" className="text-success"><CheckCircle className="h-4 w-4" /></Button>
                )}
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
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
