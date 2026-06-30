import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Activity, ArrowDownToLine, ArrowUpFromLine, PackageCheck, Move, Brain, AlertCircle } from "lucide-react";

interface WmsEvent {
  id: string;
  event_type: string;
  source_module: string | null;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

const iconFor = (type: string) => {
  if (type.startsWith("receiving") || type.startsWith("putaway")) return ArrowDownToLine;
  if (type.startsWith("picking") || type.startsWith("shipment")) return ArrowUpFromLine;
  if (type.startsWith("movement")) return Move;
  if (type.startsWith("recommendation") || type.startsWith("slotting")) return Brain;
  if (type.startsWith("conference") || type.startsWith("packing")) return PackageCheck;
  if (type.includes("alert") || type.includes("error")) return AlertCircle;
  return Activity;
};

const colorFor = (type: string) => {
  if (type.includes("error") || type.includes("alert")) return "text-destructive";
  if (type.startsWith("receiving") || type.startsWith("putaway")) return "text-blue-500";
  if (type.startsWith("picking") || type.startsWith("shipment")) return "text-emerald-500";
  if (type.startsWith("recommendation") || type.startsWith("slotting")) return "text-purple-500";
  return "text-muted-foreground";
};

export default function WMSEventStream({ limit = 30 }: { limit?: number }) {
  const [events, setEvents] = useState<WmsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("wms_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    setEvents((data ?? []) as WmsEvent[]);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("wms_events_stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "wms_events" },
        (payload) => {
          setEvents((curr) => [payload.new as WmsEvent, ...curr].slice(0, limit));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, limit]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
          Stream de Eventos
          <Badge variant="outline" className="ml-2 text-xs">ao vivo</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Pulso unificado do armazém: recebimento, putaway, picking, movimentos e decisões da engine.
        </p>
      </CardHeader>
      <CardContent>
        <div role="status" aria-live="polite" className="sr-only">
          {loading ? "Carregando eventos" : `${events.length} eventos recentes`}
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Carregando…</div>
        ) : events.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Sem eventos recentes.
          </div>
        ) : (
          <ul role="list" className="space-y-1 max-h-[480px] overflow-y-auto">
            {events.map((e) => {
              const Icon = iconFor(e.event_type);
              const color = colorFor(e.event_type);
              const when = new Date(e.created_at).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
              return (
                <li
                  key={e.id}
                  role="listitem"
                  className="flex items-center gap-3 py-2 px-2 rounded hover:bg-accent/30 text-sm border-l-2 border-l-transparent hover:border-l-primary"
                >
                  <Icon className={`h-4 w-4 shrink-0 ${color}`} aria-hidden="true" />
                  <span className="font-mono text-xs text-muted-foreground shrink-0">{when}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {e.source_module ?? "wms"}
                  </Badge>
                  <span className="truncate flex-1">{e.event_type}</span>
                  {e.entity_type && (
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                      {e.entity_type}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
