import { PhoneCall, Zap } from 'lucide-react';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { formatBRL } from '@/lib/formatters';
import type { ClientInsight } from '@/hooks/commercial/useSalesIntelligence';
import { OPPORTUNITY_LABELS, RISK_CONFIG } from './constants';

interface OpportunitiesTabProps {
  insights: ClientInsight[];
  clients: any[];
  onOpenScript: (insight: ClientInsight) => void;
  onScheduleFollowUp: (insight: ClientInsight) => void;
}

export function OpportunitiesTab({ insights, clients, onOpenScript, onScheduleFollowUp }: OpportunitiesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Clientes para Vender Hoje
          <Badge variant="secondary">{insights.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma oportunidade identificada</p>
        ) : (
          <div className="space-y-3">
            {insights.slice(0, 15).map(insight => {
              const risk = RISK_CONFIG[insight.riskLevel];
              return (
                <div key={insight.clientId} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className={`w-2 h-10 rounded-full ${risk.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{insight.clientName}</span>
                      <Badge variant="outline" className="text-[10px]">{insight.clientCode}</Badge>
                      {insight.classification && (
                        <Badge variant={insight.classification === 'A' ? 'default' : 'secondary'} className="text-[10px]">
                          {insight.classification}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{insight.suggestedAction}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>Ticket médio: {formatBRL(insight.avgTicket)}</span>
                      <span>Total: {formatBRL(insight.totalPurchases)}</span>
                      {insight.segment && <span>• {insight.segment}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className="text-[10px]">
                      {OPPORTUNITY_LABELS[insight.opportunityType] || insight.opportunityType}
                    </Badge>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600" onClick={() => {
                      const client = clients.find(c => c.id === insight.clientId);
                      const phone = client?.cellphone || client?.phone || '';
                      const cleanPhone = phone.replace(/\D/g, '');
                      const msg = encodeURIComponent(`Olá${client?.trade_name ? ' ' + client.trade_name : ''}, tudo bem? Gostaria de conversar sobre uma oportunidade.`);
                      window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank', 'noopener,noreferrer');
                    }}>
                      💬 WhatsApp
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onOpenScript(insight)}>
                      📋 Script
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onScheduleFollowUp(insight)}>
                      <PhoneCall className="h-3 w-3 mr-1" /> Agendar
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
