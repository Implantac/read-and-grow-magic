import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Brain, CheckCircle2, X, RefreshCw, ArrowRight, TrendingDown } from "lucide-react";
import WMSKpiStrip from "../components/WMSKpiStrip";

interface Suggestion {
  id: string;
  product_id: string;
  current_location_id: string | null;
  suggested_location_id: string;
  score: number | null;
  abc_class: string | null;
  reason: Record<string, unknown> | null;
  estimated_distance_saved_m: number | null;
  estimated_picks_per_day: number | null;
  status: string;
  created_at: string;
  product?: { code: string | null; name: string | null } | null;
  current_location?: { code: string | null; zone: string | null } | null;
  suggested_location?: { code: string | null; zone: string | null } | null;
}

export default function SlottingPlanner() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("slotting_suggestions")
      .select(
        `*,
         product:products!slotting_suggestions_product_id_fkey(code,name),
         current_location:wms_storage_locations!slotting_suggestions_current_location_id_fkey(code,zone),
         suggested_location:wms_storage_locations!slotting_suggestions_suggested_location_id_fkey(code,zone)`
      )
      .eq("status", "pending")
      .order("score", { ascending: false })
      .limit(50);
    setItems((data ?? []) as unknown as Suggestion[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const km = items.reduce((a, s) => a + (s.estimated_distance_saved_m ?? 0), 0);
    const picks = items.reduce((a, s) => a + (s.estimated_picks_per_day ?? 0), 0);
    return { km, picks, count: items.length };
  }, [items]);

  const recompute = async () => {
    setRunning(true);
    await supabase.functions.invoke("wms-slotting-recompute", { body: {} });
    setRunning(false);
    await load();
  };

  const decide = async (id: string, status: "approved" | "rejected") => {
    const patch =
      status === "approved"
        ? { status, executed_at: new Date().toISOString() }
        : { status };
    await supabase.from("slotting_suggestions").update(patch).eq("id", id);
    setItems((r) => r.filter((x) => x.id !== id));
  };

  const approveAll = async () => {
    if (items.length === 0) return;
    const ids = items.map((i) => i.id);
    await supabase
      .from("slotting_suggestions")
      .update({ status: "approved", executed_at: new Date().toISOString() })
      .in("id", ids);
    setItems([]);
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
        <div className="flex gap-2">
          <Button onClick={recompute} disabled={running} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} aria-hidden="true" />
            {running ? "Recalculando…" : "Recalcular"}
          </Button>
          <Button onClick={approveAll} disabled={items.length === 0} className="gap-2">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Aprovar todos
          </Button>
        </div>
      </header>

      <WMSKpiStrip />

      <section aria-label="Resumo de impacto" className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Economia estimada</p>
            <div className="text-2xl font-bold flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              {totals.km.toLocaleString("pt-BR")} m/dia
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Picks/dia impactados</p>
            <div className="text-2xl font-bold">{totals.picks.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Sugestões pendentes</p>
            <div className="text-2xl font-bold">{totals.count}</div>
          </CardContent>
        </Card>
      </section>

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
              {items.map((s) => {
                const productLabel =
                  s.product?.name ?? s.product?.code ?? `Produto ${s.product_id.slice(0, 8)}`;
                const from =
                  s.current_location?.code ??
                  (s.current_location_id ? s.current_location_id.slice(0, 8) : "sem alocação");
                const to = s.suggested_location?.code ?? s.suggested_location_id.slice(0, 8);
                return (
                  <li
                    key={s.id}
                    className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-accent/30 transition"
                    role="listitem"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge>Classe {s.abc_class ?? "—"}</Badge>
                        <Badge variant="outline">Score {s.score ?? 0}</Badge>
                        <span className="text-sm font-medium truncate">{productLabel}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-mono">{from}</span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        <span className="font-mono text-foreground">{to}</span>
                        <span>•</span>
                        <span>
                          Economia: {s.estimated_distance_saved_m ?? 0}m/dia ·{" "}
                          {s.estimated_picks_per_day ?? 0} picks/dia
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Aprovar realocação de ${productLabel} para ${to}`}
                        onClick={() => decide(s.id, "approved")}
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Rejeitar sugestão de ${productLabel}`}
                        onClick={() => decide(s.id, "rejected")}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
