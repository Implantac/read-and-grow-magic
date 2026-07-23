import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Progress } from '@/ui/base/progress';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

type SupplierMetric = {
  supplierName: string; totalOrders: number; returnedOnTime: number; returnedLate: number;
  onTimeRate: number; avgDelayDays: number; avgQualityRate: number;
};

export function MetricsTab({ supplierMetrics }: { supplierMetrics: SupplierMetric[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5" /> Performance de Fornecedores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {supplierMetrics.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado de fornecedor disponível ainda.</p>
        ) : (
          <div className="space-y-4">
            {supplierMetrics.map(sm => (
              <Card key={sm.supplierName} className="border-border/50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-sm">{sm.supplierName}</h4>
                      <p className="text-xs text-muted-foreground">{sm.totalOrders} OS total · {sm.returnedOnTime} no prazo · {sm.returnedLate} atrasadas</p>
                    </div>
                    <Badge className={cn('text-xs', sm.onTimeRate >= 80 ? 'bg-green-500/20 text-green-400' : sm.onTimeRate >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400')}>
                      {sm.onTimeRate}% no prazo
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Taxa Pontualidade</p>
                      <Progress value={sm.onTimeRate} className="h-2 mt-1" />
                      <p className="text-xs font-medium mt-0.5">{sm.onTimeRate}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Atraso Médio</p>
                      <p className="text-lg font-bold">{sm.avgDelayDays}d</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Qualidade</p>
                      <Progress value={sm.avgQualityRate} className="h-2 mt-1" />
                      <p className="text-xs font-medium mt-0.5">{sm.avgQualityRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
