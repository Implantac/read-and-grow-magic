import { differenceInDays, parseISO, addDays, format } from 'date-fns';
import { formatBRL } from '@/lib/formatters';
import type {
  OrderLike, CapacityLike, SupplyLike, MaterialItemLike, SheetLike,
  TimeEntryLike, OutsourcingOrderLike, MaterialNeed, SimulationScenario,
  SimulationResult, ActionSuggestion, PCPMetrics, ScheduleSlot,
} from './types';

import { BottleneckDetectionService } from './bottleneck';
export interface SmartSuggestion {
  id: string;
  type: 'DELAY_RISK' | 'MATERIAL_SHORTAGE' | 'SUPPLIER_LATE' | 'OVERLOAD' | 'IDLE' | 'MOVE_TO_PRODUCTION' | 'QUALITY_ALERT';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  action: 'PRIORITIZE' | 'PURCHASE' | 'REDISTRIBUTE' | 'MOVE' | 'INVESTIGATE' | 'ALERT';
  relatedEntity?: string;
  actionLabel?: string;
  actionPayload?: { orderId?: string; newStatus?: string; targetSector?: string };
}

export class SuggestionEngine {
  /**
   * Generate unified, actionable suggestions from all PCP data sources
   */
  static generate(
    orders: OrderLike[],
    materialNeeds: MaterialNeed[],
    capacities: CapacityLike[],
    outsourcingOrders: OutsourcingOrderLike[],
    timeEntries: TimeEntryLike[]
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const now = new Date();
    const activeOPs = orders.filter(o => ['planned', 'in_progress', 'paused', 'waiting_material', 'outsourced'].includes(o.status));

    // 1. Delay risk
    activeOPs.filter(o => o.due_date && new Date(o.due_date) < now).forEach(o => {
      const days = differenceInDays(now, new Date(o.due_date));
      suggestions.push({
        id: `delay-${o.id}`,
        type: 'DELAY_RISK',
        severity: days > 5 ? 'critical' : 'warning',
        message: `OP ${o.order_number} atrasada ${days}d — ${o.product_name}`,
        action: 'PRIORITIZE',
        relatedEntity: o.order_number,
        actionLabel: 'Priorizar',
        actionPayload: { orderId: o.id },
      });
    });

    // 2. About to be late
    activeOPs.filter(o => {
      if (!o.due_date) return false;
      const daysLeft = differenceInDays(new Date(o.due_date), now);
      if (daysLeft <= 0 || daysLeft > 5) return false;
      const remaining = Math.max(0, o.quantity - o.produced_quantity);
      const avgTime = o.estimated_time_minutes / Math.max(o.quantity, 1);
      const estDays = (remaining * avgTime) / (8 * 60);
      return estDays > daysLeft;
    }).forEach(o => {
      suggestions.push({
        id: `risk-${o.id}`,
        type: 'DELAY_RISK',
        severity: 'warning',
        message: `OP ${o.order_number} pode atrasar — produção insuficiente para o prazo`,
        action: 'PRIORITIZE',
        relatedEntity: o.order_number,
        actionLabel: 'Antecipar',
        actionPayload: { orderId: o.id },
      });
    });

    // 3. Material shortages
    materialNeeds.filter(m => m.status === 'critical').slice(0, 5).forEach(m => {
      suggestions.push({
        id: `mat-${m.materialCode}`,
        type: 'MATERIAL_SHORTAGE',
        severity: 'critical',
        message: `${m.materialName} com apenas ${m.coveragePct}% de cobertura — afeta ${m.relatedOPs.length} OP(s)`,
        action: 'PURCHASE',
        relatedEntity: m.materialCode,
        actionLabel: 'Solicitar Compra',
      });
    });

    // 4. Supplier late
    outsourcingOrders.filter((oo) => oo.status !== 'returned' && oo.expected_return_date && new Date(oo.expected_return_date) < now).forEach((oo) => {
      const days = differenceInDays(now, new Date(oo.expected_return_date));
      suggestions.push({
        id: `supplier-${oo.id}`,
        type: 'SUPPLIER_LATE',
        severity: days > 5 ? 'critical' : 'warning',
        message: `Fornecedor ${oo.supplier_name} com ${days}d de atraso — OS ${oo.order_number}`,
        action: 'ALERT',
        relatedEntity: oo.supplier_name,
        actionLabel: 'Cobrar Fornecedor',
      });
    });

    // 5. OPs waiting_material that might have stock now
    activeOPs.filter(o => o.status === 'waiting_material').forEach(o => {
      const hasCritical = materialNeeds.some(m => m.status === 'critical' && m.relatedOPs.includes(o.order_number));
      if (!hasCritical) {
        suggestions.push({
          id: `move-${o.id}`,
          type: 'MOVE_TO_PRODUCTION',
          severity: 'info',
          message: `OP ${o.order_number} pode ter material disponível — mover para produção`,
          action: 'MOVE',
          relatedEntity: o.order_number,
          actionLabel: 'Mover para Produção',
          actionPayload: { orderId: o.id, newStatus: 'in_progress' },
        });
      }
    });

    // 6. Paused OPs that are late
    activeOPs.filter(o => o.status === 'paused' && o.due_date && new Date(o.due_date) < now).forEach(o => {
      suggestions.push({
        id: `resume-${o.id}`,
        type: 'DELAY_RISK',
        severity: 'critical',
        message: `OP ${o.order_number} pausada e atrasada — retomar imediatamente`,
        action: 'MOVE',
        relatedEntity: o.order_number,
        actionLabel: 'Retomar',
        actionPayload: { orderId: o.id, newStatus: 'in_progress' },
      });
    });

    // 7. Bottleneck alerts
    const bottlenecks = BottleneckDetectionService.detect(orders, capacities, timeEntries);
    bottlenecks.forEach(b => {
      suggestions.push({
        id: `bottleneck-${b.sector}-${b.type}`,
        type: b.type === 'quality' ? 'QUALITY_ALERT' : 'OVERLOAD',
        severity: b.severity,
        message: b.message,
        action: b.type === 'quality' ? 'INVESTIGATE' : 'REDISTRIBUTE',
        relatedEntity: b.sector,
        actionLabel: b.suggestion.split('—')[0].trim(),
      });
    });

    return suggestions.sort((a, b) => {
      const sev = { critical: 0, warning: 1, info: 2 };
      return (sev[a.severity] ?? 2) - (sev[b.severity] ?? 2);
    });
  }
}

// ─── Kanban Service ──────────────────────────────────────────
