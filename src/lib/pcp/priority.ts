import { differenceInDays, parseISO, addDays, format } from 'date-fns';
import { formatBRL } from '@/lib/formatters';
import type {
  OrderLike, CapacityLike, SupplyLike, MaterialItemLike, SheetLike,
  TimeEntryLike, OutsourcingOrderLike, MaterialNeed, SimulationScenario,
  SimulationResult, ActionSuggestion, PCPMetrics, ScheduleSlot,
} from './types';

export class PriorityEngineService {
  /**
   * Calculate priority score for each OP based on urgency, delay, material availability, and client importance.
   * Higher score = higher priority.
   */
  static calculateScores(
    orders: OrderLike[],
    materialNeeds?: MaterialNeed[]
  ): { opId: string; opNumber: string; score: number; factors: string[] }[] {
    const now = new Date();

    return orders
      .filter(o => ['planned', 'in_progress', 'paused', 'waiting_material'].includes(o.status))
      .map(o => {
        let score = 0;
        const factors: string[] = [];

        // 1. Priority base weight
        const priorityWeights: Record<string, number> = { urgent: 40, high: 25, medium: 10, low: 0 };
        score += priorityWeights[o.priority] ?? 5;
        if (o.priority === 'urgent') factors.push('Prioridade urgente (+40)');

        // 2. Deadline urgency (closer = higher score)
        if (o.due_date) {
          const dueDate = new Date(o.due_date);
          const hoursUntilDue = (dueDate.getTime() - now.getTime()) / 3600000;
          if (hoursUntilDue < 0) {
            const hoursLate = Math.abs(hoursUntilDue);
            const delayScore = Math.min(50, 20 + (hoursLate / 24) * 5);
            score += delayScore;
            factors.push(`Atrasada ${Math.ceil(hoursLate / 24)}d (+${delayScore.toFixed(0)})`);
          } else if (hoursUntilDue < 48) {
            score += 15;
            factors.push('Prazo em < 48h (+15)');
          } else if (hoursUntilDue < 120) {
            score += 8;
            factors.push('Prazo em < 5d (+8)');
          }
        }

        // 3. Completion progress (less done = more urgent)
        const remaining = Math.max(0, o.quantity - o.produced_quantity);
        const progressPct = o.quantity > 0 ? o.produced_quantity / o.quantity : 0;
        if (progressPct < 0.1 && o.status === 'in_progress') {
          score += 10;
          factors.push('< 10% concluído em produção (+10)');
        }

        // 4. Material risk
        if (materialNeeds) {
          const opsWithDeficit = materialNeeds.filter(m => m.status === 'critical' && m.relatedOPs.includes(o.order_number));
          if (opsWithDeficit.length > 0) {
            score += 5;
            factors.push(`Material crítico (${opsWithDeficit.length} itens, +5)`);
          }
        }

        // 5. Client orders (has sales_order_id = customer waiting)
        if (o.sales_order_id) {
          score += 5;
          factors.push('Pedido de cliente (+5)');
        }

        return { opId: o.id, opNumber: o.order_number, score: Math.round(score * 100) / 100, factors };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Auto-assign priority labels based on score thresholds
   */
  static scoreToPriority(score: number): string {
    if (score >= 50) return 'urgent';
    if (score >= 30) return 'high';
    if (score >= 15) return 'medium';
    return 'low';
  }
}

// ─── War Mode Service ────────────────────────────────────────
