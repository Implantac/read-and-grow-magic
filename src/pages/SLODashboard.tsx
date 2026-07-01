import { useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Badge } from '@/ui/base/badge';
import { Progress } from '@/ui/base/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Skeleton } from '@/ui/base/skeleton';
import { Activity, AlertTriangle, Plus, Target, TrendingUp, Trash2, Siren, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { toast } from 'sonner';

interface SloRow {
  id: string;
  name: string;
  domain: string;
  target_pct: number;
  window_days: number;
  total_events: number;
  failed_events: number;
  success_rate: number;
  error_budget_consumed_pct: number;
  burn_rate_1h: number;
  status: 'healthy' | 'warning' | 'breached';
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  healthy: 'outline', warning: 'secondary', breached: 'destructive',
};
const STATUS_LABEL: Record<string, string> = { healthy: 'Saudável', warning: 'Atenção', breached: 'SLO violado' };

export default function SLODashboard() {
  const companyId = useEnterpriseStore(s => s.activeCompanyId);
  const [rows, setRows] = useState<SloRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [target, setTarget] = useState(99.5);
  const [windowDays, setWindowDays] = useState(30);
  const [timelineSlo, setTimelineSlo] = useState<SloRow | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const openTimeline = async (slo: SloRow) => {
    setTimelineSlo(slo); setTimelineLoading(true); setTimeline([]);
    const { data, error } = await supabase.rpc('sre_slo_incident_timeline', { _slo_id: slo.id, _days: 30 });
    if (error) toast.error(error.message);
    setTimeline((data ?? []) as any[]);
    setTimelineLoading(false);
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('sre_slo_status');
    if (error) toast.error('Erro ao carregar SLOs');
    setRows((data ?? []) as SloRow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const create = async () => {
    if (!name || !domain || !companyId) { toast.error('Preencha nome e domínio'); return; }
    const { error } = await supabase.from('sre_slos').insert({
      company_id: companyId, name, domain, target_pct: target, window_days: windowDays,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('SLO criado'); setName(''); setDomain(''); load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('sre_slos').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('SLO removido'); load();
  };

  const scanBurn = async () => {
    const { data, error } = await supabase.rpc('sre_slo_burn_scan');
    if (error) { toast.error(error.message); return; }
    const opened = (data ?? []).filter((x: any) => x.action === 'incident_opened').length;
    toast.success(`Scan concluído: ${opened} incidente(s) aberto(s)`);
    load();
  };

  const kpis = useMemo(() => ({
    total: rows.length,
    breached: rows.filter(r => r.status === 'breached').length,
    warning: rows.filter(r => r.status === 'warning').length,
    burning: rows.filter(r => r.burn_rate_1h >= 2).length,
  }), [rows]);

  return (
    <PageContainer>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="SLO & Error Budget" description="Objetivos de disponibilidade por domínio e orçamento de erro consumido" />
        <Button onClick={scanBurn} variant="outline" className="mt-2"><Siren className="h-4 w-4 mr-2" /> Verificar burn</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="SLOs ativos" value={kpis.total} icon={Target} index={0} />
        <KPICard title="Violados" value={kpis.breached} icon={AlertTriangle} index={1} color="danger" />
        <KPICard title="Em atenção" value={kpis.warning} icon={TrendingUp} index={2} />
        <KPICard title="Burn > 2x (1h)" value={kpis.burning} icon={Activity} index={3} />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Novo SLO</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5 items-end">
          <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Fiscal availability" /></div>
          <div><Label>Domínio (source)</Label><Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="fiscal" /></div>
          <div><Label>Alvo %</Label><Input type="number" step={0.1} min={0} max={100} value={target} onChange={e => setTarget(Number(e.target.value))} /></div>
          <div><Label>Janela (dias)</Label><Input type="number" min={1} max={90} value={windowDays} onChange={e => setWindowDays(Number(e.target.value))} /></div>
          <Button onClick={create}><Plus className="h-4 w-4 mr-2" /> Criar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Status dos SLOs</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-40 w-full" /> : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum SLO cadastrado. Crie um acima usando o domínio (`source`) dos eventos que deseja monitorar.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SLO</TableHead>
                  <TableHead>Domínio</TableHead>
                  <TableHead className="text-right">Alvo</TableHead>
                  <TableHead>Success rate</TableHead>
                  <TableHead>Error budget consumido</TableHead>
                  <TableHead className="text-right">Burn 1h</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.window_days}d · {r.total_events} eventos · {r.failed_events} falhas</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{r.domain}</Badge></TableCell>
                    <TableCell className="text-right">{Number(r.target_pct).toFixed(2)}%</TableCell>
                    <TableCell className="min-w-[120px]">{Number(r.success_rate).toFixed(3)}%</TableCell>
                    <TableCell className="min-w-[180px]">
                      <Progress value={Math.min(100, Number(r.error_budget_consumed_pct))} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">{Number(r.error_budget_consumed_pct).toFixed(1)}%</div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{Number(r.burn_rate_1h).toFixed(2)}x</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge></TableCell>
                    <TableCell className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openTimeline(r)} title="Timeline"><History className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
