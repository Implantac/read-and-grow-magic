import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { cn } from '@/lib/utils';
import type { BIMetrics } from './useBIMetrics';

export function CostTab({ metrics }: { metrics: BIMetrics }) {
  const { costBySector } = metrics;
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Horas × Eficiência por Setor</CardTitle></CardHeader>
          <CardContent>
            {costBySector.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={costBySector}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" fontSize={11} />
                  <YAxis yAxisId="left" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" fontSize={11} domain={[0, 150]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="laborHours" name="Horas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="efficiency" name="Eficiência %" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Refugo por Setor (%)</CardTitle></CardHeader>
          <CardContent>
            {costBySector.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costBySector}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <ReferenceLine y={5} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label="Meta 5%" />
                  <Bar dataKey="rejectRate" name="Refugo %" radius={[4, 4, 0, 0]}>
                    {costBySector.map((entry, i) => (
                      <Cell key={i} fill={entry.rejectRate > 10 ? 'hsl(var(--destructive))' : entry.rejectRate > 5 ? 'hsl(var(--chart-3))' : 'hsl(var(--chart-2))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Detalhamento por Setor</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Setor</TableHead><TableHead className="text-right">OPs</TableHead>
              <TableHead className="text-right">Horas</TableHead><TableHead className="text-right">Produzido</TableHead>
              <TableHead className="text-right">Refugo</TableHead><TableHead className="text-right">Refugo%</TableHead>
              <TableHead className="text-right">Min/Peça</TableHead><TableHead className="text-right">Eficiência</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {costBySector.map(s => (
                <TableRow key={s.sector}>
                  <TableCell className="font-medium">{s.sector}</TableCell>
                  <TableCell className="text-right">{s.orders}</TableCell>
                  <TableCell className="text-right">{s.laborHours}h</TableCell>
                  <TableCell className="text-right">{s.produced}</TableCell>
                  <TableCell className="text-right text-destructive">{s.rejected}</TableCell>
                  <TableCell className="text-right"><span className={cn(s.rejectRate > 5 ? 'text-destructive font-bold' : '')}>{s.rejectRate}%</span></TableCell>
                  <TableCell className="text-right font-mono">{s.costPerUnit}</TableCell>
                  <TableCell className="text-right"><span className={cn(s.efficiency >= 90 ? 'text-success font-bold' : s.efficiency >= 70 ? '' : 'text-warning')}>{s.efficiency}%</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
