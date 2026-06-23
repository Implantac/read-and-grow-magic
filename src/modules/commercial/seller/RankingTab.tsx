import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Progress } from '@/ui/base/progress';
import { formatBRL } from '@/lib/formatters';

export function RankingTab({ performances }: { performances: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Ranking de Vendedores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {performances.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Sem dados</p>
        ) : (
          <div className="space-y-3">
            {performances.map((p, i) => (
              <div key={p.repId} className={`flex items-center gap-3 p-3 rounded-lg border ${i === 0 ? 'bg-primary/5 border-primary/20' : ''}`}>
                <div className="shrink-0 w-8 text-center">
                  {i < 3 ? <span className="text-xl">{['🥇', '🥈', '🥉'][i]}</span> : <span className="text-lg font-bold text-muted-foreground">{i + 1}</span>}
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
                  </div>
                  {p.monthlyTarget > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={Math.min(p.targetPct, 100)} className="h-1 flex-1" />
                      <span className="text-[10px] font-medium">{p.targetPct.toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
