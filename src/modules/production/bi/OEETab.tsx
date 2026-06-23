import { Badge } from '@/ui/base/badge';
import { Card, CardContent } from '@/ui/base/card';
import { Progress } from '@/ui/base/progress';
import { cn } from '@/lib/utils';
import type { BIMetrics } from './useBIMetrics';

export function OEETab({ metrics }: { metrics: BIMetrics }) {
  const { availability, performance, quality, oee } = metrics;
  const cards = [
    { label: 'Disponibilidade', value: availability * 100, desc: 'Tempo real vs estimado' },
    { label: 'Performance', value: performance * 100, desc: 'Produzido vs planejado' },
    { label: 'Qualidade', value: quality * 100, desc: 'Peças boas vs total' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((item, i) => (
          <Card key={i}>
            <CardContent className="pt-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={cn('text-5xl font-extrabold', item.value >= 85 ? 'text-success' : item.value >= 60 ? 'text-warning' : 'text-destructive')}>
                {item.value.toFixed(1)}%
              </p>
              <Progress value={item.value} className="h-3" />
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">OEE Global</p>
          <p className={cn('text-7xl font-black', oee >= 85 ? 'text-success' : oee >= 60 ? 'text-warning' : 'text-destructive')}>{oee.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">Disponibilidade × Performance × Qualidade</p>
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant="outline" className="text-xs">World Class: ≥ 85%</Badge>
            <Badge variant="outline" className="text-xs">Bom: ≥ 60%</Badge>
            <Badge variant="outline" className="text-xs">Crítico: {'<'} 60%</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
