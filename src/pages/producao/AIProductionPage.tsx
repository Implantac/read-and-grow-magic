import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAIProductionInsights } from '@/hooks/useAIProductionInsights';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Sparkles, CheckCircle, AlertTriangle, TrendingDown, Zap, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const severityConfig: Record<string, { color: string; icon: any }> = {
  low: { color: 'bg-blue-100 text-blue-800', icon: Zap },
  medium: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  high: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  critical: { color: 'bg-red-100 text-red-800', icon: TrendingDown },
};

const typeLabels: Record<string, string> = {
  bottleneck: '🔴 Gargalo',
  delay_risk: '⏰ Risco de Atraso',
  low_productivity: '📉 Baixa Produtividade',
  capacity_optimization: '⚡ Otimização',
  material_shortage: '📦 Falta de Material',
  rebalance: '🔄 Redistribuição',
};

export default function AIProductionPage() {
  const { insights, loading, generating, generateInsights, resolveInsight } = useAIProductionInsights();

  const active = insights.filter(i => i.status === 'active');
  const resolved = insights.filter(i => i.status === 'resolved');

  if (loading) return <PageContainer><Skeleton className="h-10 w-64" /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="🧠 IA de Produção" description="Inteligência artificial para otimização da fábrica">
        <Button onClick={generateInsights} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Gerar Insights
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3"><Brain className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{insights.length}</p><p className="text-xs text-muted-foreground">Insights Total</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">{active.length}</p><p className="text-xs text-muted-foreground">Ativos</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{resolved.length}</p><p className="text-xs text-muted-foreground">Resolvidos</p></div></CardContent></Card>
      </div>

      {active.length === 0 && (
        <Card className="mb-6">
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
                    <div className="flex items-center gap-2">
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
        <Card className="mt-6">
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
