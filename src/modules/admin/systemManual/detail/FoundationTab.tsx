import { Ban, Gauge, Link2, Target, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';

export function FoundationTab({ foundation }: { foundation: any }) {
  return (
    <div className="space-y-4 mt-4">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" /> Conceito-chave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/90 leading-relaxed">{foundation.concept}</p>
        </CardContent>
      </Card>

      {foundation.keyMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4 text-primary" /> Indicadores que importam
            </CardTitle>
            <CardDescription>Métricas para acompanhar a saúde do módulo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {foundation.keyMetrics.map((m: any, i: number) => (
                <div key={i} className="rounded-lg border p-3 bg-muted/20">
                  <p className="font-semibold text-sm">{m.name}</p>
                  <p className="text-xs text-muted-foreground mt-1"><span className="font-mono">{m.formula}</span></p>
                  <p className="text-xs mt-2"><span className="text-primary font-medium">Meta:</span> {m.target}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {foundation.integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4 text-primary" /> Como se conecta ao resto do ERP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {foundation.integrations.map((it: any, i: number) => (
                <li key={i} className="grid sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 text-sm border-b pb-2 last:border-0 last:pb-0">
                  <span className="font-semibold text-primary">{it.with}</span>
                  <span className="text-muted-foreground">{it.what}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {foundation.antipatterns.length > 0 && (
        <Card className="border-rose-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ban className="h-4 w-4 text-rose-500" /> O que NUNCA fazer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {foundation.antipatterns.map((a: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{a}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
