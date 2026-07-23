import { useState } from 'react';
import { useProductionOrders } from '@/hooks/production/useProductionOrders';
import { useProductionTimeLogs } from '@/hooks/production/useProductionTimeLogs';
import { useOutsourcingOrders } from '@/hooks/production/useOutsourcingOrders';
import { usePCPIntelligence } from '@/hooks/production/usePCPIntelligence';
import { useTechnicalSheets } from '@/hooks/production/useTechnicalSheets';
import { useSupplyStock } from '@/hooks/inventory/useSupplyStock';
import { useProductionCapacity } from '@/hooks/production/useProductionCapacity';
import { useWorkCenters } from '@/hooks/production/useWorkCenters';
import { useProductCosts } from './hooks/useProductCosts';
import { useKanbanRealtime } from './hooks/useKanbanRealtime';
import { useWipLimits } from './hooks/useWipLimits';
import { useKanbanDerived } from './hooks/useKanbanDerived';
import { useKanbanSuggestions } from './hooks/useKanbanSuggestions';
import { useKanbanActions } from './hooks/useKanbanActions';

export function useProductionKanban() {
  const { orders, loading, update, refetch } = useProductionOrders();
  const timeLogs = useProductionTimeLogs();
  const { orders: outsourcingOrders, lateOrders: lateOutsourcing } = useOutsourcingOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useTechnicalSheets();
  useSupplyStock();
  const { capacities } = useProductionCapacity();
  const { workCenters } = useWorkCenters();
  const intelligence = usePCPIntelligence();

  const productCosts = useProductCosts(orders);
  useKanbanRealtime(refetch);
  const wipLimits = useWipLimits();

  const derived = useKanbanDerived({
    orders, outsourcingOrders, workCenters, productCosts, wipLimits,
    searchTerm, sectorFilter, priorityFilter,
  });

  const suggestions = useKanbanSuggestions({
    orders, lateOutsourcing, columns: derived.columns,
    capacityLoad: derived.capacityLoad, wipMetrics: derived.wipMetrics,
  });

  const actions = useKanbanActions({
    orders, update, refetch, capacityLoad: derived.capacityLoad,
    wipLimits, intelligence, capacities,
  });

  return {
    loading,
    timeLogs,
    searchTerm, setSearchTerm,
    sectorFilter, setSectorFilter,
    priorityFilter, setPriorityFilter,
    sectors: derived.sectors,
    columns: derived.columns,
    outsourcingByOP: derived.outsourcingByOP,
    lateCount: derived.lateCount,
    inProgressCount: derived.inProgressCount,
    outsourcedCount: derived.outsourcedCount,
    completedToday: derived.completedToday,
    waitingMaterialCount: derived.waitingMaterialCount,
    wipMetrics: derived.wipMetrics,
    suggestions,
    ...actions,
  };
}
