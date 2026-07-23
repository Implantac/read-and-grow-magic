import { KPICard } from '@/shared/components/KPICard';
import { DollarSign, TrendingUp, Target, XCircle, AlertTriangle } from 'lucide-react';
import { formatBRL } from '@/lib/formatters';
import { fmtShort } from './constants';

interface Props {
  globalStats: {
    monthBilling: number;
    monthOrders: number;
    avgTicket: number;
    conversionRate: number;
    wonDeals: number;
    lostDeals: number;
    lostValue: number;
    atRiskClients: number;
  };
  lostAlertsCount: number;
}

export function KPIRow({ globalStats, lostAlertsCount }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6 mt-6">
      <KPICard index={0} title="Faturamento Mês" value={fmtShort(globalStats.monthBilling)}
        subtitle={`${globalStats.monthOrders} pedidos`}
        icon={<DollarSign className="h-5 w-5" />} accentColor="primary" />
      <KPICard index={1} title="Ticket Médio" value={formatBRL(globalStats.avgTicket)}
        icon={<TrendingUp className="h-5 w-5" />} accentColor="accent" />
      <KPICard index={2} title="Taxa Conversão" value={`${globalStats.conversionRate.toFixed(1)}%`}
        subtitle={`${globalStats.wonDeals} ganhos / ${globalStats.lostDeals} perdidos`}
        icon={<Target className="h-5 w-5" />} accentColor="success" />
      <KPICard index={3} title="Vendas Perdidas" value={fmtShort(globalStats.lostValue)}
        subtitle={`${lostAlertsCount} alertas ativos`}
        icon={<XCircle className="h-5 w-5" />} accentColor="danger" />
      <KPICard index={4} title="Clientes em Risco" value={globalStats.atRiskClients.toString()}
        icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" />
    </div>
  );
}
