import { differenceInDays, parseISO, addDays, format } from 'date-fns';
import { formatBRL } from '@/lib/formatters';
import type {
  OrderLike, CapacityLike, SupplyLike, MaterialItemLike, SheetLike,
  TimeEntryLike, OutsourcingOrderLike, MaterialNeed, SimulationScenario,
  SimulationResult, ActionSuggestion, PCPMetrics, ScheduleSlot,
} from './types';

export class BottleneckDetectionService {
  static detect(
    orders: OrderLike[],
    capacities: CapacityLike[],
    timeEntries: TimeEntryLike[]
  ): { sector: string; type: string; severity: 'warning' | 'critical'; message: string; suggestion: string }[] {
    const bottlenecks: { sector: string; type: string; severity: 'warning' | 'critical'; message: string; suggestion: string }[] = [];
    const activeOPs = orders.filter(o => ['planned', 'in_progress'].includes(o.status));

    // Sector overload
    const sectorLoad: Record<string, { ops: number; hours: number; capacity: number }> = {};
    capacities.forEach((c: CapacityLike) => {
      const s = c.sector || 'Geral';
      if (!sectorLoad[s]) sectorLoad[s] = { ops: 0, hours: 0, capacity: 0 };
      sectorLoad[s].capacity += (c.capacity_per_hour || 0) * (c.max_hours_per_day || 8);
    });
    activeOPs.forEach(o => {
      const s = o.sector || o.work_center || 'Geral';
      if (!sectorLoad[s]) sectorLoad[s] = { ops: 0, hours: 0, capacity: 0 };
      sectorLoad[s].ops += 1;
      sectorLoad[s].hours += (o.estimated_time_minutes || 0) / 60;
    });

    Object.entries(sectorLoad).forEach(([sector, v]) => {
      const dailyCap = v.capacity;
      if (dailyCap > 0) {
        const loadPct = (v.hours / dailyCap) * 100;
        if (loadPct > 120) {
          bottlenecks.push({
            sector, type: 'overload', severity: 'critical',
            message: `Setor "${sector}" com ${loadPct.toFixed(0)}% de carga (${v.ops} OPs, ${v.hours.toFixed(0)}h)`,
            suggestion: 'Redistribuir OPs para outros setores ou habilitar hora extra',
          });
        } else if (loadPct > 90) {
          bottlenecks.push({
            sector, type: 'near_capacity', severity: 'warning',
            message: `Setor "${sector}" próximo do limite (${loadPct.toFixed(0)}%)`,
            suggestion: 'Monitorar — considere antecipar OPs de menor prioridade',
          });
        }
      }
    });

    // Quality issues (high reject rate)
    const todayStr = new Date().toDateString();
    const todayEntries = timeEntries.filter((e) => new Date(e.start_time).toDateString() === todayStr);
    const sectorRejects: Record<string, { produced: number; rejected: number }> = {};
    todayEntries.forEach((e) => {
      const s = e.work_center || 'Geral';
      if (!sectorRejects[s]) sectorRejects[s] = { produced: 0, rejected: 0 };
      sectorRejects[s].produced += e.produced_quantity || 0;
      sectorRejects[s].rejected += e.rejected_quantity || 0;
    });
    Object.entries(sectorRejects).forEach(([sector, v]) => {
      if (v.produced > 0 && v.rejected > 0) {
        const rejectRate = (v.rejected / (v.produced + v.rejected)) * 100;
        if (rejectRate > 15) {
          bottlenecks.push({
            sector, type: 'quality', severity: 'critical',
            message: `Setor "${sector}" com ${rejectRate.toFixed(0)}% de refugo hoje`,
            suggestion: 'Investigar causa raiz — parar lote se necessário',
          });
        }
      }
    });

    return bottlenecks.sort((a, b) => (a.severity === 'critical' ? 0 : 1) - (b.severity === 'critical' ? 0 : 1));
  }
}

// ─── Suggestion Engine Service ───────────────────────────────
