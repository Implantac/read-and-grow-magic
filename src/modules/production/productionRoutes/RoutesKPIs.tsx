import { Card, CardContent } from '@/ui/base/card';
import { kpiConfig } from './constants';

export function RoutesKPIs({ values }: { values: (string | number)[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {kpiConfig.map((kpi, i) => (
        <Card key={i} className="border-border/40 bg-card/80 backdrop-blur-sm hover-lift" style={{ animationDelay: `${i * 80}ms` }}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-11 w-11 rounded-xl bg-muted/60 flex items-center justify-center ${kpi.color} ring-2 ${kpi.ring}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{values[i]}</p>
              <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
