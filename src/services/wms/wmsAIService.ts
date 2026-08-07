import { supabase } from '@/integrations/supabase/client';

export class WMSAIService {
  /**
   * Generates slotting recommendations based on product movement (Curva ABC)
   */
  async getSlottingRecommendations(branchId: string) {
    // This would typically involve a complex query or RPC joining movements and inventory levels
    const { data, error } = await (supabase as any).rpc('get_wms_slotting_suggestions', {
      p_branch_id: branchId
    });

    if (error) {
      // Fallback/Mock logic if RPC not available
      return [
        {
          product_code: 'SKU-001',
          product_name: 'Widget A',
          current_location: 'END-A-01-05',
          suggested_location: 'END-PICK-01',
          reason: 'Alto giro detectado (Curva A)',
          potential_saving: '15% no tempo de picking'
        }
      ];
    }
    return data;
  }

  /**
   * Predictive analysis for stock-out risks
   */
  async getStockOutPredictions(companyId: string) {
    const { data, error } = await (supabase as any)
      .from('wms_ai_insights')
      .select('*')
      .eq('company_id', companyId)
      .eq('category', 'rupture')
      .eq('status', 'active');
    
    if (error) throw error;
    return data;
  }
}

export const wmsAIService = new WMSAIService();
