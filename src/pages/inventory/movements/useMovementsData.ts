import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useInventory } from '@/hooks/inventory/useInventoryQuery';
import type {
  StockMovement,
  MovementType,
  MovementDirection,
  MovementFilters,
} from '@/types/inventory';

export function useMovementsData() {
  const { movements: dbMovements, movementsLoading: loading } = useInventory();

  const movements = useMemo<StockMovement[]>(
    () =>
      (dbMovements || []).map((m: any) => ({
        id: m.id,
        documentNumber: m.document_number,
        productId: m.product_id || '',
        productCode: m.products?.code || '',
        productName: m.products?.name || '',
        type: m.type as MovementType,
        direction: m.direction as MovementDirection,
        quantity: m.quantity,
        unitCost: m.unit_cost,
        totalCost: m.total_cost,
        batch: m.batch,
        fromWarehouse: m.from_warehouse,
        toWarehouse: m.to_warehouse,
        reference: m.reference,
        notes: m.notes,
        operator: m.operator,
        createdAt: m.created_at,
      })),
    [dbMovements],
  );

  const [filters, setFilters] = useState<MovementFilters>({
    search: '',
    type: 'all',
    direction: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const filteredMovements = useMemo(
    () =>
      movements.filter((movement) => {
        const q = filters.search.toLowerCase();
        const matchesSearch =
          filters.search === '' ||
          movement.productName.toLowerCase().includes(q) ||
          movement.productCode.toLowerCase().includes(q) ||
          movement.documentNumber.toLowerCase().includes(q);
        const matchesType = filters.type === 'all' || movement.type === filters.type;
        const matchesDirection =
          filters.direction === 'all' || movement.direction === filters.direction;
        return matchesSearch && matchesType && matchesDirection;
      }),
    [movements, filters],
  );

  const stats = useMemo(() => {
    const totalEntries = movements
      .filter((m) => m.direction === 'in')
      .reduce((acc, m) => acc + m.totalCost, 0);
    const totalExits = movements
      .filter((m) => m.direction === 'out')
      .reduce((acc, m) => acc + m.totalCost, 0);
    const today = format(new Date(), 'yyyy-MM-dd');
    const movementsToday = movements.filter(
      (m) => format(new Date(m.createdAt), 'yyyy-MM-dd') === today,
    ).length;
    return {
      totalEntries,
      totalExits,
      movementsToday,
      entriesCount: movements.filter((m) => m.direction === 'in').length,
      exitsCount: movements.filter((m) => m.direction === 'out').length,
    };
  }, [movements]);

  return { movements, filteredMovements, filters, setFilters, stats, loading };
}
