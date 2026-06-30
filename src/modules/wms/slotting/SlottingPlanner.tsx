import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Brain, CheckCircle2, X, RefreshCw } from "lucide-react";
import WMSKpiStrip from "../components/WMSKpiStrip";

interface Suggestion {
  id: string;
  product_id: string;
  current_location_id: string | null;
  suggested_location_id: string;
  score: number | null;
  abc_class: string | null;
  reason: Record<string, unknown>;
  estimated_distance_saved_m: number | null;
  estimated_picks_per_day: number | null;
  status: string;
  created_at: string;
}

export default function SlottingPlanner() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("slotting_suggestions")
      .select("*")
      .eq("status", "pending")
      .order("score", { ascending: false })
      .limit(50);
    setItems((data ?? []) as Suggestion[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recompute = async () => {
    setRunning(true);
    await supabase.functions.invoke("wms-slotting-recompute", { body: {} });
    setRunning(false);
    await load();
  };

  const decide = async (id: string, status: "approved" | "rejected") => {
    const now = new Date().toISOString();
    const patch =
      status === "approved"
        ? { status, approved_at: now }
        : { status, rejected_at: now };
    await supabase.from("slotting_suggestions").update(patch).eq("id", id);
    setItems((r) => r.filter((x) => x.id !== id));
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Slotting Engine</h1>
          <p className="text-muted-foreground">
            Sugestões automáticas de realocação para reduzir km percorridos no picking.
          </p>
        </div>
        <Button onClick={recompute} disabled={running} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} aria-hidden="true" />
          {running ? "Recalculando…" : "Recalcular"}
        </Button>
      </header>

      <WMSKpiStrip />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
            Sugestões pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div role="status" aria-live="polite" className="sr-only">
            {loading ? "Carregando" : `${items.length} sugestões pendentes`}
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Carregando…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma sugestão pendente. Clique em "Recalcular" para gerar novas.
            </div>
          ) : (
            <ul role="list" className="space-y-2">
              {items.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start gap-3 p-3 rounded-md border bg-card"
                  role="listitem"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge>Classe {s.abc_class ?? "—"}</Badge>
                      <Badge variant="outline">Score {s.score ?? 0}</Badge>
                      <span className="text-sm font-medium truncate">Produto {s.product_id.slice(0, 8)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Economia estimada: {s.estimated_distance_saved_m ?? 0}m/dia •{" "}
                      {s.estimated_picks_per_day ?? 0} picks/dia
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label="Aprovar sugestão"
                      onClick={() => decide(s.id, "approved")}
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Rejeitar sugestão"
                      onClick={() => decide(s.id, "rejected")}
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
    </div>
  );
}
