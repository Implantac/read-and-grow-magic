import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { KPICard } from "@/shared/components/KPICard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Skeleton } from "@/ui/base/skeleton";
import { Input } from "@/ui/base/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/ui/base/table";
import { toast } from "@/ui/base/use-toast";
import {
  ArrowRightLeft, PackagePlus, Truck, Zap, Search, AlertTriangle, CheckCircle2,
} from "lucide-react";

type ReceivingItem = {
  id: string;
  receiving_order_id: string;
  product_code: string;
  product_name: string;
  expected_qty: number;
  received_qty: number;
  company_id: string;
  wms_receiving_orders?: { order_number: string; status: string; supplier: string; dock: string | null } | null;
};

type Reservation = {
  id: string;
  product_code: string;
  product_name: string;
  requested_qty: number;
  reserved_qty: number;
  picked_qty: number;
  status: string;
  order_id: string;
  priority: number | null;
  company_id: string;
};

type Candidate = {
  productCode: string;
  productName: string;
  incomingQty: number;
  demandQty: number;
  crossDockQty: number;
  receivingItems: ReceivingItem[];
  reservations: Reservation[];
};

export default function CrossDockingPage() {
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState<ReceivingItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [rec, res] = await Promise.all([
        supabase
          .from("wms_receiving_items")
          .select(
            "id, receiving_order_id, product_code, product_name, expected_qty, received_qty, company_id, wms_receiving_orders!inner(order_number,status,supplier,dock)",
          )
          .in("wms_receiving_orders.status", ["pending", "in_progress", "receiving", "scheduled"])
          .limit(500),
        supabase
          .from("stock_reservations")
          .select(
            "id, product_code, product_name, requested_qty, reserved_qty, picked_qty, status, order_id, priority, company_id",
          )
          .in("status", ["pending", "partial"])
          .limit(500),
      ]);
      if (rec.error) throw rec.error;
      if (res.error) throw res.error;
      setReceiving((rec.data ?? []) as any);
      setReservations((res.data ?? []) as any);
    } catch (e: any) {
      toast({ title: "Erro ao carregar dados", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const candidates = useMemo<Candidate[]>(() => {
    const byCode = new Map<string, Candidate>();
    for (const r of receiving) {
      if (!r.product_code) continue;
      const remaining = Math.max(0, Number(r.expected_qty || 0) - Number(r.received_qty || 0)) + Number(r.received_qty || 0);
      // total expected = received + still to come; treat full expected as inbound supply
      const inbound = Number(r.expected_qty || 0);
      const k = r.product_code;
      const cur = byCode.get(k) ?? {
        productCode: k,
        productName: r.product_name,
        incomingQty: 0,
        demandQty: 0,
        crossDockQty: 0,
        receivingItems: [],
        reservations: [],
      };
      cur.incomingQty += inbound;
      cur.receivingItems.push(r);
      byCode.set(k, cur);
    }
    for (const res of reservations) {
      if (!res.product_code) continue;
      const need = Math.max(0, Number(res.requested_qty || 0) - Number(res.picked_qty || 0));
      const cur = byCode.get(res.product_code);
      if (!cur) continue;
      cur.demandQty += need;
      cur.reservations.push(res);
    }
    return Array.from(byCode.values())
      .map((c) => ({ ...c, crossDockQty: Math.min(c.incomingQty, c.demandQty) }))
      .filter((c) => c.crossDockQty > 0)
      .sort((a, b) => b.crossDockQty - a.crossDockQty);
  }, [receiving, reservations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) => c.productCode.toLowerCase().includes(q) || c.productName.toLowerCase().includes(q),
    );
  }, [candidates, search]);

  const kpis = useMemo(() => {
    const totalIncoming = candidates.reduce((s, c) => s + c.incomingQty, 0);
    const totalDemand = candidates.reduce((s, c) => s + c.demandQty, 0);
    const totalCD = candidates.reduce((s, c) => s + c.crossDockQty, 0);
    return {
      candidates: candidates.length,
      crossDock: totalCD,
      incoming: totalIncoming,
      demand: totalDemand,
      coverage: totalDemand > 0 ? Math.round((totalCD / totalDemand) * 100) : 0,
    };
  }, [candidates]);

  const flagCrossDock = async (c: Candidate) => {
    setActing(c.productCode);
    try {
      const companyId = c.receivingItems[0]?.company_id;
      if (!companyId) throw new Error("Sem company_id");
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id ?? null;

      const { error: mErr } = await supabase.from("wms_movements").insert({
        company_id: companyId,
        product_code: c.productCode,
        product_name: c.productName,
        type: "cross_dock",
        from_location: "DOCA-IN",
        to_location: "DOCA-OUT",
        quantity: c.crossDockQty,
        reason: `Cross-docking: ${c.reservations.length} reserva(s) atendida(s) sem armazenagem`,
        reference: c.receivingItems.map((r) => r.receiving_order_id).join(","),
      });
      if (mErr) throw mErr;

      await supabase.from("wms_events").insert({
        company_id: companyId,
        event_type: "wms.cross_dock.flagged",
        source_module: "wms",
        entity_type: "product",
        entity_id: null,
        actor_user_id: userId,
        payload: {
          product_code: c.productCode,
          product_name: c.productName,
          quantity: c.crossDockQty,
          receiving_items: c.receivingItems.map((r) => r.id),
          reservations: c.reservations.map((r) => r.id),
        },
      });

      toast({
        title: "Cross-Docking marcado",
        description: `${c.productCode}: ${c.crossDockQty} un. fluirão direto da doca de entrada para expedição.`,
      });
    } catch (e: any) {
      toast({ title: "Falha ao marcar cross-dock", description: e.message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Cross-Docking"
        description="Encaminha mercadoria recebida direto para expedição, evitando armazenagem"
      >
        <Button variant="outline" onClick={load} disabled={loading}>
          <Zap className="h-4 w-4 mr-2" /> Recalcular
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Candidatos"
          value={kpis.candidates}
          subtitle="SKUs com fluxo direto"
          icon={<ArrowRightLeft className="h-5 w-5" />}
          accentColor="info"
          index={0}
        />
        <KPICard
          title="Qtd Cross-Dock"
          value={kpis.crossDock}
          subtitle="Unidades direcionáveis"
          icon={<Truck className="h-5 w-5" />}
          accentColor="success"
          index={1}
        />
        <KPICard
          title="Cobertura de Demanda"
          value={`${kpis.coverage}%`}
          subtitle={`${kpis.demand} un. demandadas`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accentColor="accent"
          index={2}
        />
        <KPICard
          title="Inbound Total"
          value={kpis.incoming}
          subtitle="Unidades entrando"
          icon={<PackagePlus className="h-5 w-5" />}
          accentColor="warning"
          index={3}
        />
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base">Oportunidades de Cross-Docking</CardTitle>
              <CardDescription>
                Cruzamento entre <strong>recebimentos pendentes</strong> e <strong>reservas em aberto</strong> por código de produto.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar SKU ou descrição"
                className="pl-9"
                aria-label="Buscar oportunidade de cross-docking"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-60" />
              <p className="text-sm">Nenhuma oportunidade de cross-docking no momento.</p>
              <p className="text-xs mt-1">Cadastre recebimentos pendentes e reservas em aberto para o mesmo SKU.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Inbound</TableHead>
                    <TableHead className="text-right">Demanda</TableHead>
                    <TableHead className="text-right">Cross-Dock</TableHead>
                    <TableHead>Recebimentos</TableHead>
                    <TableHead>Reservas</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.productCode}>
                      <TableCell className="font-mono text-xs">{c.productCode}</TableCell>
                      <TableCell className="max-w-[220px] truncate">{c.productName}</TableCell>
                      <TableCell className="text-right">{c.incomingQty}</TableCell>
                      <TableCell className="text-right">{c.demandQty}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-green-500/15 text-green-600 border-green-500/30">
                          {c.crossDockQty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.receivingItems.slice(0, 3).map((r) => (
                            <Badge key={r.id} variant="outline" className="text-[10px]">
                              {r.wms_receiving_orders?.order_number ?? "—"}
                            </Badge>
                          ))}
                          {c.receivingItems.length > 3 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{c.receivingItems.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {c.reservations.length} pedido(s)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          disabled={acting === c.productCode}
                          onClick={() => flagCrossDock(c)}
                        >
                          {acting === c.productCode ? "Processando…" : "Marcar Cross-Dock"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
