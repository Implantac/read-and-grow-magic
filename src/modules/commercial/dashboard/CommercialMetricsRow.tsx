import { Badge } from '@/ui/base/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Progress } from '@/ui/base/progress';
import { Target, Zap, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { formatBRL } from '@/lib/formatters';

interface Props {
  stats: any;
  insights: any;
  clientsLen: number;
}

export function CommercialMetricsRow({ stats, insights, clientsLen }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-3 mb-6">
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Meta vs Realizado</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">{formatBRL(stats.billingMonth)}</p>
              <p className="text-xs text-muted-foreground">de {formatBRL(stats.totalTarget)} meta mensal</p>
            </div>
            <Badge variant={stats.targetPct >= 100 ? 'default' : stats.targetPct >= 70 ? 'secondary' : 'destructive'} className="text-sm">
              {stats.targetPct.toFixed(0)}%
            </Badge>
          </div>
          <Progress value={Math.min(stats.targetPct, 100)} className="h-2" />
          {stats.billingGrowth !== 0 && (
            <div className="flex items-center gap-1 text-xs">
              {stats.billingGrowth > 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
              <span className={stats.billingGrowth > 0 ? 'text-emerald-600' : 'text-destructive'}>
                {Math.abs(stats.billingGrowth).toFixed(1)}% vs mês anterior
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Previsão de Faturamento</CardTitle></CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-primary">{formatBRL(insights.revenueForecast)}</p>
          <p className="text-xs text-muted-foreground mt-1">Pedidos em andamento (pendentes → separados)</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[10px]">{insights.stuckOrders.length} travados</Badge>
            <Badge variant="outline" className="text-[10px]">{insights.inactiveClients.length} sem compra há 90d+</Badge>
            <Badge variant="outline" className="text-[10px]">{insights.pendingApprovals.length} aguardando aprovação</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Curva ABC Clientes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(['A', 'B', 'C'] as const).map(cls => {
              const count = insights.abcDist[cls];
              const pct = clientsLen > 0 ? (count / clientsLen) * 100 : 0;
              return (
                <div key={cls} className="flex items-center gap-3">
                  <Badge variant={cls === 'A' ? 'default' : 'secondary'} className="w-8 justify-center text-xs font-bold">{cls}</Badge>
                  <div className="flex-1"><Progress value={pct} className="h-1.5" /></div>
                  <span className="text-xs font-medium w-16 text-right">{count} ({pct.toFixed(0)}%)</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
