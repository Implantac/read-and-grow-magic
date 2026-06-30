import { useEffect, useState } from "react";
import { Card, CardContent } from "@/ui/base/card";
import { supabase } from "@/integrations/supabase/client";
import { Activity, PackageCheck, Truck, Boxes, Clock, AlertCircle } from "lucide-react";

interface Kpis {
  dock_to_stock_hours: number | null;
  picking_accuracy_pct: number | null;
  inventory_accuracy_pct: number | null;
  otif_pct: number | null;
  open_recommendations: number;
  occupancy_by_zone: { zone: string; pct: number }[];
}

export default function WMSKpiStrip({ days = 7 }: { days?: number }) {
  const [data, setData] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data: res, error: err } = await supabase.rpc("get_wms_kpis", { _days: days });
      if (!alive) return;
      if (err) setError(err.message);
      else setData(res as unknown as Kpis);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [days]);

  const fmt = (v: number | null, suf = "") => (v == null ? "—" : `${v}${suf}`);

  const items = [
    { icon: Clock, label: "Dock-to-Stock", value: fmt(data?.dock_to_stock_hours ?? null, "h"), color: "border-l-blue-500" },
    { icon: PackageCheck, label: "Picking Accuracy", value: fmt(data?.picking_accuracy_pct ?? null, "%"), color: "border-l-emerald-500" },
    { icon: Boxes, label: "Inventory Accuracy", value: fmt(data?.inventory_accuracy_pct ?? null, "%"), color: "border-l-purple-500" },
    { icon: Truck, label: "OTIF", value: fmt(data?.otif_pct ?? null, "%"), color: "border-l-amber-500" },
    {
      icon: Activity,
      label: "Ocupação média",
      value:
        data?.occupancy_by_zone?.length
          ? `${(data.occupancy_by_zone.reduce((a, z) => a + z.pct, 0) / data.occupancy_by_zone.length).toFixed(1)}%`
          : "—",
      color: "border-l-cyan-500",
    },
    {
      icon: AlertCircle,
      label: "Recomendações abertas",
      value: data?.open_recommendations ?? 0,
      color: "border-l-orange-500",
    },
  ];

  return (
    <section aria-label="Indicadores WMS" className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card key={it.label} className={`border-l-4 ${it.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{it.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="text-xl font-bold" aria-live="polite">
                {loading ? "…" : it.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
      {error && (
        <div role="alert" className="col-span-full text-xs text-destructive">
          Falha ao carregar KPIs: {error}
        </div>
      )}
    </section>
  );
}
