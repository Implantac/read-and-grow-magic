import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StockBalance {
  id: string;
  productId: string | null;
  productCode: string;
  productName: string;
  lotId: string | null;
  lotNumber: string | null;
  locationId: string | null;
  locationCode: string | null;
  warehouseId: string | null;
  dcId: string | null;
  stockStatus: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  unit: string;
  lastMovementAt: string | null;
}

export function useStockBalances() {
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_balances')
        .select('*')
        .order('product_name');
      if (error) throw error;
      setBalances((data || []).map(r => ({
        id: r.id,
        productId: r.product_id,
        productCode: r.product_code,
        productName: r.product_name,
        lotId: r.lot_id,
        lotNumber: r.lot_number,
        locationId: r.location_id,
        locationCode: r.location_code,
        warehouseId: r.warehouse_id,
        dcId: r.dc_id,
        stockStatus: r.stock_status,
        quantity: Number(r.quantity),
        reservedQty: Number(r.reserved_qty),
        availableQty: Number(r.available_qty),
        unit: r.unit,
        lastMovementAt: r.last_movement_at,
      })));
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar saldos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { balances, loading, refetch: fetchData };
}
