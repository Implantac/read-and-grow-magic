import { useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Skeleton } from '@/ui/base/skeleton';
import { Truck, Clock, CheckCircle2, AlertTriangle, Trophy, DollarSign } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Shipment = {
  id: string;
  carrier: string | null;
  status: string;
  scheduled_date: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  total_value: number | null;
  total_weight: number | null;
  volumes: number | null;
  created_at: string;
};

type Score = {
  carrier: string;
  total: number;
  delivered: number;
  inTransit: number;
  cancelled: number;
  onTimeRate: number;
  avgLeadTimeH: number;
  avgValue: number;
  totalValue: number;
  totalVolumes: number;
  performance: number; // 0-100
};

const PERIODS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '365', label: 'Último ano' },
];

export default function CarrierScorecard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - parseInt(period) * 86400000).toISOString();
      const { data, error } = await supabase
        .from('wms_shipments')
        .select('id,carrier,status,scheduled_date,shipped_at,delivered_at,total_value,total_weight,volumes,created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        toast.error('Falha ao carregar expedições');
        setShipments([]);
      } else {
        setShipments((data as Shipment[]) || []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [period]);

  const scores = useMemo<Score[]>(() => {
    const groups = new Map<string, Shipment[]>();
    shipments.forEach((s) => {
      const key = (s.carrier || 'Sem transportadora').trim() || 'Sem transportadora';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s);
    });

    return Array.from(groups.entries()).map(([carrier, list]) => {
      const total = list.length;
      const delivered = list.filter((s) => s.status === 'delivered' || !!s.delivered_at).length;
      const inTransit = list.filter((s) => ['shipped', 'in_transit', 'loading'].includes(s.status)).length;
      const cancelled = list.filter((s) => s.status === 'cancelled').length;

      const deliveredWithSchedule = list.filter((s) => s.delivered_at && s.scheduled_date);
      const onTime = deliveredWithSchedule.filter(
        (s) => new Date(s.delivered_at!).getTime() <= new Date(s.scheduled_date!).getTime() + 86400000,
      ).length;
      const onTimeRate = deliveredWithSchedule.length > 0 ? (onTime / deliveredWithSchedule.length) * 100 : 0;

      const leadTimes = list
        .filter((s) => s.shipped_at && s.delivered_at)
        .map((s) => (new Date(s.delivered_at!).getTime() - new Date(s.shipped_at!).getTime()) / 3600000);
      const avgLeadTimeH = leadTimes.length > 0 ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : 0;

      const totalValue = list.reduce((sum, s) => sum + (Number(s.total_value) || 0), 0);
      const avgValue = total > 0 ? totalValue / total : 0;
      const totalVolumes = list.reduce((sum, s) => sum + (Number(s.volumes) || 0), 0);

      const cancelPenalty = total > 0 ? (cancelled / total) * 30 : 0;
      const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;
      const performance = Math.max(0, Math.min(100, onTimeRate * 0.5 + deliveryRate * 0.5 - cancelPenalty));

      return {
        carrier,
        total,
        delivered,
        inTransit,
        cancelled,
        onTimeRate,
        avgLeadTimeH,
        avgValue,
        totalValue,
        totalVolumes,
        performance,
      };
    }).sort((a, b) => b.performance - a.performance);
  }, [shipments]);

  const totals = useMemo(() => {
    const total = shipments.length;
    const delivered = scores.reduce((s, x) => s + x.delivered, 0);
    const onTimeAvg = scores.length > 0 ? scores.reduce((s, x) => s + x.onTimeRate, 0) / scores.length : 0;
    const totalValue = scores.reduce((s, x) => s + x.totalValue, 0);
    return { total, delivered, onTimeAvg, totalValue, carriers: scores.length };
  }, [scores, shipments.length]);

  const performanceBadge = (perf: number) => {
    if (perf >= 85) return <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">Excelente</Badge>;
    if (perf >= 70) return <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">Bom</Badge>;
    if (perf >= 50) return <Badge className="bg-orange-500/15 text-orange-300 border-orange-500/30">Atenção</Badge>;
    return <Badge variant="destructive">Crítico</Badge>;
  };

  const fmtBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <PageContainer>
      <PageHeader
        title="Scorecard de Transportadoras"
        description="Performance consolidada das transportadoras: pontualidade, lead time, volumes e custo por tenant."
        actions={
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KPICard title="Expedições" value={totals.total.toString()} icon={Truck} />
        <KPICard title="Entregues" value={totals.delivered.toString()} icon={CheckCircle2} />
        <KPICard title="On-Time Médio" value={`${totals.onTimeAvg.toFixed(1)}%`} icon={Clock} />
        <KPICard title="Valor Total" value={fmtBRL(totals.totalValue)} icon={DollarSign} />
        <KPICard title="Transportadoras" value={totals.carriers.toString()} icon={Trophy} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : scores.length === 0 ? (
            <EmptyState icon={Truck} title="Sem expedições no período" description="Selecione outro intervalo ou aguarde expedições concluídas para gerar o scorecard." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead className="text-right">Expedições</TableHead>
                  <TableHead className="text-right">Entregues</TableHead>
                  <TableHead className="text-right">On-Time</TableHead>
                  <TableHead className="text-right">Lead Time</TableHead>
                  <TableHead className="text-right">Volumes</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((s, idx) => (
                  <TableRow key={s.carrier}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{s.carrier}</TableCell>
                    <TableCell className="text-right">{s.total}</TableCell>
                    <TableCell className="text-right">{s.delivered}</TableCell>
                    <TableCell className="text-right">{s.onTimeRate.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{s.avgLeadTimeH.toFixed(1)}h</TableCell>
                    <TableCell className="text-right">{s.totalVolumes}</TableCell>
                    <TableCell className="text-right">{fmtBRL(s.totalValue)}</TableCell>
                    <TableCell className="text-right font-semibold">{s.performance.toFixed(0)}</TableCell>
                    <TableCell>{performanceBadge(s.performance)}</TableCell>
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
