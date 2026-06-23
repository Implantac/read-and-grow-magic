import { differenceInDays } from 'date-fns';
import { AlertTriangle, DollarSign, Target } from 'lucide-react';
import { Badge } from '@/ui/base/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { KPICard } from '@/shared/components/KPICard';
import { formatBRL } from '@/lib/formatters';
import { getFunnelStageLabel } from './constants';

interface PipelineTabProps {
  funnel: any[];
  openFunnel: number;
  funnelValue: number;
  openAlerts: number;
}

export function PipelineTab({ funnel, openFunnel, funnelValue, openAlerts }: PipelineTabProps) {
  const items = funnel.filter(f => f.status === 'open');
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <KPICard index={0} title="Oportunidades Abertas" value={openFunnel.toString()} icon={<Target className="h-5 w-5" />} accentColor="info" />
        <KPICard index={1} title="Valor do Pipeline" value={formatBRL(funnelValue)} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" />
        <KPICard index={2} title="Alertas Comerciais" value={openAlerts.toString()} icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Propostas e Negociações Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma oportunidade aberta</p>
          ) : (
            <div className="space-y-2">
              {items.slice(0, 10).map(item => {
                const days = differenceInDays(new Date(), new Date(item.updated_at || item.created_at));
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.title}</span>
                        <Badge variant="outline" className="text-[10px]">{getFunnelStageLabel(item.stage)}</Badge>
                        {days > 14 && <Badge variant="destructive" className="text-[10px]">⏰ {days}d parado</Badge>}
                      </div>
                      <p className="text-xs text-primary font-semibold mt-0.5">{formatBRL(item.value)}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{item.probability}%</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
