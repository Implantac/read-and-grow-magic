import { useState, useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { useSalesTargets, useSalesTargetMutations } from '@/hooks/commercial/useSalesTargets';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Progress } from '@/ui/base/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import { Target, TrendingUp, Award, AlertTriangle, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';

import { formatBRL, formatNumber } from '@/lib/formatters';
const currentPeriod = format(new Date(), 'yyyy-MM');

const targetTypeLabels: Record<string, string> = {
  revenue: 'Faturamento', quantity: 'Quantidade', margin: 'Margem',
  new_clients: 'Novos Clientes', orders: 'Pedidos', conversion_rate: 'Taxa Conversão',
};

const entityTypeLabels: Record<string, string> = {
  sales_rep: 'Representante', team: 'Equipe', branch: 'Filial',
  region: 'Região', product: 'Produto', category: 'Categoria',
};

export default function SalesTargetsPage() {
  const [period, setPeriod] = useState(currentPeriod);
  const [showDialog, setShowDialog] = useState(false);
  const { data: targets = [], isLoading } = useSalesTargets({ period });
  const { createTarget } = useSalesTargetMutations();

  const [newTarget, setNewTarget] = useState({
    name: '', target_type: 'revenue', entity_type: 'sales_rep', entity_name: '',
    period_type: 'monthly', period: currentPeriod, target_value: 0,
  });

  const totalTarget = targets.reduce((s, t) => s + (t.target_value || 0), 0);
  const totalAchieved = targets.reduce((s, t) => s + (t.achieved_value || 0), 0);
  const avgPct = targets.length ? targets.reduce((s, t) => s + (t.achievement_pct || 0), 0) / targets.length : 0;
  const atRisk = targets.filter(t => (t.achievement_pct || 0) < 50).length;

  const chartData = useMemo(() =>
    targets.slice(0, 10).map(t => ({
      name: t.entity_name || t.name,
      meta: t.target_value,
      realizado: t.achieved_value,
      pct: t.achievement_pct,
    })),
  [targets]);

  const handleCreate = () => {
    createTarget.mutate(newTarget);
    setShowDialog(false);
    setNewTarget({ name: '', target_type: 'revenue', entity_type: 'sales_rep', entity_name: '', period_type: 'monthly', period: currentPeriod, target_value: 0 });
  };

  return (
    <PageContainer>
      <PageHeader title="Metas Comerciais" description="Acompanhamento de metas e performance">
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova Meta</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Meta</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={newTarget.name} onChange={e => setNewTarget(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Tipo</Label>
                  <Select value={newTarget.target_type} onValueChange={v => setNewTarget(p => ({ ...p, target_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(targetTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Entidade</Label>
                  <Select value={newTarget.entity_type} onValueChange={v => setNewTarget(p => ({ ...p, entity_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(entityTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Nome da Entidade</Label><Input value={newTarget.entity_name} onChange={e => setNewTarget(p => ({ ...p, entity_name: e.target.value }))} placeholder="Ex: João Silva" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Período</Label><Input type="month" value={newTarget.period} onChange={e => setNewTarget(p => ({ ...p, period: e.target.value }))} /></div>
                <div><Label>Valor Meta</Label><Input type="number" value={newTarget.target_value} onChange={e => setNewTarget(p => ({ ...p, target_value: +e.target.value }))} /></div>
              </div>
              <Button onClick={handleCreate} disabled={!newTarget.name || !newTarget.target_value} className="w-full">Criar Meta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex items-center gap-3 mb-6">
        <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="w-48" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard title="Meta Total" value={`${formatBRL(totalTarget)}`} icon={<Target className="h-5 w-5" />} index={0} accentColor="primary" />
        <KPICard title="Realizado" value={`${formatBRL(totalAchieved)}`} icon={<TrendingUp className="h-5 w-5" />} index={1} accentColor="success" />
        <KPICard title="% Médio Atingido" value={`${avgPct.toFixed(1)}%`} icon={<Award className="h-5 w-5" />} index={2} accentColor="info" />
        <KPICard title="Em Risco" value={`${atRisk}`} icon={<AlertTriangle className="h-5 w-5" />} index={3} accentColor="danger" />
      </div>

      {chartData.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Meta vs Realizado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(v: number) => `R$ ${formatNumber(v)}`} />
                <Bar dataKey="meta" fill="hsl(var(--muted-foreground))" opacity={0.3} name="Meta" />
                <Bar dataKey="realizado" name="Realizado">
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={(entry.pct || 0) >= 100 ? 'hsl(var(--chart-2))' : (entry.pct || 0) >= 50 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Valor Meta</TableHead>
                <TableHead>Realizado</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={Target}
                    title="Nenhuma meta cadastrada para este período"
                    description="Defina metas de faturamento, quantidade, margem ou conversão por representante, equipe, filial ou região."
                  />
                </TableCell></TableRow>
              ) : targets.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell><Badge variant="outline">{targetTypeLabels[t.target_type] || t.target_type}</Badge></TableCell>
                  <TableCell>{t.entity_name || '-'}</TableCell>
                  <TableCell>R$ {(t.target_value || formatNumber(0), 2)}</TableCell>
                  <TableCell>R$ {(t.achieved_value || formatNumber(0), 2)}</TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min(t.achievement_pct || 0, 100)} className="flex-1" />
                      <span className="text-xs font-medium w-12 text-right">{(t.achievement_pct || 0).toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={(t.achievement_pct || 0) >= 100 ? 'default' : (t.achievement_pct || 0) >= 50 ? 'secondary' : 'destructive'}>
                      {(t.achievement_pct || 0) >= 100 ? 'Atingida' : (t.achievement_pct || 0) >= 50 ? 'Em progresso' : 'Em risco'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
