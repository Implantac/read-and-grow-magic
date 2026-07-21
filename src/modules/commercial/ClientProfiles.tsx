import { useMemo, useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Input } from "@/ui/base/input";
import { Skeleton } from "@/ui/base/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { Crown, Award, Medal, Gem, TrendingUp, Users, DollarSign, AlertTriangle } from "lucide-react";
import {
  useClientProfiles,
  TIER_META,
  LIFECYCLE_META,
  type ClientTier,
  type ClientLifecycle,
} from "@/hooks/commercial/useClientProfiles";

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

const TIER_ICON: Record<ClientTier, JSX.Element> = {
  bronze: <Medal className="h-4 w-4" />,
  prata: <Award className="h-4 w-4" />,
  ouro: <Crown className="h-4 w-4" />,
  diamante: <Gem className="h-4 w-4" />,
};

export default function ClientProfiles() {
  const { data: profiles, isLoading } = useClientProfiles();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<ClientTier | "all">("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<ClientLifecycle | "all">("all");

  const filtered = useMemo(() => {
    if (!profiles) return [];
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      if (tierFilter !== "all" && p.tier !== tierFilter) return false;
      if (lifecycleFilter !== "all" && p.lifecycle_status !== lifecycleFilter) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.document?.toLowerCase().includes(q)
      );
    });
  }, [profiles, search, tierFilter, lifecycleFilter]);

  const kpis = useMemo(() => {
    const all = profiles ?? [];
    const totalLTV = all.reduce((s, p) => s + Number(p.ltv || 0), 0);
    const active = all.filter((p) => p.lifecycle_status === "ativo").length;
    const atRisk = all.filter((p) => p.lifecycle_status === "em_risco").length;
    const gold = all.filter((p) => p.tier === "ouro" || p.tier === "diamante").length;
    return { totalLTV, active, atRisk, gold, total: all.length };
  }, [profiles]);

  const tierCounts = useMemo(() => {
    const c: Record<ClientTier, number> = { bronze: 0, prata: 0, ouro: 0, diamante: 0 };
    (profiles ?? []).forEach((p) => (c[p.tier] += 1));
    return c;
  }, [profiles]);

  return (
    <PageContainer>
      <PageHeader
        title="Perfil Comercial de Clientes"
        description="Faixas Bronze/Prata/Ouro/Diamante, LTV, ticket médio e ciclo de vida"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Users className="h-5 w-5" />} label="Clientes" value={String(kpis.total)} />
        <KpiCard icon={<DollarSign className="h-5 w-5" />} label="LTV total" value={brl(kpis.totalLTV)} />
        <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="Ativos (60d)" value={String(kpis.active)} accent="text-emerald-400" />
        <KpiCard icon={<AlertTriangle className="h-5 w-5" />} label="Em risco" value={String(kpis.atRisk)} accent="text-orange-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(TIER_META) as ClientTier[]).map((t) => (
          <Card key={t}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">{TIER_META[t].label}</p>
                <p className="text-2xl font-bold">{tierCounts[t]}</p>
                <p className="text-xs text-muted-foreground">a partir de {brl(TIER_META[t].min)}</p>
              </div>
              <div className="text-primary">{TIER_ICON[t]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carteira detalhada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="Buscar cliente, código ou CNPJ/CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:max-w-sm"
            />
            <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as any)}>
              <SelectTrigger className="md:w-48"><SelectValue placeholder="Faixa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as faixas</SelectItem>
                {(Object.keys(TIER_META) as ClientTier[]).map((t) => (
                  <SelectItem key={t} value={t}>{TIER_META[t].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={lifecycleFilter} onValueChange={(v) => setLifecycleFilter(v as any)}>
              <SelectTrigger className="md:w-48"><SelectValue placeholder="Ciclo de vida" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os ciclos</SelectItem>
                {(Object.keys(LIFECYCLE_META) as ClientLifecycle[]).map((l) => (
                  <SelectItem key={l} value={l}>{LIFECYCLE_META[l].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhum cliente encontrado com os filtros atuais.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Faixa</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead className="text-right">LTV</TableHead>
                    <TableHead className="text-right">Ticket médio</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Última compra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 200).map((p) => (
                    <TableRow key={p.client_id}>
                      <TableCell>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.code || p.document}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={TIER_META[p.tier].color}>
                          <span className="inline-flex items-center gap-1">{TIER_ICON[p.tier]}{TIER_META[p.tier].label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={LIFECYCLE_META[p.lifecycle_status].color}>
                          {LIFECYCLE_META[p.lifecycle_status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{brl(Number(p.ltv))}</TableCell>
                      <TableCell className="text-right">{brl(Number(p.avg_ticket))}</TableCell>
                      <TableCell className="text-right">{p.total_orders}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {p.last_order_date ? new Date(p.last_order_date).toLocaleDateString("pt-BR") : "—"}
                        {p.days_since_last_order !== null && (
                          <div className="text-xs">{p.days_since_last_order}d atrás</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length > 200 && (
                <p className="text-xs text-muted-foreground mt-2">Exibindo 200 de {filtered.length}. Refine os filtros para ver mais.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function KpiCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase">{label}</p>
          <p className={`text-2xl font-bold ${accent ?? ""}`}>{value}</p>
        </div>
        <div className="text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}
