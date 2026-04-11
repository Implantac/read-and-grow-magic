import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain, Zap, Target, AlertTriangle, TrendingUp, Users, Phone, CheckCircle,
  DollarSign, ShieldAlert, Sparkles, RefreshCw, ArrowRight, Clock,
  Lightbulb, XCircle, BarChart3, TrendingDown, Percent, CalendarDays,
} from 'lucide-react';
import {
  useAIScores, useAIRecommendations, useAIInsights, useAIDailyActions,
  useAIPredictions, useAIForecasts,
  useRunAIEngine, useCompleteAIAction, useActOnRecommendation, useDismissInsight,
  type AIScore, type AIRecommendation, type AIInsight, type AIDailyAction, type AIPrediction, type AIForecast,
} from '@/hooks/useAICommercial';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const SEVERITY_MAP: Record<string, { color: string; icon: typeof AlertTriangle }> = {
  critical: { color: 'text-red-500', icon: ShieldAlert },
  warning: { color: 'text-amber-500', icon: AlertTriangle },
  info: { color: 'text-blue-500', icon: Lightbulb },
  success: { color: 'text-emerald-500', icon: CheckCircle },
};

const PRIORITY_MAP: Record<string, string> = {
  maximum: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
};

const ACTION_ICONS: Record<string, typeof Phone> = {
  urgent_call: ShieldAlert, follow_up: Phone, upsell: TrendingUp,
  reorder: RefreshCw, call: Phone, recovery: TrendingDown, expand: Sparkles,
};

const ROLE_LABELS: Record<string, string> = {
  seller: '🧑‍💼 Vendedor', supervisor: '👥 Supervisor',
  manager: '📊 Gerente', director: '🏢 Diretoria',
};

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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
        <KPICard index={0} title="Clientes Scored" value={totalScored.toString()} subtitle={`${atRisk} em risco • ${declining} em queda`} icon={<Users className="h-5 w-5" />} accentColor="primary" />
        <KPICard index={1} title="Ações do Dia" value={pendingActions.toString()} subtitle={`${completedActions} concluídas`} icon={<Zap className="h-5 w-5" />} accentColor="info" />
        <KPICard index={2} title="Deals em Risco" value={highRiskDeals.toString()} subtitle={`${highPriority} alta prioridade`} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" />
        <KPICard index={3} title="Potencial Recs" value={fmt(totalRecsValue)} subtitle={`${recommendations.length} recomendações`} icon={<DollarSign className="h-5 w-5" />} accentColor="success" />
      </div>

      {/* Forecast Summary */}
      {latestForecast && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">Previsão {latestForecast.period}</span>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Pessimista</div>
                <div className="text-sm font-semibold">{fmt(latestForecast.worst_case || 0)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Realista</div>
                <div className="text-lg font-bold text-primary">{fmt(latestForecast.predicted_revenue || 0)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Otimista</div>
                <div className="text-sm font-semibold">{fmt(latestForecast.best_case || 0)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Confiança</div>
                <div className="text-sm font-semibold">{Math.round((latestForecast.confidence || 0) * 100)}%</div>
              </div>
              {latestForecast.factors?.target_achievement_pct != null && (
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Meta</div>
                  <div className={`text-sm font-bold ${latestForecast.factors.target_achievement_pct >= 100 ? 'text-emerald-500' : latestForecast.factors.target_achievement_pct >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
                    {latestForecast.factors.target_achievement_pct}%
                  </div>
                </div>
              )}
              {latestForecast.factors?.daily_needed > 0 && (
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Precisa/dia</div>
                  <div className="text-sm font-semibold">{fmt(latestForecast.factors.daily_needed)}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engine Controls */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-medium text-sm">Motores da IA</span>
          <div className="flex flex-wrap gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={() => runEngine.mutate('score_clients')} disabled={isRunning}>
              <RefreshCw className={`h-3 w-3 mr-1 ${isRunning ? 'animate-spin' : ''}`} /> Scoring
            </Button>
            <Button size="sm" variant="outline" onClick={() => runEngine.mutate('generate_daily_actions')} disabled={isRunning}>
              <Target className="h-3 w-3 mr-1" /> Ações
            </Button>
            <Button size="sm" variant="outline" onClick={() => runEngine.mutate('generate_predictions')} disabled={isRunning}>
              <Percent className="h-3 w-3 mr-1" /> Previsões
            </Button>
            <Button size="sm" variant="outline" onClick={() => runEngine.mutate('generate_recommendations')} disabled={isRunning}>
              <Sparkles className="h-3 w-3 mr-1" /> Recomendações
            </Button>
            <Button size="sm" variant="outline" onClick={() => runEngine.mutate('generate_insights')} disabled={isRunning}>
              <Lightbulb className="h-3 w-3 mr-1" /> Insights
            </Button>
            <Button size="sm" variant="outline" onClick={() => runEngine.mutate('generate_forecast')} disabled={isRunning}>
              <BarChart3 className="h-3 w-3 mr-1" /> Forecast
            </Button>
            <Button size="sm" onClick={() => runEngine.mutate('full_analysis')} disabled={isRunning}>
              <Brain className={`h-3 w-3 mr-1 ${isRunning ? 'animate-spin' : ''}`} /> Análise Completa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="actions">📋 Ações ({pendingActions})</TabsTrigger>
          <TabsTrigger value="scores">🏆 Ranking ({totalScored})</TabsTrigger>
          <TabsTrigger value="recommendations">💡 Recomendações ({recommendations.length})</TabsTrigger>
          <TabsTrigger value="predictions">🎯 Previsões ({predictions.length})</TabsTrigger>
          <TabsTrigger value="insights">📊 Insights ({insights.length})</TabsTrigger>
          <TabsTrigger value="forecast">📈 Forecast</TabsTrigger>
        </TabsList>

        {/* Daily Actions */}
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

        {/* Client Scores */}
        <TabsContent value="scores">
          {loadingScores ? <LoadingSkeleton /> : scores.length === 0 ? (
            <EmptyState icon={Users} message="Nenhum score calculado. Execute o motor de scoring." />
          ) : (
            <div className="grid gap-3">
              {scores.slice(0, 40).map(score => <ScoreCard key={score.id} score={score} />)}
            </div>
          )}
        </TabsContent>

        {/* Recommendations */}
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

        {/* Predictions */}
        <TabsContent value="predictions">
          {loadingPreds ? <LoadingSkeleton /> : predictions.length === 0 ? (
            <EmptyState icon={Target} message="Nenhuma previsão. Execute o motor de previsões." />
          ) : (
            <div className="grid gap-3">
              {predictions.map(pred => <PredictionCard key={pred.id} prediction={pred} />)}
            </div>
          )}
        </TabsContent>

        {/* Insights */}
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

        {/* Forecast */}
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

// ─── Sub-components ──────────────────────────────────────────────────────

function KPI({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string | number; color?: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color || 'text-muted-foreground'}`} />
        <div>
          <div className="text-[10px] text-muted-foreground">{label}</div>
          <div className="font-semibold text-sm">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function DailyActionCard({ action, onComplete }: { action: AIDailyAction; onComplete: (result: string) => void }) {
  const Icon = ACTION_ICONS[action.action_type] || Phone;
  const isDone = action.status === 'completed';

  return (
    <Card className={isDone ? 'opacity-60' : ''}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isDone ? 'bg-muted' : action.priority <= 2 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-primary/10'}`}>
          <Icon className={`h-4 w-4 ${isDone ? 'text-muted-foreground' : action.priority <= 2 ? 'text-red-500' : 'text-primary'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{action.title}</span>
            <Badge variant={action.priority <= 2 ? 'destructive' : 'outline'} className="text-xs">P{action.priority}</Badge>
            {isDone && <Badge className="bg-emerald-500 text-white text-xs">✓</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{action.description}</p>
          {action.explanation && (
            <p className="text-xs text-muted-foreground/70 mt-1 italic border-l-2 border-primary/30 pl-2">💡 {action.explanation}</p>
          )}
          {action.clients && (
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{action.clients.cellphone || action.clients.phone}</span>
              {action.estimated_value > 0 && <span className="text-primary font-medium">{fmt(action.estimated_value)}</span>}
            </div>
          )}
        </div>
        {!isDone && (
          <Button size="sm" variant="outline" onClick={() => onComplete('contacted')}>
            <CheckCircle className="h-3 w-3 mr-1" /> Feito
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreCard({ score }: { score: AIScore }) {
  const gradeColors: Record<string, string> = { A: 'bg-emerald-500', B: 'bg-blue-500', C: 'bg-amber-500', D: 'bg-red-500' };
  const trendIcons: Record<string, string> = { growing: '📈', declining: '📉', stable: '➡️' };

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${gradeColors[score.score_grade] || 'bg-muted'}`}>
          {score.score_grade}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{score.clients?.name || 'N/A'}</span>
            <span className="text-xs text-muted-foreground">{score.clients?.code}</span>
            <Badge className={PRIORITY_MAP[score.priority_level] || ''} variant="outline">{score.priority_level}</Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span>Score: {score.score_numeric}/100</span>
            <span>📅 {score.days_since_purchase}d</span>
            <span>{trendIcons[score.purchase_trend] || '➡️'} {score.purchase_trend}</span>
            <span className={score.churn_probability > 0.5 ? 'text-red-500 font-medium' : ''}>
              Churn: {Math.round(score.churn_probability * 100)}%
            </span>
            <span className={score.recompra_probability > 0.7 ? 'text-emerald-500 font-medium' : ''}>
              Recompra: {Math.round(score.recompra_probability * 100)}%
            </span>
          </div>
          <Progress value={score.score_numeric} className="h-1.5 mt-2" />
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ rec, onAct }: { rec: AIRecommendation; onAct: (result: string) => void }) {
  const typeLabels: Record<string, string> = {
    cross_sell: '🛒 Cross-sell', upsell: '📈 Upsell', recovery: '🔄 Recuperação',
    ticket_increase: '💰 +Ticket', reorder: '📦 Reposição',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-primary mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium text-sm">{rec.title}</span>
              <Badge variant="outline" className="text-xs">{typeLabels[rec.recommendation_type] || rec.recommendation_type}</Badge>
              <Badge className={`text-xs ${PRIORITY_MAP[rec.priority] || ''}`} variant="outline">{rec.priority}</Badge>
              {rec.estimated_value > 0 && <Badge variant="secondary" className="text-xs">{fmt(rec.estimated_value)}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{rec.description}</p>
            {rec.explanation && (
              <p className="text-xs text-muted-foreground/70 mt-1 italic border-l-2 border-primary/30 pl-2">💡 {rec.explanation}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>Cliente: {rec.clients?.name}</span>
              <span>Confiança: {Math.round((rec.confidence || 0) * 100)}%</span>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => onAct('applied')}>
            <ArrowRight className="h-3 w-3 mr-1" /> Aplicar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PredictionCard({ prediction }: { prediction: AIPrediction }) {
  const prob = Math.round(prediction.close_probability * 100);
  const risk = Math.round(prediction.loss_risk * 100);
  const probColor = prob >= 70 ? 'text-emerald-500' : prob >= 40 ? 'text-amber-500' : 'text-red-500';
  const riskColor = risk >= 60 ? 'text-red-500' : risk >= 30 ? 'text-amber-500' : 'text-emerald-500';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Target className="h-4 w-4 text-primary mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium text-sm">{prediction.sales_funnel?.title || prediction.clients?.name || 'Oportunidade'}</span>
              {prediction.sales_funnel?.stage && (
                <Badge variant="outline" className="text-xs">{prediction.sales_funnel.stage}</Badge>
              )}
              {prediction.predicted_value > 0 && (
                <Badge variant="secondary" className="text-xs">{fmt(prediction.predicted_value)}</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs mb-1">
              <span className={`font-medium ${probColor}`}>✅ Fechamento: {prob}%</span>
              <span className={`font-medium ${riskColor}`}>⚠️ Risco: {risk}%</span>
              {prediction.predicted_close_date && (
                <span className="text-muted-foreground">
                  <CalendarDays className="h-3 w-3 inline mr-1" />
                  {new Date(prediction.predicted_close_date).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
            {prediction.recommended_action && (
              <p className="text-xs text-primary font-medium mt-1">→ {prediction.recommended_action}</p>
            )}
            {prediction.explanation && (
              <p className="text-xs text-muted-foreground/70 mt-1 italic border-l-2 border-primary/30 pl-2">💡 {prediction.explanation}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight, onDismiss }: { insight: AIInsight; onDismiss: () => void }) {
  const config = SEVERITY_MAP[insight.severity] || SEVERITY_MAP.info;
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium text-sm">{insight.title}</span>
              <Badge variant="outline" className="text-xs">{ROLE_LABELS[insight.target_role] || insight.target_role}</Badge>
              <Badge variant={insight.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">{insight.severity}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{insight.description}</p>
            {insight.explanation && (
              <p className="text-xs text-muted-foreground/70 mt-1 italic border-l-2 border-primary/30 pl-2">💡 {insight.explanation}</p>
            )}
            {insight.suggested_actions?.length > 0 && (
              <div className="mt-2 space-y-1">
                {insight.suggested_actions.map((action: string, i: number) => (
                  <div key={i} className="flex items-center gap-1 text-xs text-primary">
                    <ArrowRight className="h-3 w-3" />{action}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={onDismiss}><XCircle className="h-3 w-3" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ForecastCard({ forecast }: { forecast: AIForecast }) {
  const byRep = forecast.by_rep ? Object.entries(forecast.by_rep as Record<string, any>) : [];
  const byRegion = forecast.by_region ? Object.entries(forecast.by_region as Record<string, number>) : [];
  const bySegment = forecast.by_segment ? Object.entries(forecast.by_segment as Record<string, number>) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Forecast — {forecast.period}
          <span className="text-xs text-muted-foreground ml-auto">{new Date(forecast.forecast_date).toLocaleDateString('pt-BR')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Pessimista</div>
            <div className="text-sm font-bold">{fmt(forecast.worst_case || 0)}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-xs text-muted-foreground">Realista</div>
            <div className="text-lg font-bold text-primary">{fmt(forecast.predicted_revenue || 0)}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Otimista</div>
            <div className="text-sm font-bold">{fmt(forecast.best_case || 0)}</div>
          </div>
        </div>

        {byRep.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Por Vendedor</h4>
            <div className="space-y-1">
              {byRep.map(([id, data]: [string, any]) => (
                <div key={id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                  <span>{data.name || id.slice(0, 8)}</span>
                  <div className="flex gap-3">
                    <span>Conf: {fmt(data.confirmed || 0)}</span>
                    <span className="text-muted-foreground">Pipeline: {fmt(data.pipeline || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {byRegion.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Por Região</h4>
            <div className="flex flex-wrap gap-2">
              {byRegion.map(([region, value]) => (
                <Badge key={region} variant="secondary" className="text-xs">{region}: {fmt(value as number)}</Badge>
              ))}
            </div>
          </div>
        )}

        {bySegment.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Por Segmento</h4>
            <div className="flex flex-wrap gap-2">
              {bySegment.map(([seg, value]) => (
                <Badge key={seg} variant="outline" className="text-xs">{seg}: {fmt(value as number)}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof Users; message: string }) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Icon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
