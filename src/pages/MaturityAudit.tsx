import { useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Progress } from '@/ui/base/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Skeleton } from '@/ui/base/skeleton';
import { Activity, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';

interface DomainScore {
  domain: string;
  label: string;
  score: number;
  delta: number;
  highlights: string;
  gaps: string;
}

const SEED: DomainScore[] = [
  { domain: 'fiscal', label: 'Fiscal (NF-e/SPED/Reinf)', score: 82, delta: 9, highlights: 'Reinf R-2010/R-4020 + transmissão sandbox', gaps: 'Certificado A1 real, R-2020, R-2099' },
  { domain: 'financeiro', label: 'Financeiro', score: 84, delta: 7, highlights: 'Conciliação automática por regras', gaps: 'PIX recorrente, DRE gerencial' },
  { domain: 'wms', label: 'WMS', score: 88, delta: 5, highlights: 'Wave Planning v2, Digital Twin, Slotting ML', gaps: 'Voice picking, cross-dock' },
  { domain: 'producao', label: 'Produção', score: 72, delta: 0, highlights: 'OEE, MRP, Kanban', gaps: 'APS multi-restrição' },
  { domain: 'compras', label: 'Compras', score: 68, delta: 0, highlights: 'POs, cotações, supplier score', gaps: 'Aprovação hierárquica, contratos' },
  { domain: 'estoque', label: 'Estoque', score: 80, delta: 2, highlights: 'Kardex, ABC, reservas', gaps: 'Consolidado multi-empresa' },
  { domain: 'contabil', label: 'Contábil', score: 70, delta: 0, highlights: 'Partida dobrada, Balancete', gaps: 'DFCs auto, consolidação' },
  { domain: 'comercial', label: 'Comercial', score: 76, delta: 0, highlights: 'Sales AI, Kanban', gaps: 'Forecast probabilístico' },
  { domain: 'sre', label: 'SRE', score: 74, delta: 12, highlights: 'SLO/Error Budget', gaps: 'On-call, runbooks' },
  { domain: 'ai', label: 'IA / Brain', score: 82, delta: 6, highlights: 'Hard-cap tenant, decisões auditáveis', gaps: 'Fine-tune por tenant' },
  { domain: 'saas', label: 'SaaS Core', score: 86, delta: 0, highlights: 'Multi-tenant RLS, RBAC, Flags', gaps: 'Faturamento por uso ao vivo' },
];

function statusOf(score: number) {
  if (score >= 85) return { label: 'Alta maturidade', variant: 'outline' as const };
  if (score >= 70) return { label: 'Em evolução', variant: 'secondary' as const };
  return { label: 'Requer foco', variant: 'destructive' as const };
}

export default function MaturityAudit() {
  const companyId = useEnterpriseStore(s => s.activeCompanyId);
  const [rows, setRows] = useState<DomainScore[]>(SEED);
  const [signals, setSignals] = useState({ slos: 0, incidents30d: 0, transmissions: 0, matchRules: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [slos, incidents, trans, rules] = await Promise.all([
        supabase.from('sre_slos').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('system_incidents').select('id', { count: 'exact', head: true }).eq('company_id', companyId).gte('created_at', since),
        supabase.from('reinf_transmissions').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('bank_match_rules').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      ]);
      setSignals({
        slos: slos.count ?? 0,
        incidents30d: incidents.count ?? 0,
        transmissions: trans.count ?? 0,
        matchRules: rules.count ?? 0,
      });

      // Ajuste dinâmico leve: se não há SLOs cadastrados, penaliza SRE.
      setRows(prev => prev.map(r => {
        if (r.domain === 'sre' && (slos.count ?? 0) === 0) return { ...r, score: Math.max(50, r.score - 15) };
        if (r.domain === 'financeiro' && (rules.count ?? 0) === 0) return { ...r, score: Math.max(60, r.score - 8) };
        if (r.domain === 'fiscal' && (trans.count ?? 0) === 0) return { ...r, score: Math.max(60, r.score - 6) };
        return r;
      }));
      setLoading(false);
    })();
  }, [companyId]);

  const global = useMemo(() => Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length), [rows]);
  const highs = rows.filter(r => r.score >= 85).length;
  const lows = rows.filter(r => r.score < 70).length;

  return (
    <PageContainer>
      <PageHeader
        title="Maturity Audit v2"
        description="Auditoria contínua dos 11 domínios sob a Constituição UEEF"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Score global" value={`${global}/100`} icon={TrendingUp} />
        <KPICard title="Domínios ≥ 85" value={highs.toString()} icon={ShieldCheck} />
        <KPICard title="Domínios < 70" value={lows.toString()} icon={AlertTriangle} />
        <KPICard title="Incidentes 30d" value={signals.incidents30d.toString()} icon={Activity} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maturidade por domínio</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domínio</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="w-[220px]">Progresso</TableHead>
                  <TableHead>Δ vs Jun</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Destaques</TableHead>
                  <TableHead>Gaps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => {
                  const s = statusOf(r.score);
                  return (
                    <TableRow key={r.domain}>
                      <TableCell className="font-medium">{r.label}</TableCell>
                      <TableCell>{r.score}</TableCell>
                      <TableCell><Progress value={r.score} /></TableCell>
                      <TableCell className={r.delta > 0 ? 'text-emerald-500' : r.delta < 0 ? 'text-destructive' : ''}>
                        {r.delta > 0 ? `▲ +${r.delta}` : r.delta < 0 ? `▼ ${r.delta}` : '='}
                      </TableCell>
                      <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.highlights}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.gaps}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backlog priorizado — próximas 6 Sprints</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-6 space-y-1 text-sm">
            <li>Reinf produção — certificado A1 real + R-2020/R-2099.</li>
            <li>DRE Gerencial por centro de custo com drill-down.</li>
            <li>Aprovação hierárquica de Compras via Workflow Engine v3.</li>
            <li>APS de Produção — sequenciamento multi-restrição.</li>
            <li>Forecast comercial probabilístico (Monte Carlo).</li>
            <li>On-call e Runbooks SRE vinculados aos SLOs.</li>
          </ol>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
