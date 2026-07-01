import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Skeleton } from '@/ui/base/skeleton';
import { Badge } from '@/ui/base/badge';
import { useForecastMonteCarlo } from '@/hooks/commercial/useForecastMonteCarlo';
import { format } from 'date-fns';
import { formatBRL } from '@/lib/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Dice5, Gauge, TrendingUp, TrendingDown, Sigma } from 'lucide-react';

const currentPeriod = format(new Date(), 'yyyy-MM');

export default function ForecastMonteCarlo() {
  const [period, setPeriod] = useState(currentPeriod);
  const [scenarios, setScenarios] = useState(2000);
  const { data, isLoading } = useForecastMonteCarlo(period, scenarios);

  const fmt = (v: number) => formatBRL(v);
  const fmtShort = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}k` : String(Math.round(v));

  return (
    <PageContainer>
      <PageHeader
        title="Forecast Probabilístico (Monte Carlo)"
        description="Simulação estocástica do pipeline com bandas P10 / P50 / P90"
      >
        <div className="flex items-end gap-2">
          <div className="w-40">
            <Label className="text-xs">Período</Label>
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
          <div className="w-32">
            <Label className="text-xs">Simulações</Label>
            <Input
              type="number"
              min={200}
              max={20000}
              step={100}
              value={scenarios}
              onChange={(e) => setScenarios(Math.max(200, Math.min(20000, Number(e.target.value) || 2000)))}
            />
          </div>
        </div>
      </PageHeader>

      {isLoading || !data ? (
        <Card><CardContent className="p-6"><Skeleton className="h-72 w-full" /></CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <KPICard title="Confirmado" value={fmt(data.confirmed)} icon={<Gauge className="h-5 w-5" />} accentColor="success" />
            <KPICard title="P10 (pessimista)" value={fmt(data.p10)} icon={<TrendingDown className="h-5 w-5" />} accentColor="warning" />
            <KPICard title="P50 (mediana)" value={fmt(data.p50)} icon={<Dice5 className="h-5 w-5" />} accentColor="primary" />
            <KPICard title="P90 (otimista)" value={fmt(data.p90)} icon={<TrendingUp className="h-5 w-5" />} accentColor="info" />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Distribuição de cenários</CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px]">
                  <Sigma className="h-3 w-3 mr-1" /> σ ≈ {fmt(data.stddev)}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Média {fmt(data.mean)}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {data.scenarios.toLocaleString('pt-BR')} simulações · {data.pipelineCount} deals
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.histogram}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" tickFormatter={fmtShort} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(v: number) => `Faixa ~ ${fmt(v)}`}
                    formatter={(v: number) => [`${v} cenários`, 'Frequência']}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                  <ReferenceLine x={data.p10} stroke="hsl(var(--chart-4))" strokeDasharray="4 2" label={{ value: 'P10', fontSize: 10, fill: 'hsl(var(--chart-4))' }} />
                  <ReferenceLine x={data.p50} stroke="hsl(var(--primary))" strokeDasharray="4 2" label={{ value: 'P50', fontSize: 10, fill: 'hsl(var(--primary))' }} />
                  <ReferenceLine x={data.p90} stroke="hsl(var(--chart-2))" strokeDasharray="4 2" label={{ value: 'P90', fontSize: 10, fill: 'hsl(var(--chart-2))' }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Como interpretar</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>• <strong className="text-foreground">P10</strong>: em 90% dos cenários o faturamento fica acima deste valor (compromisso seguro).</p>
              <p>• <strong className="text-foreground">P50</strong>: mediana das simulações — cenário mais provável.</p>
              <p>• <strong className="text-foreground">P90</strong>: teto realista — apenas 10% dos cenários superam.</p>
              <p>• Cada deal do pipeline é sorteado {data.scenarios.toLocaleString('pt-BR')} vezes conforme a probabilidade da etapa.</p>
            </CardContent>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
