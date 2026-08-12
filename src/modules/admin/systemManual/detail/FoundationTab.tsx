import { Ban, Gauge, Link2, Target, XCircle, Activity, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import type { ModuleFoundation } from '../foundation-types';

export function FoundationTab({ foundation }: { foundation: ModuleFoundation }) {
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
              {foundation.keyMetrics.map((m, i) => (
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
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4 text-primary" /> Ecossistema & Dependências
            </CardTitle>
            <CardDescription>Este módulo faz parte de um organismo vivo. Veja as conexões.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {foundation.integrations.map((it, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background border hover:border-primary/40 transition-colors">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Activity className="h-3 w-3 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-primary uppercase text-[10px] tracking-wider">{it.with}</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{it.what}</p>
                  </div>
                </div>
              ))}
              <div className="mt-4 p-3 rounded-lg border border-dashed border-primary/30 flex items-center justify-between group cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => document.querySelector<HTMLButtonElement>('[value="ecosystem"]')?.click()}>
                <span className="text-xs font-medium text-muted-foreground">Ver mapa completo no Ecossistema</span>
                <ArrowRight className="h-3 w-3 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
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
