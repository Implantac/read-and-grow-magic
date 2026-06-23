import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/ui/base/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { formatBRL } from '@/lib/formatters';

export function LostSalesTab({ lostAlerts }: { lostAlerts: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Você Está Perdendo Essas Vendas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lostAlerts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma venda em risco 🎉</p>
        ) : (
          <div className="space-y-3">
            {lostAlerts.slice(0, 10).map((alert, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <span className="text-lg">{alert.type === 'stagnant_funnel' ? '⏳' : alert.type === 'cancelled_order' ? '❌' : '📞'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">{alert.description}</p>
                </div>
                {alert.estimatedLoss > 0 && (
                  <Badge variant="destructive">{formatBRL(alert.estimatedLoss)}</Badge>
                )}
              </div>
            ))}
            <div className="p-3 rounded-lg bg-destructive/10 text-center">
              <p className="text-sm font-medium text-destructive">
                Total em risco: {formatBRL(lostAlerts.reduce((s, a) => s + a.estimatedLoss, 0))}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
