import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="overflow-hidden">
      <CardHeader className={cn("py-3 px-4", accentColor)}>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((kpi, index) => (
            <div key={index} className="space-y-1">
              <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
              <p className="text-lg font-bold text-foreground">{kpi.value}</p>
              {kpi.trendValue && (
                <p className={cn(
                  "text-xs font-medium",
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
