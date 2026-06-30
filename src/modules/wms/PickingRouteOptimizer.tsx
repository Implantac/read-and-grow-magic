import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/base/table";
import { useToast } from "@/ui/base/use-toast";
import { Route, Save, Zap } from "lucide-react";

interface PickingOrder {
  id: string;
  order_number: string;
  customer_name: string | null;
  status: string;
  items_count: number | null;
}
interface PickingItem {
  id: string;
  product_code: string;
  product_name: string;
  location: string | null;
  requested_qty: number;
  picked: boolean;
}
interface LocationRow {
  code: string;
  aisle: string | null;
  rack: string | null;
  level: string | null;
}

// Parse alphanumeric to numeric coordinate
const toNum = (v: string | null | undefined): number => {
  if (!v) return 0;
  const n = parseInt(v.replace(/\D/g, ""), 10);
  if (!Number.isNaN(n)) return n;
  return v.toUpperCase().charCodeAt(0) - 64;
};

// Euclidean distance between two locations
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

// Nearest-neighbor TSP from origin (0,0)
function optimize<T extends { x: number; y: number }>(points: T[]): T[] {
  const remaining = [...points];
  const out: T[] = [];
  let cur = { x: 0, y: 0 };
  while (remaining.length) {
    let best = 0;
    let bestD = Infinity;
    remaining.forEach((p, i) => {
      const d = dist(cur, p);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const next = remaining.splice(best, 1)[0];
    out.push(next);
    cur = next;
  }
  return out;
}

export default function PickingRouteOptimizer() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<PickingOrder[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [items, setItems] = useState<PickingItem[]>([]);
  const [locs, setLocs] = useState<Record<string, LocationRow>>({});
  const [loading, setLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("wms_picking_orders")
      .select("id, order_number, customer_name, status, items_count")
      .in("status", ["pending", "in_progress", "assigned"])
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setOrders((data || []) as PickingOrder[]);
  }, [toast]);

  const loadOrder = useCallback(
    async (orderId: string) => {
      if (!orderId) return;
      setLoading(true);
      const { data: itm, error: e1 } = await supabase
        .from("wms_picking_items")
        .select("id, product_code, product_name, location, requested_qty, picked")
        .eq("picking_order_id", orderId);
      if (e1) {
        toast({ title: "Erro itens", description: e1.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      const codes = (itm || []).map((i) => i.location).filter(Boolean) as string[];
      let map: Record<string, LocationRow> = {};
      if (codes.length) {
        const { data: locRows } = await supabase
          .from("warehouse_locations")
          .select("code, aisle, rack, level")
          .in("code", codes);
        map = Object.fromEntries((locRows || []).map((l) => [l.code, l as LocationRow]));
      }
      setItems((itm || []) as PickingItem[]);
      setLocs(map);
      setLoading(false);
    },
    [toast],
  );

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);
  useEffect(() => {
    if (selected) void loadOrder(selected);
  }, [selected, loadOrder]);

  const route = useMemo(() => {
    const pts = items
      .filter((i) => i.location && locs[i.location])
      .map((i) => {
        const l = locs[i.location!];
        return {
          item: i,
          x: toNum(l.aisle),
          y: toNum(l.rack) * 2 + toNum(l.level) * 0.2,
        };
      });
    return optimize(pts);
  }, [items, locs]);

  const totalDistance = useMemo(() => {
    let d = 0;
    let prev = { x: 0, y: 0 };
    route.forEach((p) => {
      d += dist(prev, p);
      prev = p;
    });
    return d;
  }, [route]);

  const saveSequence = async () => {
    if (!selected || !route.length) return;
    const sequence = route.map((r, idx) => ({
      seq: idx + 1,
      item_id: r.item.id,
      location: r.item.location,
    }));
    const { error } = await supabase
      .from("wms_picking_orders")
      .update({ route_sequence: sequence, picking_strategy: "optimized_nn" })
      .eq("id", selected);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Rota otimizada salva", description: `${sequence.length} paradas` });
  };

  // SVG layout
  const W = 800;
  const H = 400;
  const maxX = Math.max(1, ...route.map((r) => r.x));
  const maxY = Math.max(1, ...route.map((r) => r.y));
  const sx = (x: number) => 40 + (x / maxX) * (W - 80);
  const sy = (y: number) => 40 + (y / maxY) * (H - 80);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Route className="h-6 w-6" /> Rota de Picking Otimizada
          </h1>
          <p className="text-sm text-muted-foreground">
            Algoritmo nearest-neighbor sobre coordenadas de corredor/rack/nível.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecionar pedido de picking" />
            </SelectTrigger>
            <SelectContent>
              {orders.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.order_number} — {o.customer_name || "—"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={saveSequence} disabled={!route.length}>
            <Save className="h-4 w-4 mr-2" /> Salvar sequência
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Itens</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{route.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Distância total</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-primary">
            {totalDistance.toFixed(1)} u
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Estratégia</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" /> Nearest Neighbor
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mapa da rota</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : route.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Selecione um pedido para visualizar a rota.
            </p>
          ) : (
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full border rounded bg-muted/20"
              role="img"
              aria-label="Mapa da rota de picking"
            >
              <circle cx={sx(0)} cy={sy(0)} r={8} fill="#10b981" />
              <text x={sx(0) + 12} y={sy(0) + 4} className="fill-foreground text-xs">
                Doca
              </text>
              <polyline
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="4 2"
                points={[
                  `${sx(0)},${sy(0)}`,
                  ...route.map((r) => `${sx(r.x)},${sy(r.y)}`),
                ].join(" ")}
              />
              {route.map((r, i) => (
                <g key={r.item.id}>
                  <circle cx={sx(r.x)} cy={sy(r.y)} r={10} fill="hsl(var(--primary))" />
                  <text
                    x={sx(r.x)}
                    y={sy(r.y) + 4}
                    textAnchor="middle"
                    className="fill-primary-foreground text-[10px] font-bold"
                  >
                    {i + 1}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sequência sugerida</CardTitle>
        </CardHeader>
        <CardContent>
          {route.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {route.map((r, i) => (
                  <TableRow key={r.item.id}>
                    <TableCell className="font-bold">{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{r.item.location}</TableCell>
                    <TableCell>
                      {r.item.product_code} — {r.item.product_name}
                    </TableCell>
                    <TableCell>{r.item.requested_qty}</TableCell>
                    <TableCell>
                      <Badge variant={r.item.picked ? "default" : "secondary"}>
                        {r.item.picked ? "Coletado" : "Pendente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
