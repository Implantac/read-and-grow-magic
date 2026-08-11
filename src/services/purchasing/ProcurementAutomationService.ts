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

    // Busca produtos que precisam de reposição
    // Nota: Em um sistema real, aqui consideraríamos o estoque consolidado de todas as unidades
    // ou de uma unidade específica. Para este MVP, usamos o cadastro global do produto.
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .limit(LIST_LIMIT);

    if (error) throw error;

    // TODO: Integrar com a tabela de estoque real (inventory_ledger ou operational_units_stock)
    // Por enquanto, simulamos o 'current_stock' como sendo 0 para produtos abaixo do ponto de pedido
    // para demonstrar a lógica do serviço.
    
    return (products || [])
      .filter(p => (p.min_stock > 0 || p.reorder_point > 0))
      .map(p => ({
        product_id: p.id,
        product_name: p.name,
        product_code: p.code,
        current_stock: 0, // Placeholder: integrar com ledger de estoque
        min_stock: p.min_stock || 0,
        reorder_point: p.reorder_point || 0,
        suggested_quantity: (p.max_stock || p.min_stock * 2) - 0, 
        lead_time_days: p.lead_time_days || 0,
        supplier: p.supplier
      }))
      .filter(s => s.current_stock <= s.reorder_point);
  }

  private async resolveCompanyId(): Promise<string> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id) throw new Error('Sessão expirada');
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', auth.user.id)
      .maybeSingle();
    if (!profile?.company_id) throw new Error('Empresa não encontrada');
    return profile.company_id;
  }
}

export const procurementAutomationService = new ProcurementAutomationService();
