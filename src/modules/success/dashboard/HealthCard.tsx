import { Heart, Info } from "lucide-react";
import { Badge } from "@/ui/base/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Progress } from "@/ui/base/progress";
import { cn } from "@/lib/utils";

export function HealthCard({ health }: { health: any }) {
  return (
    <Card className="lg:col-span-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="h-4 w-4 text-primary" /> Saúde da empresa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-bold tabular-nums">{health.score}</span>
          <span className="text-lg text-muted-foreground">/100</span>
          <Badge variant="outline" className="ml-auto">{health.grade}</Badge>
        </div>
        <Progress value={health.score} className="h-2" />
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="rounded-lg border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Financeiro</p>
            <p className="text-xl font-bold">{health.financial}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Operacional</p>
            <p className="text-xl font-bold">{health.operational}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Comercial</p>
            <p className="text-xl font-bold">{health.commercial}</p>
          </div>
        </div>

        <div className="pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Como cada pilar contribui
            </p>
            <span className="text-[10px] text-muted-foreground">
              Σ contribuições = {health.pillars.reduce((a: number, p: any) => a + p.contribution, 0).toFixed(1)} / 100
            </span>
          </div>
          <div className="space-y-2">
            {health.pillars.map((p: any) => {
              const barColor =
                p.status === "good" ? "bg-emerald-500"
                : p.status === "warn" ? "bg-amber-500"
                : "bg-red-500";
              const dot = barColor;
              return (
                <div key={p.key} className="rounded-lg border p-3 space-y-1.5 bg-card/40">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", dot)} />
                      <p className="text-sm font-semibold truncate">{p.label}</p>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        peso {Math.round(p.weight * 100)}%
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">nota</span>
                      <span className="font-mono font-bold tabular-nums">{p.score}</span>
                      <span className="text-[10px] text-muted-foreground">→</span>
                      <span className="font-mono font-bold tabular-nums text-primary">
                        +{p.contribution.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full transition-all", barColor)}
                      style={{ width: `${Math.max(2, p.score)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{p.metricLabel}</span>
                    <span className="font-mono tabular-nums font-medium">{p.metricValue}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{p.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {health.drivers.map((d: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-[11px] font-normal">
              <Info className="h-3 w-3 mr-1" />{d}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
