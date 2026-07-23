import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { AlertTriangle } from 'lucide-react';
import { formatBRL } from '@/lib/formatters';
import { LOST_TYPE_CONFIG } from './constants';

export function LostSalesTab({ lostAlerts }: { lostAlerts: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Você Está Perdendo Essas Vendas
          <Badge variant="destructive">{lostAlerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lostAlerts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma venda em risco identificada 🎉</p>
        ) : (
          <div className="space-y-3">
            {lostAlerts.map((alert, i) => {
              const config = LOST_TYPE_CONFIG[alert.type] || LOST_TYPE_CONFIG.stagnant_funnel;
              return (
                <div key={i} className={`p-4 rounded-lg border ${config.color}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{config.icon}</span>
                        <span className="text-sm font-medium">{alert.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                    </div>
                    {alert.estimatedLoss > 0 && (
                      <Badge variant="destructive" className="shrink-0">
                        {formatBRL(alert.estimatedLoss)}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
              <p className="text-sm font-medium text-destructive">
                Total em risco: {formatBRL(lostAlerts.reduce((s, a) => s + a.estimatedLoss, 0))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Agir agora pode recuperar parte significativa deste valor
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
