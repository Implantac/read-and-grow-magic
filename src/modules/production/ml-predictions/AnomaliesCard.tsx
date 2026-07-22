import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart, Line, Legend, Cell } from 'recharts';
import { BarChart3, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Anomalies } from './useMLPredictions';

export function AnomaliesCard({ anomalies }: { anomalies: Anomalies }) {
  const anomalyCount = anomalies.filter(a => a.isAnomaly).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Detecção de Anomalias — Controle Estatístico (Z-Score ± 2σ)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {anomalies.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={anomalies}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--destructive) / 0.08)" name="Lim. Superior (2σ)" />
                <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" name="Lim. Inferior (2σ)" />
                <Line type="monotone" dataKey="mean" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={1} name="Média" dot={false} />
                <Bar dataKey="rate" name="Peças/h">
                  {anomalies.map((entry, i) => (
                    <Cell key={i} fill={entry.isAnomaly ? (entry.anomalyType === 'high' ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))') : 'hsl(var(--primary))'} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>

            {anomalyCount > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Anomalias Identificadas:</p>
                {anomalies.filter(a => a.isAnomaly).map((a, i) => (
                  <div key={i} className={cn('p-3 rounded-lg text-sm flex items-center gap-3', a.anomalyType === 'low' ? 'bg-destructive/10' : 'bg-chart-2/10')}>
                    {a.anomalyType === 'low' ? <ArrowDownRight className="h-4 w-4 text-destructive" /> : <ArrowUpRight className="h-4 w-4 text-chart-2" />}
                    <span><strong>{a.date}</strong>: {a.rate} peças/h (Z={a.zScore}) — {a.anomalyType === 'low' ? 'Produtividade anormalmente baixa' : 'Pico atípico de produtividade'}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-muted-foreground py-8">Dados insuficientes para análise estatística.</p>
        )}
      </CardContent>
    </Card>
  );
}
