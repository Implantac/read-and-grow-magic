import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { ShieldCheck, AlertTriangle, AlertCircle, Info, Play, CheckCircle2, Wrench } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { useFinancialAuditLogs, useRunFinancialAudit, useResolveAuditLog } from '@/hooks/financial/useFinancialAudit';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const levelMeta = {
  high: { label: 'Crítico', variant: 'destructive' as const, icon: AlertCircle },
  medium: { label: 'Atenção', variant: 'default' as const, icon: AlertTriangle },
  low: { label: 'Info', variant: 'secondary' as const, icon: Info },
};

export default function FinancialAudit() {
  const { data: logs = [], isLoading } = useFinancialAuditLogs();
  const runAudit = useRunFinancialAudit();
  const resolve = useResolveAuditLog();

  const stats = useMemo(() => {
    const open = logs.filter(l => l.status === 'open');
    return {
      high: open.filter(l => l.level === 'high').length,
      medium: open.filter(l => l.level === 'medium').length,
      low: open.filter(l => l.level === 'low').length,
      autoFixed: logs.filter(l => l.auto_fixed).length,
      lastRun: logs[0]?.created_at,
    };
  }, [logs]);

  return (
    <PageContainer>
      <PageHeader title="Auditoria Financeira Contínua" description="Monitoramento automático de integridade do ledger, transações e relatórios">
        <Button variant="outline" size="sm" onClick={() => runAudit.mutate('light')} disabled={runAudit.isPending} className="gap-2">
          <Play className="h-4 w-4" /> Rápida
        </Button>
        <Button size="sm" onClick={() => runAudit.mutate('full')} disabled={runAudit.isPending} className="gap-2">
          <ShieldCheck className="h-4 w-4" /> Auditoria Completa
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Críticos" value={stats.high} subtitle="Requerem atenção imediata" icon={<AlertCircle className="h-5 w-5" />} accentColor="danger" index={0} />
        <KPICard title="Atenção" value={stats.medium} subtitle="Monitorar de perto" icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Informativos" value={stats.low} subtitle="Baixa prioridade" icon={<Info className="h-5 w-5" />} accentColor="primary" index={2} />
        <KPICard title="Auto-corrigidos" value={stats.autoFixed} subtitle={stats.lastRun ? `Última: ${format(new Date(stats.lastRun), 'dd/MM HH:mm', { locale: ptBR })}` : 'Nunca executado'} icon={<Wrench className="h-5 w-5" />} accentColor="success" index={3} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Logs de auditoria (últimos 200)</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Verificação</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : logs.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum log ainda. Execute uma auditoria.</TableCell></TableRow>
                ) : logs.map(log => {
                  const meta = levelMeta[log.level];
                  const Icon = meta.icon;
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}</TableCell>
                      <TableCell><Badge variant={meta.variant} className="gap-1"><Icon className="h-3 w-3" />{meta.label}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] uppercase">{log.category}</Badge></TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{log.check_name}</TableCell>
                      <TableCell className="text-sm max-w-md">{log.description}</TableCell>
                      <TableCell className="text-right font-medium">{log.affected_count || '—'}</TableCell>
                      <TableCell>
                        {log.auto_fixed ? <Badge variant="default" className="gap-1 bg-success text-success-foreground"><Wrench className="h-3 w-3" />Auto</Badge>
                          : log.status === 'resolved' ? <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" />Resolvido</Badge>
                          : <Badge variant="secondary">Aberto</Badge>}
                      </TableCell>
                      <TableCell>
                        {log.status === 'open' && !log.auto_fixed && (
                          <Button size="sm" variant="ghost" onClick={() => resolve.mutate(log.id)}>Resolver</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
