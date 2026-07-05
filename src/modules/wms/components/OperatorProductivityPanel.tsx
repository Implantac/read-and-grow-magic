import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Users, RefreshCw, Trophy } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";

interface OperatorRow {
  operator_id: string;
  operator_name: string | null;
  tasks_completed: number;
  avg_seconds_per_task: number | null;
  picks: number;
  putaways: number;
  last_activity: string | null;
}

const fmtDuration = (sec: number | null) => {
  if (!sec) return "—";
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s}s`;
};

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

export default function OperatorProductivityPanel({ days = 7 }: { days?: number }) {
  const [rows, setRows] = useState<OperatorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_operator_productivity", { p_days: days });
    if (!error) setRows((data ?? []) as OperatorRow[]);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" aria-hidden="true" />
            Produtividade de Operadores
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Tarefas concluídas, tempo médio e mix por operador nos últimos {days} dias.
          </p>
        </div>
        <Button onClick={load} variant="outline" size="sm" className="gap-2" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        <div role="status" aria-live="polite" className="sr-only">
          {loading ? "Carregando ranking" : `${rows.length} operadores`}
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Carregando…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Nenhuma atividade registrada no período.
          </div>
        ) : (
          <ol role="list" className="space-y-2">
            {rows.map((r, idx) => (
              <li
                key={r.operator_id}
                className="flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-accent/30 transition"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold shrink-0">
                  {idx < 3 ? <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.operator_name ?? "Operador"}</p>
                  <p className="text-xs text-muted-foreground">
                    Última atividade: {fmtDate(r.last_activity)}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <Badge variant="secondary">{r.tasks_completed} tarefas</Badge>
                  <Badge variant="outline">⌀ {fmtDuration(r.avg_seconds_per_task)}</Badge>
                  {r.picks > 0 && <Badge className="bg-blue-500/10 text-blue-500">{r.picks} picks</Badge>}
                  {r.putaways > 0 && (
                    <Badge className="bg-green-500/10 text-green-500">{r.putaways} putaway</Badge>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
