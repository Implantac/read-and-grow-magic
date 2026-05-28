import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDefaultScores, useRecomputeDefaultScores, RISK_LABELS, RISK_COLORS } from '@/hooks/useDefaultScores';
import { RefreshCw, AlertTriangle, TrendingDown, Users } from 'lucide-react';
import { formatNumber } from '@/lib/formatters';

const RISK_BADGE: Record<string, any> = {
  low: 'secondary',
  medium: 'default',
  high: 'default',
  critical: 'destructive',
};

export default function DefaultManagementPage() {
  const { data: scores = [] } = useDefaultScores();
  const recompute = useRecomputeDefaultScores();

  const stats = {
    totalClients: scores.length,
    overdueClients: scores.filter((s) => s.overdue_count > 0).length,
    totalOverdue: scores.reduce((sum, s) => sum + Number(s.overdue_amount || 0), 0),
    avgDelay:
      scores.length > 0
        ? scores.reduce((sum, s) => sum + Number(s.avg_delay_days || 0), 0) / scores.length
        : 0,
    critical: scores.filter((s) => s.risk_level === 'critical').length,
    high: scores.filter((s) => s.risk_level === 'high').length,
  };

  return (
    <PageContainer>
      <PageHeader
        title="📉 Gestão de Inadimplência"
        description="Score de risco por cliente, dias médios de atraso e valor total em aberto."
        actions={
          <Button onClick={() => recompute.mutate()} disabled={recompute.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${recompute.isPending ? 'animate-spin' : ''}`} />
            Recalcular scores
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Clientes em atraso</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats.overdueClients}</p>
            <p className="text-xs text-muted-foreground">de {stats.totalClients} avaliados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Valor em aberto</p>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">
              R$ {formatNumber(stats.totalOverdue, 2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Atraso médio</p>
            <p className="text-2xl font-bold">{stats.avgDelay.toFixed(0)} dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Risco crítico/alto</p>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.critical + stats.high}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking de risco</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead>Vencidos</TableHead>
                <TableHead>Valor em aberto</TableHead>
                <TableHead>Atraso médio</TableHead>
                <TableHead>Atraso máx.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum score calculado. Clique em "Recalcular scores".
                  </TableCell>
                </TableRow>
              )}
              {scores.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.client_name || s.client_id}</TableCell>
                  <TableCell>
                    <span className={`font-bold ${RISK_COLORS[s.risk_level]}`}>{s.score_numeric}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={RISK_BADGE[s.risk_level]}>{RISK_LABELS[s.risk_level]}</Badge>
                  </TableCell>
                  <TableCell>{s.overdue_count}</TableCell>
                  <TableCell>
                    R$ {formatNumber(Number(s.overdue_amount), 2)}
                  </TableCell>
                  <TableCell>{Number(s.avg_delay_days).toFixed(0)} dias</TableCell>
                  <TableCell>{s.max_delay_days} dias</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
