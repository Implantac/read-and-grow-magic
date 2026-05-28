import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/shared/KPICard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, FileText, AlertTriangle, DollarSign, TrendingUp, TrendingDown, CalendarDays, Loader2 } from 'lucide-react';
import { useDailyReports, useGenerateReport, DailyReport, DailyReportData } from '@/hooks/useDailyReport';

import { formatBRL, formatDate } from '@/lib/formatters';
function ReportDetail({ data }: { data: DailyReportData }) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard title="A Receber Hoje" value={formatBRL(data.receivables_due_today.total)} subtitle={`${data.receivables_due_today.count} títulos`} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="A Receber Atrasados" value={formatBRL(data.receivables_overdue.total)} subtitle={`${data.receivables_overdue.count} títulos`} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={1} />
        <KPICard title="A Pagar Hoje" value={formatBRL(data.payables_due_today.total)} subtitle={`${data.payables_due_today.count} títulos`} icon={<TrendingDown className="h-5 w-5" />} accentColor="warning" index={2} />
        <KPICard title="A Pagar Atrasados" value={formatBRL(data.payables_overdue.total)} subtitle={`${data.payables_overdue.count} títulos`} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={3} />
        <KPICard title="Vendas do Dia" value={formatBRL(data.sales_summary.total)} subtitle={`${data.sales_summary.count} vendas`} icon={<TrendingUp className="h-5 w-5" />} accentColor="success" index={4} />
        <KPICard title="Saldo Caixa" value={formatBRL(data.cash_flow.balance)} subtitle={`+${formatBRL(data.cash_flow.income)} / -${formatBRL(data.cash_flow.expense)}`} icon={<DollarSign className="h-5 w-5" />} accentColor="info" index={5} />
      </div>

      {/* Receivables Due Today */}
      {data.receivables_due_today.items.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">📥 Títulos a Receber — Vencimento Hoje</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.receivables_due_today.items.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.description}</TableCell>
                    <TableCell>{r.client_name}</TableCell>
                    <TableCell className="text-right font-medium">{formatBRL(r.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Receivables Overdue */}
      {data.receivables_overdue.items.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base text-destructive">⚠️ Títulos a Receber em Atraso</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.receivables_overdue.items.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.description}</TableCell>
                    <TableCell>{r.client_name}</TableCell>
                    <TableCell><Badge variant="destructive">{formatDate(r.due_date)}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{formatBRL(r.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payables Due Today */}
      {data.payables_due_today.items.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">📤 Títulos a Pagar — Vencimento Hoje</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payables_due_today.items.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.description}</TableCell>
                    <TableCell>{r.supplier}</TableCell>
                    <TableCell className="text-right font-medium">{formatBRL(r.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sales */}
      {data.sales_summary.items.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">🛒 Vendas do Dia</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sales_summary.items.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">{s.number}</TableCell>
                    <TableCell>{s.client_name}</TableCell>
                    <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{formatBRL(s.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {data.receivables_due_today.count === 0 && data.receivables_overdue.count === 0 && data.payables_due_today.count === 0 && data.sales_summary.count === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado financeiro registrado para esta data.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DailyReports() {
  const { data: reports, isLoading } = useDailyReports();
  const generateReport = useGenerateReport();
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);

  if (isLoading) return <PageLoading message="Carregando relatórios..." />;

  const latestReport = selectedReport || (reports && reports.length > 0 ? reports[0] : null);

  return (
    <PageContainer>
      <PageHeader title="Relatório Executivo Diário" description="Resumo automático enviado ao gestor com a posição financeira do dia">
        <Button onClick={() => generateReport.mutate()} disabled={generateReport.isPending} className="gap-2">
          {generateReport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Gerar Agora
        </Button>
      </PageHeader>

      {/* Report history */}
      {reports && reports.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {reports.slice(0, 10).map((r) => (
            <Button
              key={r.id}
              size="sm"
              variant={latestReport?.id === r.id ? 'default' : 'outline'}
              onClick={() => setSelectedReport(r)}
              className="gap-1"
            >
              <CalendarDays className="h-3 w-3" />
              {formatDate(r.report_date)}
            </Button>
          ))}
        </div>
      )}

      {latestReport ? (
        <ReportDetail data={latestReport.report_data as DailyReportData} />
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum relatório gerado</h3>
            <p className="text-muted-foreground mb-4">Clique em "Gerar Agora" para criar o primeiro relatório executivo.</p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
