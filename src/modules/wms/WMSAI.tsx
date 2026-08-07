import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { EmptyState } from '@/shared/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Brain, AlertTriangle, TrendingUp, RefreshCw, Zap, Layers } from 'lucide-react';
import DigitalTwinViewer from './components/twin/DigitalTwinViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { useWMSAIInsights } from '@/hooks/wms/useWMSAIInsights';

const severityConfig: Record<string, { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline'; border: string }> = {
  info: { icon: <TrendingUp className="h-4 w-4" />, variant: 'outline', border: '' },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, variant: 'secondary', border: 'border-l-4 border-l-amber-500' },
  critical: { icon: <AlertTriangle className="h-4 w-4" />, variant: 'destructive', border: 'border-l-4 border-l-destructive' },
};

const categoryLabels: Record<string, string> = {
  slotting: 'Slotting', rupture: 'Ruptura', replenishment: 'Reabastecimento',
  bottleneck: 'Gargalo', idle_stock: 'Estoque Parado', optimization: 'Otimização', general: 'Geral',
};

export default function WMSAIPage() {
  const { insights, loading, dismiss, refetch } = useWMSAIInsights();

  const critical = insights.filter(i => i.severity === 'critical').length;
  const warnings = insights.filter(i => i.severity === 'warning').length;

  return (
    <PageContainer loading={loading}>
      <PageHeader
        title="IA Logística — Cérebro Operacional"
        description="Insights preditivos e otimização autônoma de armazém e rede"
        actions={<Button variant="outline" onClick={refetch}><RefreshCw className="h-4 w-4 mr-2" /> Atualizar</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KPICard title="Insights Ativos" value={insights.length} icon={Brain} index={0} />
        <KPICard title="Críticos" value={critical} icon={AlertTriangle} index={1} color={critical > 0 ? 'danger' : undefined} />
        <KPICard title="Alertas" value={warnings} icon={AlertTriangle} index={2} color={warnings > 0 ? 'warning' : undefined} />
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Insights Ativos</TabsTrigger>
          <TabsTrigger value="twin">Digital Twin (Live)</TabsTrigger>
          <TabsTrigger value="slotting">Otimização de Slotting</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map(insight => {
                const sev = severityConfig[insight.severity] || severityConfig.info;
                return (
                  <Card key={insight.id} className={sev.border}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">{sev.icon} {insight.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{categoryLabels[insight.category] || insight.category}</Badge>
                          <Badge variant={sev.variant}>{insight.severity === 'critical' ? 'Crítico' : insight.severity === 'warning' ? 'Alerta' : 'Info'}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {insight.description && <p className="text-sm">{insight.description}</p>}
                      {insight.recommendedActions && Array.isArray(insight.recommendedActions) && (
                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-sm font-medium mb-2">Ações Recomendadas:</p>
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
              <CardContent className="p-0">
                <EmptyState
                  icon={Brain}
                  title="Nenhum insight no momento"
                  description="A IA está monitorando a operação e gerará insights automaticamente."
                  action={{ label: 'Atualizar', onClick: () => refetch(), icon: RefreshCw }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="twin">
          <DigitalTwinViewer />
        </TabsContent>

        <TabsContent value="slotting">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" /> Otimização de Slotting IA
              </CardTitle>
              <CardDescription>Realocação de SKUs para otimizar tempo de picking baseada na Curva ABC</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Análise de Giro (Heatmap)
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    A IA identificou que 15% dos itens da Curva A estão em endereços de fundo de armazém. 
                    Sugestão de movimentação para áreas de picking rápido (Golden Zone).
                  </p>
                  <Button size="sm" className="w-full md:w-auto">Executar Re-Slotting Sugerido</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Tempo de Picking Estimado</p>
                    <p className="text-xl font-bold text-green-600">-22% <span className="text-[10px] text-muted-foreground font-normal">(após otimização)</span></p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Capacidade de Pulmão</p>
                    <p className="text-xl font-bold text-blue-600">+12% <span className="text-[10px] text-muted-foreground font-normal">(liberação de espaço)</span></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
