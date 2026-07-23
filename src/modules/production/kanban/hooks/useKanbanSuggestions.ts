import { useMemo } from 'react';
import { parseISO, differenceInDays } from 'date-fns';
import { formatBRL } from '@/lib/formatters';
import { KANBAN_COLUMNS } from '../constants';

export function useKanbanSuggestions(params: {
  orders: any[];
  lateOutsourcing: any[];
  columns: any[];
  capacityLoad: Record<string, { name: string; capacity: number; allocated: number }>;
  wipMetrics: { totalCost: number; byColumn: Record<string, { count: number; qty: number; cost: number }> };
}) {
  const { orders, lateOutsourcing, columns, capacityLoad, wipMetrics } = params;
  return useMemo(() => {
    const list: { icon: string; text: string; severity: 'critical' | 'warning' | 'info' }[] = [];

    orders.filter(o => o.due_date && differenceInDays(new Date(), parseISO(o.due_date)) > 0 && !['completed', 'cancelled'].includes(o.status))
      .slice(0, 3).forEach(o => {
        list.push({ icon: '🔴', text: `OP ${o.order_number} atrasada ${differenceInDays(new Date(), parseISO(o.due_date))}d → priorizar`, severity: 'critical' });
      });

    lateOutsourcing.slice(0, 2).forEach(oo => {
      list.push({ icon: '🟠', text: `Fornecedor ${oo.supplier_name} em atraso → risco de parada`, severity: 'warning' });
    });

    orders.filter(o => o.status === 'waiting_material').slice(0, 2).forEach(o => {
      list.push({ icon: '📦', text: `OP ${o.order_number} aguardando material → verificar estoque`, severity: 'info' });
    });

    Object.values(capacityLoad).forEach(cl => {
      const pct = cl.capacity > 0 ? (cl.allocated / cl.capacity) * 100 : 0;
      if (pct > 100) {
        list.push({ icon: '🔴', text: `Centro "${cl.name}" com ${pct.toFixed(0)}% de carga (${cl.allocated}/${cl.capacity}) → sobrecarga`, severity: 'critical' });
      } else if (pct >= 85) {
        list.push({ icon: '🟡', text: `Centro "${cl.name}" com ${pct.toFixed(0)}% de carga → próximo do limite`, severity: 'warning' });
      }
    });

    columns.forEach(col => {
      if (col.wipLimit > 0 && col.items.length >= col.wipLimit * 0.9 && col.items.length < col.wipLimit) {
        list.push({ icon: '⚡', text: `"${col.label}" próximo do limite WIP (${col.items.length}/${col.wipLimit})`, severity: 'warning' });
      }
    });

    if (wipMetrics.totalCost > 0) {
      Object.entries(wipMetrics.byColumn).forEach(([status, data]) => {
        if (data.count > 10) {
          const statusLabel = KANBAN_COLUMNS.find(c => c.key === status)?.label || status;
          list.push({ icon: '🏭', text: `${statusLabel}: ${data.count} OPs com ${data.qty} un em WIP (${formatBRL(data.cost)})`, severity: 'warning' });
        }
      });
    }

    return list;
  }, [orders, lateOutsourcing, columns, capacityLoad, wipMetrics]);
}
