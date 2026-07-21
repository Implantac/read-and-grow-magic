import { differenceInDays, parseISO, addDays, format } from 'date-fns';
import { formatBRL } from '@/lib/formatters';
import type {
  OrderLike, CapacityLike, SupplyLike, MaterialItemLike, SheetLike,
  TimeEntryLike, OutsourcingOrderLike, MaterialNeed, SimulationScenario,
  SimulationResult, ActionSuggestion, PCPMetrics, ScheduleSlot,
} from './types';

export class SchedulingService {
  static readonly PRIORITY_MAP: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

  /**
   * Sequence OPs based on multiple criteria
   */
  static sequenceOPs(
    activeOPs: OrderLike[],
    capacities: CapacityLike[],
    algorithm: 'priority_due' | 'edd' | 'spt' | 'lpt' | 'critical_ratio' = 'priority_due'
  ): ScheduleSlot[] {
    const totalCapPerDay = capacities.reduce((s: number, c) => s + (c.capacity_per_hour || 0) * (c.max_hours_per_day || 8), 0);
    const today = new Date();

    const slots = activeOPs.map(o => {
      const remaining = Math.max(0, o.quantity - o.produced_quantity);
      const avgTime = o.produced_quantity > 0 && o.realized_time_minutes > 0
        ? o.realized_time_minutes / o.produced_quantity
        : o.estimated_time_minutes / Math.max(o.quantity, 1);
      const estMinutes = remaining * avgTime;
      const estHours = estMinutes / 60;
      const estDays = totalCapPerDay > 0 ? remaining / totalCapPerDay : 999;
      const dueIn = o.due_date ? differenceInDays(parseISO(o.due_date), today) : 999;
      const criticalRatio = dueIn > 0 ? estDays / dueIn : 999;
      const isLate = o.due_date ? today > new Date(o.due_date) : false;
      const willBeLate = dueIn < estDays;

      return {
        opId: o.id,
        opNumber: o.order_number,
        productName: o.product_name,
        sector: o.sector || o.work_center || 'Geral',
        startDate: today,
        endDate: addDays(today, Math.ceil(estDays)),
        estHours,
        priority: o.priority,
        isLate,
        willBeLate,
        criticalRatio,
        _remaining: remaining,
        _estMinutes: estMinutes,
        _dueIn: dueIn,
        _priorityNum: this.PRIORITY_MAP[o.priority] ?? 9,
      };
    });

    slots.sort((a, b) => {
      switch (algorithm) {
        case 'edd': return a._dueIn - b._dueIn;
        case 'spt': return a._estMinutes - b._estMinutes;
        case 'lpt': return b._estMinutes - a._estMinutes;
        case 'critical_ratio': return b.criticalRatio - a.criticalRatio;
        default: {
          if (a.isLate !== b.isLate) return a.isLate ? -1 : 1;
          if (a.willBeLate !== b.willBeLate) return a.willBeLate ? -1 : 1;
          const pDiff = a._priorityNum - b._priorityNum;
          return pDiff !== 0 ? pDiff : a._dueIn - b._dueIn;
        }
      }
    });

    // Calculate start/end dates sequentially
    let cumHours = 0;
    return slots.map((slot) => {
      const startDate = addDays(today, Math.ceil(cumHours / 8));
      cumHours += slot.estHours;
      const endDate = addDays(today, Math.ceil(cumHours / 8));
      return { ...slot, startDate, endDate };
    });
  }

  /**
   * Calculate resource load per sector
   */
  static calculateResourceLoad(
    slots: ScheduleSlot[],
    capacities: CapacityLike[]
  ): { sector: string; ops: number; hours: number; capacity: number; loadPct: number; isOverloaded: boolean }[] {
    const sectorLoad: Record<string, { ops: number; hours: number; capacity: number }> = {};

    capacities.forEach((c) => {
      const s = c.sector || 'Geral';
      if (!sectorLoad[s]) sectorLoad[s] = { ops: 0, hours: 0, capacity: 0 };
      sectorLoad[s].capacity += (c.capacity_per_hour || 0) * (c.max_hours_per_day || 8) * 22;
    });

    slots.forEach(s => {
      if (!sectorLoad[s.sector]) sectorLoad[s.sector] = { ops: 0, hours: 0, capacity: 0 };
      sectorLoad[s.sector].ops += 1;
      sectorLoad[s.sector].hours += s.estHours;
    });

    return Object.entries(sectorLoad).map(([sector, v]) => {
      const dailyCap = v.capacity / 22;
      const loadPct = dailyCap > 0 ? +((v.hours / dailyCap) * 100).toFixed(0) : 0;
      return { sector, ops: v.ops, hours: +v.hours.toFixed(1), capacity: v.capacity, loadPct, isOverloaded: loadPct > 100 };
    });
  }
}

// ─── Simulation Service ──────────────────────────────────────
