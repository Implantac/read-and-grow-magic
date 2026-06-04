/**
 * Unified PCP Intelligence Hook
 * Aggregates MRP, Scheduling, and Simulation services into proactive alerts & metrics
 */
import { useMemo } from 'react';
import { useProductionOrders } from '@/hooks/production/useProductionOrders';
import { useProductionCapacity } from '@/hooks/production/useProductionCapacity';
import { useTechnicalSheets } from '@/hooks/production/useTechnicalSheets';
import { useSupplyStock } from '@/hooks/inventory/useSupplyStock';
import { useTimeEntries } from '@/hooks/system/useTimeEntries';
import { MRPService, SchedulingService, PCPMetricsService, type ActionSuggestion, type PCPMetrics, type MaterialNeed, type ScheduleSlot } from '@/lib/pcpServices';
import { differenceInDays, differenceInMinutes } from 'date-fns';

export interface PCPIntelligence {
  /** Proactive suggestions sorted by severity */
  suggestions: ActionSuggestion[];
  /** Material needs from MRP explosion */
  materialNeeds: MaterialNeed[];
  /** Sequenced OPs */
  scheduledSlots: ScheduleSlot[];
  /** PCP metrics */
  metrics: PCPMetrics;
  /** Quick summary counts */
  summary: {
    criticalAlerts: number;
    warningAlerts: number;
    materialsInDeficit: number;
    opsAtRisk: number;
    opsLate: number;
    bottleneckSectors: number;
    oee: number;
    onTimePct: number;
  };
  loading: boolean;
}

export function usePCPIntelligence(): PCPIntelligence {
  const { orders, loading: loadingOrders } = useProductionOrders();
  const { capacities } = useProductionCapacity();
  const { sheets, loading: loadingSheets } = useTechnicalSheets();
  const { supplies, loading: loadingSupplies } = useSupplyStock();
  const { entries } = useTimeEntries();

  const loading = loadingOrders || loadingSheets || loadingSupplies;

  const activeOPs = useMemo(() =>
    orders.filter(o => ['planned', 'in_progress', 'paused'].includes(o.status)),
    [orders]
  );

  const materialNeeds = useMemo(() =>
    MRPService.calculateNeeds(activeOPs, sheets, supplies),
    [activeOPs, sheets, supplies]
  );

  const suggestions = useMemo(() =>
    MRPService.generateSuggestions(materialNeeds, activeOPs, capacities),
    [materialNeeds, activeOPs, capacities]
  );

  const scheduledSlots = useMemo(() =>
    SchedulingService.sequenceOPs(activeOPs, capacities, 'priority_due'),
    [activeOPs, capacities]
  );

  const resourceLoad = useMemo(() =>
    SchedulingService.calculateResourceLoad(scheduledSlots, capacities),
    [scheduledSlots, capacities]
  );

  const metrics = useMemo(() =>
    PCPMetricsService.calculate(orders, entries, capacities),
    [orders, entries, capacities]
  );

  const summary = useMemo(() => {
    const criticalAlerts = suggestions.filter(s => s.severity === 'critical').length;
    const warningAlerts = suggestions.filter(s => s.severity === 'warning').length;
    const materialsInDeficit = materialNeeds.filter(m => m.deficit > 0).length;
    const today = new Date();
    const opsLate = activeOPs.filter(o => o.due_date && new Date(o.due_date) < today).length;
    const opsAtRisk = scheduledSlots.filter(s => s.willBeLate && !s.isLate).length;
    const bottleneckSectors = resourceLoad.filter(r => r.isOverloaded).length;

    // OEE
    const totalTarget = orders.filter(o => ['completed', 'in_progress'].includes(o.status)).reduce((s, o) => s + o.quantity, 0);
    const totalProduced = orders.reduce((s, o) => s + o.produced_quantity, 0);
    const totalRejected = orders.reduce((s, o) => s + o.rejected_quantity, 0);
    const totalEst = orders.reduce((s, o) => s + o.estimated_time_minutes, 0);
    const totalReal = orders.reduce((s, o) => s + o.realized_time_minutes, 0);
    const avail = totalEst > 0 ? Math.min(totalReal / totalEst, 1) : 0;
    const perf = totalTarget > 0 ? Math.min(totalProduced / totalTarget, 1) : 0;
    const qual = totalProduced > 0 ? (totalProduced - totalRejected) / totalProduced : 1;
    const oee = avail * perf * qual * 100;

    const completedWithDates = orders.filter(o => o.status === 'completed' && o.completed_date && o.due_date);
    const onTimeCount = completedWithDates.filter(o => new Date(o.completed_date!) <= new Date(o.due_date!)).length;
    const onTimePct = completedWithDates.length > 0 ? (onTimeCount / completedWithDates.length) * 100 : 0;

    return { criticalAlerts, warningAlerts, materialsInDeficit, opsAtRisk, opsLate, bottleneckSectors, oee, onTimePct };
  }, [suggestions, materialNeeds, activeOPs, scheduledSlots, resourceLoad, orders]);

  return { suggestions, materialNeeds, scheduledSlots, metrics, summary, loading };
}
