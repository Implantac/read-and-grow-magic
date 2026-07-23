import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Progress } from '@/ui/base/progress';
import { Trophy, Medal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatBRL } from '@/lib/formatters';
import { MEDAL_COLORS, COLORS, fmtShort } from './constants';

export function RankingTab({ performances }: { performances: any[] }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" /> Ranking de Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performances.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sem dados de vendedores</p>
            ) : (
              <div className="space-y-3">
                {performances.map((p, i) => (
                  <div key={p.repId} className={`flex items-center gap-3 p-3 rounded-lg border ${i === 0 ? 'bg-primary/5 border-primary/20' : ''}`}>
                    <div className="shrink-0 w-8 text-center">
                      {i < 3 ? (
                        <Medal className={`h-6 w-6 mx-auto ${MEDAL_COLORS[i]}`} />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{p.repName}</span>
                        <span className="text-sm font-bold text-primary">{formatBRL(p.totalSales)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>{p.ordersCount} pedidos</span>
                        <span>Ticket: {formatBRL(p.avgTicket)}</span>
                        <span>Conv: {p.conversionRate.toFixed(0)}%</span>
                        <span>{p.clientsServed} clientes</span>
                      </div>
                      {p.monthlyTarget > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={Math.min(p.targetPct, 100)} className="h-1 flex-1" />
                          <span className={`text-[10px] font-medium ${p.targetPct >= 100 ? 'text-emerald-600' : p.targetPct >= 70 ? 'text-amber-600' : 'text-destructive'}`}>
                            {p.targetPct.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Faturamento por Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            {performances.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performances.slice(0, 8)} layout="vertical">
                  <XAxis type="number" tickFormatter={v => fmtShort(v)} fontSize={10} />
                  <YAxis type="category" dataKey="repName" width={100} fontSize={11} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Bar dataKey="totalSales" radius={[0, 4, 4, 0]}>
                    {performances.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Comparativo Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Vendedor</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Faturamento</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Pedidos</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Ticket Médio</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Conversão</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Ganhos</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Perdidos</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Clientes</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Meta</th>
                </tr>
              </thead>
              <tbody>
                {performances.map(p => (
                  <tr key={p.repId} className="border-b hover:bg-muted/30">
                    <td className="px-3 py-2 font-bold">{p.ranking}</td>
                    <td className="px-3 py-2 font-medium">{p.repName}</td>
                    <td className="px-3 py-2 text-right font-semibold text-primary">{formatBRL(p.totalSales)}</td>
                    <td className="px-3 py-2 text-right">{p.ordersCount}</td>
                    <td className="px-3 py-2 text-right">{formatBRL(p.avgTicket)}</td>
                    <td className="px-3 py-2 text-right">
                      <Badge variant={p.conversionRate >= 50 ? 'default' : 'secondary'}>{p.conversionRate.toFixed(0)}%</Badge>
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-600">{p.wonDeals}</td>
                    <td className="px-3 py-2 text-right text-destructive">{p.lostDeals}</td>
                    <td className="px-3 py-2 text-right">{p.clientsServed}</td>
                    <td className="px-3 py-2 text-right">
                      {p.monthlyTarget > 0 ? (
                        <Badge variant={p.targetPct >= 100 ? 'default' : p.targetPct >= 70 ? 'secondary' : 'destructive'}>
                          {p.targetPct.toFixed(0)}%
                        </Badge>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
