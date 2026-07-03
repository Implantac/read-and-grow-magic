import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/base/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { Activity, TrendingUp, Clock, AlertTriangle, Target, Gauge, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toastError } from "@/lib/toastHelpers";
import { EmptyState } from "@/shared/components/EmptyState";
import { Truck, ListChecks } from "lucide-react";

type Range = "24h" | "7d" | "30d";

type KPI = {
  receivings: number;
  shipments: number;
  pickingsCompleted: number;
  pickingsPending: number;
  avgPickMinutes: number;
  slaOnTime: number;
  slaLate: number;
  accuracyPct: number;
  qualityFails: number;
  tasksPerHour: number;
};

const rangeToHours: Record<Range, number> = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30 };

export default function WMSAnalytics() {
  const [range, setRange] = useState<Range>("7d");
  const [loading, setLoading] = useState(false);
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const since = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() - rangeToHours[range]);
    return d.toISOString();
  }, [range]);

  const load = async () => {
    setLoading(true);
    try {
      const [recv, ship, pickAll, logs, qual, evts] = await Promise.all([
        supabase.from("wms_receiving_orders").select("id,status,created_at").gte("created_at", since),
        supabase.from("wms_shipments").select("id,status,carrier,tracking_number,scheduled_date,shipped_at,delivered_at,created_at").gte("created_at", since).order("created_at", { ascending: false }),
        supabase.from("wms_picking_orders").select("id,status,created_at,completed_at").gte("created_at", since),
        supabase.from("wms_task_logs").select("id,task_type,duration_seconds,created_at").gte("created_at", since),
        supabase.from("wms_quality_checks").select("id,decision,created_at").gte("created_at", since),
        supabase.from("wms_events").select("id,event_type,created_at,payload").gte("created_at", since).order("created_at", { ascending: false }).limit(50),
      ]);

      const shipRows = ship.data ?? [];
      const pickRows = pickAll.data ?? [];
      const logRows = (logs.data ?? []) as any[];
      const qRows = (qual.data ?? []) as any[];

      const completed = pickRows.filter((p: any) => p.status === "completed");
      const avgPickMin = completed.length
        ? completed.reduce((acc: number, p: any) => {
            if (!p.completed_at) return acc;
            return acc + (new Date(p.completed_at).getTime() - new Date(p.created_at).getTime()) / 60000;
          }, 0) / completed.length
        : 0;

      const slaOn = shipRows.filter((s: any) => s.delivered_at && s.scheduled_date && new Date(s.delivered_at) <= new Date(s.scheduled_date)).length;
      const slaLate = shipRows.filter((s: any) => s.delivered_at && s.scheduled_date && new Date(s.delivered_at) > new Date(s.scheduled_date)).length;

      const qualFails = qRows.filter((q) => q.decision === "rejected" || q.decision === "quarantine").length;
      const accuracy = qRows.length ? Math.max(0, 100 - (qualFails / qRows.length) * 100) : 100;

      const totalSeconds = logRows.reduce((a, l) => a + (l.duration_seconds || 0), 0);
      const tasksPerHour = totalSeconds > 0 ? (logRows.length / (totalSeconds / 3600)) : 0;

      setKpi({
        receivings: recv.data?.length ?? 0,
        shipments: shipRows.length,
        pickingsCompleted: completed.length,
        pickingsPending: pickRows.filter((p: any) => p.status !== "completed" && p.status !== "cancelled").length,
        avgPickMinutes: Math.round(avgPickMin),
        slaOnTime: slaOn,
        slaLate,
        accuracyPct: Math.round(accuracy * 10) / 10,
        qualityFails: qualFails,
        tasksPerHour: Math.round(tasksPerHour * 10) / 10,
      });
      setShipments(shipRows.slice(0, 20));
      setEvents(evts.data ?? []);
    } catch (e: any) {
      toastError("Falha ao carregar analytics", e?.message ?? "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [range]);

  const slaTotal = (kpi?.slaOnTime ?? 0) + (kpi?.slaLate ?? 0);
  const slaPct = slaTotal > 0 ? Math.round(((kpi?.slaOnTime ?? 0) / slaTotal) * 100) : 100;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Gauge className="h-6 w-6 text-primary" /> WMS Analytics &amp; SLA</h1>
          <p className="text-sm text-muted-foreground">KPIs operacionais consolidados por tenant</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
            <TabsList>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7 dias</TabsTrigger>
              <TabsTrigger value="30d">30 dias</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={<Activity className="h-4 w-4" />} title="Recebimentos" value={kpi?.receivings ?? 0} />
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} title="Expedições" value={kpi?.shipments ?? 0} />
        <KpiCard icon={<Target className="h-4 w-4" />} title="SLA no prazo" value={`${slaPct}%`} sub={`${kpi?.slaOnTime ?? 0} on / ${kpi?.slaLate ?? 0} atraso`} />
        <KpiCard icon={<Clock className="h-4 w-4" />} title="Pick médio" value={`${kpi?.avgPickMinutes ?? 0} min`} sub={`${kpi?.pickingsCompleted ?? 0} concluídos`} />
        <KpiCard icon={<AlertTriangle className="h-4 w-4" />} title="Acuracidade" value={`${kpi?.accuracyPct ?? 0}%`} sub={`${kpi?.qualityFails ?? 0} falhas`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Expedições Recentes</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Tracking</TableHead><TableHead>Status</TableHead><TableHead>SLA</TableHead></TableRow></TableHeader>
              <TableBody>
                {shipments.length === 0 && (<TableRow><TableCell colSpan={3} className="p-0"><EmptyState icon={Truck} title="Sem expedições no período" description="Ajuste o período ou aguarde novas expedições." /></TableCell></TableRow>)}
                {shipments.map((s) => {
                  const onTime = s.delivered_at && s.scheduled_date ? new Date(s.delivered_at) <= new Date(s.scheduled_date) : null;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.tracking_number ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                      <TableCell>
                        {onTime === null ? <Badge variant="secondary">pendente</Badge> : onTime ? <Badge className="bg-emerald-600">no prazo</Badge> : <Badge variant="destructive">atrasado</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Eventos Operacionais</CardTitle></CardHeader>
          <CardContent className="max-h-[420px] overflow-auto">
            {events.length === 0 ? (
              <EmptyState icon={ListChecks} title="Sem eventos registrados" description="Eventos operacionais do WMS aparecerão em tempo real." />
            ) : (
              <ul className="space-y-2">
                {events.map((e) => (
                  <li key={e.id} className="text-xs border-l-2 border-primary/40 pl-3 py-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{e.event_type}</span>
                      <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Produtividade</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="Tarefas/hora" value={kpi?.tasksPerHour ?? 0} />
          <Metric label="Pickings pendentes" value={kpi?.pickingsPending ?? 0} />
          <Metric label="Pickings concluídos" value={kpi?.pickingsCompleted ?? 0} />
          <Metric label="Eventos no período" value={events.length} />
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon, title, value, sub }: { icon: React.ReactNode; title: string; value: React.ReactNode; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-2">{icon}{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
