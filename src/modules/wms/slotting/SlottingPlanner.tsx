import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Brain, CheckCircle2, X, RefreshCw, ArrowRight, TrendingDown, FlaskConical, Sparkles } from "lucide-react";
import WMSKpiStrip from "../components/WMSKpiStrip";
import { EmptyState } from "@/shared/components/EmptyState";
import { toast } from "sonner";

type Engine = "v1" | "v2";
interface SimResult {
  generated: number;
  affinity_pairs: number;
  abc_distribution: { A: number; B: number; C: number };
  estimated_total_savings_m: number;
  preview?: Array<{
    product_id: string;
    abc_class: string;
    estimated_distance_saved_m: number;
    estimated_picks_per_day: number;
    reason: Record<string, unknown>;
  }>;
}

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
  const [engine, setEngine] = useState<Engine>("v2");
  const [sim, setSim] = useState<SimResult | null>(null);
  const [simulating, setSimulating] = useState(false);

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
    try {
      const fn = engine === "v2" ? "wms-slotting-v2" : "wms-slotting-recompute";
      const body = engine === "v2" ? { mode: "persist" } : {};
      const { error } = await supabase.functions.invoke(fn, { body });
      if (error) throw error;
      toast.success(`Engine ${engine.toUpperCase()} executado`);
      setSim(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao recalcular");
    } finally {
      setRunning(false);
    }
  };

  const simulate = async () => {
    setSimulating(true);
    try {
      const { data, error } = await supabase.functions.invoke("wms-slotting-v2", {
        body: { mode: "simulate" },
      });
      if (error) throw error;
      const first = data?.result ? (Object.values(data.result)[0] as SimResult) : null;
      setSim(first);
      if (first) toast.success(`Simulação: ${first.generated} sugestões previstas`);
    } catch (e: any) {
      toast.error(e?.message || "Falha na simulação");
    } finally {
      setSimulating(false);
    }
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
        <div className="flex gap-2 flex-wrap items-center">
          <div role="radiogroup" aria-label="Engine de slotting" className="flex rounded-md border overflow-hidden">
            {(["v1", "v2"] as Engine[]).map((e) => (
              <button
                key={e}
                role="radio"
                aria-checked={engine === e}
                onClick={() => setEngine(e)}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  engine === e ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"
                }`}
              >
                {e === "v1" ? "v1 · ABC" : "v2 · Afinidade+Peso"}
              </button>
            ))}
          </div>
          <Button onClick={simulate} disabled={simulating || engine !== "v2"} variant="outline" className="gap-2">
            <FlaskConical className={`h-4 w-4 ${simulating ? "animate-pulse" : ""}`} aria-hidden="true" />
            {simulating ? "Simulando…" : "Simular (what-if)"}
          </Button>
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

      {sim && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Simulação v2 (não aplicada)
              <Button size="sm" variant="ghost" className="ml-auto h-7" onClick={() => setSim(null)}>
                Fechar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><div className="text-xs text-muted-foreground">Sugestões</div><div className="text-xl font-bold">{sim.generated}</div></div>
              <div><div className="text-xs text-muted-foreground">Economia total</div><div className="text-xl font-bold text-emerald-600">{sim.estimated_total_savings_m.toLocaleString("pt-BR")} m/dia</div></div>
              <div><div className="text-xs text-muted-foreground">Pares de afinidade</div><div className="text-xl font-bold">{sim.affinity_pairs}</div></div>
              <div>
                <div className="text-xs text-muted-foreground">ABC dinâmico</div>
                <div className="flex gap-1 mt-1">
                  <Badge variant="outline">A {sim.abc_distribution.A}</Badge>
                  <Badge variant="outline">B {sim.abc_distribution.B}</Badge>
                  <Badge variant="outline">C {sim.abc_distribution.C}</Badge>
                </div>
              </div>
            </div>
            {sim.preview && sim.preview.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Top {sim.preview.length} sugestões preview · principais razões:{" "}
                {Array.from(new Set(sim.preview.map((p) => String((p.reason as any)?.rationale)))).join(", ")}
              </div>
            )}
            <Button size="sm" onClick={recompute} disabled={running} className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Aplicar essa simulação
            </Button>
          </CardContent>
        </Card>
      )}


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
