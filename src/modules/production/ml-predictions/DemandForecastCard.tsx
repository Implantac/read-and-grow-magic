import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Line, Legend, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { DemandForecast } from './useMLPredictions';

export function DemandForecastCard({ data }: { data: DemandForecast }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Previsão de Demanda — Suavização Exponencial (Holt-Winters) com Intervalo de Confiança 95%
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--primary) / 0.1)" name="Limite Superior" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--background))" name="Limite Inferior" />
              <Bar dataKey="qty" name="Real" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="forecast" name="Previsão" stroke="hsl(var(--chart-2))" strokeWidth={3} strokeDasharray="8 4" dot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-8">Dados insuficientes para previsão (mínimo 4 semanas).</p>
        )}
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span>🔵 Dados reais</span>
          <span>🟢 Previsão (Holt-Winters α=0.3, β=0.1)</span>
          <span>📊 Intervalo de confiança 95%</span>
        </div>
      </CardContent>
    </Card>
  );
}
