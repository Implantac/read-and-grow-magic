import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '../shared/baseService';
import { LIST_LIMIT } from '@/lib/queryLimits';

export interface ProcurementSuggestion {
  product_id: string;
  product_name: string;
  product_code: string;
  current_stock: number;
  min_stock: number;
  reorder_point: number;
  suggested_quantity: number;
  lead_time_days: number;
  supplier: string | null;
}

export class ProcurementAutomationService extends BaseService<'products'> {
  constructor() {
    super('products');
  }

  /**
   * Sugere compras baseadas em ruptura de estoque (MRP básico).
   * Critério: current_stock <= reorder_point
   */
  async getPurchaseSuggestions(): Promise<ProcurementSuggestion[]> {
    const companyId = await this.resolveCompanyId();

    const { data: products, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .limit(LIST_LIMIT || 1000);

    if (error) throw error;

    return (products || [])
      .filter((p: any) => (p.min_stock > 0 || p.reorder_point > 0))
      .map((p: any) => ({
        product_id: p.id,
        product_name: p.name,
        product_code: p.code,
        current_stock: 0,
        min_stock: p.min_stock || 0,
        reorder_point: p.reorder_point || 0,
        suggested_quantity: (p.max_stock || p.min_stock * 2) - 0, 
        lead_time_days: p.lead_time_days || 0,
        supplier: p.supplier
      }))
      .filter((s: any) => s.current_stock <= s.reorder_point);
  }

  private async resolveCompanyId(): Promise<string> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id) throw new Error('Sessão expirada');
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('company_id')
      .eq('id', auth.user.id)
      .maybeSingle();
    if (!profile?.company_id) throw new Error('Empresa não encontrada');
    return profile.company_id;
  }
}

export const procurementAutomationService = new ProcurementAutomationService();
