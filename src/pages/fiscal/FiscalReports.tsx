import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart3,
  Download,
  FileText,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  FileSpreadsheet,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { reportTypeLabels } from '@/config/fiscal';
import { useFiscalReports } from '@/hooks/useFiscalReports';
import { CreateReportDialog } from '@/components/fiscal/CreateReportDialog';
import type { FiscalReport } from '@/types/fiscal';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { color: 'bg-warning/10 text-warning', icon: Clock },
  generated: { color: 'bg-success/10 text-success', icon: CheckCircle },
  error: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

// Chart data will be computed from reports

export default function FiscalReportsPage() {
  const { toast } = useToast();
  const { reports, loading, generate, create } = useFiscalReports();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [generating, setGenerating] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filteredReports = reports.filter((report) => {
    return typeFilter === 'all' || report.type === typeFilter;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const handleGenerate = async (report: FiscalReport) => {
    setGenerating(report.id);
    await generate(report.id);
    setGenerating(null);
  };

  const handleDownload = (report: FiscalReport) => {
    toast({
      title: 'Download Iniciado',
      description: `Baixando ${reportTypeLabels[report.type]}...`,
    });
  };

  const renderStatusBadge = (status: string) => {
    const config = statusConfig[status];
    const Icon = config?.icon || FileText;
    const labels: Record<string, string> = {
      pending: 'Pendente',
      generated: 'Gerado',
      error: 'Erro',
    };
    return (
      <Badge className={`${config?.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {labels[status] || status}
      </Badge>
    );
  };

  const totalTaxes = reports.reduce((s, r) => s + r.totalICMS + r.totalIPI + r.totalPIS + r.totalCOFINS, 0);
  const taxBreakdown = {
    icms: reports.reduce((s, r) => s + r.totalICMS, 0),
    ipi: reports.reduce((s, r) => s + r.totalIPI, 0),
    pis: reports.reduce((s, r) => s + r.totalPIS, 0),
    cofins: reports.reduce((s, r) => s + r.totalCOFINS, 0),
  };

  const taxDistributionData = [
    { name: 'ICMS', value: taxBreakdown.icms, color: 'hsl(var(--primary))' },
    { name: 'COFINS', value: taxBreakdown.cofins, color: 'hsl(var(--info, 210 100% 50%))' },
    { name: 'IPI', value: taxBreakdown.ipi, color: 'hsl(var(--warning, 45 100% 50%))' },
    { name: 'PIS', value: taxBreakdown.pis, color: 'hsl(var(--success, 142 76% 36%))' },
  ].filter(d => d.value > 0);

  const monthlyTaxData = reports
    .filter(r => r.status === 'generated')
    .slice(0, 6)
    .reverse()
    .map(r => ({
      name: r.period,
      icms: r.totalICMS,
      ipi: r.totalIPI,
      pis: r.totalPIS,
      cofins: r.totalCOFINS,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios Fiscais</h1>
          <p className="text-muted-foreground">
            Gerencie e exporte seus relatórios fiscais e obrigações acessórias
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <FileSpreadsheet className="h-4 w-4" />
          Novo Relatório
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impostos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTaxes)}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ICMS</CardTitle>
            <div className="h-3 w-3 rounded-full bg-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(taxBreakdown.icms)}</div>
            <Progress value={(taxBreakdown.icms / totalTaxes) * 100} className="mt-2 h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              {((taxBreakdown.icms / totalTaxes) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">COFINS</CardTitle>
            <div className="h-3 w-3 rounded-full bg-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(taxBreakdown.cofins)}</div>
            <Progress value={(taxBreakdown.cofins / totalTaxes) * 100} className="mt-2 h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              {((taxBreakdown.cofins / totalTaxes) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PIS + IPI</CardTitle>
            <div className="flex gap-1">
              <div className="h-3 w-3 rounded-full bg-warning" />
              <div className="h-3 w-3 rounded-full bg-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(taxBreakdown.pis + taxBreakdown.ipi)}</div>
            <Progress value={((taxBreakdown.pis + taxBreakdown.ipi) / totalTaxes) * 100} className="mt-2 h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              {(((taxBreakdown.pis + taxBreakdown.ipi) / totalTaxes) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tax Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolução de Impostos
            </CardTitle>
            <CardDescription>Impostos por mês (últimos 6 meses)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTaxData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis
                    className="text-xs"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="icms"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                    name="ICMS"
                  />
                  <Area
                    type="monotone"
                    dataKey="cofins"
                    stackId="1"
                    stroke="hsl(var(--info))"
                    fill="hsl(var(--info))"
                    fillOpacity={0.6}
                    name="COFINS"
                  />
                  <Area
                    type="monotone"
                    dataKey="ipi"
                    stackId="1"
                    stroke="hsl(var(--warning))"
                    fill="hsl(var(--warning))"
                    fillOpacity={0.6}
                    name="IPI"
                  />
                  <Area
                    type="monotone"
                    dataKey="pis"
                    stackId="1"
                    stroke="hsl(var(--success))"
                    fill="hsl(var(--success))"
                    fillOpacity={0.6}
                    name="PIS"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tax Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Distribuição de Impostos
            </CardTitle>
            <CardDescription>Composição tributária do mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taxDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {taxDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {taxDistributionData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                  <span className="ml-auto text-sm font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Reports List */}
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold">Relatórios e Obrigações</h2>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
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
                {filteredReports.map((report) => (
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerate(report)}
                            disabled={generating === report.id}
                          >
                            {generating === report.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            <span className="ml-2 hidden sm:inline">Gerar</span>
                          </Button>
                        )}
                        {report.status === 'generated' && (
                          <>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(report)}
                            >
                              <Download className="h-4 w-4" />
                              <span className="ml-2 hidden sm:inline">Baixar</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      Nenhum relatório encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create Report Dialog */}
      <CreateReportDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={create} />
    </div>
  );
}
