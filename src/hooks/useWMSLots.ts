import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StockLot {
  id: string;
  lotNumber: string;
  productId?: string;
  productCode: string;
  productName: string;
  supplier?: string;
  manufactureDate?: string;
  expirationDate?: string;
  quantity: number;
  remainingQty: number;
  origin: string;
  originReference?: string;
  location?: string;
  status: string;
  createdAt: string;
}

export function useWMSLots() {
  const [lots, setLots] = useState<StockLot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stock_lots')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar lotes'); }
    else setLots((data || []).map((r: any) => ({
      id: r.id, lotNumber: r.lot_number, productId: r.product_id,
      productCode: r.product_code, productName: r.product_name,
      supplier: r.supplier, manufactureDate: r.manufacture_date,
      expirationDate: r.expiration_date, quantity: Number(r.quantity),
      remainingQty: Number(r.remaining_qty), origin: r.origin,
      originReference: r.origin_reference, location: r.location,
      status: r.status, createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  const create = async (lot: {
    lot_number: string; product_code: string; product_name: string;
    product_id?: string; supplier?: string; manufacture_date?: string;
    expiration_date?: string; quantity: number; origin?: string;
    origin_reference?: string; location?: string;
  }) => {
    const { error } = await supabase.from('stock_lots').insert({
      ...lot, remaining_qty: lot.quantity,
    });
    if (error) { toast.error('Erro ao criar lote'); return false; }
    toast.success('Lote registrado!');
    await fetch();
    return true;
  };

  useEffect(() => { fetch(); }, [fetch]);
  return { lots, loading, refetch: fetch, create };
}
