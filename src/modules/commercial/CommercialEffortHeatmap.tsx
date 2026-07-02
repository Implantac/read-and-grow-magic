import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import type { DbOrder } from '@/hooks/commercial/useOrders';

interface Props {
  orders: DbOrder[];
}

const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function CommercialEffortHeatmap({ orders }: Props) {
  const { grid, max } = useMemo(() => {
    const g: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    orders.forEach((o) => {
      if (!o.created_at) return;
      const d = new Date(o.created_at);
      g[d.getDay()][d.getHours()] += 1;
    });
    const m = Math.max(1, ...g.flat());
    return { grid: g, max: m };
  }, [orders]);

  const intensity = (v: number) => {
    if (!v) return 'bg-muted/30';
    const pct = v / max;
    if (pct > 0.75) return 'bg-primary';
    if (pct > 0.5) return 'bg-primary/70';
    if (pct > 0.25) return 'bg-primary/40';
    return 'bg-primary/20';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Heatmap de Esforço Comercial</CardTitle>
        <p className="text-xs text-muted-foreground">Pedidos criados por dia da semana × hora</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: 'auto repeat(24, minmax(14px, 1fr))' }}>
            <div />
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="text-center text-[9px] text-muted-foreground">
                {h % 3 === 0 ? h : ''}
              </div>
            ))}
            {WEEK.map((label, day) => (
              <>
                <div key={`l-${day}`} className="pr-2 text-right text-[10px] font-medium text-muted-foreground">
                  {label}
                </div>
                {grid[day].map((v, h) => (
                  <div
                    key={`${day}-${h}`}
                    title={`${label} ${h}h — ${v} pedido${v === 1 ? '' : 's'}`}
                    className={`h-4 w-full rounded-sm ${intensity(v)}`}
                  />
                ))}
              </>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Menos</span>
          <div className="h-3 w-3 rounded-sm bg-muted/30" />
          <div className="h-3 w-3 rounded-sm bg-primary/20" />
          <div className="h-3 w-3 rounded-sm bg-primary/40" />
          <div className="h-3 w-3 rounded-sm bg-primary/70" />
          <div className="h-3 w-3 rounded-sm bg-primary" />
          <span>Mais</span>
        </div>
      </CardContent>
    </Card>
  );
}
