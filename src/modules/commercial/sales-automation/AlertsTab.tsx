import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { useAIScores } from '@/hooks/commercial/useAICommercial';
import { useCommercialAlerts } from '@/hooks/commercial/useCommercialAlerts';
import { Loader2, MessageSquare } from 'lucide-react';

const severityColors: Record<string, string> = { critical: 'destructive', high: 'destructive', medium: 'default', low: 'secondary' };

export function AlertsTab() {
  const { data: alerts = [], isLoading } = useCommercialAlerts('active');
  const { data: scores = [] } = useAIScores();

  const hotLeads = scores.filter(s => s.score_numeric >= 80);
  const riskClients = scores.filter(s => s.churn_probability > 0.5);
  const dormantClients = scores.filter(s => (s.days_since_purchase || 0) > 90);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-500/30"><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{hotLeads.length}</div>
          <div className="text-xs text-muted-foreground">🔥 Leads Quentes</div>
        </CardContent></Card>
        <Card className="border-destructive/30"><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-destructive">{riskClients.length}</div>
          <div className="text-xs text-muted-foreground">⚠️ Risco de Perda</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{dormantClients.length}</div>
          <div className="text-xs text-muted-foreground">💤 Inativos (+90d)</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{alerts.length}</div>
          <div className="text-xs text-muted-foreground">🔔 Alertas Ativos</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Alertas Inteligentes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
            alerts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum alerta ativo</p> :
            alerts.slice(0, 15).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium text-sm">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.description}</div>
                </div>
                <Badge variant={severityColors[a.severity] as any}>{a.severity}</Badge>
              </div>
            ))}
        </CardContent>
      </Card>

      {dormantClients.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">♻️ Recuperação de Clientes Inativos</CardTitle><CardDescription>Clientes sem compra há mais de 90 dias</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {dormantClients.slice(0, 10).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium text-sm">{c.clients?.name}</div>
                  <div className="text-xs text-muted-foreground">{c.days_since_purchase} dias sem compra • Score: {c.score_grade}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    const phone = c.clients?.cellphone || c.clients?.phone || '';
                    const cleanPhone = phone.replace(/\D/g, '');
                    if (cleanPhone) window.open(`https://wa.me/55${cleanPhone}`, '_blank', 'noopener,noreferrer');
                  }}>
                    <MessageSquare className="h-3 w-3 mr-1" />WhatsApp
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
