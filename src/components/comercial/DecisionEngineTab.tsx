import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFollowUpTasks } from '@/hooks/useFollowUpTasks';
import { useAIScores } from '@/hooks/useAICommercial';
import { useCommercialAlerts } from '@/hooks/useCommercialAlerts';
import { useSalesFunnel } from '@/hooks/commercial/useSalesFunnel';
import { useAISalesMessage } from '@/hooks/useFollowUpTasks';
import { Brain, Flame, Phone, MessageSquare, AlertTriangle, TrendingUp, UserX, Zap, Target, Loader2, Sparkles, Copy, Clock } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

export default function DecisionEngineTab() {
  const { data: pendingTasks = [] } = useFollowUpTasks(undefined, 'pending');
  const { data: scores = [] } = useAIScores();
  const { data: alerts = [] } = useCommercialAlerts('active');
  const { data: funnel = [] } = useSalesFunnel();
  const aiMessage = useAISalesMessage();
  const [aiPlan, setAiPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const overdue = pendingTasks.filter(t => t.scheduled_date < today);
  const todayTasks = pendingTasks.filter(t => t.scheduled_date === today);
  const hotLeads = scores.filter(s => s.score_numeric >= 80);
  const riskClients = scores.filter(s => s.churn_probability > 0.5);
  const dormant = scores.filter(s => (s.days_since_purchase || 0) > 90);
  const pipelineValue = funnel.reduce((a: number, f: any) => a + (f.value || 0), 0);

  const urgencyScore = useMemo(() => {
    const overdueWeight = overdue.length * 3;
    const riskWeight = riskClients.length * 2;
    const hotWeight = hotLeads.length * 1;
    return Math.min(100, overdueWeight + riskWeight + hotWeight + todayTasks.length);
  }, [overdue, riskClients, hotLeads, todayTasks]);

  const generatePlan = () => {
    setLoadingPlan(true);
    const topClients = hotLeads.slice(0, 5).map(s => ({
      name: s.clients?.name || 'N/A',
      score: s.score_numeric,
      trend: s.purchase_trend,
    }));

    aiMessage.mutate({
      action: 'generate_daily_plan',
      context: {
        activeLeads: funnel.filter((f: any) => f.status === 'active').length,
        hotLeads: hotLeads.length,
        pendingProposals: funnel.filter((f: any) => f.stage === 'proposal').length,
        riskClients: riskClients.length,
        dormantClients: dormant.length,
        overdueFollowUps: overdue.length,
        todayFollowUps: todayTasks.length,
        pipelineValue,
        topClients,
      },
    }, {
      onSuccess: (data) => {
        try {
          const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          setAiPlan(parsed);
        } catch {
          setAiPlan({ summary: data.result, priority_actions: [], recovery_targets: [], tips: [] });
        }
        setLoadingPlan(false);
      },
      onError: () => setLoadingPlan(false),
    });
  };

  const urgencyColor = urgencyScore >= 70 ? 'text-destructive' : urgencyScore >= 40 ? 'text-amber-500' : 'text-emerald-500';
  const urgencyLabel = urgencyScore >= 70 ? 'URGENTE' : urgencyScore >= 40 ? 'ATENÇÃO' : 'TRANQUILO';

  return (
    <div className="space-y-6">
      {/* Pulse Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Brain className="h-10 w-10 text-primary" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold">Motor de Decisão</h3>
                <p className="text-sm text-muted-foreground">O sistema analisa sua carteira e decide o que fazer</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-black ${urgencyColor}`}>{urgencyScore}</div>
              <Badge variant={urgencyScore >= 70 ? 'destructive' : urgencyScore >= 40 ? 'default' : 'secondary'}>
                {urgencyLabel}
              </Badge>
            </div>
          </div>
          <Progress value={urgencyScore} className="mt-4 h-2" />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { icon: AlertTriangle, label: 'Atrasados', value: overdue.length, color: 'text-destructive', bg: 'border-destructive/30' },
          { icon: Clock, label: 'Hoje', value: todayTasks.length, color: 'text-primary', bg: 'border-primary/30' },
          { icon: Flame, label: 'Quentes', value: hotLeads.length, color: 'text-orange-500', bg: 'border-orange-500/30' },
          { icon: UserX, label: 'Risco', value: riskClients.length, color: 'text-destructive', bg: 'border-destructive/30' },
          { icon: Target, label: 'Inativos', value: dormant.length, color: 'text-amber-500', bg: 'border-amber-500/30' },
          { icon: TrendingUp, label: 'Pipeline', value: `R$ ${(pipelineValue / 1000).toFixed(0)}k`, color: 'text-emerald-500', bg: 'border-emerald-500/30' },
        ].map((s) => (
          <Card key={s.label} className={s.bg}>
            <CardContent className="p-3 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generate AI Plan */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />Plano de Ação Diário (IA)
              </CardTitle>
              <CardDescription>A IA analisa toda a carteira e gera ações priorizadas</CardDescription>
            </div>
            <Button onClick={generatePlan} disabled={loadingPlan} size="sm">
              {loadingPlan ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
              Gerar Plano
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!aiPlan && !loadingPlan && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Clique em "Gerar Plano" para a IA analisar sua carteira</p>
              <p className="text-xs mt-1">O motor decide quem contatar, quando e qual mensagem usar</p>
            </div>
          )}

          {loadingPlan && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Analisando carteira e gerando plano...</p>
            </div>
          )}

          {aiPlan && (
            <div className="space-y-4">
              {/* Summary */}
              {aiPlan.summary && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium">{aiPlan.summary}</p>
                </div>
              )}

              {/* Priority Actions */}
              {aiPlan.priority_actions?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Ações Prioritárias</h4>
                  {aiPlan.priority_actions.map((a: any, i: number) => {
                    const urgencyColors: Record<string, string> = { critical: 'border-l-destructive', high: 'border-l-amber-500', medium: 'border-l-primary' };
                    const actionIcons: Record<string, typeof Phone> = { call: Phone, whatsapp: MessageSquare, proposal: Target };
                    const Icon = actionIcons[a.action_type] || Zap;
                    return (
                      <div key={i} className={`border-l-4 ${urgencyColors[a.urgency] || 'border-l-primary'} p-3 rounded-r-lg bg-card border border-l-0`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-muted-foreground mt-0.5">#{a.order || i + 1}</span>
                            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{a.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{a.reason}</p>
                              {a.expected_impact && <p className="text-xs text-emerald-600 mt-0.5">💰 {a.expected_impact}</p>}
                            </div>
                          </div>
                          <Badge variant={a.urgency === 'critical' ? 'destructive' : a.urgency === 'high' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                            {a.urgency}
                          </Badge>
                        </div>
                        {a.suggested_message && (
                          <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                            <p className="italic">"{a.suggested_message}"</p>
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] mt-1 px-2" onClick={() => navigator.clipboard.writeText(a.suggested_message)}>
                              <Copy className="h-3 w-3 mr-1" />Copiar
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Recovery Targets */}
              {aiPlan.recovery_targets?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">♻️ Alvos de Recuperação</h4>
                  {aiPlan.recovery_targets.map((r: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{r.client_name}</p>
                          <p className="text-xs text-muted-foreground">{r.days_inactive}d inativo • {r.approach}</p>
                        </div>
                      </div>
                      {r.message && (
                        <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                          <p className="italic">"{r.message}"</p>
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] mt-1 px-2" onClick={() => navigator.clipboard.writeText(r.message)}>
                            <Copy className="h-3 w-3 mr-1" />Copiar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tips */}
              {aiPlan.tips?.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">💡 Dicas Estratégicas</h4>
                  <ul className="space-y-1">
                    {aiPlan.tips.map((tip: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Actions */}
      {overdue.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {overdue.length} Follow-ups Atrasados — Ação Imediata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdue.slice(0, 8).map(t => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded border border-destructive/20 bg-destructive/5">
                <div>
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.client_name} • Atraso: {t.scheduled_date}</p>
                </div>
                <Badge variant="destructive" className="text-[10px]">{t.priority}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Hot Leads */}
      {hotLeads.length > 0 && (
        <Card className="border-orange-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              🔥 {hotLeads.length} Leads Quentes — Priorizar Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hotLeads.slice(0, 6).map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded border">
                <div>
                  <p className="text-sm font-medium">{s.clients?.name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">
                    Score: {s.score_numeric} • Recompra: {Math.round(s.recompra_probability * 100)}%
                    {s.purchase_trend === 'growing' && ' • 📈 Crescendo'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => {
                    const phone = s.clients?.cellphone || s.clients?.phone || '';
                    if (phone) window.open(`https://wa.me/55${phone.replace(/\D/g, '')}`, '_blank');
                  }}>
                    <MessageSquare className="h-3 w-3" />
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
