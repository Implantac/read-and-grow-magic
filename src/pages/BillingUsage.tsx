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
} from "@/hooks/useBillingUsage";

export default function BillingUsage() {
  const meters = useBillingMeters();
  const summary = useCurrentUsageSummary();
  const events = useRecentUsageEvents(100);

  const totalMonth = useMemo(
    () => (summary.data ?? []).reduce((acc, r) => acc + Number(r.total_amount || 0), 0),
    [summary.data],
  );
  const totalEvents = useMemo(
    () => (summary.data ?? []).reduce((acc, r) => acc + Number(r.total_quantity || 0), 0),
    [summary.data],
  );

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
