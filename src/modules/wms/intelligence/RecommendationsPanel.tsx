import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Brain, CheckCircle2, X, RefreshCw, AlertTriangle } from "lucide-react";

interface Recommendation {
  id: string;
  type: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  body: string | null;
  evidence: Record<string, unknown>;
  suggested_action: Record<string, unknown>;
  status: string;
  created_at: string;
}

const sevColor: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-500",
  low: "bg-slate-500/10 text-slate-500",
  medium: "bg-amber-500/10 text-amber-500",
  high: "bg-orange-500/10 text-orange-500",
  critical: "bg-red-500/10 text-red-500",
};

export default function RecommendationsPanel() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("wms_recommendations")
      .select("*")
      .eq("status", "open")
      .order("severity", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    setRecs((data ?? []) as Recommendation[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runEngine = async () => {
    setRunning(true);
    await supabase.functions.invoke("wms-intelligence", { body: {} });
    setRunning(false);
    await load();
  };

  const updateStatus = async (id: string, status: "applied" | "dismissed") => {
    const now = new Date().toISOString();
    const patch =
      status === "applied" ? { status, applied_at: now } : { status, dismissed_at: now };
    await supabase.from("wms_recommendations").update(patch).eq("id", id);
    setRecs((r) => r.filter((x) => x.id !== id));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
            Recomendações Operacionais
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Engine determinística analisa zonas, lotes, docas e operação a cada 30 minutos.
          </p>
        </div>
        <Button onClick={runEngine} disabled={running} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} aria-hidden="true" />
          {running ? "Analisando…" : "Recalcular agora"}
        </Button>
      </CardHeader>
      <CardContent>
        <div role="status" aria-live="polite" className="sr-only">
          {loading ? "Carregando recomendações" : `${recs.length} recomendações abertas`}
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Carregando…</div>
        ) : recs.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Nenhuma recomendação aberta. Operação saudável.
          </div>
        ) : (
          <ul role="list" className="space-y-2">
            {recs.map((r) => (
              <li
                key={r.id}
                role="listitem"
                className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-accent/30 transition"
              >
                <AlertTriangle className={`h-4 w-4 mt-1 ${sevColor[r.severity]?.split(" ")[1] ?? ""}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={sevColor[r.severity]}>{r.severity.toUpperCase()}</Badge>
                    <Badge variant="outline">{r.type}</Badge>
                    <span className="text-sm font-medium truncate">{r.title}</span>
                  </div>
                  {r.body && <p className="text-xs text-muted-foreground mt-1">{r.body}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Aplicar recomendação ${r.title}`}
                    onClick={() => updateStatus(r.id, "applied")}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Descartar recomendação ${r.title}`}
                    onClick={() => updateStatus(r.id, "dismissed")}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
