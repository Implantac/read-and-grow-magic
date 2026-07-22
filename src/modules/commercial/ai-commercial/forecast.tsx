import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { BarChart3 } from 'lucide-react';
import { formatBRL, formatDate } from '@/lib/formatters';
import type { AIForecast } from '@/hooks/commercial/useAICommercial';

export function ForecastSummary({ latestForecast }: { latestForecast: AIForecast }) {
  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm">Previsão {latestForecast.period}</span>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Pessimista</div>
            <div className="text-sm font-semibold">{formatBRL(latestForecast.worst_case || 0)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Realista</div>
            <div className="text-lg font-bold text-primary">{formatBRL(latestForecast.predicted_revenue || 0)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Otimista</div>
            <div className="text-sm font-semibold">{formatBRL(latestForecast.best_case || 0)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Confiança</div>
            <div className="text-sm font-semibold">{Math.round((latestForecast.confidence || 0) * 100)}%</div>
          </div>
          {latestForecast.factors?.target_achievement_pct != null && (
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Meta</div>
              <div className={`text-sm font-bold ${latestForecast.factors.target_achievement_pct >= 100 ? 'text-emerald-500' : latestForecast.factors.target_achievement_pct >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
                {latestForecast.factors.target_achievement_pct}%
              </div>
            </div>
          )}
          {latestForecast.factors?.daily_needed > 0 && (
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Precisa/dia</div>
              <div className="text-sm font-semibold">{formatBRL(latestForecast.factors.daily_needed)}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ForecastCard({ forecast }: { forecast: AIForecast }) {
  const byRep = forecast.by_rep ? Object.entries(forecast.by_rep as Record<string, any>) : [];
  const byRegion = forecast.by_region ? Object.entries(forecast.by_region as Record<string, number>) : [];
  const bySegment = forecast.by_segment ? Object.entries(forecast.by_segment as Record<string, number>) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Forecast — {forecast.period}
          <span className="text-xs text-muted-foreground ml-auto">{formatDate(forecast.forecast_date)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Pessimista</div>
            <div className="text-sm font-bold">{formatBRL(forecast.worst_case || 0)}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-xs text-muted-foreground">Realista</div>
            <div className="text-lg font-bold text-primary">{formatBRL(forecast.predicted_revenue || 0)}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Otimista</div>
            <div className="text-sm font-bold">{formatBRL(forecast.best_case || 0)}</div>
          </div>
        </div>

        {byRep.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Por Vendedor</h4>
            <div className="space-y-1">
              {byRep.map(([id, data]: [string, any]) => (
                <div key={id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                  <span>{data.name || id.slice(0, 8)}</span>
                  <div className="flex gap-3">
                    <span>Conf: {formatBRL(data.confirmed || 0)}</span>
                    <span className="text-muted-foreground">Pipeline: {formatBRL(data.pipeline || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {byRegion.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Por Região</h4>
            <div className="flex flex-wrap gap-2">
              {byRegion.map(([region, value]) => (
                <Badge key={region} variant="secondary" className="text-xs">{region}: {formatBRL(value as number)}</Badge>
              ))}
            </div>
          </div>
        )}

        {bySegment.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Por Segmento</h4>
            <div className="flex flex-wrap gap-2">
              {bySegment.map(([seg, value]) => (
                <Badge key={seg} variant="outline" className="text-xs">{seg}: {formatBRL(value as number)}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
