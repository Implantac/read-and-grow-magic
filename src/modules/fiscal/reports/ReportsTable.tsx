import { Calendar, Download, Eye, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Card, CardContent } from '@/ui/base/card';
import { EmptyState } from '@/shared/components/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { reportTypeLabels } from '@/config/fiscal';
import type { FiscalReport } from '@/types/fiscal';
import { formatCurrency, formatDate, renderStatusBadge } from './helpers';

interface Props {
  reports: FiscalReport[];
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
  generating: string | null;
  onGenerate: (r: FiscalReport) => void;
  onDownload: (r: FiscalReport) => void;
}

export function ReportsTable({ reports, typeFilter, onTypeFilterChange, generating, onGenerate, onDownload }: Props) {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-lg font-semibold">Relatórios e Obrigações</h2>
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Tipo de Relatório" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="sped_fiscal">SPED Fiscal</SelectItem>
            <SelectItem value="sped_contribuicoes">SPED Contribuições</SelectItem>
            <SelectItem value="sintegra">SINTEGRA</SelectItem>
            <SelectItem value="gia">GIA</SelectItem>
            <SelectItem value="monthly_summary">Resumo Mensal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Relatório</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>NF-e</TableHead>
                <TableHead>NFC-e</TableHead>
                <TableHead>Total Impostos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gerado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{reportTypeLabels[report.type]}</div>
                      <div className="text-xs text-muted-foreground">{report.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{report.period}</TableCell>
                  <TableCell>{report.totalNFe}</TableCell>
                  <TableCell>{report.totalNFCe}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(report.totalICMS + report.totalIPI + report.totalPIS + report.totalCOFINS)}
                  </TableCell>
                  <TableCell>{renderStatusBadge(report.status)}</TableCell>
                  <TableCell>{formatDate(report.generatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {report.status === 'pending' && (
                        <Button variant="outline" size="sm" onClick={() => onGenerate(report)} disabled={generating === report.id}>
                          <RefreshCw className={`h-4 w-4 ${generating === report.id ? 'animate-spin' : ''}`} />
                          <span className="ml-2 hidden sm:inline">Gerar</span>
                        </Button>
                      )}
                      {report.status === 'generated' && (
                        <>
                          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => onDownload(report)}>
                            <Download className="h-4 w-4" />
                            <span className="ml-2 hidden sm:inline">Baixar</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState icon={FileText} title="Nenhum relatório encontrado" description="Gere um novo relatório fiscal para o período desejado." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
