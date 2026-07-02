import { useMemo } from 'react';
import { format } from 'date-fns';
import { Camera, History, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Skeleton } from '@/ui/base/skeleton';
import { Badge } from '@/ui/base/badge';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatBRL } from '@/lib/formatters';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  useForecastSnapshots,
  useRecordForecastSnapshot,
  type ForecastSnapshot,
} from '@/hooks/commercial/useForecastSnapshots';

interface Props {
  periodKey: string;
}

/**
 * Histórico semana-a-semana de snapshots de forecast para o período.
 * Permite capturar snapshot manual para congelar a "foto do dia" do pipeline.
 */
export function ForecastSnapshotHistory({ periodKey }: Props) {
  const { data: snapshots = [], isLoading } = useForecastSnapshots(periodKey);
  const record = useRecordForecastSnapshot();

  const chartData = useMemo(() => {
    return (snapshots as ForecastSnapshot[]).map((s) => ({
      date: format(new Date(s.forecast_date), 'dd/MM'),
      Meta: Number(s.target_revenue ?? 0),
      Forecast: Number(s.predicted_revenue ?? 0),
      Realizado: Number(s.actual_revenue ?? 0),
    }));
  }, [snapshots]);

  const last = snapshots.at(-1) as ForecastSnapshot | undefined;
  const prev = snapshots.at(-2) as ForecastSnapshot | undefined;
  const deltaForecast = last && prev ? Number(last.predicted_revenue) - Number(prev.predicted_revenue) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Histórico de Snapshots — {periodKey}
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => record.mutate(periodKey)}
          disabled={record.isPending}
        >
          <Camera className="mr-1 h-3.5 w-3.5" />
          {record.isPending ? 'Capturando…' : 'Capturar snapshot'}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-56" />
        ) : snapshots.length === 0 ? (
          <EmptyState
            title="Nenhum snapshot registrado"
            description="Capture o primeiro snapshot para começar a acompanhar a evolução do forecast do período."
          />
        ) : (
          <>
            {last && prev && (
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="gap-1">
                  {deltaForecast >= 0
                    ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                    : <TrendingDown className="h-3 w-3 text-destructive" />}
                  Variação forecast: {deltaForecast >= 0 ? '+' : ''}{formatBRL(deltaForecast)}
                </Badge>
                <span className="text-muted-foreground">
                  {snapshots.length} snapshot{snapshots.length === 1 ? '' : 's'} no período
                </span>
              </div>
            )}
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatBRL(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Meta" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="Forecast" stroke="hsl(var(--chart-4))" strokeWidth={2} />
                <Line type="monotone" dataKey="Realizado" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
