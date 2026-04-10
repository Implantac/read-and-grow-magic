import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain, Zap, Target, AlertTriangle, TrendingUp, Users, Phone, CheckCircle,
  DollarSign, ShieldAlert, Eye, Sparkles, RefreshCw, ArrowRight, Clock,
  BarChart3, Lightbulb, XCircle,
} from 'lucide-react';
import {
  useAIScores, useAIRecommendations, useAIInsights, useAIDailyActions,
  useRunAIEngine, useCompleteAIAction, useActOnRecommendation, useDismissInsight,
  type AIScore, type AIRecommendation, type AIInsight, type AIDailyAction,
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
  urgent_call: ShieldAlert,
  follow_up: Phone,
  upsell: TrendingUp,
  reorder: RefreshCw,
  call: Phone,
};

export default function AICommercialDashboard() {
  const { data: scores = [], isLoading: loadingScores } = useAIScores();
  const { data: recommendations = [], isLoading: loadingRecs } = useAIRecommendations('pending');
  const { data: insights = [], isLoading: loadingInsights } = useAIInsights();
  const { data: dailyActions = [], isLoading: loadingActions } = useAIDailyActions();

  const runEngine = useRunAIEngine();
  const completeAction = useCompleteAIAction();
  const actOnRec = useActOnRecommendation();
  const dismissInsight = useDismissInsight();

  const [activeTab, setActiveTab] = useState('actions');

  const totalScored = scores.length;
  const atRisk = scores.filter(s => s.churn_probability > 0.6).length;
  const highPriority = scores.filter(s => s.priority_level === 'maximum' || s.priority_level === 'high').length;
  const pendingActions = dailyActions.filter(a => a.status === 'pending').length;
  const completedActions = dailyActions.filter(a => a.status === 'completed').length;
  const totalRecsValue = recommendations.reduce((s, r) => s + (r.estimated_value || 0), 0);

  const isRunning = runEngine.isPending;

  return (
    <PageContainer>
      <PageHeader
        title="🧠 IA Comercial"
        description="Motor inteligente de vendas — scoring, recomendações, insights e ações diárias"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KPI icon={Users} label="Clientes Scored" value={totalScored} />
        <KPI icon={ShieldAlert} label="Em Risco" value={atRisk} color="text-red-500" />
        <KPI icon={Target} label="Alta Prioridade" value={highPriority} color="text-amber-500" />
        <KPI icon={Zap} label="Ações Hoje" value={pendingActions} color="text-blue-500" />
        <KPI icon={CheckCircle} label="Concluídas" value={completedActions} color="text-emerald-500" />
        <KPI icon={DollarSign} label="Potencial Recs" value={fmt(totalRecsValue)} color="text-primary" />
      </div>

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
              <Target className="h-3 w-3 mr-1" /> Ações Diárias
            </Button>
            <Button size="sm" variant="outline" onClick={() => runEngine.mutate('generate_recommendations')} disabled={isRunning}>
              <Sparkles className="h-3 w-3 mr-1" /> Recomendações
            </Button>
            <Button size="sm" variant="outline" onClick={() => runEngine.mutate('generate_insights')} disabled={isRunning}>
              <Lightbulb className="h-3 w-3 mr-1" /> Insights
            </Button>
            <Button size="sm" onClick={() => runEngine.mutate('full_analysis')} disabled={isRunning}>
              <Brain className={`h-3 w-3 mr-1 ${isRunning ? 'animate-spin' : ''}`} /> Análise Completa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="actions">📋 Ações do Dia ({pendingActions})</TabsTrigger>
          <TabsTrigger value="scores">🏆 Ranking ({totalScored})</TabsTrigger>
          <TabsTrigger value="recommendations">💡 Recomendações ({recommendations.length})</TabsTrigger>
          <TabsTrigger value="insights">📊 Insights ({insights.length})</TabsTrigger>
        </TabsList>

        {/* Daily Actions */}
        <TabsContent value="actions">
          {loadingActions ? <LoadingSkeleton /> : dailyActions.length === 0 ? (
            <EmptyState icon={Zap} message="Nenhuma ação gerada. Execute o motor de ações diárias." />
          ) : (
            <div className="grid gap-3">
              {dailyActions.map(action => (
                <DailyActionCard
                  key={action.id}
                  action={action}
                  onComplete={(result) => completeAction.mutate({ id: action.id, result })}
                />
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
              {scores.slice(0, 30).map(score => (
                <ScoreCard key={score.id} score={score} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="recommendations">
          {loadingRecs ? <LoadingSkeleton /> : recommendations.length === 0 ? (
            <EmptyState icon={Sparkles} message="Nenhuma recomendação gerada. Execute o motor de recomendações." />
          ) : (
            <div className="grid gap-3">
              {recommendations.map(rec => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  onAct={(result) => actOnRec.mutate({ id: rec.id, result })}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights">
          {loadingInsights ? <LoadingSkeleton /> : insights.length === 0 ? (
            <EmptyState icon={Lightbulb} message="Nenhum insight gerado. Execute o motor de insights." />
          ) : (
            <div className="grid gap-3">
              {insights.map(insight => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onDismiss={() => dismissInsight.mutate(insight.id)}
                />
              ))}
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
          <div className="text-xs text-muted-foreground">{label}</div>
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
        <div className={`p-2 rounded-lg ${isDone ? 'bg-muted' : 'bg-primary/10'}`}>
          <Icon className={`h-4 w-4 ${isDone ? 'text-muted-foreground' : 'text-primary'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{action.title}</span>
            <Badge variant="outline" className="text-xs">P{action.priority}</Badge>
            {isDone && <Badge className="bg-emerald-500 text-white text-xs">✓</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{action.description}</p>
          {action.explanation && (
            <p className="text-xs text-muted-foreground/70 mt-1 italic">💡 {action.explanation}</p>
          )}
          {action.clients && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {action.clients.cellphone || action.clients.phone}
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
  const gradeColors: Record<string, string> = {
    A: 'bg-emerald-500',
    B: 'bg-blue-500',
    C: 'bg-amber-500',
    D: 'bg-red-500',
  };

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
            <Badge className={PRIORITY_MAP[score.priority_level] || ''} variant="outline">
              {score.priority_level}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Score: {score.score_numeric}/100</span>
            <span>📅 {score.days_since_purchase}d</span>
            <span>📈 {score.purchase_trend}</span>
            <span className={score.churn_probability > 0.5 ? 'text-red-500' : ''}>
              Churn: {Math.round(score.churn_probability * 100)}%
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
    cross_sell: '🛒 Cross-sell',
    upsell: '📈 Upsell',
    recovery: '🔄 Recuperação',
    ticket_increase: '💰 Aumento Ticket',
    reorder: '📦 Reposição',
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
              {rec.estimated_value > 0 && (
                <Badge variant="secondary" className="text-xs">{fmt(rec.estimated_value)}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{rec.description}</p>
            {rec.explanation && (
              <p className="text-xs text-muted-foreground/70 mt-1 italic">💡 {rec.explanation}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-muted-foreground">Cliente: {rec.clients?.name}</span>
              <span className="text-muted-foreground">Confiança: {Math.round((rec.confidence || 0) * 100)}%</span>
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

function InsightCard({ insight, onDismiss }: { insight: AIInsight; onDismiss: () => void }) {
  const config = SEVERITY_MAP[insight.severity] || SEVERITY_MAP.info;
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{insight.title}</span>
              <Badge variant="outline" className="text-xs">{insight.target_role}</Badge>
              <Badge variant={insight.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                {insight.severity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{insight.description}</p>
            {insight.suggested_actions?.length > 0 && (
              <div className="mt-2 space-y-1">
                {insight.suggested_actions.map((action: string, i: number) => (
                  <div key={i} className="flex items-center gap-1 text-xs text-primary">
                    <ArrowRight className="h-3 w-3" />
                    {action}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            <XCircle className="h-3 w-3" />
          </Button>
        </div>
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
