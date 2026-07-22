import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { MaterialNeed } from './types';

export function useMRPPurchaseOrder(materialNeeds: MaterialNeed[], supplies: any[]) {
  const [generatingPO, setGeneratingPO] = useState(false);

  const handleGeneratePurchaseOrder = async () => {
    const deficits = materialNeeds.filter(m => m.deficit > 0);
    if (deficits.length === 0) return;
    setGeneratingPO(true);
    try {
      const poNumber = `PC-MRP-${format(new Date(), 'yyyyMMdd-HHmm')}`;
      const totalValue = deficits.reduce((s, m) => {
        const supply = supplies.find(su => su.code === m.materialCode || su.name === m.materialName);
        return s + m.deficit * (supply?.unit_cost || 0);
      }, 0);
      const supplierName = deficits[0]?.supplier || 'A definir';

      const { data: po, error: poErr } = await (supabase as any).from('purchase_orders').insert({
        number: poNumber,
        supplier_name: supplierName,
        status: 'draft',
        total: totalValue,
        notes: `Gerado automaticamente pelo MRP com ${deficits.length} item(s) em déficit`,
      }).select('id').single();

      if (poErr) throw poErr;

      for (const m of deficits) {
        const supply = supplies.find(su => su.code === m.materialCode || su.name === m.materialName);
        await (supabase as any).from('purchase_order_items').insert({
          purchase_order_id: po.id,
          product_code: m.materialCode,
          product_name: m.materialName,
          quantity: m.deficit,
          unit_price: supply?.unit_cost || 0,
          total: m.deficit * (supply?.unit_cost || 0),
          unit: m.unit,
        });
      }

      toast.success(`Pedido de compra ${poNumber} gerado com ${deficits.length} itens`);
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao gerar pedido de compra');
    } finally {
      setGeneratingPO(false);
    }
  };

  return { generatingPO, handleGeneratePurchaseOrder };
}
