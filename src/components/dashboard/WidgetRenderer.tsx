import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Skeleton } from "@/ui/base/skeleton";
import { Alert, AlertDescription } from "@/ui/base/alert";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { DashboardWidget } from "@/hooks/useDashboardEngine";

const COLORS = ["#FF9800", "#1A2234", "#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#06b6d4", "#eab308"];

function formatValue(v: number, format?: string) {
  if (format === "currency") {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  }
  return new Intl.NumberFormat("pt-BR").format(v);
}

export function WidgetRenderer({ widget }: { widget: DashboardWidget }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["widget-data", widget.id, widget.data_source],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dashboard-widget-data", {
        body: { data_source: widget.data_source, config: widget.config ?? {} },
      });
      if (error) throw error;
      return data as { type: string; data: any };
    },
    staleTime: 60_000,
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{(error as Error).message}</AlertDescription>
          </Alert>
        ) : !data ? (
          <p className="text-xs text-muted-foreground">Sem dados.</p>
        ) : (
          <RenderByType type={data.type} payload={data.data} widget={widget} />
        )}
      </CardContent>
    </Card>
  );
}

function RenderByType({ type, payload, widget }: { type: string; payload: any; widget: DashboardWidget }) {
  if (type === "scalar") {
    return (
      <div className="text-3xl font-bold">
        {formatValue(Number(payload?.value ?? 0), payload?.format)}
      </div>
    );
  }
  if (type === "series") {
    const Chart = widget.widget_type === "bar" ? BarChart : LineChart;
    const Bars = widget.widget_type === "bar" ? Bar : Line;
    return (
      <ResponsiveContainer width="100%" height={220}>
        <Chart data={payload}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" fontSize={11} />
          <YAxis fontSize={11} />
          <Tooltip />
          <Bars type="monotone" dataKey="value" stroke="#FF9800" fill="#FF9800" />
        </Chart>
      </ResponsiveContainer>
    );
  }
  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={payload} dataKey="value" nameKey="name" outerRadius={80} label>
            {(payload as any[]).map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  if (type === "table") {
    const rows = (payload as any[]) ?? [];
    if (!rows.length) return <p className="text-xs text-muted-foreground">Sem dados.</p>;
    const cols = Object.keys(rows[0]);
    return (
      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              {cols.map((c) => <th key={c} className="text-left p-1 font-medium">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b last:border-0">
                {cols.map((c) => <td key={c} className="p-1">{String(r[c] ?? "")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return <pre className="text-xs">{JSON.stringify(payload, null, 2)}</pre>;
}
