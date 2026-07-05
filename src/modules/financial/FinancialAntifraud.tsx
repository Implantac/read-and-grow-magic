import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Switch } from '@/ui/base/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { ShieldAlert, ShieldCheck, AlertTriangle, Activity, Check } from 'lucide-react';
import { formatBRL, formatDateTime, formatNumber } from '@/lib/formatters';
import { EmptyState } from '@/shared/components/EmptyState';
import {
  useRiskProfiles, useSecurityLogs, useFraudRules, useUpdateFraudRule, useResolveSecurityLog,
} from '@/hooks/financial/useFinancialSecurity';

const fmtCur = (v: number | null) => v == null ? '—' : formatBRL(v);
const sevColor = (s: string) =>
  s === 'critical' ? 'bg-red-600 text-white' :
  s === 'high' ? 'bg-orange-500 text-white' :
  s === 'medium' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white';

export default function FinancialAntifraud() {
  const [tab, setTab] = useState('alerts');
  const { data: profiles = [] } = useRiskProfiles();
  const { data: logs = [], isLoading: ll } = useSecurityLogs({ resolved: false });
  const { data: rules = [] } = useFraudRules();
  const update = useUpdateFraudRule();
  const resolve = useResolveSecurityLog();

  const critical = logs.filter(l => l.severity === 'critical').length;
  const high = logs.filter(l => l.severity === 'high').length;
  const blocked = logs.filter(l => l.decision === 'block').length;
  const review = logs.filter(l => l.decision === 'review').length;

  return (
    <PageContainer>
      <PageHeader title="Antifraude & Segurança" description="Monitoramento contínuo de risco e anomalias financeiras" />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Alertas críticos" value={critical} subtitle="Requerem ação imediata" icon={<ShieldAlert className="h-5 w-5" />} accentColor="danger" index={0} />
        <KPICard title="Alertas altos" value={high} subtitle="Em revisão" icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Em revisão" value={review} subtitle="Aguardando aprovação" icon={<Activity className="h-5 w-5" />} accentColor="primary" index={2} />
        <KPICard title="Bloqueados" value={blocked} subtitle="Pelo motor antifraude" icon={<ShieldCheck className="h-5 w-5" />} accentColor="success" index={3} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="alerts">Alertas ativos ({logs.length})</TabsTrigger>
          <TabsTrigger value="profiles">Perfis de risco ({profiles.length})</TabsTrigger>
          <TabsTrigger value="rules">Regras ({rules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <Card>
            <CardHeader><CardTitle>Logs de segurança não resolvidos</CardTitle></CardHeader>
            <CardContent>
              {ll ? <p className="text-sm text-muted-foreground">Carregando...</p> :
               logs.length === 0 ? (
                <EmptyState
                  icon={ShieldCheck}
                  title="Tudo limpo"
                  description="Nenhum alerta de segurança ativo no momento. Continuamos monitorando anomalias em tempo real."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Decisão</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Quando</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map(l => (
                      <TableRow key={l.id}>
                        <TableCell><Badge className={sevColor(l.severity)}>{l.severity}</Badge></TableCell>
                        <TableCell className="text-sm">{l.title}<div className="text-xs text-muted-foreground">{l.description}</div></TableCell>
                        <TableCell><Badge variant="outline">{l.decision ?? '—'}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{l.risk_score ?? '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{fmtCur(l.amount)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDateTime(l.created_at)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => resolve.mutate(l.id)}><Check className="h-3 w-3" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles">
          <Card>
            <CardHeader><CardTitle>Top entidades por risco</CardTitle></CardHeader>
            <CardContent>
              {profiles.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="Nenhum perfil computado"
                  description="Os perfis de risco são gerados automaticamente após movimentações no ledger financeiro."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Transações</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">Ticket médio</TableHead>
                      <TableHead className="text-right">Anomalias</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{p.entity_label ?? p.entity_id?.slice(0, 8) ?? '—'}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{p.entity_type}</Badge></TableCell>
                        <TableCell><Badge className={sevColor(p.risk_level)}>{p.risk_level}</Badge></TableCell>
                        <TableCell className="text-right font-mono">{p.risk_score}</TableCell>
                        <TableCell className="text-right font-mono">{p.total_transactions}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{fmtCur(p.total_volume)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{fmtCur(p.avg_ticket)}</TableCell>
                        <TableCell className="text-right font-mono">{p.anomalies_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader><CardTitle>Regras antifraude configuráveis</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {rules.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.name}</span>
                      <Badge variant="outline" className="text-xs">{r.action}</Badge>
                      <Badge className={`text-xs ${sevColor(r.severity)}`}>{r.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {r.threshold != null && `limite: ${r.threshold}`} {r.window_minutes && `· janela: ${r.window_minutes}min`}
                    </p>
                  </div>
                  <Switch checked={r.enabled} onCheckedChange={(v) => update.mutate({ id: r.id, enabled: v })} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
