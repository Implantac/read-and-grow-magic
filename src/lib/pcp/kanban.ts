import { differenceInDays, parseISO, addDays, format } from 'date-fns';
import { formatBRL } from '@/lib/formatters';
import type {
  OrderLike, CapacityLike, SupplyLike, MaterialItemLike, SheetLike,
  TimeEntryLike, OutsourcingOrderLike, MaterialNeed, SimulationScenario,
  SimulationResult, ActionSuggestion, PCPMetrics, ScheduleSlot,
} from './types';

export class KanbanService {
  static readonly VALID_TRANSITIONS: Record<string, string[]> = {
    planned: ['waiting_material', 'in_progress', 'outsourced'],
    waiting_material: ['planned', 'in_progress'],
    in_progress: ['paused', 'outsourced', 'finishing', 'completed'],
    outsourced: ['in_progress', 'finishing'],
    paused: ['in_progress'],
    finishing: ['completed', 'in_progress'],
    completed: [],
    cancelled: [],
    draft: ['planned'],
  };

  static canTransition(from: string, to: string): boolean {
    return (this.VALID_TRANSITIONS[from] || []).includes(to);
  }

  static getNextStatuses(currentStatus: string): string[] {
    return this.VALID_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Calculate supplier performance metrics from outsourcing orders
   */
  static calculateSupplierMetrics(outsourcingOrders: OutsourcingOrderLike[]): {
    supplierName: string;
    totalOrders: number;
    returnedOnTime: number;
    returnedLate: number;
    avgDelayDays: number;
    onTimeRate: number;
    avgQualityRate: number;
  }[] {
    const bySupplier: Record<string, OutsourcingOrderLike[]> = {};
    outsourcingOrders.forEach(o => {
      if (!bySupplier[o.supplier_name]) bySupplier[o.supplier_name] = [];
      bySupplier[o.supplier_name].push(o);
    });

    return Object.entries(bySupplier).map(([name, orders]) => {
      const returned = orders.filter(o => o.status === 'returned');
      let totalDelay = 0;
      let onTimeCount = 0;
      let totalQuality = 0;

      returned.forEach(o => {
        if (o.actual_return_date && o.expected_return_date) {
          const delay = differenceInDays(new Date(o.actual_return_date), new Date(o.expected_return_date));
          if (delay <= 0) onTimeCount++;
          totalDelay += Math.max(0, delay);
        }
        if (o.quantity_returned > 0) {
          totalQuality += ((o.quantity_returned - (o.quantity_rejected || 0)) / o.quantity_returned) * 100;
        }
      });

      return {
        supplierName: name,
        totalOrders: orders.length,
        returnedOnTime: onTimeCount,
        returnedLate: returned.length - onTimeCount,
        avgDelayDays: returned.length > 0 ? +(totalDelay / returned.length).toFixed(1) : 0,
        onTimeRate: returned.length > 0 ? Math.round((onTimeCount / returned.length) * 100) : 0,
        avgQualityRate: returned.length > 0 ? Math.round(totalQuality / returned.length) : 100,
      };
    }).sort((a, b) => a.onTimeRate - b.onTimeRate);
  }
}
