/* eslint-disable react-refresh/only-export-components -- shadcn pattern: variants/utilities co-localizados com o componente */
import { Card, CardContent } from '@/ui/base/card';
import { Progress } from '@/ui/base/progress';
import {
  TrendingUp, DollarSign, AlertTriangle, Wallet, Users, Target,
  Factory, Activity, Package, Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExecutiveKPIs } from '@/hooks/ai/useExecutiveAI';

import { formatters } from '@/shared/utils/formatters';

const fmt = formatters.currency;
const fmtCompact = formatters.currencyCompact;

export { fmt, fmtCompact };


interface Props {
  kpis: ExecutiveKPIs | undefined;
}

export function PrimaryKPICards({ kpis }: Props) {
  const kpiCards = [
    { 
      label: 'Receita Total', 
      value: fmtCompact(kpis?.totalRevenue || 0), 
      icon: TrendingUp, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-500/10', 
      sub: (
        <div className="flex flex-col gap-0.5 mt-1">
          <span className={cn('text-[10px]', (kpis?.moMGrowth ?? 0) >= 0 ? 'text-emerald-600' : 'text-destructive')}>
            MoM: {(kpis?.moMGrowth ?? 0) >= 0 ? '+' : ''}{kpis?.moMGrowth || 0}%
          </span>
          <span className={cn('text-[10px]', (kpis?.yoYGrowth ?? 0) >= 0 ? 'text-emerald-600' : 'text-destructive')}>
            YoY: {(kpis?.yoYGrowth ?? 0) >= 0 ? '+' : ''}{kpis?.yoYGrowth || 0}%
          </span>
        </div>
      )
    },
    { label: 'Lucro Bruto', value: fmtCompact(kpis?.grossProfit || 0), icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', sub: <span className="text-[10px] text-muted-foreground">Margem {kpis?.grossMargin || 0}%</span> },
    { label: 'Liquidez Corrente', value: (kpis?.currentRatio || 0).toFixed(2), icon: Scale, color: (kpis?.currentRatio || 0) >= 1 ? 'text-emerald-600' : 'text-destructive', bg: (kpis?.currentRatio || 0) >= 1 ? 'bg-emerald-500/10' : 'bg-destructive/10', sub: <span className="text-[10px] text-muted-foreground">Saúde de curto prazo</span> },
    { label: 'Posição Líquida', value: fmtCompact(kpis?.netPosition || 0), icon: Wallet, color: (kpis?.netPosition || 0) >= 0 ? 'text-emerald-600' : 'text-destructive', bg: (kpis?.netPosition || 0) >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiCards.map((k, idx) => (
        <Card key={k.label} className="hover-lift" style={{ animationDelay: `${idx * 60}ms` }}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{k.label}</p>
                <p className="text-2xl font-bold tabular-nums">{k.value}</p>
                {k.sub && <p className="text-xs text-muted-foreground">{k.sub}</p>}
              </div>
              <div className={cn('rounded-xl p-2.5', k.bg)}>
                <k.icon className={cn('h-5 w-5', k.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SecondaryKPICards({ kpis }: Props) {
  const items = [
    { icon: Users, color: 'text-primary', label: 'Clientes Ativos', value: kpis?.activeClients || 0 },
    { icon: AlertTriangle, color: 'text-destructive', label: 'Em Risco', value: kpis?.clientsAtRisk || 0 },
    { icon: Target, color: 'text-primary', label: 'Ticket Médio', value: fmt(kpis?.avgTicket || 0) },
    { icon: Factory, color: 'text-orange-500', label: 'Efic. Produção', value: `${kpis?.prodEfficiency || 0}%` },
    { icon: Activity, color: 'text-emerald-600', label: 'Caixa 30d', value: fmt(kpis?.cashFlowProjection30d || 0) },
    { icon: Package, color: 'text-destructive', label: 'Estoque Crítico', value: kpis?.lowStockProducts || 0 },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
      {items.map(item => (
        <Card key={item.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <item.icon className={cn('h-4 w-4', item.color)} />
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-bold">{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TargetAttainmentBar({ kpis }: Props) {
  if (!kpis || (kpis.totalTarget || 0) <= 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Meta de Vendas</span>
          </div>
          <span className="text-sm font-bold">{kpis.targetAttainment || 0}%</span>
        </div>
        <Progress value={Math.min(100, kpis.targetAttainment || 0)} className="h-2.5" />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>Atingido: {fmt(kpis.totalAchieved || 0)}</span>
          <span>Meta: {fmt(kpis.totalTarget || 0)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
