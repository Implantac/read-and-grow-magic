import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { EmptyState } from "@/shared/components/EmptyState";
import { MapPin } from "lucide-react";

interface LocationRow {
  id: string;
  code: string;
  zone: string | null;
  aisle: string | null;
  rack: string | null;
  level: string | null;
  position: string | null;
  capacity: number | null;
  occupied: number | null;
  active: boolean | null;
  abc_class: string | null;
}

interface MovementRow {
  to_location: string | null;
  created_at: string;
}

interface RecommendationPin {
  id: string;
  type: string;
  severity: string;
  title: string;
  location?: string;
}

type Layer = "occupancy" | "congestion" | "abc" | "recommendations";

const LAYERS: { key: Layer; label: string; shortcut: string }[] = [
  { key: "occupancy", label: "Ocupação", shortcut: "1" },
  { key: "congestion", label: "Congestionamento (1h)", shortcut: "2" },
  { key: "abc", label: "Classe ABC", shortcut: "3" },
  { key: "recommendations", label: "Recomendações", shortcut: "4" },
];

function heatColor(pct: number) {
  if (pct >= 95) return "#dc2626";
  if (pct >= 80) return "#f59e0b";
  if (pct >= 50) return "#10b981";
  if (pct > 0) return "#3b82f6";
  return "#1f2937";
}

function congestionColor(n: number) {
  if (n >= 30) return "#dc2626";
  if (n >= 15) return "#f59e0b";
  if (n >= 5) return "#10b981";
  if (n > 0) return "#3b82f6";
  return "#1f2937";
}

function abcColor(c: string | null) {
  if (c === "A") return "#facc15";
  if (c === "B") return "#10b981";
  if (c === "C") return "#3b82f6";
  return "#1f2937";
}

export default function WarehouseMap() {
  const [locs, setLocs] = useState<LocationRow[]>([]);
  const [moves, setMoves] = useState<MovementRow[]>([]);
  const [recs, setRecs] = useState<RecommendationPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<LocationRow | null>(null);
  const [layer, setLayer] = useState<Layer>("occupancy");

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 3600000).toISOString();
      const [{ data: l }, { data: m }, { data: r }] = await Promise.all([
        supabase
          .from("wms_storage_locations")
          .select("id, code, zone, aisle, rack, level, position, capacity, occupied, active, abc_class")
          .eq("active", true)
          .limit(2000),
        supabase
          .from("wms_movements")
          .select("to_location, created_at")
          .gte("created_at", since)
          .not("to_location", "is", null)
          .limit(5000),
        supabase
          .from("wms_recommendations")
          .select("id, type, severity, title, evidence")
          .eq("status", "open")
          .limit(200),
      ]);
      setLocs((l ?? []) as LocationRow[]);
      setMoves((m ?? []) as MovementRow[]);
      setRecs(
        ((r ?? []) as any[]).map((row) => ({
          id: row.id,
          type: row.type,
          severity: row.severity,
          title: row.title,
          location: row.evidence?.location ?? row.evidence?.zone,
        })),
      );
      setLoading(false);
    })();
  }, []);

  const congestionByLoc = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of moves) {
      if (!m.to_location) continue;
      c[m.to_location] = (c[m.to_location] ?? 0) + 1;
    }
    return c;
  }, [moves]);

  const recsByLoc = useMemo(() => {
    const c: Record<string, RecommendationPin[]> = {};
    for (const r of recs) {
      if (!r.location) continue;
      (c[r.location] ||= []).push(r);
    }
    return c;
  }, [recs]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    const map: Record<string, Layer> = { "1": "occupancy", "2": "congestion", "3": "abc", "4": "recommendations" };
    if (map[e.key]) setLayer(map[e.key]);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const grid = useMemo(() => {
    const aisles = [...new Set(locs.map((l) => l.aisle ?? "?"))].sort();
    const racks = [...new Set(locs.map((l) => l.rack ?? "?"))].sort();
    const aisleIdx: Record<string, number> = {};
    aisles.forEach((a, i) => (aisleIdx[a] = i));
    const rackIdx: Record<string, number> = {};
    racks.forEach((r, i) => (rackIdx[r] = i));
    return { aisles, racks, aisleIdx, rackIdx };
  }, [locs]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">Carregando mapa…</CardContent>
      </Card>
    );
  }

  if (locs.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={MapPin}
            title="Nenhum endereço cadastrado"
            description="Configure endereços de armazenagem para renderizar o mapa do CD."
          />
        </CardContent>
      </Card>
    );
  }

  const cell = 28;
  const padding = 60;
  const width = grid.aisles.length * cell + padding * 2;
  const height = grid.racks.length * cell + padding * 2;

  const legend =
    layer === "occupancy"
      ? [
          { c: "#1f2937", l: "Vazio" },
          { c: "#3b82f6", l: "<50%" },
          { c: "#10b981", l: "50–80%" },
          { c: "#f59e0b", l: "80–95%" },
          { c: "#dc2626", l: ">95%" },
        ]
      : layer === "congestion"
      ? [
          { c: "#1f2937", l: "0 mov/h" },
          { c: "#3b82f6", l: "1–4" },
          { c: "#10b981", l: "5–14" },
          { c: "#f59e0b", l: "15–29" },
          { c: "#dc2626", l: "≥30" },
        ]
      : layer === "abc"
      ? [
          { c: "#facc15", l: "A" },
          { c: "#10b981", l: "B" },
          { c: "#3b82f6", l: "C" },
          { c: "#1f2937", l: "—" },
        ]
      : [{ c: "#dc2626", l: "Recomendação ativa" }];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Digital Twin — Mapa do Armazém</CardTitle>
            <p className="text-xs text-muted-foreground">
              Camadas alternáveis. Atalhos: 1 ocupação · 2 congestionamento · 3 ABC · 4 recomendações.
            </p>
          </div>
          <div className="flex gap-1 flex-wrap" role="tablist" aria-label="Camadas do Digital Twin">
            {LAYERS.map((lyr) => (
              <Button
                key={lyr.key}
                size="sm"
                variant={layer === lyr.key ? "default" : "outline"}
                role="tab"
                aria-selected={layer === lyr.key}
                aria-label={`Camada ${lyr.label}, atalho ${lyr.shortcut}`}
                onClick={() => setLayer(lyr.key)}
              >
                <span className="text-[10px] opacity-60 mr-1">{lyr.shortcut}</span>
                {lyr.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 text-xs items-center mb-3 flex-wrap" aria-label="Legenda">
          {legend.map((s) => (
            <span key={s.l} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: s.c }} aria-hidden="true" />
              {s.l}
            </span>
          ))}
        </div>
        <div className="overflow-auto border rounded-md bg-slate-950/40">
          <svg width={width} height={height} role="img" aria-label={`Mapa do armazém — camada ${layer}`}>
            {grid.aisles.map((a, i) => (
              <text key={`a-${a}`} x={padding + i * cell + cell / 2} y={padding - 8} fill="#94a3b8" fontSize={10} textAnchor="middle">
                {a}
              </text>
            ))}
            {grid.racks.map((r, j) => (
              <text key={`r-${r}`} x={padding - 8} y={padding + j * cell + cell / 2 + 3} fill="#94a3b8" fontSize={10} textAnchor="end">
                {r}
              </text>
            ))}
            {locs.map((l) => {
              const x = padding + (grid.aisleIdx[l.aisle ?? "?"] ?? 0) * cell;
              const y = padding + (grid.rackIdx[l.rack ?? "?"] ?? 0) * cell;
              const pct = l.capacity && l.capacity > 0 ? Math.min(100, ((l.occupied ?? 0) / l.capacity) * 100) : 0;
              const movN = congestionByLoc[l.code] ?? 0;
              const hasRec = !!recsByLoc[l.code]?.length;
              let fill = "#1f2937";
              if (layer === "occupancy") fill = heatColor(pct);
              else if (layer === "congestion") fill = congestionColor(movN);
              else if (layer === "abc") fill = abcColor(l.abc_class);
              else if (layer === "recommendations") fill = hasRec ? "#dc2626" : "#1f2937";
              return (
                <g key={l.id}>
                  <rect
                    x={x + 2}
                    y={y + 2}
                    width={cell - 4}
                    height={cell - 4}
                    rx={3}
                    fill={fill}
                    stroke={l.abc_class === "A" && layer !== "abc" ? "#facc15" : "transparent"}
                    strokeWidth={l.abc_class === "A" && layer !== "abc" ? 1.5 : 0}
                    onMouseEnter={() => setHover(l)}
                    onMouseLeave={() => setHover(null)}
                    style={{ cursor: "pointer", opacity: 0.9 }}
                  >
                    <title>
                      {`${l.code} • ocup ${pct.toFixed(0)}% • ${movN} mov/h${hasRec ? " • recomendação" : ""}`}
                    </title>
                  </rect>
                  {hasRec && layer === "recommendations" && (
                    <circle cx={x + cell - 4} cy={y + 4} r={3} fill="#fbbf24" stroke="#7c2d12" strokeWidth={0.5}>
                      <title>{recsByLoc[l.code].map((r) => r.title).join("\n")}</title>
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        {hover && (
          <div className="mt-3 text-sm" role="status" aria-live="polite">
            <strong>{hover.code}</strong> — Zona {hover.zone ?? "—"} • Classe {hover.abc_class ?? "—"} •{" "}
            Ocupado {hover.occupied ?? 0}/{hover.capacity ?? 0} • {congestionByLoc[hover.code] ?? 0} mov/h
            {recsByLoc[hover.code]?.length ? ` • ${recsByLoc[hover.code].length} recomendação(ões)` : ""}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
