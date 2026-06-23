import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import type { BIMetrics } from './useBIMetrics';

interface TrendTabProps {
  metrics: BIMetrics;
  period: string;
  periodDays: number;
}

export function TrendTab({ metrics, period, periodDays }: TrendTabProps) {
  const { productionTrend } = metrics;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Produção Diária ({period} dias)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={productionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" fontSize={10} interval={Math.floor(periodDays / 10)} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="produced" name="Produzido" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
              <Area type="monotone" dataKey="rejected" name="Refugo" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.1)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Produtividade (peças/h)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" fontSize={10} interval={Math.floor(periodDays / 10)} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="pcsH" name="Peças/h" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
