import { AlertTriangle, Phone, Target, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/ui/base/card';
import { Progress } from '@/ui/base/progress';
import { KPICard } from '@/shared/components/KPICard';
import { formatBRL } from '@/lib/formatters';

export interface SellerStats {
  dailyTarget: number;
  todayBilling: number;
  targetPct: number;
  monthBilling: number;
  totalTarget: number;
  todayFollowUps: number;
  pendingFollowUps: number;
  criticalClients: number;
  upsellOpportunities: number;
}

export function SellerKPIs({ stats }: { stats: SellerStats }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 mt-6">
        <KPICard index={0} title="Meta Diária" value={formatBRL(stats.dailyTarget)}
          subtitle={`Vendido hoje: ${formatBRL(stats.todayBilling)}`}
          icon={<Target className="h-5 w-5" />} accentColor="primary" />
        <KPICard index={1} title="Meta Mensal" value={`${stats.targetPct.toFixed(0)}%`}
          subtitle={`${formatBRL(stats.monthBilling)} de ${formatBRL(stats.totalTarget)}`}
          icon={<Trophy className="h-5 w-5" />} accentColor="success" />
        <KPICard index={2} title="Follow-ups Hoje" value={stats.todayFollowUps.toString()}
          subtitle={`${stats.pendingFollowUps} atrasados`}
          icon={<Phone className="h-5 w-5" />} accentColor={stats.pendingFollowUps > 0 ? 'danger' : 'info'} />
        <KPICard index={3} title="Clientes em Risco" value={stats.criticalClients.toString()}
          subtitle={`${stats.upsellOpportunities} oportunidades de upsell`}
          icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" />
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso da Meta Mensal</span>
            <span className="text-sm font-bold text-primary">{stats.targetPct.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(stats.targetPct, 100)} className="h-3" />
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>R$ 0</span>
            <span>{formatBRL(stats.totalTarget)}</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
