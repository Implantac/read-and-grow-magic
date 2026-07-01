import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { KPICard } from '@/shared/components/KPICard';
import { PCPMetricsService, MRPService, ActionSuggestion } from '@/lib/pcpServices';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, Target, TrendingUp, AlertTriangle, Lightbulb, Gauge, CheckCircle, Factory, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PCPKPIPanelProps {
  orders: any[];
  timeEntries: any[];
  capacities: any[];
  sheets?: any[];
  supplies?: any[];
}

export default function PCPKPIPanel({ orders, timeEntries, capacities, sheets, supplies }: PCPKPIPanelProps) {
  const metrics = useMemo(() => PCPMetricsService.calculate(orders, timeEntries, capacities), [orders, timeEntries, capacities]);

  const suggestions = useMemo(() => {
    if (!sheets || !supplies) return [];
    const activeOPs = orders.filter(o => ['planned', 'in_progress', 'paused'].includes(o.status));
    const needs = MRPService.calculateNeeds(activeOPs, sheets, supplies);
    return MRPService.generateSuggestions(needs, activeOPs, capacities);
  }, [orders, sheets, supplies, capacities]);

  const leadTimeData = [
    { name: 'Planejado', horas: metrics.avgLeadTimePlanned, fill: 'hsl(var(--primary))' },
    { name: 'Real', horas: metrics.avgLeadTimeReal, fill: metrics.avgLeadTimeReal > metrics.avgLeadTimePlanned ? 'hsl(var(--destructive))' : 'hsl(var(--success))' },
  ];

  const severityIcon = (s: string) => {
    if (s === 'critical') return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (s === 'warning') return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <Lightbulb className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="space-y-4">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Taxa No Prazo" value={`${metrics.onTimeRate}%`} icon={<Target className="h-5 w-5" />}
          accentColor={metrics.onTimeRate >= 80 ? 'success' : metrics.onTimeRate >= 60 ? 'warning' : 'danger'} index={0}
          entityKey="oee" numericValue={metrics.onTimeRate} progress={metrics.onTimeRate}
          status={metrics.onTimeRate >= 80 ? 'healthy' : metrics.onTimeRate >= 60 ? 'warn' : 'critical'} source="PCP" />
        <KPICard title="Taxa de Atraso" value={`${metrics.delayRate}%`} icon={<AlertTriangle className="h-5 w-5" />}
          accentColor={metrics.delayRate <= 10 ? 'success' : metrics.delayRate <= 30 ? 'warning' : 'danger'} index={1}
          entityKey="oee" numericValue={metrics.delayRate}
          status={metrics.delayRate <= 10 ? 'healthy' : metrics.delayRate <= 30 ? 'warn' : 'critical'} source="PCP" />
        <KPICard title="Eficiência" value={`${metrics.efficiency}%`} icon={<Gauge className="h-5 w-5" />}
          accentColor={metrics.efficiency >= 90 ? 'success' : 'warning'} index={2}
          entityKey="oee" numericValue={metrics.efficiency} progress={metrics.efficiency} source="PCP" />
        <KPICard title="Throughput (30d)" value={metrics.throughput} icon={<TrendingUp className="h-5 w-5" />}
          accentColor="primary" index={3} entityKey="oee" numericValue={metrics.throughput} source="PCP" />

      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Lead Time chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Lead Time: Planejado vs Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leadTimeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={11} />
                <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                <Tooltip formatter={(v: number) => [`${v}h`, 'Lead Time']} />
                <Bar dataKey="horas" radius={[0, 4, 4, 0]}>
                  {leadTimeData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 text-center">
              <Badge variant={metrics.leadTimeVariance <= 0 ? 'default' : 'destructive'} className="text-xs">
                Variação: {metrics.leadTimeVariance > 0 ? '+' : ''}{metrics.leadTimeVariance}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Additional metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Factory className="h-4 w-4" /> Indicadores Detalhados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 rounded bg-muted">
              <span className="text-sm">OPs Ativas</span>
              <span className="font-bold">{metrics.activeOPs}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-muted">
              <span className="text-sm">Concluídas Hoje</span>
              <span className="font-bold text-success">{metrics.completedToday}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-muted">
              <span className="text-sm">Atrasadas</span>
              <span className={cn('font-bold', metrics.delayedCount > 0 ? 'text-destructive' : 'text-success')}>{metrics.delayedCount}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-muted">
              <span className="text-sm">Lead Time Planejado (h)</span>
              <span className="font-bold">{metrics.avgLeadTimePlanned}h</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-muted">
              <span className="text-sm">Lead Time Real (h)</span>
              <span className={cn('font-bold', metrics.avgLeadTimeReal > metrics.avgLeadTimePlanned ? 'text-destructive' : 'text-success')}>
                {metrics.avgLeadTimeReal}h
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-muted">
              <span className="text-sm">Utilização Capacidade</span>
              <span className="font-bold">{metrics.utilizationPct}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Sugestões Inteligentes de Ação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {suggestions.map((s, i) => (
                <div key={i} className={cn(
                  'p-3 rounded-lg border flex items-start gap-3',
                  s.severity === 'critical' ? 'bg-destructive/5 border-destructive/30' :
                    s.severity === 'warning' ? 'bg-warning/5 border-warning/30' : 'bg-muted border-border'
                )}>
                  {severityIcon(s.severity)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    {s.estimatedImpact && <p className="text-xs font-medium text-primary mt-1">💡 {s.estimatedImpact}</p>}
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{s.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
