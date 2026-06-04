import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { useForecastCalculation } from '@/hooks/commercial/useSalesForecasts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TrendingUp, Target, BarChart3, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';
import { formatBRL } from '@/lib/formatters';

const currentPeriod = format(new Date(), 'yyyy-MM');

const stageLabels: Record<string, string> = {
  lead: 'Lead', opportunity: 'Oportunidade', proposal: 'Proposta',
  negotiation: 'Negociação', waiting_client: 'Aguard. Cliente', approved: 'Aprovado',
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--primary))'];

export default function ForecastPage() {
  const [period, setPeriod] = useState(currentPeriod);
  const { data: forecast, isLoading } = useForecastCalculation(period);

  const fmt = (v: number) => `${formatBRL(v)}`;

  return (
    <PageContainer>
      <PageHeader title="Forecast Comercial" description="Previsão de faturamento baseada em pipeline e pedidos" />

      <div className="flex items-center gap-3 mb-6">
        <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="w-48" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard title="Confirmado" value={fmt(forecast?.confirmedValue || 0)} icon={<Target className="h-5 w-5" />} index={0} accentColor="success" />
        <KPICard title="Conservador" value={fmt(forecast?.conservative || 0)} icon={<BarChart3 className="h-5 w-5" />} index={1} accentColor="warning" />
        <KPICard title="Realista" value={fmt(forecast?.realistic || 0)} icon={<TrendingUp className="h-5 w-5" />} index={2} accentColor="primary" />
        <KPICard title="Otimista" value={fmt(forecast?.optimistic || 0)} icon={<Zap className="h-5 w-5" />} index={3} accentColor="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>Pipeline por Etapa</CardTitle></CardHeader>
          <CardContent>
            {(forecast?.pipelineByStage || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={forecast?.pipelineByStage?.map(p => ({ ...p, stage: stageLabels[p.stage] || p.stage, weighted: p.value * p.weight }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="value" fill="hsl(var(--muted-foreground))" opacity={0.3} name="Valor Total" />
                  <Bar dataKey="weighted" fill="hsl(var(--primary))" name="Valor Ponderado" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">Nenhum dado de pipeline</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cenários de Previsão</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Confirmado', value: forecast?.confirmedValue || 0 },
                    { name: 'Pipeline Ponderado', value: forecast?.weightedPipeline || 0 },
                  ]}
                  cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--chart-4))" />
                </Pie>
                <Legend />
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Previsão por Representante</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Representante</TableHead>
                <TableHead>Confirmado</TableHead>
                <TableHead>Pipeline Ponderado</TableHead>
                <TableHead>Total Previsto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(forecast?.byRep || []).length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum dado disponível</TableCell></TableRow>
              ) : forecast?.byRep.sort((a, b) => b.total - a.total).map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name || r.id}</TableCell>
                  <TableCell>{fmt(r.confirmed)}</TableCell>
                  <TableCell>{fmt(r.weighted)}</TableCell>
                  <TableCell className="font-semibold">{fmt(r.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
