import { useMemo } from 'react';
import { parseISO, differenceInDays } from 'date-fns';
import type { ProductionOrderRow } from '@/hooks/production/useProductionOrders';
import { KANBAN_COLUMNS } from '../constants';

export function useKanbanDerived(params: {
  orders: ProductionOrderRow[];
  outsourcingOrders: any[];
  workCenters: any[];
  productCosts: Record<string, number>;
  wipLimits: Record<string, number>;
  searchTerm: string;
  sectorFilter: string;
  priorityFilter: string;
}) {
  const { orders, outsourcingOrders, workCenters, productCosts, wipLimits, searchTerm, sectorFilter, priorityFilter } = params;

  const sectors = useMemo(
    () => [...new Set(orders.map(o => o.sector || o.work_center).filter(Boolean))],
    [orders],
  );

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status === 'cancelled' || o.status === 'draft') return false;
      const term = searchTerm.toLowerCase();
      const matchSearch = !term ||
        o.order_number.toLowerCase().includes(term) ||
        o.product_name.toLowerCase().includes(term) ||
        (o.client_name || '').toLowerCase().includes(term);
      const matchSector = sectorFilter === 'all' || o.sector === sectorFilter || o.work_center === sectorFilter;
      const matchPriority = priorityFilter === 'all' || o.priority === priorityFilter;
      return matchSearch && matchSector && matchPriority;
    });
  }, [orders, searchTerm, sectorFilter, priorityFilter]);

  const outsourcingByOP = useMemo(() => {
    const map: Record<string, any[]> = {};
    outsourcingOrders.forEach(oo => {
      if (!map[oo.production_order_id]) map[oo.production_order_id] = [];
      map[oo.production_order_id].push(oo);
    });
    return map;
  }, [outsourcingOrders]);

  const columns = useMemo(() => {
    const pMap: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return KANBAN_COLUMNS.map(col => ({
      ...col,
      items: filteredOrders.filter(o => o.status === col.key)
        .sort((a, b) => {
          if ((b.priority_score || 0) !== (a.priority_score || 0)) return (b.priority_score || 0) - (a.priority_score || 0);
          const pDiff = (pMap[a.priority] ?? 9) - (pMap[b.priority] ?? 9);
          if (pDiff !== 0) return pDiff;
          if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          return 0;
        }),
      wipLimit: wipLimits[col.key] || 0,
    }));
  }, [filteredOrders, wipLimits]);

  const lateCount = orders.filter(o => o.due_date && differenceInDays(new Date(), parseISO(o.due_date)) > 0 && !['completed', 'cancelled'].includes(o.status)).length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length;
  const outsourcedCount = orders.filter(o => o.status === 'outsourced').length;
  const completedToday = orders.filter(o => o.status === 'completed' && o.completed_date && new Date(o.completed_date).toDateString() === new Date().toDateString()).length;
  const waitingMaterialCount = orders.filter(o => o.status === 'waiting_material').length;

  const capacityLoad = useMemo(() => {
    const load: Record<string, { name: string; capacity: number; allocated: number }> = {};
    workCenters.filter(wc => wc.is_active).forEach(wc => {
      load[wc.id] = { name: wc.name, capacity: wc.capacity, allocated: 0 };
    });
    orders.filter(o => ['planned', 'in_progress', 'waiting_material'].includes(o.status)).forEach(o => {
      const wcId = (o as any).work_center_id;
      if (wcId && load[wcId]) load[wcId].allocated += o.quantity;
    });
    return load;
  }, [workCenters, orders]);

  const wipMetrics = useMemo(() => {
    const wipStatuses = ['planned', 'waiting_material', 'in_progress', 'outsourced', 'finishing', 'paused'];
    const wipOrders = orders.filter(o => wipStatuses.includes(o.status));
    const totalQty = wipOrders.reduce((s, o) => s + (o.quantity - o.produced_quantity), 0);
    const totalCost = wipOrders.reduce((s, o) => {
      const unitCost = o.product_id ? (productCosts[o.product_id] || 0) : 0;
      return s + (o.quantity - o.produced_quantity) * unitCost;
    }, 0);

    const byColumn: Record<string, { count: number; qty: number; cost: number }> = {};
    wipOrders.forEach(o => {
      if (!byColumn[o.status]) byColumn[o.status] = { count: 0, qty: 0, cost: 0 };
      const remaining = o.quantity - o.produced_quantity;
      const unitCost = o.product_id ? (productCosts[o.product_id] || 0) : 0;
      byColumn[o.status].count++;
      byColumn[o.status].qty += remaining;
      byColumn[o.status].cost += remaining * unitCost;
    });

    return { totalOrders: wipOrders.length, totalQty, totalCost, byColumn };
  }, [orders, productCosts]);

  return { sectors, filteredOrders, outsourcingByOP, columns, lateCount, inProgressCount, outsourcedCount, completedToday, waitingMaterialCount, capacityLoad, wipMetrics };
}
