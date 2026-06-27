import { useMemo } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { KPICard } from "@/shared/components/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { Badge } from "@/ui/base/badge";
import { Skeleton } from "@/ui/base/skeleton";
import { Activity, Coins, Receipt, TrendingUp } from "lucide-react";
const formatCurrencyPtBr = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
import {
  useBillingMeters,
  useCurrentUsageSummary,
  useRecentUsageEvents,
  useDailyUsageSeries,
} from "@/hooks/useBillingUsage";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function BillingUsage() {
  const meters = useBillingMeters();
  const summary = useCurrentUsageSummary();
  const events = useRecentUsageEvents(100);
  const daily = useDailyUsageSeries();

  const palette = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "#10b981",
    "#f59e0b",
    "#6366f1",
    "#ec4899",
    "#14b8a6",
    "#ef4444",
  ];

  const totalMonth = useMemo(
    () => (summary.data ?? []).reduce((acc, r) => acc + Number(r.total_amount || 0), 0),
    [summary.data],
  );
  const totalEvents = useMemo(
    () => (summary.data ?? []).reduce((acc, r) => acc + Number(r.total_quantity || 0), 0),
    [summary.data],
  );

  const bySource = useMemo(() => {
    const map = new Map<string, { source: string; quantity: number; amount: number; events: number }>();
    for (const e of events.data ?? []) {
      const key = e.source ?? "manual";
      const row = map.get(key) ?? { source: key, quantity: 0, amount: 0, events: 0 };
      row.quantity += Number(e.quantity || 0);
      row.amount += Number(e.amount || 0);
      row.events += 1;
      map.set(key, row);
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [events.data]);

  return (
    <PageContainer>
      <PageHeader
        title="Consumo & Billing"
        description="Acompanhe o consumo do mês corrente por métrica e o custo estimado."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total estimado do mês"
          value={formatCurrencyPtBr(totalMonth)}
          icon={Coins}
        />
        <KPICard
          title="Eventos consumidos"
          value={totalEvents.toLocaleString("pt-BR")}
          icon={Activity}
        />
        <KPICard
          title="Métricas ativas"
          value={(meters.data?.length ?? 0).toString()}
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Consumo diário por métrica (mês corrente)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {daily.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !daily.data || daily.data.points.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem eventos suficientes para gerar o gráfico.
            </p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily.data.points}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(v: string) => v.slice(8, 10)}
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)
                    }
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrencyPtBr(Number(value))}
                    labelFormatter={(label: string) =>
                      new Date(label).toLocaleDateString("pt-BR")
                    }
                  />
                  <Legend />
                  {daily.data.meters.map((m, i) => (
                    <Area
                      key={m}
                      type="monotone"
                      dataKey={m}
                      stackId="1"
                      stroke={palette[i % palette.length]}
                      fill={palette[i % palette.length]}
                      fillOpacity={0.35}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" /> Resumo por métrica (mês corrente)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (summary.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum consumo registrado neste mês.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Métrica</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Valor estimado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(summary.data ?? []).map((r) => (
                  <TableRow key={r.meter_key}>
                    <TableCell className="font-medium">{r.meter_name}</TableCell>
                    <TableCell className="text-right">
                      {Number(r.total_quantity).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyPtBr(Number(r.total_amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de métricas</CardTitle>
        </CardHeader>
        <CardContent>
          {meters.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Métrica</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Preço unitário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(meters.data ?? []).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.unit}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyPtBr(Number(m.unit_price))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimos eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {events.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (events.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem eventos registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Métrica</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(events.data ?? []).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs">
                      {new Date(e.occurred_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>{e.meter_key}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.source ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(e.quantity).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyPtBr(Number(e.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
