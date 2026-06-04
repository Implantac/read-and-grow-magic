import { useMemo, useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatBRL } from '@/lib/formatters';
import {
  Target, Phone, AlertTriangle, TrendingUp, Users, Clock, CheckCircle,
  DollarSign, Trophy, Zap, ArrowRight, PhoneCall, Mail, MessageSquare,
  Calendar, Star, ShieldAlert, Eye, Brain, Sparkles, RefreshCw,
} from 'lucide-react';
import { useClients } from '@/hooks/commercial/useClients';
import { useOrders } from '@/hooks/commercial/useOrders';
import { useSales } from '@/hooks/commercial/useSales';
import { useSalesFunnel } from '@/hooks/commercial/useSalesFunnel';
import { useSalesReps } from '@/hooks/commercial/useSalesReps';
import { useFollowUps, useCreateFollowUp, useUpdateFollowUp, useClientInsights, useRepPerformance, useLostSalesAlerts, useSalesScript, type ClientInsight } from '@/hooks/commercial/useSalesIntelligence';
import { useCommercialAlerts } from '@/hooks/useCommercialAlerts';
import { useAIDailyActions, useAIRecommendations, useCompleteAIAction, useActOnRecommendation, useRunAIEngine } from '@/hooks/useAICommercial';
import { differenceInDays, format, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';


const RISK_CONFIG = {
  critical: { label: 'Crítico', color: 'bg-red-500', badge: 'destructive' as const, icon: ShieldAlert },
  high: { label: 'Alto', color: 'bg-orange-500', badge: 'destructive' as const, icon: AlertTriangle },
  medium: { label: 'Médio', color: 'bg-amber-500', badge: 'secondary' as const, icon: Clock },
  low: { label: 'Baixo', color: 'bg-blue-500', badge: 'secondary' as const, icon: TrendingUp },
  none: { label: 'Normal', color: 'bg-emerald-500', badge: 'default' as const, icon: CheckCircle },
};

const OPPORTUNITY_LABELS: Record<string, string> = {
  reactivation: '🔄 Reativação',
  winback: '💰 Win-Back',
  follow_up: '📞 Follow-up',
  upsell: '📈 Upsell',
  cross_sell: '🛒 Cross-sell',
};

export default function SellerDashboard() {
  const { data: clients = [], isLoading: lc } = useClients();
  const { data: orders = [], isLoading: lo } = useOrders();
  const { data: sales = [] } = useSales();
  const { data: funnel = [] } = useSalesFunnel();
  const { data: reps = [] } = useSalesReps();
  const { data: followUps = [] } = useFollowUps();
  const { data: alerts = [] } = useCommercialAlerts('open');
  const { data: aiActions = [] } = useAIDailyActions();
  const { data: aiRecs = [] } = useAIRecommendations('pending');
  const completeAIAction = useCompleteAIAction();
  const actOnAIRec = useActOnRecommendation();
  const runAIEngine = useRunAIEngine();
  const createFollowUp = useCreateFollowUp();
  const updateFollowUp = useUpdateFollowUp();

  const insights = useClientInsights(clients, orders, sales);
  const performances = useRepPerformance(reps, orders, funnel);
  const lostAlerts = useLostSalesAlerts(funnel, orders, followUps);
  const loading = lc || lo;

  const [scriptClient, setScriptClient] = useState<ClientInsight | null>(null);
  const [scriptOpen, setScriptOpen] = useState(false);
  const scriptClientData = clients.find(c => c.id === scriptClient?.clientId) || null;
  const salesScript = useSalesScript(scriptClientData, scriptClient);

  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientInsight | null>(null);
  const [followUpData, setFollowUpData] = useState({ type: 'call', subject: '', description: '', scheduled_date: '' });

  // Today's stats
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const todayOrders = orders.filter(o => isToday(new Date(o.date)) && o.status !== 'cancelled');
    const todayBilling = todayOrders.reduce((s, o) => s + o.total, 0);
    const monthOrders = orders.filter(o => {
      const d = new Date(o.date);
      return d >= monthStart && d <= monthEnd && o.status !== 'cancelled';
    });
    const monthBilling = monthOrders.reduce((s, o) => s + o.total, 0);

    const totalTarget = reps.reduce((s, r) => s + (r.monthly_target || 0), 0);
    const workingDays = 22;
    const dayOfMonth = now.getDate();
    const dailyTarget = totalTarget > 0 ? totalTarget / workingDays : 0;
    const expectedToDate = dailyTarget * Math.min(dayOfMonth, workingDays);
    const targetPct = totalTarget > 0 ? (monthBilling / totalTarget) * 100 : 0;

    const pendingFollowUps = followUps.filter(f => f.status === 'pending' && new Date(f.scheduled_date) <= now);
    const todayFollowUps = followUps.filter(f => f.status === 'pending' && isToday(new Date(f.scheduled_date)));

    const criticalClients = insights.filter(i => i.riskLevel === 'critical' || i.riskLevel === 'high');
    const upsellOpportunities = insights.filter(i => i.opportunityType === 'upsell' || i.opportunityType === 'cross_sell');

    const openFunnel = funnel.filter(f => f.status === 'open');
    const funnelValue = openFunnel.reduce((s, f) => s + f.value, 0);

    return {
      todayBilling, todayOrders: todayOrders.length, monthBilling, monthOrders: monthOrders.length,
      dailyTarget, targetPct, totalTarget, expectedToDate,
      pendingFollowUps: pendingFollowUps.length, todayFollowUps: todayFollowUps.length,
      criticalClients: criticalClients.length, upsellOpportunities: upsellOpportunities.length,
      openFunnel: openFunnel.length, funnelValue, openAlerts: alerts.length,
    };
  }, [orders, reps, followUps, insights, funnel, alerts]);

  const handleScheduleFollowUp = (client: ClientInsight) => {
    setSelectedClient(client);
    setFollowUpData({
      type: 'call',
      subject: `Follow-up: ${client.clientName}`,
      description: client.suggestedAction,
      scheduled_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    });
    setFollowUpOpen(true);
  };

  const saveFollowUp = async () => {
    if (!selectedClient) return;
    await createFollowUp.mutateAsync({
      client_id: selectedClient.clientId,
      sales_rep_id: selectedClient.salesRepId,
      type: followUpData.type,
      subject: followUpData.subject,
      description: followUpData.description,
      scheduled_date: followUpData.scheduled_date,
    } as any);
    setFollowUpOpen(false);
  };

  const completeFollowUp = async (id: string) => {
    await updateFollowUp.mutateAsync({ id, status: 'completed', completed_at: new Date().toISOString() } as any);
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Painel do Vendedor" description="Seu dia a dia de vendas" />
        <div className="grid gap-4 md:grid-cols-4 mt-6">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Painel do Vendedor" description="Foco no que gera resultado — venda mais, venda melhor" />

      {/* Daily KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 mt-6">
        <KPICard index={0} title="Meta Diária" value={formatBRL(stats.dailyTarget)}
          subtitle={`Vendido hoje: ${formatBRL(stats.todayBilling)}`}
          icon={<Target className="h-5 w-5" />} accentColor="primary" />
        <KPICard index={1} title="Meta Mensal" value={`${stats.targetPct.toFixed(0)}%`}
          subtitle={`${formatBRL(stats.monthBilling)} de ${formatBRL(stats.totalTarget)}`}
          icon={<Trophy className="h-5 w-5" />} accentColor="success" />
        <KPICard index={2} title="Follow-ups Hoje" value={stats.todayFollowUps.toString()}
          subtitle={`${stats.pendingFollowUps} atrasados`}
          icon={<Phone className="h-5 w-5" />} accentColor={stats.pendingFollowUps > 0 ? 'danger' : 'info'} />
        <KPICard index={3} title="Clientes em Risco" value={stats.criticalClients.toString()}
          subtitle={`${stats.upsellOpportunities} oportunidades de upsell`}
          icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" />
      </div>

      {/* Progress bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso da Meta Mensal</span>
            <span className="text-sm font-bold text-primary">{stats.targetPct.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(stats.targetPct, 100)} className="h-3" />
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>R$ 0</span>
            <span>{formatBRL(stats.totalTarget)}</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="ai">🤖 IA ({aiActions.filter(a => a.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="opportunities">🎯 Oportunidades</TabsTrigger>
          <TabsTrigger value="followups">📞 Follow-ups</TabsTrigger>
          <TabsTrigger value="at-risk">⚠️ Em Risco</TabsTrigger>
          <TabsTrigger value="lost">🚨 Perdendo ({lostAlerts.length})</TabsTrigger>
          <TabsTrigger value="ranking">🏆 Ranking</TabsTrigger>
          <TabsTrigger value="pipeline">💰 Pipeline</TabsTrigger>
        </TabsList>

        {/* AI Tab */}
        <TabsContent value="ai" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Suas Ações do Dia (IA)
            </h3>
            <Button size="sm" variant="outline" onClick={() => runAIEngine.mutate('generate_daily_actions')} disabled={runAIEngine.isPending}>
              <RefreshCw className={`h-3 w-3 mr-1 ${runAIEngine.isPending ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>

          {aiActions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Nenhuma ação gerada pela IA hoje.</p>
                <Button size="sm" onClick={() => runAIEngine.mutate('full_analysis')} disabled={runAIEngine.isPending}>
                  <Brain className="h-3 w-3 mr-1" /> Gerar Análise Completa
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {aiActions.map(action => {
                const isDone = action.status === 'completed';
                const ActionIcon = action.action_type === 'urgent_call' ? ShieldAlert : action.action_type === 'recovery' ? AlertTriangle : action.action_type === 'upsell' ? TrendingUp : action.action_type === 'reorder' ? RefreshCw : Phone;
                return (
                  <Card key={action.id} className={isDone ? 'opacity-50' : ''}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isDone ? 'bg-muted' : action.priority <= 2 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        <ActionIcon className={`h-4 w-4 ${isDone ? 'text-muted-foreground' : action.priority <= 2 ? 'text-destructive' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-sm">{action.title}</span>
                          <Badge variant={action.priority <= 2 ? 'destructive' : 'outline'} className="text-[10px]">P{action.priority}</Badge>
                          {isDone && <Badge className="bg-emerald-500 text-white text-[10px]">✓</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                        {action.explanation && (
                          <p className="text-[10px] text-muted-foreground/70 mt-1 italic border-l-2 border-primary/30 pl-2">💡 {action.explanation}</p>
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
                        <Button size="sm" variant="outline" onClick={() => completeAIAction.mutate({ id: action.id, result: 'contacted' })}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Feito
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* AI Recommendations section */}
          {aiRecs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                Recomendações da IA
                <Badge variant="secondary">{aiRecs.length}</Badge>
              </h3>
              <div className="space-y-2">
                {aiRecs.slice(0, 5).map(rec => (
                  <Card key={rec.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{rec.title}</span>
                          {rec.estimated_value > 0 && <Badge variant="secondary" className="text-[10px]">{formatBRL(rec.estimated_value)}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                        {rec.explanation && <p className="text-[10px] text-muted-foreground/70 italic mt-1">💡 {rec.explanation}</p>}
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0" onClick={() => actOnAIRec.mutate({ id: rec.id, result: 'applied' })}>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Clientes para Vender Hoje
                <Badge variant="secondary">{insights.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma oportunidade identificada</p>
              ) : (
                <div className="space-y-3">
                  {insights.slice(0, 15).map(insight => {
                    const risk = RISK_CONFIG[insight.riskLevel];
                    return (
                      <div key={insight.clientId} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className={`w-2 h-10 rounded-full ${risk.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{insight.clientName}</span>
                            <Badge variant="outline" className="text-[10px]">{insight.clientCode}</Badge>
                            {insight.classification && (
                              <Badge variant={insight.classification === 'A' ? 'default' : 'secondary'} className="text-[10px]">
                                {insight.classification}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{insight.suggestedAction}</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span>Ticket médio: {formatBRL(insight.avgTicket)}</span>
                            <span>Total: {formatBRL(insight.totalPurchases)}</span>
                            {insight.segment && <span>• {insight.segment}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className="text-[10px]">
                            {OPPORTUNITY_LABELS[insight.opportunityType] || insight.opportunityType}
                          </Badge>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600" onClick={() => {
                            const client = clients.find(c => c.id === insight.clientId);
                            const phone = client?.cellphone || client?.phone || '';
                            const cleanPhone = phone.replace(/\D/g, '');
                            const msg = encodeURIComponent(`Olá${client?.trade_name ? ' ' + client.trade_name : ''}, tudo bem? Gostaria de conversar sobre uma oportunidade.`);
                            window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
                          }}>
                            💬 WhatsApp
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setScriptClient(insight); setScriptOpen(true); }}>
                            📋 Script
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleScheduleFollowUp(insight)}>
                            <PhoneCall className="h-3 w-3 mr-1" /> Agendar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-ups Tab */}
        <TabsContent value="followups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Follow-ups Pendentes
                <Badge variant="secondary">{followUps.filter(f => f.status === 'pending').length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {followUps.filter(f => f.status === 'pending').length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum follow-up pendente</p>
              ) : (
                <div className="space-y-2">
                  {followUps.filter(f => f.status === 'pending').map(fu => {
                    const client = clients.find(c => c.id === fu.client_id);
                    const isOverdue = new Date(fu.scheduled_date) < new Date();
                    const TypeIcon = fu.type === 'call' ? PhoneCall : fu.type === 'email' ? Mail : MessageSquare;
                    return (
                      <div key={fu.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                        <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{fu.subject}</p>
                          <p className="text-xs text-muted-foreground">{client?.name || 'Cliente'}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(fu.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            {isOverdue && <span className="text-destructive ml-1 font-medium">• Atrasado</span>}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => completeFollowUp(fu.id)}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Concluir
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* At-Risk Tab */}
        <TabsContent value="at-risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                Clientes em Risco de Perda
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.filter(i => i.riskLevel === 'critical' || i.riskLevel === 'high').length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum cliente em risco</p>
              ) : (
                <div className="space-y-3">
                  {insights.filter(i => i.riskLevel === 'critical' || i.riskLevel === 'high').map(insight => {
                    const risk = RISK_CONFIG[insight.riskLevel];
                    return (
                      <div key={insight.clientId} className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <risk.icon className="h-4 w-4 text-destructive" />
                              <span className="font-medium">{insight.clientName}</span>
                              <Badge variant={risk.badge} className="text-[10px]">{risk.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{insight.suggestedAction}</p>
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Último pedido: {insight.daysSinceLastPurchase} dias atrás</span>
                              <span>Total comprado: {formatBRL(insight.totalPurchases)}</span>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleScheduleFollowUp(insight)}>
                            <PhoneCall className="h-3 w-3 mr-1" /> Ligar Agora
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lost Sales Tab */}
        <TabsContent value="lost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Você Está Perdendo Essas Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lostAlerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma venda em risco 🎉</p>
              ) : (
                <div className="space-y-3">
                  {lostAlerts.slice(0, 10).map((alert, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                      <span className="text-lg">{alert.type === 'stagnant_funnel' ? '⏳' : alert.type === 'cancelled_order' ? '❌' : '📞'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                      </div>
                      {alert.estimatedLoss > 0 && (
                        <Badge variant="destructive">{formatBRL(alert.estimatedLoss)}</Badge>
                      )}
                    </div>
                  ))}
                  <div className="p-3 rounded-lg bg-destructive/10 text-center">
                    <p className="text-sm font-medium text-destructive">
                      Total em risco: {formatBRL(lostAlerts.reduce((s, a) => s + a.estimatedLoss, 0))}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" /> Ranking de Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performances.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sem dados</p>
              ) : (
                <div className="space-y-3">
                  {performances.map((p, i) => (
                    <div key={p.repId} className={`flex items-center gap-3 p-3 rounded-lg border ${i === 0 ? 'bg-primary/5 border-primary/20' : ''}`}>
                      <div className="shrink-0 w-8 text-center">
                        {i < 3 ? <span className="text-xl">{['🥇', '🥈', '🥉'][i]}</span> : <span className="text-lg font-bold text-muted-foreground">{i + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{p.repName}</span>
                          <span className="text-sm font-bold text-primary">{formatBRL(p.totalSales)}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span>{p.ordersCount} pedidos</span>
                          <span>Ticket: {formatBRL(p.avgTicket)}</span>
                          <span>Conv: {p.conversionRate.toFixed(0)}%</span>
                        </div>
                        {p.monthlyTarget > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={Math.min(p.targetPct, 100)} className="h-1 flex-1" />
                            <span className="text-[10px] font-medium">{p.targetPct.toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <KPICard index={0} title="Oportunidades Abertas" value={stats.openFunnel.toString()} icon={<Target className="h-5 w-5" />} accentColor="info" />
            <KPICard index={1} title="Valor do Pipeline" value={formatBRL(stats.funnelValue)} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" />
            <KPICard index={2} title="Alertas Comerciais" value={stats.openAlerts.toString()} icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Propostas e Negociações Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              {funnel.filter(f => f.status === 'open').length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma oportunidade aberta</p>
              ) : (
                <div className="space-y-2">
                  {funnel.filter(f => f.status === 'open').slice(0, 10).map(item => {
                    const days = differenceInDays(new Date(), new Date(item.updated_at || item.created_at));
                    const stageLabel = (() => {
                      const s = [
                        { value: 'lead', label: 'Lead' },
                        { value: 'opportunity', label: 'Oportunidade' },
                        { value: 'proposal_sent', label: 'Proposta Enviada' },
                        { value: 'negotiation', label: 'Negociação' },
                        { value: 'awaiting_approval', label: 'Aguardando Aprovação' },
                        { value: 'approved', label: 'Aprovado' },
                      ].find(s => s.value === item.stage);
                      return s?.label || item.stage;
                    })();
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{item.title}</span>
                            <Badge variant="outline" className="text-[10px]">{stageLabel}</Badge>
                            {days > 14 && <Badge variant="destructive" className="text-[10px]">⏰ {days}d parado</Badge>}
                          </div>
                          <p className="text-xs text-primary font-semibold mt-0.5">{formatBRL(item.value)}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{item.probability}%</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Follow-up Dialog */}
      <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Follow-up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedClient && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">{selectedClient.clientName}</p>
                <p className="text-xs text-muted-foreground">{selectedClient.suggestedAction}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select value={followUpData.type} onValueChange={v => setFollowUpData(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">📞 Ligação</SelectItem>
                    <SelectItem value="email">📧 E-mail</SelectItem>
                    <SelectItem value="visit">🏢 Visita</SelectItem>
                    <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Data/Hora</label>
                <Input type="datetime-local" value={followUpData.scheduled_date}
                  onChange={e => setFollowUpData(p => ({ ...p, scheduled_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Assunto</label>
              <Input value={followUpData.subject} onChange={e => setFollowUpData(p => ({ ...p, subject: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Observações</label>
              <Textarea value={followUpData.description} onChange={e => setFollowUpData(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowUpOpen(false)}>Cancelar</Button>
            <Button onClick={saveFollowUp} disabled={createFollowUp.isPending}>Agendar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sales Script Dialog */}
      <Dialog open={scriptOpen} onOpenChange={setScriptOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>📋 Script de Venda — {scriptClient?.clientName}</DialogTitle>
          </DialogHeader>
          {salesScript ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-bold">{salesScript.approach}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">ABERTURA</p>
                <p className="text-sm italic">&ldquo;{salesScript.openingLine}&rdquo;</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">PONTOS-CHAVE</p>
                <ul className="space-y-1">
                  {salesScript.keyPoints.map((p, i) => (
                    <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary">•</span>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">OBJEÇÕES</p>
                <ul className="space-y-1">
                  {salesScript.objectionHandlers.map((o, i) => (
                    <li key={i} className="text-xs bg-muted/50 p-2 rounded">{o}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs font-medium text-muted-foreground mb-1">FECHAMENTO</p>
                <p className="text-sm font-medium">{salesScript.closingTechnique}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Selecione um cliente</p>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
