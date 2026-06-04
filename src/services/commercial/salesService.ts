import { supabase } from '@/integrations/supabase/client';
import { DbSale, CreateSaleInput } from '@/types/commercial';

export const salesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return (data as any[]).map((s) => ({
      ...s,
      items: s.sale_items || [],
    })) as DbSale[];
  },

  async create(input: CreateSaleInput) {
    // Get next number
    const { count } = await supabase.from('sales').select('id', { count: 'exact', head: true });
    const nextNum = `VND${String((count || 0) + 1).padStart(4, '0')}`;

    const subtotal = input.items.reduce((s, i) => s + (i.quantity * i.unit_price), 0);
    const discount = input.items.reduce((s, i) => s + (i.discount || 0), 0);
    const total = subtotal - discount;

    const { data: sale, error: saleError } = await supabase.from('sales').insert({
      number: nextNum,
      client_id: input.client_id || null,
      client_name: input.client_name,
      payment_method: input.payment_method,
      subtotal,
      discount,
      total,
      notes: input.notes || null,
      status: 'completed',
    }).select().single();
    
    if (saleError) throw saleError;

    const items = input.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.product_id || null,
      product_name: item.product_name,
      product_code: item.product_code,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount || 0,
      total: (item.quantity * item.unit_price) - (item.discount || 0),
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(items);
    if (itemsError) throw itemsError;

    return sale;
  }
};
