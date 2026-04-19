import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFinancialAlerts, useDetectFinancialAlerts, useUpdateAlertStatus } from '@/hooks/useFinancialAlerts';
import { AlertTriangle, AlertCircle, Bell, Check, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SEVERITY: Record<string, { variant: any; icon: any }> = {
  info: { variant: 'secondary', icon: Bell },
  warning: { variant: 'default', icon: AlertTriangle },
  critical: { variant: 'destructive', icon: AlertCircle },
};

export default function FinancialAlertsPage() {
  const { data: alerts = [] } = useFinancialAlerts('open');
  const detect = useDetectFinancialAlerts();
  const update = useUpdateAlertStatus();

  const stats = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length,
  };

  return (
    <PageContainer>
      <PageHeader
        title="🚨 Alertas Financeiros Inteligentes"
        description="Detecção automática de saldo negativo projetado, queda de receita e aumento de despesas."
        actions={
          <Button onClick={() => detect.mutate()} disabled={detect.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${detect.isPending ? 'animate-spin' : ''}`} />
            Analisar agora
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Críticos</p>
            <p className="text-2xl font-bold text-destructive">{stats.critical}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Atenção</p>
            <p className="text-2xl font-bold">{stats.warning}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Informativos</p>
            <p className="text-2xl font-bold text-muted-foreground">{stats.info}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Alertas abertos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {alerts.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum alerta aberto. Clique em "Analisar agora" para detectar.
            </p>
          )}
          {alerts.map((a) => {
            const sev = SEVERITY[a.severity] || SEVERITY.info;
            const Icon = sev.icon;
            return (
              <div key={a.id} className="flex items-start gap-3 p-4 border rounded-lg bg-card">
                <Icon className={`h-5 w-5 mt-0.5 ${a.severity === 'critical' ? 'text-destructive' : 'text-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{a.title}</p>
                    <Badge variant={sev.variant}>{a.severity}</Badge>
                    <Badge variant="outline" className="text-xs">{a.alert_type}</Badge>
                  </div>
                  {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => update.mutate({ id: a.id, status: 'acknowledged' })}
                  >
                    Visto
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => update.mutate({ id: a.id, status: 'resolved' })}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
