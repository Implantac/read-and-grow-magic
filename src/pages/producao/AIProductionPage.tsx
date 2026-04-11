import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAIProductionInsights } from '@/hooks/useAIProductionInsights';
import { Brain, Sparkles, CheckCircle, AlertTriangle, TrendingDown, Zap, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const severityConfig: Record<string, { color: string; icon: any }> = {
  low: { color: 'bg-info/15 text-info', icon: Zap },
  medium: { color: 'bg-warning/15 text-warning', icon: AlertTriangle },
  high: { color: 'bg-warning/15 text-warning', icon: AlertTriangle },
  critical: { color: 'bg-destructive/15 text-destructive', icon: TrendingDown },
};

const typeLabels: Record<string, string> = {
  bottleneck: '🔴 Gargalo', delay_risk: '⏰ Risco de Atraso', low_productivity: '📉 Baixa Produtividade',
  capacity_optimization: '⚡ Otimização', material_shortage: '📦 Falta de Material', rebalance: '🔄 Redistribuição',
};

export default function AIProductionPage() {
  const { insights, loading, generating, generateInsights, resolveInsight } = useAIProductionInsights();
  const active = insights.filter(i => i.status === 'active');
  const resolved = insights.filter(i => i.status === 'resolved');

  return (
    <PageContainer loading={loading}>
      <PageHeader title="🧠 IA de Produção" description="Inteligência artificial para otimização da fábrica">
        <Button onClick={generateInsights} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Gerar Insights
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Insights Total" value={insights.length} icon={<Brain className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Ativos" value={active.length} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={1} />
        <KPICard title="Resolvidos" value={resolved.length} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={2} />
      </div>

      {active.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum insight ativo</p>
            <p className="text-sm text-muted-foreground mb-4">Clique em "Gerar Insights" para analisar a produção</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {active.map(insight => {
          const sev = severityConfig[insight.severity] || severityConfig.medium;
          const SevIcon = sev.icon;
          return (
            <Card key={insight.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SevIcon className="h-5 w-5" />
                      <span className="font-semibold">{insight.title}</span>
                      <Badge className={sev.color}>{insight.severity}</Badge>
                      <Badge variant="outline">{typeLabels[insight.insight_type] || insight.insight_type}</Badge>
                    </div>
                    {insight.description && <p className="text-sm text-muted-foreground">{insight.description}</p>}
                    {insight.recommended_action && (
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium">💡 Ação Recomendada:</p>
                        <p className="text-sm">{insight.recommended_action}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {insight.affected_sector && <span>Setor: {insight.affected_sector}</span>}
                      {insight.impact_estimate && <span>Impacto: {insight.impact_estimate}</span>}
                      <span>{format(parseISO(insight.created_at), 'dd/MM HH:mm')}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => resolveInsight(insight.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Resolver
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {resolved.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Histórico Resolvido ({resolved.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {resolved.slice(0, 10).map(i => (
              <div key={i.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                <span>{i.title}</span>
                <span className="text-xs text-muted-foreground">{i.resolved_at ? format(parseISO(i.resolved_at), 'dd/MM') : ''}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
