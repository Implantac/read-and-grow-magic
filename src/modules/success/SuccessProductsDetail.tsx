import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSuccessData, type SuccessProductInsight } from "./useSuccessData";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Skeleton } from "@/ui/base/skeleton";
import {
  ArrowLeft, Snowflake, Flame, Search, Package, Clock, TrendingUp, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

type DetailType = "sem-giro" | "mais-vendidos";

const CONFIG: Record<DetailType, {
  title: string;
  subtitle: string;
  icon: JSX.Element;
  emptyMsg: string;
  accent: string;
}> = {
  "sem-giro": {
    title: "Produtos sem giro",
    subtitle: "SKUs com estoque parado nos últimos 90 dias, ordenados por capital imobilizado.",
    icon: <Snowflake className="h-5 w-5 text-amber-500" />,
    emptyMsg: "Todos os SKUs venderam nos últimos 90 dias. 🎉",
    accent: "text-amber-500",
  },
  "mais-vendidos": {
    title: "Mais vendidos (90 dias)",
    subtitle: "SKUs que mais geraram faturamento nos últimos 90 dias.",
    icon: <Flame className="h-5 w-5 text-red-500" />,
    emptyMsg: "Sem vendas registradas nos últimos 90 dias.",
    accent: "text-red-500",
  },
};

function ReasonBadges({ reasons }: { reasons: string[] }) {
  if (!reasons.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {reasons.map((r, i) => (
        <Badge key={i} variant="outline" className="text-[10px] font-normal">
          {r}
        </Badge>
      ))}
    </div>
  );
}

function DaysBadge({ days }: { days: number | null }) {
  if (days === null) {
    return (
      <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-500 bg-red-500/10">
        <Clock className="h-3 w-3 mr-1" /> +365d sem vender
      </Badge>
    );
  }
  const cls =
    days >= 180 ? "border-red-500/40 text-red-500 bg-red-500/10"
    : days >= 90 ? "border-amber-500/40 text-amber-500 bg-amber-500/10"
    : days >= 30 ? "border-blue-500/40 text-blue-500 bg-blue-500/10"
    : "border-emerald-500/40 text-emerald-500 bg-emerald-500/10";
  return (
    <Badge variant="outline" className={cn("text-[10px]", cls)}>
      <Clock className="h-3 w-3 mr-1" /> {days}d sem vender
    </Badge>
  );
}

export default function SuccessProductsDetail() {
  const { type } = useParams<{ type: DetailType }>();
  const navigate = useNavigate();
  const { data, isLoading } = useSuccessData();
  const [q, setQ] = useState("");

  const kind: DetailType = type === "mais-vendidos" ? "mais-vendidos" : "sem-giro";
  const cfg = CONFIG[kind];

  const list: SuccessProductInsight[] = useMemo(() => {
    if (!data) return [];
    if (kind === "sem-giro") {
      return data.allProductInsights
        .filter((p) => p.quantity > 0 && p.sold_last_90d === 0)
        .sort((a, b) => b.capital_locked - a.capital_locked);
    }
    return data.allProductInsights
      .filter((p) => p.sold_last_90d > 0)
      .sort((a, b) => b.revenue_last_90d - a.revenue_last_90d);
  }, [data, kind]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (p) =>
        p.product_name.toLowerCase().includes(term) ||
        p.product_code.toLowerCase().includes(term) ||
        (p.subcategory ?? "").toLowerCase().includes(term),
    );
  }, [list, q]);

  const totalCapital = filtered.reduce((a, p) => a + p.capital_locked, 0);
  const totalRevenue = filtered.reduce((a, p) => a + p.revenue_last_90d, 0);
  const totalUnits = filtered.reduce((a, p) => a + p.sold_last_90d, 0);

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="shrink-0 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-muted border shrink-0">{cfg.icon}</div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{cfg.title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">{cfg.subtitle}</p>
            </div>
          </div>
        </div>
        <Link
          to={kind === "sem-giro" ? "/success/produtos/mais-vendidos" : "/success/produtos/sem-giro"}
          className="text-xs text-primary hover:underline shrink-0"
        >
          {kind === "sem-giro" ? "Ver mais vendidos →" : "Ver produtos sem giro →"}
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">SKUs listados</p>
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold tabular-nums">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">
                {kind === "sem-giro" ? "Capital imobilizado" : "Receita 90d"}
              </p>
              <TrendingUp className={cn("h-3.5 w-3.5", cfg.accent)} />
            </div>
            <p className={cn("text-xl font-bold tabular-nums", cfg.accent)}>
              {brl(kind === "sem-giro" ? totalCapital : totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">
                {kind === "sem-giro" ? "Estoque parado (un)" : "Unidades vendidas"}
              </p>
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold tabular-nums">
              {(kind === "sem-giro"
                ? filtered.reduce((a, p) => a + p.quantity, 0)
                : totalUnits
              ).toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Margem média</p>
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold tabular-nums">
              {filtered.length
                ? (filtered.reduce((a, p) => a + p.margin_pct, 0) / filtered.length).toFixed(1)
                : "0"}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, código ou família…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {cfg.icon} Lista detalhada
            <Badge variant="outline" className="ml-2 text-[10px]">{filtered.length} SKUs</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">{cfg.emptyMsg}</p>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="md:hidden divide-y">
                {filtered.map((p) => (
                  <div key={p.product_code} className="p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{p.product_name}</p>
                        <p className="text-[11px] text-muted-foreground">{p.product_code}</p>
                      </div>
                      <p className={cn("font-mono font-semibold text-sm shrink-0", cfg.accent)}>
                        {brl(kind === "sem-giro" ? p.capital_locked : p.revenue_last_90d)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      <span>Est: {p.quantity.toLocaleString("pt-BR")} {p.unit}</span>
                      <span>· Vendido 90d: {p.sold_last_90d}</span>
                      <span>· Margem: {p.margin_pct}%</span>
                    </div>
                    <DaysBadge days={p.days_since_last_sale} />
                    <ReasonBadges reasons={p.reasons} />
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr className="text-left text-[11px] uppercase text-muted-foreground">
                      <th className="px-4 py-2 font-semibold">Produto</th>
                      <th className="px-4 py-2 font-semibold text-right">Estoque</th>
                      <th className="px-4 py-2 font-semibold text-right">Vendido 90d</th>
                      <th className="px-4 py-2 font-semibold text-right">Margem</th>
                      <th className="px-4 py-2 font-semibold text-right">
                        {kind === "sem-giro" ? "Capital parado" : "Receita 90d"}
                      </th>
                      <th className="px-4 py-2 font-semibold">Última venda</th>
                      <th className="px-4 py-2 font-semibold">Motivos / Insights</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.product_code} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 max-w-[280px]">
                          <p className="font-medium truncate">{p.product_name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {p.product_code}
                            {p.subcategory ? ` · ${p.subcategory}` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {p.quantity.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {p.sold_last_90d}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {p.margin_pct}%
                        </td>
                        <td className={cn("px-4 py-3 text-right font-mono font-semibold tabular-nums", cfg.accent)}>
                          {brl(kind === "sem-giro" ? p.capital_locked : p.revenue_last_90d)}
                        </td>
                        <td className="px-4 py-3">
                          <DaysBadge days={p.days_since_last_sale} />
                        </td>
                        <td className="px-4 py-3 max-w-[320px]">
                          <div className="flex flex-wrap gap-1">
                            {p.reasons.slice(0, 3).map((r, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] font-normal">
                                {r}
                              </Badge>
                            ))}
                            {p.reasons.length > 3 && (
                              <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                                +{p.reasons.length - 3}
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
