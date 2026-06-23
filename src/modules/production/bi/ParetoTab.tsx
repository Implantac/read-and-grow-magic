import { Award } from 'lucide-react';
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/ui/base/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { formatBRL } from '@/lib/formatters';
import type { BIMetrics } from './useBIMetrics';

export function ParetoTab({ metrics }: { metrics: BIMetrics }) {
  const { paretoData } = metrics;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" /> Análise Pareto ABC — Lucro Acumulado</CardTitle>
        </CardHeader>
        <CardContent>
          {paretoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={paretoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" fontSize={10} angle={-30} textAnchor="end" height={80} />
                <YAxis yAxisId="left" fontSize={11} tickFormatter={v => `R$${v}`} />
                <YAxis yAxisId="right" orientation="right" fontSize={11} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="profit" name="Lucro" radius={[4, 4, 0, 0]}>
                  {paretoData.map((entry, i) => (
                    <Cell key={i} fill={entry.class === 'A' ? 'hsl(var(--primary))' : entry.class === 'B' ? 'hsl(var(--chart-3))' : 'hsl(var(--muted-foreground))'} />
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="cumPct" name="% Acumulado" stroke="hsl(var(--destructive))" strokeWidth={2} dot />
                <ReferenceLine yAxisId="right" y={80} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label="80%" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-8">Sem dados de custos para análise Pareto</p>}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {['A', 'B', 'C'].map(cls => {
          const items = paretoData.filter(p => p.class === cls);
          const totalP = items.reduce((s, p) => s + p.profit, 0);
          return (
            <Card key={cls}>
              <CardContent className="pt-6 text-center space-y-2">
                <Badge variant={cls === 'A' ? 'default' : cls === 'B' ? 'secondary' : 'outline'} className="text-lg px-4 py-1">Classe {cls}</Badge>
                <p className="text-3xl font-bold">{items.length} produtos</p>
                <p className="text-sm text-muted-foreground">Lucro: {formatBRL(totalP)}</p>
                <p className="text-xs text-muted-foreground">{cls === 'A' ? '80% do lucro total' : cls === 'B' ? '15% do lucro total' : '5% do lucro total'}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
