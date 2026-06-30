import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";

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

function heatColor(pct: number) {
  if (pct >= 95) return "#dc2626";
  if (pct >= 80) return "#f59e0b";
  if (pct >= 50) return "#10b981";
  if (pct > 0) return "#3b82f6";
  return "#1f2937";
}

export default function WarehouseMap() {
  const [locs, setLocs] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<LocationRow | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("wms_storage_locations")
        .select("id, code, zone, aisle, rack, level, position, capacity, occupied, active, abc_class")
        .eq("active", true)
        .limit(2000);
      setLocs((data ?? []) as LocationRow[]);
      setLoading(false);
    })();
  }, []);

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
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum endereço cadastrado em wms_storage_locations.
        </CardContent>
      </Card>
    );
  }

  const cell = 28;
  const padding = 60;
  const width = grid.aisles.length * cell + padding * 2;
  const height = grid.racks.length * cell + padding * 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Digital Twin — Mapa do Armazém</CardTitle>
        <p className="text-xs text-muted-foreground">
          Heatmap de ocupação por endereço. Hover para detalhes.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 text-xs items-center mb-3" aria-label="Legenda de ocupação">
          {[
            { c: "#1f2937", l: "Vazio" },
            { c: "#3b82f6", l: "<50%" },
            { c: "#10b981", l: "50–80%" },
            { c: "#f59e0b", l: "80–95%" },
            { c: "#dc2626", l: ">95%" },
          ].map((s) => (
            <span key={s.l} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: s.c }} aria-hidden="true" />
              {s.l}
            </span>
          ))}
        </div>
        <div className="overflow-auto border rounded-md bg-slate-950/40">
          <svg width={width} height={height} role="img" aria-label="Mapa de calor de ocupação do armazém">
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
              return (
                <rect
                  key={l.id}
                  x={x + 2}
                  y={y + 2}
                  width={cell - 4}
                  height={cell - 4}
                  rx={3}
                  fill={heatColor(pct)}
                  stroke={l.abc_class === "A" ? "#facc15" : "transparent"}
                  strokeWidth={l.abc_class === "A" ? 1.5 : 0}
                  onMouseEnter={() => setHover(l)}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer", opacity: 0.9 }}
                >
                  <title>{`${l.code} • ${pct.toFixed(0)}%`}</title>
                </rect>
              );
            })}
          </svg>
        </div>
        {hover && (
          <div className="mt-3 text-sm" role="status" aria-live="polite">
            <strong>{hover.code}</strong> — Zona {hover.zone ?? "—"} • Classe {hover.abc_class ?? "—"} •{" "}
            Ocupado {hover.occupied ?? 0}/{hover.capacity ?? 0}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
