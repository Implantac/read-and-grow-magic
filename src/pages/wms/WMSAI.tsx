import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, AlertTriangle, TrendingUp, Package, RefreshCw } from 'lucide-react';
import { useWMSAIInsights } from '@/hooks/useWMSAIInsights';

const severityConfig: Record<string, { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  info: { icon: <TrendingUp className="h-4 w-4" />, variant: 'outline' },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, variant: 'secondary' },
  critical: { icon: <AlertTriangle className="h-4 w-4" />, variant: 'destructive' },
};

const categoryLabels: Record<string, string> = {
  slotting: 'Slotting',
  rupture: 'Ruptura',
  replenishment: 'Reabastecimento',
  bottleneck: 'Gargalo',
  idle_stock: 'Estoque Parado',
  optimization: 'Otimização',
  general: 'Geral',
};

export default function WMSAIPage() {
  const { insights, loading, dismiss, refetch } = useWMSAIInsights();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const critical = insights.filter(i => i.severity === 'critical').length;
  const warnings = insights.filter(i => i.severity === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IA do WMS</h1>
          <p className="text-muted-foreground">Insights inteligentes para otimizar operação logística</p>
        </div>
        <Button variant="outline" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights Ativos</CardTitle>
            <Brain className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{insights.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{critical}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-500">{warnings}</div></CardContent>
        </Card>
      </div>

      {insights.length > 0 ? (
        <div className="space-y-4">
          {insights.map(insight => {
            const sev = severityConfig[insight.severity] || severityConfig.info;
            return (
              <Card key={insight.id} className={insight.severity === 'critical' ? 'border-destructive' : insight.severity === 'warning' ? 'border-amber-500' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {sev.icon} {insight.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{categoryLabels[insight.category] || insight.category}</Badge>
                      <Badge variant={sev.variant}>{insight.severity}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insight.description && <p className="text-sm">{insight.description}</p>}
                  {insight.recommendedActions && Array.isArray(insight.recommendedActions) && (
                    <div>
                      <p className="text-sm font-medium mb-1">Ações Recomendadas:</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        {(insight.recommendedActions as string[]).map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => dismiss(insight.id)}>Dispensar</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum insight no momento</h3>
            <p>A IA está monitorando a operação e gerará insights automaticamente.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
