import { Zap } from "lucide-react";
import { Badge } from "@/ui/base/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { cn } from "@/lib/utils";
import { RecIcon } from "./utils";

export function AIRecommendations({ recommendations }: { recommendations: any[] }) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-md bg-primary/15">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          Recomendações da IA
          <Badge variant="outline" className="ml-2 text-[10px]">{recommendations.length} ações</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommendations.map((r) => {
          const priorityLabel =
            r.priority === 1 ? { txt: "Crítico", cls: "border-red-500/40 text-red-500 bg-red-500/10" } :
            r.priority === 2 ? { txt: "Alto",    cls: "border-amber-500/40 text-amber-500 bg-amber-500/10" } :
            r.priority === 3 ? { txt: "Médio",   cls: "border-blue-500/40 text-blue-500 bg-blue-500/10" } :
            r.priority === 4 ? { txt: "Oportunidade", cls: "border-emerald-500/40 text-emerald-500 bg-emerald-500/10" } :
                               { txt: "Info",    cls: "border-muted-foreground/30 text-muted-foreground bg-muted/40" };
          return (
            <div key={r.id} className="rounded-lg border bg-card p-3 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0"><RecIcon icon={r.icon} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm leading-tight">{r.title}</p>
                    <Badge variant="outline" className={cn("text-[10px] font-medium shrink-0", priorityLabel.cls)}>
                      {priorityLabel.txt}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{r.detail}</p>
                  {r.impact && (
                    <p className="text-[11px] text-primary/80 mt-2 font-medium font-mono">{r.impact}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
