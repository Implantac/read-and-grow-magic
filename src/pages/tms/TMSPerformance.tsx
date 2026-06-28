import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Truck, Timer, Target, DollarSign } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';

const BRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const PCT = (n: number) => `${(n * 100).toFixed(1)}%`;

type RouteRow = {
  id: string;
  carrier_id: string | null;
  driver_name: string | null;
  planned_date: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  total_stops: number | null;
  completed_stops: number | null;
  status: string;
};
type CarrierRow = { id: string; name: string };
type CostRow = { route_id: string; fuel_cost: number; toll_cost: number; driver_cost: number; maintenance_cost: number; other_cost: number; total_distance_km: number };
type ProofRow = { route_id: string; status: string; delivered_at: string | null; created_at: string };

const RANGE_DAYS = { '30': 30, '60': 60, '90': 90 } as const;

export default function TMSPerformance() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  const [range, setRange] = useState<keyof typeof RANGE_DAYS>('30');

  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - RANGE_DAYS[range]);
    return d.toISOString().slice(0, 10);
  }, [range]);

  const { data, isLoading } = useQuery({
    queryKey: ['tms-performance', companyId, since],
    enabled: !!companyId,
    queryFn: async () => {
      const [routes, carriers, costs, proofs] = await Promise.all([
        supabase.from('delivery_routes').select('id,carrier_id,driver_name,planned_date,departure_time,arrival_time,total_stops,completed_stops,status').gte('planned_date', since),
        supabase.from('carriers').select('id,name'),
        supabase.from('route_costs').select('route_id,fuel_cost,toll_cost,driver_cost,maintenance_cost,other_cost,total_distance_km'),
        supabase.from('delivery_proof').select('route_id,status,delivered_at,created_at').gte('created_at', since),
      ]);
      return {
        routes: (routes.data ?? []) as RouteRow[],
        carriers: (carriers.data ?? []) as CarrierRow[],
        costs: (costs.data ?? []) as CostRow[],
        proofs: (proofs.data ?? []) as ProofRow[],
      };
    },
  });

  const summary = useMemo(() => {
    if (!data) return null;
    const { routes, carriers, costs, proofs } = data;
    const carrierName = new Map(carriers.map((c) => [c.id, c.name]));

    const totalCostByRoute = new Map<string, { cost: number; km: number }>();
    for (const c of costs) {
      const cost = (c.fuel_cost ?? 0) + (c.toll_cost ?? 0) + (c.driver_cost ?? 0) + (c.maintenance_cost ?? 0) + (c.other_cost ?? 0);
      totalCostByRoute.set(c.route_id, { cost, km: c.total_distance_km ?? 0 });
    }

    const totalRoutes = routes.length;
    const completedRoutes = routes.filter((r) => r.status === 'completed' || r.status === 'delivered').length;
    const totalStops = routes.reduce((s, r) => s + (r.total_stops ?? 0), 0);
    const completedStops = routes.reduce((s, r) => s + (r.completed_stops ?? 0), 0);
    const stopCompletion = totalStops > 0 ? completedStops / totalStops : 0;

    const delivered = proofs.filter((p) => p.status === 'delivered').length;
    const refused = proofs.filter((p) => p.status === 'refused').length;
    const totalProofs = proofs.length;
    const successRate = totalProofs > 0 ? delivered / totalProofs : 0;

    const totalCost = [...totalCostByRoute.values()].reduce((s, x) => s + x.cost, 0);
    const totalKm = [...totalCostByRoute.values()].reduce((s, x) => s + x.km, 0);
    const costPerKm = totalKm > 0 ? totalCost / totalKm : 0;

    // by carrier
    const byCarrier = new Map<string, { name: string; routes: number; completed: number; cost: number; km: number; delivered: number; proofs: number }>();
    for (const r of routes) {
      const key = r.carrier_id ?? 'sem-transportadora';
      const name = r.carrier_id ? (carrierName.get(r.carrier_id) ?? '—') : 'Sem transportadora';
      const acc = byCarrier.get(key) ?? { name, routes: 0, completed: 0, cost: 0, km: 0, delivered: 0, proofs: 0 };
      acc.routes += 1;
      if (r.status === 'completed' || r.status === 'delivered') acc.completed += 1;
      const rc = totalCostByRoute.get(r.id);
      if (rc) { acc.cost += rc.cost; acc.km += rc.km; }
      byCarrier.set(key, acc);
    }
    const routeCarrier = new Map(routes.map((r) => [r.id, r.carrier_id ?? 'sem-transportadora']));
    for (const p of proofs) {
      const k = routeCarrier.get(p.route_id);
      if (!k) continue;
      const acc = byCarrier.get(k);
      if (!acc) continue;
      acc.proofs += 1;
      if (p.status === 'delivered') acc.delivered += 1;
    }

    const carriersRanked = [...byCarrier.values()]
      .map((c) => ({
        ...c,
        completionRate: c.routes > 0 ? c.completed / c.routes : 0,
        successRate: c.proofs > 0 ? c.delivered / c.proofs : 0,
        costPerKm: c.km > 0 ? c.cost / c.km : 0,
      }))
      .sort((a, b) => b.routes - a.routes);

    // top drivers
    const byDriver = new Map<string, { driver: string; routes: number; delivered: number; proofs: number }>();
    for (const r of routes) {
      const d = r.driver_name?.trim() || '—';
      const acc = byDriver.get(d) ?? { driver: d, routes: 0, delivered: 0, proofs: 0 };
      acc.routes += 1;
      byDriver.set(d, acc);
    }
    const routeDriver = new Map(routes.map((r) => [r.id, r.driver_name?.trim() || '—']));
    for (const p of proofs) {
      const d = routeDriver.get(p.route_id);
      if (!d) continue;
      const acc = byDriver.get(d);
      if (!acc) continue;
      acc.proofs += 1;
      if (p.status === 'delivered') acc.delivered += 1;
    }
    const driversRanked = [...byDriver.values()]
      .filter((d) => d.driver !== '—')
      .map((d) => ({ ...d, successRate: d.proofs > 0 ? d.delivered / d.proofs : 0 }))
      .sort((a, b) => b.delivered - a.delivered)
      .slice(0, 10);

    return {
      totalRoutes, completedRoutes, stopCompletion, successRate, costPerKm, totalCost, totalKm, refused,
      carriersRanked, driversRanked,
    };
  }, [data]);

  if (isLoading || !summary) return <PageLoading />;

  return (
    <PageContainer>
      <PageHeader
        title="Performance TMS"
        description="SLA de entregas, custo por km e ranking de transportadoras e motoristas"
      />

      <div className="flex justify-end mb-4">
        <Select value={range} onValueChange={(v) => setRange(v as keyof typeof RANGE_DAYS)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="60">Últimos 60 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Rotas concluídas" value={`${summary.completedRoutes}/${summary.totalRoutes}`} icon={<Truck className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Conclusão de paradas" value={PCT(summary.stopCompletion)} icon={<Target className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="Sucesso de entrega" value={PCT(summary.successRate)} icon={<Timer className="h-5 w-5" />} accentColor="info" index={2} />
        <KPICard title="Custo médio / km" value={BRL(summary.costPerKm)} icon={<DollarSign className="h-5 w-5" />} accentColor="warning" index={3} />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Ranking de transportadoras</CardTitle></CardHeader>
        <CardContent>
          {summary.carriersRanked.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem rotas no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transportadora</TableHead>
                  <TableHead className="text-right">Rotas</TableHead>
                  <TableHead className="text-right">Conclusão</TableHead>
                  <TableHead className="text-right">Sucesso</TableHead>
                  <TableHead className="text-right">Km</TableHead>
                  <TableHead className="text-right">Custo total</TableHead>
                  <TableHead className="text-right">Custo / km</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.carriersRanked.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right">{c.routes}</TableCell>
                    <TableCell className="text-right">{PCT(c.completionRate)}</TableCell>
                    <TableCell className="text-right">{PCT(c.successRate)}</TableCell>
                    <TableCell className="text-right">{c.km.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right">{BRL(c.cost)}</TableCell>
                    <TableCell className="text-right">{c.km > 0 ? BRL(c.costPerKm) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top motoristas por entregas</CardTitle></CardHeader>
        <CardContent>
          {summary.driversRanked.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem motoristas registrados no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Motorista</TableHead>
                  <TableHead className="text-right">Rotas</TableHead>
                  <TableHead className="text-right">Entregas</TableHead>
                  <TableHead className="text-right">Sucesso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.driversRanked.map((d) => (
                  <TableRow key={d.driver}>
                    <TableCell className="font-medium">{d.driver}</TableCell>
                    <TableCell className="text-right">{d.routes}</TableCell>
                    <TableCell className="text-right">{d.delivered}</TableCell>
                    <TableCell className="text-right">{PCT(d.successRate)}</TableCell>
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
