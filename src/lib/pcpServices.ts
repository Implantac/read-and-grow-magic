/**
 * PCP Services — MRP, Scheduling, Simulation
 * Pure calculation layer, no persistence. Uses real data from hooks.
 */

import { differenceInDays, parseISO, addDays, format } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────

export interface MaterialNeed {
  materialCode: string;
  materialName: string;
  unit: string;
  totalRequired: number;
  inStock: number;
  deficit: number;
  coveragePct: number;
  relatedOPs: string[];
  status: 'ok' | 'partial' | 'critical';
  unitCost: number;
}

export interface SimulationScenario {
  name: string;
  description: string;
  delayedOPs?: { opId: string; delayDays: number }[];
  materialShortages?: { materialCode: string; reducePct: number }[];
  capacityChange?: { sector: string; changePct: number }[];
}

export interface SimulationResult {
  scenario: string;
  impactSummary: string;
  affectedOPs: { opNumber: string; originalDue: string; newEstimate: string; daysImpact: number; risk: 'low' | 'medium' | 'high' }[];
  materialImpact: { materialName: string; originalDeficit: number; newDeficit: number; change: number }[];
  kpis: { delayRate: number; avgLeadTimeChange: number; criticalOPs: number };
  suggestions: ActionSuggestion[];
}

export interface ActionSuggestion {
  type: 'anticipate' | 'purchase' | 'redistribute' | 'alert' | 'overtime';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  relatedOP?: string;
  estimatedImpact?: string;
}

export interface PCPMetrics {
  totalOPs: number;
  activeOPs: number;
  completedToday: number;
  avgLeadTimePlanned: number;
  avgLeadTimeReal: number;
  leadTimeVariance: number;
  delayRate: number;
  delayedCount: number;
  onTimeRate: number;
  efficiency: number;
  throughput: number;
  utilizationPct: number;
}

export interface ScheduleSlot {
  opId: string;
  opNumber: string;
  productName: string;
  sector: string;
  startDate: Date;
  endDate: Date;
  estHours: number;
  priority: string;
  isLate: boolean;
  willBeLate: boolean;
  criticalRatio: number;
}

// ─── MRP Service ─────────────────────────────────────────────

export class MRPService {
  /**
   * Calculate material needs from production orders and technical sheets
   */
  static calculateNeeds(
    activeOPs: any[],
    sheets: any[],
    supplies: any[]
  ): MaterialNeed[] {
    const needsMap: Record<string, { totalRequired: number; relatedOPs: string[]; unit: string; name: string }> = {};

    activeOPs.forEach(op => {
      const sheet = sheets.find((s: any) =>
        s.product_code === op.product_code || s.product_id === op.product_id
      );
      if (sheet && Array.isArray(sheet.materials)) {
        const remaining = Math.max(0, op.quantity - op.produced_quantity);
        sheet.materials.forEach((mat: any) => {
          const code = mat.code || mat.componentCode || mat.material_code || '';
          const name = mat.name || mat.componentName || mat.material_name || code;
          const qtyPerUnit = mat.quantity || mat.qty || 0;
          const waste = mat.waste_pct || mat.wastePercentage || 0;
          const needed = remaining * qtyPerUnit * (1 + waste / 100);
          if (!needsMap[code]) needsMap[code] = { totalRequired: 0, relatedOPs: [], unit: mat.unit || 'UN', name };
          needsMap[code].totalRequired += needed;
          if (!needsMap[code].relatedOPs.includes(op.order_number)) needsMap[code].relatedOPs.push(op.order_number);
        });
      }
    });

    return Object.entries(needsMap).map(([code, data]) => {
      const supply = supplies.find((s: any) => s.code === code || s.name === data.name);
      const inStock = supply?.current_quantity || 0;
      const deficit = Math.max(0, data.totalRequired - inStock);
      const coveragePct = data.totalRequired > 0 ? Math.min(100, (inStock / data.totalRequired) * 100) : 100;
      let status: 'ok' | 'partial' | 'critical' = 'ok';
      if (coveragePct < 50) status = 'critical';
      else if (coveragePct < 100) status = 'partial';

      return {
        materialCode: code,
        materialName: data.name,
        unit: data.unit,
        totalRequired: Math.ceil(data.totalRequired * 100) / 100,
        inStock,
        deficit: Math.ceil(deficit * 100) / 100,
        coveragePct: Math.round(coveragePct),
        relatedOPs: data.relatedOPs,
        status,
        unitCost: supply?.unit_cost || 0,
      };
    }).sort((a, b) => a.coveragePct - b.coveragePct);
  }

  /**
   * Generate smart suggestions based on material needs and OPs
   */
  static generateSuggestions(
    needs: MaterialNeed[],
    activeOPs: any[],
    capacities: any[]
  ): ActionSuggestion[] {
    const suggestions: ActionSuggestion[] = [];

    // Critical material shortages
    const criticals = needs.filter(n => n.status === 'critical');
    if (criticals.length > 0) {
      suggestions.push({
        type: 'purchase',
        severity: 'critical',
        title: `${criticals.length} material(is) em estado crítico`,
        description: `Materiais ${criticals.slice(0, 3).map(c => c.materialName).join(', ')} com cobertura abaixo de 50%. Gere pedido de compra urgente.`,
        estimatedImpact: `R$ ${criticals.reduce((s, c) => s + c.deficit * c.unitCost, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em compras necessárias`,
      });
    }

    // OPs at risk due to material
    const opsAtRisk = new Set<string>();
    criticals.forEach(c => c.relatedOPs.forEach(op => opsAtRisk.add(op)));
    if (opsAtRisk.size > 0) {
      suggestions.push({
        type: 'alert',
        severity: 'warning',
        title: `${opsAtRisk.size} OP(s) em risco por falta de material`,
        description: `Ordens ${[...opsAtRisk].slice(0, 3).join(', ')} podem parar por falta de insumos. Priorize compras ou redistribua.`,
      });
    }

    // Overdue OPs
    const today = new Date();
    const overdueOPs = activeOPs.filter(o => o.due_date && new Date(o.due_date) < today);
    overdueOPs.forEach(op => {
      const daysLate = differenceInDays(today, new Date(op.due_date));
      suggestions.push({
        type: 'anticipate',
        severity: daysLate > 5 ? 'critical' : 'warning',
        title: `OP ${op.order_number} atrasada ${daysLate} dia(s)`,
        description: `Produto: ${op.product_name}. Pendente: ${op.quantity - op.produced_quantity} un. Considere hora extra ou redistribuição.`,
        relatedOP: op.order_number,
        estimatedImpact: `${daysLate} dias de atraso no prazo de entrega`,
      });
    });

    // About-to-be-late OPs
    activeOPs.filter(o => {
      if (!o.due_date || overdueOPs.includes(o)) return false;
      const daysLeft = differenceInDays(new Date(o.due_date), today);
      const remaining = o.quantity - o.produced_quantity;
      const avgTimePerUnit = o.estimated_time_minutes / Math.max(o.quantity, 1);
      const estDaysNeeded = (remaining * avgTimePerUnit) / (8 * 60);
      return estDaysNeeded > daysLeft && daysLeft <= 5;
    }).forEach(op => {
      suggestions.push({
        type: 'anticipate',
        severity: 'warning',
        title: `OP ${op.order_number} pode atrasar`,
        description: `Prazo em ${differenceInDays(new Date(op.due_date), today)} dias, mas estimativa de conclusão é maior. Antecipe ou aumente capacidade.`,
        relatedOP: op.order_number,
      });
    });

    return suggestions.sort((a, b) => {
      const sev = { critical: 0, warning: 1, info: 2 };
      return (sev[a.severity] || 2) - (sev[b.severity] || 2);
    });
  }
}

// ─── Scheduling Service ──────────────────────────────────────

export class SchedulingService {
  static readonly PRIORITY_MAP: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

  /**
   * Sequence OPs based on multiple criteria
   */
  static sequenceOPs(
    activeOPs: any[],
    capacities: any[],
    algorithm: 'priority_due' | 'edd' | 'spt' | 'lpt' | 'critical_ratio' = 'priority_due'
  ): ScheduleSlot[] {
    const totalCapPerDay = capacities.reduce((s: number, c: any) => s + (c.capacity_per_hour || 0) * (c.max_hours_per_day || 8), 0);
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

    slots.sort((a: any, b: any) => {
      switch (algorithm) {
        case 'edd': return a._dueIn - b._dueIn;
        case 'spt': return a._estMinutes - b._estMinutes;
        case 'lpt': return b._estMinutes - a._estMinutes;
        case 'critical_ratio': return b.criticalRatio - a.criticalRatio;
        default:
          if (a.isLate !== b.isLate) return a.isLate ? -1 : 1;
          if (a.willBeLate !== b.willBeLate) return a.willBeLate ? -1 : 1;
          const pDiff = a._priorityNum - b._priorityNum;
          return pDiff !== 0 ? pDiff : a._dueIn - b._dueIn;
      }
    });

    // Calculate start/end dates sequentially
    let cumHours = 0;
    return slots.map((slot: any) => {
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
    capacities: any[]
  ): { sector: string; ops: number; hours: number; capacity: number; loadPct: number; isOverloaded: boolean }[] {
    const sectorLoad: Record<string, { ops: number; hours: number; capacity: number }> = {};

    capacities.forEach((c: any) => {
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

export class SimulationService {
  /**
   * Run a what-if simulation without persisting data
   */
  static simulate(
    scenario: SimulationScenario,
    orders: any[],
    sheets: any[],
    supplies: any[],
    capacities: any[]
  ): SimulationResult {
    const today = new Date();

    // Clone data for simulation (no mutations to originals)
    let simOrders = orders.map(o => ({ ...o }));
    let simSupplies = supplies.map(s => ({ ...s }));
    let simCapacities = capacities.map(c => ({ ...c }));

    // Apply delay scenario
    if (scenario.delayedOPs) {
      scenario.delayedOPs.forEach(d => {
        const op = simOrders.find(o => o.id === d.opId);
        if (op && op.due_date) {
          op.due_date = addDays(parseISO(op.due_date), d.delayDays).toISOString();
        }
      });
    }

    // Apply material shortage scenario
    if (scenario.materialShortages) {
      scenario.materialShortages.forEach(ms => {
        const sup = simSupplies.find(s => s.code === ms.materialCode || s.name === ms.materialCode);
        if (sup) {
          sup.current_quantity = Math.max(0, sup.current_quantity * (1 - ms.reducePct / 100));
        }
      });
    }

    // Apply capacity changes
    if (scenario.capacityChange) {
      scenario.capacityChange.forEach(cc => {
        simCapacities.filter(c => c.sector === cc.sector).forEach(c => {
          c.capacity_per_hour = Math.max(0, c.capacity_per_hour * (1 + cc.changePct / 100));
        });
      });
    }

    // Calculate original and simulated needs
    const activeOPs = simOrders.filter(o => ['planned', 'in_progress', 'paused'].includes(o.status));
    const originalNeeds = MRPService.calculateNeeds(
      orders.filter(o => ['planned', 'in_progress', 'paused'].includes(o.status)),
      sheets, supplies
    );
    const simNeeds = MRPService.calculateNeeds(activeOPs, sheets, simSupplies);

    // Calculate impact on OPs
    const affectedOPs = activeOPs
      .filter(o => o.due_date)
      .map(o => {
        const origOrder = orders.find(orig => orig.id === o.id);
        const origDue = origOrder?.due_date || o.due_date;
        const remaining = Math.max(0, o.quantity - o.produced_quantity);
        const avgTime = o.estimated_time_minutes / Math.max(o.quantity, 1);
        const totalCap = simCapacities.reduce((s: number, c: any) => s + (c.capacity_per_hour || 0) * 8, 0);
        const estDays = totalCap > 0 ? remaining / totalCap : 999;
        const newEstimate = format(addDays(today, Math.ceil(estDays)), 'yyyy-MM-dd');
        const daysImpact = differenceInDays(parseISO(newEstimate), parseISO(origDue));
        let risk: 'low' | 'medium' | 'high' = 'low';
        if (daysImpact > 5) risk = 'high';
        else if (daysImpact > 0) risk = 'medium';

        return {
          opNumber: o.order_number,
          originalDue: format(parseISO(origDue), 'dd/MM/yyyy'),
          newEstimate: format(parseISO(newEstimate), 'dd/MM/yyyy'),
          daysImpact,
          risk,
        };
      })
      .filter(o => o.daysImpact !== 0)
      .sort((a, b) => b.daysImpact - a.daysImpact);

    // Material impact comparison
    const materialImpact = simNeeds.map(sn => {
      const orig = originalNeeds.find(on => on.materialCode === sn.materialCode);
      return {
        materialName: sn.materialName,
        originalDeficit: orig?.deficit || 0,
        newDeficit: sn.deficit,
        change: sn.deficit - (orig?.deficit || 0),
      };
    }).filter(m => m.change !== 0);

    // KPIs
    const delayedInSim = affectedOPs.filter(o => o.daysImpact > 0).length;
    const totalActive = activeOPs.filter(o => o.due_date).length;

    const suggestions = MRPService.generateSuggestions(simNeeds, activeOPs, simCapacities);

    return {
      scenario: scenario.name,
      impactSummary: `Cenário "${scenario.name}": ${affectedOPs.length} OPs impactadas, ${delayedInSim} com atraso adicional.`,
      affectedOPs,
      materialImpact,
      kpis: {
        delayRate: totalActive > 0 ? (delayedInSim / totalActive) * 100 : 0,
        avgLeadTimeChange: affectedOPs.length > 0 ? affectedOPs.reduce((s, o) => s + o.daysImpact, 0) / affectedOPs.length : 0,
        criticalOPs: affectedOPs.filter(o => o.risk === 'high').length,
      },
      suggestions,
    };
  }

  /**
   * Generate preset scenarios for quick simulation
   */
  static presetScenarios(orders: any[], supplies: any[], capacities: any[]): SimulationScenario[] {
    const scenarios: SimulationScenario[] = [];

    // Scenario 1: Main material shortage
    if (supplies.length > 0) {
      const topMaterial = supplies.sort((a: any, b: any) => (b.current_quantity || 0) - (a.current_quantity || 0))[0];
      scenarios.push({
        name: 'Falta de material principal',
        description: `Redução de 50% no estoque de ${topMaterial?.name || 'material'}`,
        materialShortages: [{ materialCode: topMaterial?.code || '', reducePct: 50 }],
      });
    }

    // Scenario 2: Capacity reduction
    const sectors = [...new Set(capacities.map((c: any) => c.sector))];
    if (sectors.length > 0) {
      scenarios.push({
        name: 'Redução de capacidade (-30%)',
        description: `Redução de 30% na capacidade de ${sectors[0]}`,
        capacityChange: [{ sector: sectors[0], changePct: -30 }],
      });
    }

    // Scenario 3: Delay of urgent OPs
    const urgentOPs = orders.filter(o => o.priority === 'urgent' && ['planned', 'in_progress'].includes(o.status));
    if (urgentOPs.length > 0) {
      scenarios.push({
        name: 'Atraso em OPs urgentes (+5 dias)',
        description: `Simulação de atraso de 5 dias nas ${urgentOPs.length} OPs urgentes`,
        delayedOPs: urgentOPs.map(o => ({ opId: o.id, delayDays: 5 })),
      });
    }

    // Scenario 4: Overtime (+20% capacity)
    if (sectors.length > 0) {
      scenarios.push({
        name: 'Hora extra (+20% capacidade)',
        description: `Aumento de 20% na capacidade de todos os setores`,
        capacityChange: sectors.map(s => ({ sector: s, changePct: 20 })),
      });
    }

    return scenarios;
  }
}

// ─── Metrics Service ─────────────────────────────────────────

export class PCPMetricsService {
  static calculate(orders: any[], timeEntries: any[], capacities: any[]): PCPMetrics {
    const today = new Date();
    const todayStr = today.toDateString();
    const activeStatuses = ['planned', 'in_progress', 'paused'];
    const activeOPs = orders.filter(o => activeStatuses.includes(o.status));
    const completedOPs = orders.filter(o => o.status === 'completed');
    const completedToday = completedOPs.filter(o => o.completed_date && new Date(o.completed_date).toDateString() === todayStr);

    // Lead times
    const leadTimes = completedOPs
      .filter(o => o.start_date && o.completed_date)
      .map(o => ({
        planned: o.estimated_time_minutes || 0,
        real: differenceInDays(new Date(o.completed_date), new Date(o.start_date)) * 8 * 60,
      }));

    const avgPlanned = leadTimes.length > 0 ? leadTimes.reduce((s, l) => s + l.planned, 0) / leadTimes.length : 0;
    const avgReal = leadTimes.length > 0 ? leadTimes.reduce((s, l) => s + l.real, 0) / leadTimes.length : 0;

    // Delay rate
    const withDueDate = orders.filter(o => o.due_date && o.status !== 'cancelled');
    const delayed = withDueDate.filter(o => {
      if (o.status === 'completed' && o.completed_date) {
        return new Date(o.completed_date) > new Date(o.due_date);
      }
      return new Date() > new Date(o.due_date) && o.status !== 'completed';
    });

    // Efficiency
    const totalProduced = completedOPs.reduce((s, o) => s + o.produced_quantity, 0);
    const totalPlanned = completedOPs.reduce((s, o) => s + o.quantity, 0);
    const efficiency = totalPlanned > 0 ? (totalProduced / totalPlanned) * 100 : 0;

    // Throughput (completed OPs in last 30 days)
    const last30 = completedOPs.filter(o => o.completed_date && differenceInDays(today, new Date(o.completed_date)) <= 30);
    const throughput = last30.length;

    // Utilization
    const totalCapHrs = capacities.reduce((s: number, c: any) => s + (c.capacity_per_hour || 0) * (c.max_hours_per_day || 8), 0) * 22;
    const totalUsedHrs = activeOPs.reduce((s, o) => s + (o.realized_time_minutes || 0) / 60, 0);
    const utilizationPct = totalCapHrs > 0 ? (totalUsedHrs / totalCapHrs) * 100 : 0;

    return {
      totalOPs: orders.length,
      activeOPs: activeOPs.length,
      completedToday: completedToday.length,
      avgLeadTimePlanned: Math.round(avgPlanned / 60),
      avgLeadTimeReal: Math.round(avgReal / 60),
      leadTimeVariance: avgPlanned > 0 ? Math.round(((avgReal - avgPlanned) / avgPlanned) * 100) : 0,
      delayRate: withDueDate.length > 0 ? Math.round((delayed.length / withDueDate.length) * 100) : 0,
      delayedCount: delayed.length,
      onTimeRate: withDueDate.length > 0 ? Math.round(((withDueDate.length - delayed.length) / withDueDate.length) * 100) : 0,
      efficiency: Math.round(efficiency),
      throughput,
      utilizationPct: Math.round(utilizationPct),
    };
  }
}
