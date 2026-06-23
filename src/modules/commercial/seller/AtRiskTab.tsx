import { PhoneCall, ShieldAlert } from 'lucide-react';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { formatBRL } from '@/lib/formatters';
import type { ClientInsight } from '@/hooks/commercial/useSalesIntelligence';
import { RISK_CONFIG } from './constants';

interface AtRiskTabProps {
  insights: ClientInsight[];
  onScheduleFollowUp: (insight: ClientInsight) => void;
}

export function AtRiskTab({ insights, onScheduleFollowUp }: AtRiskTabProps) {
  const atRisk = insights.filter(i => i.riskLevel === 'critical' || i.riskLevel === 'high');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          Clientes em Risco de Perda
        </CardTitle>
      </CardHeader>
      <CardContent>
        {atRisk.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum cliente em risco</p>
        ) : (
          <div className="space-y-3">
            {atRisk.map(insight => {
              const risk = RISK_CONFIG[insight.riskLevel];
              return (
                <div key={insight.clientId} className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <risk.icon className="h-4 w-4 text-destructive" />
                        <span className="font-medium">{insight.clientName}</span>
                        <Badge variant={risk.badge} className="text-[10px]">{risk.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{insight.suggestedAction}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Último pedido: {insight.daysSinceLastPurchase} dias atrás</span>
                        <span>Total comprado: {formatBRL(insight.totalPurchases)}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => onScheduleFollowUp(insight)}>
                      <PhoneCall className="h-3 w-3 mr-1" /> Ligar Agora
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
