import { Badge } from '@/ui/base/badge';
import { formatBRL } from '@/lib/formatters';
import { trendIcon } from './helpers';

export function ForecastKPIs({ forecast, kpis }: { forecast: any; kpis: any[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="p-3 rounded-lg border bg-card">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          Previsão próx. mês {trendIcon(forecast?.trend)}
        </div>
        <div className="text-xl font-bold mt-1">{formatBRL(forecast?.previsao_proximo_mes ?? 0)}</div>
        <div className="text-[10px] text-muted-foreground">
          Último: {formatBRL(forecast?.ultimo_mes ?? 0)}
        </div>
      </div>
      {kpis.slice(0, 3).map((k) => (
        <div key={k.kpi_name} className="p-3 rounded-lg border bg-card">
          <div className="text-xs text-muted-foreground capitalize">{k.kpi_name.replace(/_/g, ' ')}</div>
          <div className="text-xl font-bold mt-1">
            {k.kpi_name.includes('margem') || k.kpi_name.includes('inadim')
              ? `${Number(k.current_value).toFixed(1)}%`
              : k.category === 'inventory'
              ? Number(k.current_value).toFixed(0)
              : formatBRL(Number(k.current_value))}
          </div>
          <Badge variant={k.status === 'ok' ? 'outline' : k.status === 'alerta' ? 'secondary' : 'destructive'} className="mt-1 text-[10px]">
            {k.status}
          </Badge>
        </div>
      ))}
      {kpis.length === 0 && (
        <div className="col-span-3 p-3 rounded-lg border bg-muted/30 text-xs text-muted-foreground text-center">
          Nenhum KPI disponível ainda — gere a análise novamente em alguns minutos.
        </div>
      )}
    </div>
  );
}
