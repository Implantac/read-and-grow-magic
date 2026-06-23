import { useMemo, useState } from 'react';
import { format, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Skeleton } from '@/ui/base/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { useClients } from '@/hooks/commercial/useClients';
import { useOrders } from '@/hooks/commercial/useOrders';
import { useSales } from '@/hooks/commercial/useSales';
import { useSalesFunnel } from '@/hooks/commercial/useSalesFunnel';
import { useSalesReps } from '@/hooks/commercial/useSalesReps';
import {
  useClientInsights, useCreateFollowUp, useFollowUps, useLostSalesAlerts,
  useRepPerformance, useSalesScript, useUpdateFollowUp, type ClientInsight,
} from '@/hooks/commercial/useSalesIntelligence';
import { useCommercialAlerts } from '@/hooks/commercial/useCommercialAlerts';
import {
  useActOnRecommendation, useAIDailyActions, useAIRecommendations,
  useCompleteAIAction, useRunAIEngine,
} from '@/hooks/commercial/useAICommercial';
import { SellerKPIs } from './seller/SellerKPIs';
import { AITab } from './seller/AITab';
import { OpportunitiesTab } from './seller/OpportunitiesTab';
import { FollowUpsTab } from './seller/FollowUpsTab';
import { AtRiskTab } from './seller/AtRiskTab';
import { LostSalesTab } from './seller/LostSalesTab';
import { RankingTab } from './seller/RankingTab';
import { PipelineTab } from './seller/PipelineTab';
import { FollowUpDialog, type FollowUpData } from './seller/FollowUpDialog';
import { SalesScriptDialog } from './seller/SalesScriptDialog';

export default function SellerDashboard() {
  const { data: clients = [], isLoading: lc } = useClients();
  const { data: orders = [], isLoading: lo } = useOrders();
  const { data: sales = [] } = useSales() as { data: any[] | undefined };
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
  const [followUpData, setFollowUpData] = useState<FollowUpData>({ type: 'call', subject: '', description: '', scheduled_date: '' });

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
      scheduled_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
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

      <SellerKPIs stats={stats} />

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

        <TabsContent value="ai" className="space-y-4">
          <AITab
            aiActions={aiActions}
            aiRecs={aiRecs}
            runAIEngine={runAIEngine}
            completeAIAction={completeAIAction}
            actOnAIRec={actOnAIRec}
          />
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <OpportunitiesTab
            insights={insights}
            clients={clients}
            onOpenScript={(insight) => { setScriptClient(insight); setScriptOpen(true); }}
            onScheduleFollowUp={handleScheduleFollowUp}
          />
        </TabsContent>

        <TabsContent value="followups" className="space-y-4">
          <FollowUpsTab followUps={followUps} clients={clients} onComplete={completeFollowUp} />
        </TabsContent>

        <TabsContent value="at-risk" className="space-y-4">
          <AtRiskTab insights={insights} onScheduleFollowUp={handleScheduleFollowUp} />
        </TabsContent>

        <TabsContent value="lost" className="space-y-4">
          <LostSalesTab lostAlerts={lostAlerts} />
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          <RankingTab performances={performances} />
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <PipelineTab
            funnel={funnel}
            openFunnel={stats.openFunnel}
            funnelValue={stats.funnelValue}
            openAlerts={stats.openAlerts}
          />
        </TabsContent>
      </Tabs>

      <FollowUpDialog
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        selectedClient={selectedClient}
        data={followUpData}
        setData={setFollowUpData}
        isPending={createFollowUp.isPending}
        onSave={saveFollowUp}
      />

      <SalesScriptDialog
        open={scriptOpen}
        onOpenChange={setScriptOpen}
        scriptClient={scriptClient}
        salesScript={salesScript}
      />
    </PageContainer>
  );
}
