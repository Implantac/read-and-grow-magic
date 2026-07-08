import { useSuccessData } from "./useSuccessData";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Progress } from "@/ui/base/progress";
import { Skeleton } from "@/ui/base/skeleton";
import {
  Heart, TrendingUp, TrendingDown, Wallet, Package, ShoppingCart,
  Users, AlertTriangle, Target, Sparkles, Lightbulb, Info, Zap,
  Snowflake, Truck, Layers, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function GradePill({ grade, score }: { grade: string; score: number }) {
  const color =
    grade === "A" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" :
    grade === "B" ? "bg-blue-500/15 text-blue-500 border-blue-500/30" :
    grade === "C" ? "bg-amber-500/15 text-amber-500 border-amber-500/30" :
    grade === "D" ? "bg-orange-500/15 text-orange-500 border-orange-500/30" :
    "bg-red-500/15 text-red-500 border-red-500/30";
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", color)}>
      <Heart className="h-3.5 w-3.5" />
      Grau {grade} · {score}/100
    </div>
  );
}

function RevenueBarChart({ data }: { data: Array<{ label: string; revenue: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <div className="flex h-[220px] items-end gap-2 px-1">
      {data.map((d, i) => {
        const h = (d.revenue / max) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5 group">
            <div className="text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              {(d.revenue / 1000).toFixed(0)}k
            </div>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-primary/80 to-primary transition-all hover:brightness-110"
              style={{ height: `${Math.max(h, 2)}%` }}
              title={brl(d.revenue)}
            />
            <span className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RecIcon({ icon }: { icon: "warning" | "opportunity" | "insight" | "alert" }) {
  if (icon === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  if (icon === "alert") return <AlertTriangle className="h-4 w-4 text-red-500" />;
  if (icon === "opportunity") return <Sparkles className="h-4 w-4 text-emerald-500" />;
  return <Lightbulb className="h-4 w-4 text-blue-500" />;
}

export default function SuccessDashboard() {
  const { data, isLoading } = useSuccessData();

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const {
    health, revenue12m, cashflow, slowMoving, topMargin, bestSellers,
    subcategoryStock, topSuppliers, topCustomers, inactiveTopCustomers,
    delinquents, monthGoal, recommendations, totals,
  } = data;
  const monthDelta = totals.revenuePrevMonth > 0
    ? ((totals.revenueMonth - totals.revenuePrevMonth) / totals.revenuePrevMonth) * 100
    : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Use Success</h1>
              <p className="text-sm text-muted-foreground">
                A visão do dono do negócio — saúde, resultados e ações da IA.
              </p>
            </div>
          </div>
        </div>
        <GradePill grade={health.grade} score={health.score} />
      </div>

      {/* Health Score Card + Month Goal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-4 w-4 text-primary" /> Saúde da empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold tabular-nums">{health.score}</span>
              <span className="text-lg text-muted-foreground">/100</span>
              <Badge variant="outline" className="ml-auto">{health.grade}</Badge>
            </div>
            <Progress value={health.score} className="h-2" />
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-lg border p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Financeiro</p>
                <p className="text-xl font-bold">{health.financial}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Operacional</p>
                <p className="text-xl font-bold">{health.operational}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Comercial</p>
                <p className="text-xl font-bold">{health.commercial}</p>
              </div>
            </div>

            {/* Detalhamento por pilar */}
            <div className="pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Como cada pilar contribui
                </p>
                <span className="text-[10px] text-muted-foreground">
                  Σ contribuições = {health.pillars.reduce((a, p) => a + p.contribution, 0).toFixed(1)} / 100
                </span>
              </div>
              <div className="space-y-2">
                {health.pillars.map((p) => {
                  const barColor =
                    p.status === "good" ? "bg-emerald-500"
                    : p.status === "warn" ? "bg-amber-500"
                    : "bg-red-500";
                  const dot =
                    p.status === "good" ? "bg-emerald-500"
                    : p.status === "warn" ? "bg-amber-500"
                    : "bg-red-500";
                  return (
                    <div key={p.key} className="rounded-lg border p-3 space-y-1.5 bg-card/40">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn("h-2 w-2 rounded-full shrink-0", dot)} />
                          <p className="text-sm font-semibold truncate">{p.label}</p>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            peso {Math.round(p.weight * 100)}%
                          </Badge>
                        </div>
                        <div className="flex items-baseline gap-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground">nota</span>
                          <span className="font-mono font-bold tabular-nums">{p.score}</span>
                          <span className="text-[10px] text-muted-foreground">→</span>
                          <span className="font-mono font-bold tabular-nums text-primary">
                            +{p.contribution.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full transition-all", barColor)}
                          style={{ width: `${Math.max(2, p.score)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{p.metricLabel}</span>
                        <span className="font-mono tabular-nums font-medium">{p.metricValue}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{p.explanation}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {health.drivers.map((d, i) => (
                <Badge key={i} variant="secondary" className="text-[11px] font-normal">
                  <Info className="h-3 w-3 mr-1" />{d}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" /> Meta do mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold tabular-nums">{brl(monthGoal.achieved)}</p>
              <p className="text-xs text-muted-foreground">de {brl(monthGoal.goal)}</p>
            </div>
            <Progress value={Math.min(100, monthGoal.pct)} className="h-2" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{monthGoal.pct.toFixed(1)}% atingido</span>
              <Badge variant={monthGoal.pct >= 100 ? "default" : monthGoal.pct >= 80 ? "secondary" : "outline"}>
                {monthGoal.pct >= 100 ? "Batida" : monthGoal.pct >= 80 ? "No caminho" : "Atenção"}
              </Badge>
            </div>
            <div className="pt-2 border-t">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Vs mês anterior</p>
              <div className={cn("text-sm font-semibold flex items-center gap-1",
                monthDelta >= 0 ? "text-emerald-500" : "text-red-500")}>
                {monthDelta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {monthDelta >= 0 ? "+" : ""}{monthDelta.toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Receita 12m</p>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <p className="text-xl font-bold tabular-nums">{brl(totals.revenueYTD)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Fluxo 90d</p>
              <Wallet className={cn("h-3.5 w-3.5", cashflow.net >= 0 ? "text-emerald-500" : "text-red-500")} />
            </div>
            <p className={cn("text-xl font-bold tabular-nums", cashflow.net < 0 && "text-red-500")}>
              {brl(cashflow.net)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Clientes ativos</p>
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-xl font-bold tabular-nums">{totals.activeCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Pedidos abertos</p>
              <ShoppingCart className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-xl font-bold tabular-nums">{totals.ordersOpen}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue chart + Cashflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" /> Faturamento últimos 12 meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueBarChart data={revenue12m} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary" /> Fluxo previsto 90d
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: "30 dias", inflow: cashflow.inflow_30, outflow: cashflow.outflow_30 },
              { label: "60 dias", inflow: cashflow.inflow_60, outflow: cashflow.outflow_60 },
              { label: "90 dias", inflow: cashflow.inflow_90, outflow: cashflow.outflow_90 },
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{row.label}</span>
                  <span className={cn("font-mono tabular-nums", (row.inflow - row.outflow) >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {brl(row.inflow - row.outflow)}
                  </span>
                </div>
                <div className="flex gap-1 h-1.5">
                  <div className="flex-1 rounded-full bg-emerald-500/20 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (row.inflow / Math.max(row.inflow, row.outflow, 1)) * 100)}%` }} />
                  </div>
                  <div className="flex-1 rounded-full bg-red-500/20 overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (row.outflow / Math.max(row.inflow, row.outflow, 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t text-xs space-y-1">
              <div className="flex justify-between text-red-500">
                <span>Inadimplência (AR)</span>
                <span className="font-mono">{brl(cashflow.overdue_ar)}</span>
              </div>
              <div className="flex justify-between text-amber-500">
                <span>Vencidos a pagar</span>
                <span className="font-mono">{brl(cashflow.overdue_ap)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products + Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Produtos sem giro (0 vendas em 90d, com estoque parado) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Snowflake className="h-4 w-4 text-amber-500" /> Produtos sem giro
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                {totals.stagnantSkuCount} SKUs · {brl(totals.stagnantCapital)}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">0 vendas nos últimos 90 dias · ordenado por capital imobilizado</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {slowMoving.length === 0 && <p className="text-sm text-muted-foreground">Todos os SKUs venderam nos últimos 90 dias. 🎉</p>}
            {slowMoving.map((p) => (
              <div key={p.product_code} className="flex items-center justify-between border-b last:border-0 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.product_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.product_code} · estoque {p.quantity.toLocaleString("pt-BR")} {p.unit} · margem {p.margin_pct}%
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-mono font-semibold text-amber-500">{brl(p.capital_locked)}</p>
                  <p className="text-[10px] text-muted-foreground">capital parado</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top margem (peso × qtd vendida) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-emerald-500" /> Produtos com maior margem
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">Ranking por lucro real gerado (margem × vendas 90d)</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {topMargin.length === 0 && <p className="text-sm text-muted-foreground">Sem vendas nos últimos 90 dias.</p>}
            {topMargin.map((p) => (
              <div key={p.product_code} className="flex items-center justify-between border-b last:border-0 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.product_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.product_code} · vendeu {p.sold_last_90d} un · {brl(p.revenue_last_90d)}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-mono font-semibold text-emerald-500">{p.margin_pct}%</p>
                  <p className="text-[10px] text-muted-foreground">margem</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Best sellers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4 text-red-500" /> Mais vendidos (90d)
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">Produtos que puxam o faturamento</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {bestSellers.length === 0 && <p className="text-sm text-muted-foreground">Sem vendas.</p>}
            {bestSellers.map((p) => (
              <div key={p.product_code} className="flex items-center justify-between border-b last:border-0 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.product_name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.product_code} · {p.sold_last_90d} un vendidas</p>
                </div>
                <p className="font-mono font-semibold text-right shrink-0 ml-3">{brl(p.revenue_last_90d)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Estoque por família (subcategoria) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-primary" /> Estoque por família
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">Giro e estagnação por categoria de confecção</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {subcategoryStock.slice(0, 6).map((s) => (
              <div key={s.subcategory} className="border-b last:border-0 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium">{s.subcategory}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{brl(s.capital_locked)}</p>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{s.skus} SKUs · {s.stock_qty.toLocaleString("pt-BR")} un · vendeu {s.sold_90d}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-mono",
                      s.stagnation_pct >= 40 ? "border-amber-500/40 text-amber-500" :
                      s.stagnation_pct >= 20 ? "border-blue-500/40 text-blue-500" :
                      "border-emerald-500/40 text-emerald-500"
                    )}
                  >
                    {s.stagnation_pct}% parado
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Melhores clientes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" /> Melhores clientes
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">Volume de compra nos últimos 12 meses</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {topCustomers.map((c) => {
              const inactive = (c.last_purchase_days ?? 0) > 60;
              return (
                <div key={c.client_id ?? c.client_name} className="flex items-center justify-between border-b last:border-0 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.client_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {c.orders} pedido(s)
                      {c.last_purchase_days != null && (
                        <span className={cn(" · ", inactive ? "text-amber-500" : "text-muted-foreground")}>
                          {inactive ? `⚠ ${c.last_purchase_days}d sem comprar` : `há ${c.last_purchase_days}d`}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="font-mono font-semibold text-right shrink-0 ml-3">{brl(c.total)}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Fornecedores + economia potencial */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4 text-primary" /> Top fornecedores (90d)
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">Concentração de compras · economia potencial renegociando 5%</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {topSuppliers.length === 0 && <p className="text-sm text-muted-foreground">Sem ordens de compra nos últimos 90d.</p>}
            {topSuppliers.map((s) => (
              <div key={s.supplier_name} className="border-b last:border-0 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium">{s.supplier_name}</p>
                  <p className="font-mono font-semibold">{brl(s.spend_90d)}</p>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{s.orders} pedido(s) · {s.share_pct}% do total</span>
                  <span className="text-emerald-500">Economia ≈ {brl(s.potential_savings)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Clientes inadimplentes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Clientes inadimplentes
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">Contas vencidas · priorize acima de 30 dias</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {delinquents.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum vencido. 🎉</p>
            )}
            {delinquents.map((d, i) => (
              <div key={i} className="flex items-center justify-between border-b last:border-0 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{d.client_name}</p>
                  <p className="text-[11px] text-muted-foreground">{d.invoice} · {d.days_overdue}d atraso</p>
                </div>
                <p className="font-mono font-semibold text-red-500 text-right shrink-0 ml-3">{brl(d.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>


      {/* AI Recommendations */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-md bg-primary/15">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            Recomendações da IA
            <Badge variant="outline" className="ml-2 text-[10px]">{recommendations.length} ações</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommendations.map((r) => (
            <div key={r.id} className="rounded-lg border bg-card p-3 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0"><RecIcon icon={r.icon} /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.detail}</p>
                  {r.impact && (
                    <p className="text-[11px] text-primary/80 mt-2 font-medium">{r.impact}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
