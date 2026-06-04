import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useChargeRules, useChargesLog, useRunChargesRuler, useToggleChargeRule } from '@/hooks/financial/useFinancialCharges';
import { Play, Bell, AlertTriangle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatNumber } from '@/lib/formatters';

const SEVERITY_BADGE: Record<string, { variant: any; icon: any; label: string }> = {
  info: { variant: 'secondary', icon: Bell, label: 'Aviso' },
  warning: { variant: 'default', icon: AlertTriangle, label: 'Cobrança' },
  critical: { variant: 'destructive', icon: AlertCircle, label: 'Crítico' },
};

export default function ChargesRulerPage() {
  const { data: rules = [] } = useChargeRules();
  const { data: logs = [] } = useChargesLog({ days: 30 });
  const runRuler = useRunChargesRuler();
  const toggleRule = useToggleChargeRule();

  const stats = {
    total: logs.length,
    critical: logs.filter((l) => l.severity === 'critical').length,
    warning: logs.filter((l) => l.severity === 'warning').length,
    info: logs.filter((l) => l.severity === 'info').length,
  };

  return (
    <PageContainer>
      <PageHeader
        title="🧾 Régua de Cobrança"
        description="Cobrança automática: aviso 3 dias antes, no vencimento e alerta forte 7 dias após."
        actions={
          <Button onClick={() => runRuler.mutate()} disabled={runRuler.isPending}>
            <Play className="mr-2 h-4 w-4" />
            {runRuler.isPending ? 'Executando...' : 'Executar régua agora'}
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total (30d)</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avisos</p>
            <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Cobranças</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Críticos</p>
            <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regras configuradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Regra</TableHead>
                <TableHead>Quando</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="w-24">Ativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => {
                const sev = SEVERITY_BADGE[rule.severity];
                const when =
                  rule.trigger_type === 'before_due'
                    ? `${rule.days_offset} dias antes`
                    : rule.trigger_type === 'on_due'
                    ? 'No vencimento'
                    : `${rule.days_offset} dias após`;
                return (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{when}</TableCell>
                    <TableCell>
                      <Badge variant={sev.variant}>{sev.label}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{rule.channel.replace('_', ' ')}</TableCell>
                    <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                      {rule.message_template}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.active}
                        onCheckedChange={(active) => toggleRule.mutate({ id: rule.id, active })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de cobranças (últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma cobrança registrada. Execute a régua para gerar.
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => {
                const sev = SEVERITY_BADGE[log.severity] || SEVERITY_BADGE.info;
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{log.client_name || '—'}</TableCell>
                    <TableCell>R$ {formatNumber(log.amount, 2)}</TableCell>
                    <TableCell>
                      {log.due_date ? format(new Date(log.due_date), 'dd/MM/yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sev.variant}>{sev.label}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{log.channel.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === 'sent' ? 'default' : 'secondary'}>{log.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
