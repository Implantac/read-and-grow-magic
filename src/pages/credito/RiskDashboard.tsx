import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { useCreditProfiles, useOrderBlocks, useCollectionActions } from '@/hooks/useCreditAnalysis';
import { useClients } from '@/hooks/useClients';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldAlert, Lock, AlertTriangle, TrendingDown, Users, DollarSign } from 'lucide-react';

const RISK_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];

export default function RiskDashboard() {
  const { data: profiles = [] } = useCreditProfiles();
  const { data: blocks = [] } = useOrderBlocks();
  const { data: actions = [] } = useCollectionActions();
  const { data: clients = [] } = useClients();
  const { data: receivables = [] } = useAccountsReceivable();

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const activeBlocks = blocks.filter(b => b.status === 'active');
  const blockedClients = profiles.filter(p => p.credit_status === 'blocked');
  const analysisClients = profiles.filter(p => p.credit_status === 'analysis');

  const now = new Date();
  const overdueReceivables = receivables.filter((r: any) => r.status !== 'paid' && new Date(r.due_date) < now);
  const totalOverdue = overdueReceivables.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const totalOpen = receivables.filter((r: any) => r.status !== 'paid').reduce((s: number, r: any) => s + Number(r.amount), 0);

  // Risk distribution for pie chart
  const riskDist = [
    { name: 'Baixo', value: profiles.filter(p => p.risk_classification === 'low').length },
    { name: 'Médio', value: profiles.filter(p => p.risk_classification === 'medium').length },
    { name: 'Alto', value: profiles.filter(p => p.risk_classification === 'high').length },
    { name: 'Bloqueado', value: profiles.filter(p => p.risk_classification === 'blocked').length },
  ].filter(d => d.value > 0);

  // Aging for bar chart
  const aging: { name: string; value: number }[] = [];
  const ranges = [
    { name: 'A vencer', min: -999, max: 0 },
    { name: '1-7d', min: 1, max: 7 },
    { name: '8-15d', min: 8, max: 15 },
    { name: '16-30d', min: 16, max: 30 },
    { name: '31-60d', min: 31, max: 60 },
    { name: '>60d', min: 61, max: 9999 },
  ];
  ranges.forEach(r => {
    const val = receivables
      .filter((rc: any) => rc.status !== 'paid')
      .filter((rc: any) => {
        const diff = Math.floor((now.getTime() - new Date(rc.due_date).getTime()) / 86400000);
        return diff >= r.min && diff <= r.max;
      })
      .reduce((s: number, rc: any) => s + Number(rc.amount), 0);
    aging.push({ name: r.name, value: val });
  });

  // Top risk clients
  const topRisk = [...profiles]
    .filter(p => p.risk_classification === 'high' || p.risk_classification === 'blocked')
    .sort((a, b) => Number(b.overdue_amount) - Number(a.overdue_amount))
    .slice(0, 5);

  return (
    <PageContainer>
      <PageHeader title="Dashboard de Risco Comercial" description="Visão consolidada de risco, inadimplência e bloqueios" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Clientes Bloqueados" value={String(blockedClients.length)} icon={<ShieldAlert className="h-5 w-5" />} />
        <KPICard title="Pedidos Bloqueados" value={String(activeBlocks.length)} icon={<Lock className="h-5 w-5" />} />
        <KPICard title="Total em Aberto" value={fmt(totalOpen)} icon={<DollarSign className="h-5 w-5" />} />
        <KPICard title="Total Vencido" value={fmt(totalOverdue)} icon={<TrendingDown className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>Distribuição por Risco</CardTitle></CardHeader>
          <CardContent className="h-64">
            {riskDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {riskDist.map((_, i) => <Cell key={i} fill={RISK_COLORS[i % RISK_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Aging de Recebíveis</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aging}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Top Clientes em Risco</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead>Limite Usado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topRisk.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Nenhum cliente em alto risco</TableCell></TableRow>
                ) : topRisk.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{clientMap[p.client_id]?.name || '—'}</TableCell>
                    <TableCell><span className="font-mono font-bold">{p.score_grade} ({p.score_numeric})</span></TableCell>
                    <TableCell><Badge variant="destructive">{p.risk_classification === 'blocked' ? 'Bloqueado' : 'Alto'}</Badge></TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={p.credit_limit > 0 ? (p.used_limit / p.credit_limit) * 100 : 0} className="h-2" />
                        <span className="text-xs text-muted-foreground">{fmt(p.used_limit)} / {fmt(p.credit_limit)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" />Clientes em Análise</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Última Análise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisClients.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">Nenhum cliente em análise</TableCell></TableRow>
                ) : analysisClients.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{clientMap[p.client_id]?.name || '—'}</TableCell>
                    <TableCell><span className="font-mono">{p.score_grade} ({p.score_numeric})</span></TableCell>
                    <TableCell className="text-xs">{p.last_analysis_date ? new Date(p.last_analysis_date).toLocaleDateString('pt-BR') : 'Nunca'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
