import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { InventoryItem, InventoryCount } from '@/types/wms';
import { toast } from 'sonner';

export function useWMSInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, countsRes] = await Promise.all([
        supabase.from('wms_inventory_items').select('*').order('product_name'),
        supabase.from('wms_inventory_counts').select('*').order('scheduled_date', { ascending: false }),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (countsRes.error) throw countsRes.error;

      const mappedItems: InventoryItem[] = (itemsRes.data || []).map((row) => ({
        id: row.id,
        productCode: row.product_code,
        productName: row.product_name,
        category: row.category || '',
        location: row.location || '',
        quantity: Number(row.quantity),
        reservedQty: Number(row.reserved_qty),
        availableQty: Number(row.available_qty),
        minStock: Number(row.min_stock),
        maxStock: Number(row.max_stock),
        unit: row.unit,
        batch: row.batch || undefined,
        expirationDate: row.expiration_date || undefined,
        status: row.status as InventoryItem['status'],
        lastMovement: row.last_movement || '',
        value: Number(row.value),
      }));

      const mappedCounts: InventoryCount[] = (countsRes.data || []).map((row) => ({
        id: row.id,
        countNumber: row.count_number,
        zone: row.zone || undefined,
        status: row.status as InventoryCount['status'],
        scheduledDate: row.scheduled_date,
        startedAt: row.started_at || undefined,
        completedAt: row.completed_at || undefined,
        itemsCount: row.items_count,
        discrepancies: row.discrepancies,
        operator: row.operator || undefined,
      }));

      setItems(mappedItems);
      setCounts(mappedCounts);
    } catch (error) {
      console.error('Error fetching WMS inventory:', error);
      toast.error('Erro ao carregar inventário WMS');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime: qualquer mudança nas tabelas do WMS re-busca os dados
  useEffect(() => {
    let mounted = true;
    const channelName = `wms-inventory-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelName);
    
    const handleChanges = () => {
      if (mounted) fetchData();
    };

    channel
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'wms_inventory_items' }, 
        handleChanges
      )
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'wms_inventory_counts' }, 
        handleChanges
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscribed successfully for WMS inventory');
        }
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { items, counts, loading, refetch: fetchData };
}
