import { Card, CardContent } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Progress } from '@/ui/base/progress';
import { CheckCircle, Phone, ArrowRight, Sparkles, Target, XCircle, CalendarDays } from 'lucide-react';
import { formatBRL, formatDate } from '@/lib/formatters';
import { ACTION_ICONS, PRIORITY_MAP, SEVERITY_MAP, ROLE_LABELS } from './constants';
import type { AIScore, AIRecommendation, AIInsight, AIDailyAction, AIPrediction } from '@/hooks/commercial/useAICommercial';

export function DailyActionCard({ action, onComplete }: { action: AIDailyAction; onComplete: (result: string) => void }) {
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
              {action.estimated_value > 0 && <span className="text-primary font-medium">{formatBRL(action.estimated_value)}</span>}
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

export function ScoreCard({ score }: { score: AIScore }) {
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
              Cancelamento: {Math.round(score.churn_probability * 100)}%
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

export function RecommendationCard({ rec, onAct }: { rec: AIRecommendation; onAct: (result: string) => void }) {
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
              {rec.estimated_value > 0 && <Badge variant="secondary" className="text-xs">{formatBRL(rec.estimated_value)}</Badge>}
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

export function PredictionCard({ prediction }: { prediction: AIPrediction }) {
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
                <Badge variant="secondary" className="text-xs">{formatBRL(prediction.predicted_value)}</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs mb-1">
              <span className={`font-medium ${probColor}`}>✅ Fechamento: {prob}%</span>
              <span className={`font-medium ${riskColor}`}>⚠️ Risco: {risk}%</span>
              {prediction.predicted_close_date && (
                <span className="text-muted-foreground">
                  <CalendarDays className="h-3 w-3 inline mr-1" />
                  {formatDate(prediction.predicted_close_date)}
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

export function InsightCard({ insight, onDismiss }: { insight: AIInsight; onDismiss: () => void }) {
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
