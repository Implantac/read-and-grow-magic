import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ModuleKPI {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

interface ModuleKPISectionProps {
  title: string;
  icon: LucideIcon;
  kpis: ModuleKPI[];
  accentColor: string;
}

export function ModuleKPISection({ title, icon: Icon, kpis, accentColor }: ModuleKPISectionProps) {
  return (
    <Card className="overflow-hidden hover-lift">
      <CardHeader className={cn("py-2.5 px-4", accentColor)}>
        <CardTitle className="flex items-center gap-2 text-xs font-semibold text-primary-foreground uppercase tracking-wider">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((kpi, index) => (
            <div key={index} className="space-y-0.5">
              <p className="text-[11px] text-muted-foreground truncate">{kpi.label}</p>
              <p className="text-base font-bold text-foreground tabular-nums">{kpi.value}</p>
              {kpi.trendValue && (
                <p className={cn(
                  "text-[11px] font-medium",
                  kpi.trend === 'up' && "text-success",
                  kpi.trend === 'down' && "text-destructive",
                  kpi.trend === 'neutral' && "text-muted-foreground"
                )}>
                  {kpi.trend === 'up' && '↑ '}
                  {kpi.trend === 'down' && '↓ '}
                  {kpi.trendValue}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
