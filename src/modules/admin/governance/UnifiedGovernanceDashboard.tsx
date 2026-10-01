import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Brain, History, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { GovernanceDrillDown } from './GovernanceDrillDown';

type Period = '24h' | '7d' | '30d';
const since = (period: Period) => new Date(Date.now() - ({ '24h': 1, '7d': 7, '30d': 30 }[period] * 86_400_000)).toISOString();

export function UnifiedGovernanceDashboard() {
  const { currentCompany } = useEnterprise();
  const companyId = currentCompany?.id;
  const [period, setPeriod] = useState<Period>('7d');
  const [detail, setDetail] = useState<'ledger' | 'security' | 'ai' | null>(null);
  const query = useQuery({
    queryKey: ['governance-summary', companyId, period],
    enabled: Boolean(companyId),
    queryFn: async () => {
      if (!companyId) throw new Error('Selecione uma empresa.');
      const start = since(period);
      const [movements, audits, decisions] = await Promise.all([
        supabase.from('stock_movements').select('id', { count: 'exact', head: true }).eq('company_id', companyId).gte('created_at', start),
        supabase.from('system_audit_logs').select('id', { count: 'exact', head: true }).eq('company_id', companyId).gte('created_at', start),
        supabase.from('ai_brain_decisions').select('id', { count: 'exact', head: true }).eq('company_id', companyId).gte('created_at', start),
      ]);
      return { movements, audits, decisions };
    },
  });
  const metrics = [
    { title: 'Movimentos de estoque', value: query.data?.movements, icon: History, type: 'ledger' as const },
    { title: 'Registros de auditoria', value: query.data?.audits, icon: ShieldCheck, type: 'security' as const },
    { title: 'Decisões de IA', value: query.data?.decisions, icon: Brain, type: 'ai' as const },
  ];

  if (detail) return <GovernanceDrillDown type={detail} period={period} onBack={() => setDetail(null)} />;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">Governança</h2>
      <div className="flex items-center gap-2">
        <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
          <SelectTrigger className="w-40" aria-label="Período"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="24h">Últimas 24 horas</SelectItem><SelectItem value="7d">Últimos 7 dias</SelectItem><SelectItem value="30d">Últimos 30 dias</SelectItem></SelectContent>
        </Select>
        <Button variant="outline" size="icon" aria-label="Atualizar governança" title="Atualizar governança" disabled={query.isFetching || !companyId} onClick={() => void query.refetch()}><RefreshCw className="h-4 w-4" /></Button>
      </div>
    </div>
    {!companyId && <p className="text-sm text-muted-foreground">Selecione uma empresa para consultar os registros.</p>}
    <div className="grid gap-3 md:grid-cols-3">
      {metrics.map(({ title, value, icon: Icon, type }) => <Button key={type} variant="outline" className="h-auto min-h-28 w-full justify-start whitespace-normal p-4 text-left" onClick={() => setDetail(type)} disabled={!companyId}>
        <div className="space-y-2"><span className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" />{title}</span><span className="block text-2xl font-semibold text-foreground">{query.isLoading ? '…' : value?.error ? 'Indisponível' : value?.count ?? '—'}</span></div>
      </Button>)}
    </div>
    <Tabs defaultValue="ledger">
      <TabsList className="flex h-auto flex-wrap"><TabsTrigger value="ledger">Estoque</TabsTrigger><TabsTrigger value="security">Auditoria</TabsTrigger><TabsTrigger value="ai">IA</TabsTrigger></TabsList>
      {metrics.map(({ title, value, type }) => <TabsContent key={type} value={type} className="py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-3"><Activity className="h-5 w-5 text-primary" /><span className="font-medium">{title}</span><Badge variant="outline">{value?.error ? 'Consulta indisponível' : query.isLoading ? 'Carregando' : `${value?.count ?? 0} no período`}</Badge></div>
          <Button variant="outline" onClick={() => setDetail(type)} disabled={!companyId}>Ver registros</Button>
        </div>
        {value?.error && <p role="alert" className="mt-3 text-sm text-destructive">Não foi possível consultar estes registros. Tente atualizar.</p>}
      </TabsContent>)}
    </Tabs>
  </div>;
}
