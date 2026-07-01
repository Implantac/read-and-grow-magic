/* eslint-disable react-refresh/only-export-components -- shadcn pattern: variants/utilities co-localizados com o componente */
import { Card, CardContent } from '@/ui/base/card';
import { Progress } from '@/ui/base/progress';
import {
  TrendingUp, DollarSign, AlertTriangle, Wallet, Users, Target,
  Factory, Activity, Package, Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExecutiveKPIs } from '@/hooks/ai/useExecutiveAI';
import { EnterpriseKPICard } from '@/shared/components/EnterpriseKPICard';

import { formatters } from '@/shared/utils/formatters';

const fmt = formatters.currency;
const fmtCompact = formatters.currencyCompact;

export { fmt, fmtCompact };


interface Props {
  kpis: ExecutiveKPIs | undefined;
}

export function PrimaryKPICards({ kpis }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <EnterpriseKPICard
        index={0}
        entityKey="revenue"
        title="Receita Total"
        value={fmtCompact(kpis?.totalRevenue || 0)}
        numericValue={kpis?.totalRevenue || 0}
        icon={TrendingUp}
        color="success"
        deltas={{ month: kpis?.moMGrowth, year: kpis?.yoYGrowth }}
        trend={(kpis?.moMGrowth ?? 0) >= 0 ? 'up' : 'down'}
        source="Dashboard Consolidado"
        lastUpdated={new Date()}
      />
      <EnterpriseKPICard
        index={1}
        entityKey="gross_margin"
        title="Lucro Bruto"
        value={fmtCompact(kpis?.grossProfit || 0)}
        numericValue={kpis?.grossProfit || 0}
        icon={DollarSign}
        color="primary"
        subtitle={`Margem ${kpis?.grossMargin || 0}%`}
        progress={kpis?.grossMargin}
        source="Dashboard Consolidado"
        lastUpdated={new Date()}
      />
      <EnterpriseKPICard
        index={2}
        title="Liquidez Corrente"
        value={(kpis?.currentRatio || 0).toFixed(2)}
        icon={Scale}
        color={(kpis?.currentRatio || 0) >= 1 ? 'success' : 'danger'}
        subtitle="Saúde de curto prazo"
        status={(kpis?.currentRatio || 0) >= 1 ? 'healthy' : 'critical'}
      />
      <EnterpriseKPICard
        index={3}
        entityKey="cash_position"
        title="Posição Líquida"
        value={fmtCompact(kpis?.netPosition || 0)}
        numericValue={kpis?.netPosition || 0}
        icon={Wallet}
        color={(kpis?.netPosition || 0) >= 0 ? 'success' : 'danger'}
        source="Dashboard Consolidado"
        lastUpdated={new Date()}
      />
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
