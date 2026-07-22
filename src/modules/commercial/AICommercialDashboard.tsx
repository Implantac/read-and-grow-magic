import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Button } from '@/ui/base/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { formatBRL } from '@/lib/formatters';
import {
  AlertTriangle, Users, Zap, DollarSign, Target, Sparkles, Lightbulb, BarChart3,
} from 'lucide-react';
import {
  useAIScores, useAIRecommendations, useAIInsights, useAIDailyActions,
  useAIPredictions, useAIForecasts,
  useRunAIEngine, useCompleteAIAction, useActOnRecommendation, useDismissInsight,
} from '@/hooks/commercial/useAICommercial';
import { ROLE_LABELS } from './ai-commercial/constants';
import { LoadingSkeleton, EmptyState } from './ai-commercial/common';
import { DailyActionCard, ScoreCard, RecommendationCard, PredictionCard, InsightCard } from './ai-commercial/cards';
import { ForecastSummary, ForecastCard } from './ai-commercial/forecast';
import { EngineControls } from './ai-commercial/EngineControls';

export default function AICommercialDashboard() {
  const { data: scores = [], isLoading: loadingScores } = useAIScores();
  const { data: recommendations = [], isLoading: loadingRecs } = useAIRecommendations('pending');
  const { data: insights = [], isLoading: loadingInsights } = useAIInsights();
  const { data: dailyActions = [], isLoading: loadingActions } = useAIDailyActions();
  const { data: predictions = [], isLoading: loadingPreds } = useAIPredictions();
  const { data: forecasts = [], isLoading: loadingForecasts } = useAIForecasts();

  const runEngine = useRunAIEngine();
  const completeAction = useCompleteAIAction();
  const actOnRec = useActOnRecommendation();
  const dismissInsight = useDismissInsight();

  const [activeTab, setActiveTab] = useState('actions');
  const [insightFilter, setInsightFilter] = useState<string | null>(null);

  const totalScored = scores.length;
  const atRisk = scores.filter(s => s.churn_probability > 0.6).length;
  const declining = scores.filter(s => s.purchase_trend === 'declining').length;
  const highPriority = scores.filter(s => s.priority_level === 'maximum' || s.priority_level === 'high').length;
  const pendingActions = dailyActions.filter(a => a.status === 'pending').length;
  const completedActions = dailyActions.filter(a => a.status === 'completed').length;
  const totalRecsValue = recommendations.reduce((s, r) => s + (r.estimated_value || 0), 0);
  const highRiskDeals = predictions.filter(p => p.loss_risk > 0.6).length;

  const latestForecast = forecasts[0];
  const isRunning = runEngine.isPending;

  const filteredInsights = insightFilter
    ? insights.filter(i => i.target_role === insightFilter)
    : insights;

  return (
    <PageContainer>
      <PageHeader
        title="🧠 IA Comercial"
        description="Motor inteligente de vendas — scoring, recomendações, previsões, insights e ações diárias"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
        <KPICard index={0} title="Clientes Scored" value={totalScored.toString()} subtitle={`${atRisk} em risco • ${declining} em queda`} icon={<Users className="h-5 w-5" />} accentColor="primary" />
        <KPICard index={1} title="Ações do Dia" value={pendingActions.toString()} subtitle={`${completedActions} concluídas`} icon={<Zap className="h-5 w-5" />} accentColor="info" />
        <KPICard index={2} title="Deals em Risco" value={highRiskDeals.toString()} subtitle={`${highPriority} alta prioridade`} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" />
        <KPICard index={3} title="Potencial Recs" value={formatBRL(totalRecsValue)} subtitle={`${recommendations.length} recomendações`} icon={<DollarSign className="h-5 w-5" />} accentColor="success" />
      </div>

      {latestForecast && <ForecastSummary latestForecast={latestForecast} />}

      <EngineControls isRunning={isRunning} run={(e) => runEngine.mutate(e)} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="actions">📋 Ações ({pendingActions})</TabsTrigger>
          <TabsTrigger value="scores">🏆 Ranking ({totalScored})</TabsTrigger>
          <TabsTrigger value="recommendations">💡 Recomendações ({recommendations.length})</TabsTrigger>
          <TabsTrigger value="predictions">🎯 Previsões ({predictions.length})</TabsTrigger>
          <TabsTrigger value="insights">📊 Insights ({insights.length})</TabsTrigger>
          <TabsTrigger value="forecast">📈 Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="actions">
          {loadingActions ? <LoadingSkeleton /> : dailyActions.length === 0 ? (
            <EmptyState icon={Zap} message="Nenhuma ação gerada. Execute o motor de ações diárias." />
          ) : (
            <div className="grid gap-3">
              {dailyActions.map(action => (
                <DailyActionCard key={action.id} action={action}
                  onComplete={(result) => completeAction.mutate({ id: action.id, result })} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scores">
          {loadingScores ? <LoadingSkeleton /> : scores.length === 0 ? (
            <EmptyState icon={Users} message="Nenhum score calculado. Execute o motor de scoring." />
          ) : (
            <div className="grid gap-3">
              {scores.slice(0, 40).map(score => <ScoreCard key={score.id} score={score} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations">
          {loadingRecs ? <LoadingSkeleton /> : recommendations.length === 0 ? (
            <EmptyState icon={Sparkles} message="Nenhuma recomendação. Execute o motor de recomendações." />
          ) : (
            <div className="grid gap-3">
              {recommendations.map(rec => (
                <RecommendationCard key={rec.id} rec={rec}
                  onAct={(result) => actOnRec.mutate({ id: rec.id, result })} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="predictions">
          {loadingPreds ? <LoadingSkeleton /> : predictions.length === 0 ? (
            <EmptyState icon={Target} message="Nenhuma previsão. Execute o motor de previsões." />
          ) : (
            <div className="grid gap-3">
              {predictions.map(pred => <PredictionCard key={pred.id} prediction={pred} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button size="sm" variant={insightFilter === null ? 'default' : 'outline'} onClick={() => setInsightFilter(null)}>Todos</Button>
            {['seller', 'supervisor', 'manager', 'director'].map(role => (
              <Button key={role} size="sm" variant={insightFilter === role ? 'default' : 'outline'} onClick={() => setInsightFilter(role)}>
                {ROLE_LABELS[role]}
              </Button>
            ))}
          </div>
          {loadingInsights ? <LoadingSkeleton /> : filteredInsights.length === 0 ? (
            <EmptyState icon={Lightbulb} message="Nenhum insight. Execute o motor de insights." />
          ) : (
            <div className="grid gap-3">
              {filteredInsights.map(insight => (
                <InsightCard key={insight.id} insight={insight}
                  onDismiss={() => dismissInsight.mutate(insight.id)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="forecast">
          {loadingForecasts ? <LoadingSkeleton /> : forecasts.length === 0 ? (
            <EmptyState icon={BarChart3} message="Nenhum forecast gerado. Execute o motor de forecast." />
          ) : (
            <div className="grid gap-4">
              {forecasts.map(fc => <ForecastCard key={fc.id} forecast={fc} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
