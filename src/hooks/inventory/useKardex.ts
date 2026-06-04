import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProductKardex, KardexEntry, MovementType } from '@/types/inventory';

export function useKardex(productId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['kardex', productId, startDate, endDate],
    queryFn: async () => {
      if (!productId) return null;

      // Fetch product info
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('code, name, unit, cost_price')
        .eq('id', productId)
        .single();

      if (productError || !product) throw productError || new Error('Produto não encontrado');

      // Fetch movements
      let query = supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data: movements, error: movementsError } = await query;

      if (movementsError) throw movementsError;

      // Process movements to calculate running balance and average cost
      let currentBalance = 0;
      let currentTotalValue = 0;
      const entries: KardexEntry[] = [];

      movements.forEach((m) => {
        const qty = Number(m.quantity);
        const unitCost = Number(m.unit_cost) || 0;
        
        if (m.direction === 'in') {
          currentBalance += qty;
          currentTotalValue += qty * unitCost;
        } else {
          // Weighted average cost is usually used for outflows
          const avgCost = currentBalance > 0 ? currentTotalValue / currentBalance : unitCost;
          currentBalance -= qty;
          currentTotalValue -= qty * avgCost;
        }

        const balance = currentBalance;
        const totalValue = currentTotalValue;
        const averageCost = balance > 0 ? totalValue / balance : unitCost;

        entries.push({
          id: m.id,
          date: m.created_at,
          documentNumber: m.document_number || 'N/A',
          type: m.type as MovementType,
          description: m.notes || m.reference || '',
          quantityIn: m.direction === 'in' ? qty : 0,
          quantityOut: m.direction === 'out' ? qty : 0,
          balance,
          unitCost,
          averageCost,
          totalValue,
        });
      });

      const kardex: ProductKardex = {
        productId,
        productCode: product.code || '',
        productName: product.name || '',
        unit: product.unit || 'un',
        currentBalance,
        currentAverageCost: currentBalance > 0 ? currentTotalValue / currentBalance : Number(product.cost_price),
        currentTotalValue,
        entries: entries.reverse(), // Show latest first in the UI table
      };

      return kardex;
    },
    enabled: !!productId,
  });
}

export function useKardexProducts() {
  return useQuery({
    queryKey: ['kardex-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, code, name')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });
}
