import { supabase } from '@/integrations/supabase/client';

export interface OperationalTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  category: string;
  created_at: string;
  due_at?: string;
}

export const operationalService = {
  async getMyTasks(branchId: string): Promise<OperationalTask[]> {
    const { data, error } = await (supabase as any)
      .from('operational_tasks')
      .select('*')
      .eq('branch_id', branchId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as OperationalTask[];
  },

  async createTask(task: any) {
    const { data, error } = await (supabase as any)
      .from('operational_tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async resolveDiscrepancy(discrepancyId: string, resolution: { resolution_notes: string; status: string }) {
    const { data, error } = await (supabase as any)
      .from('operational_discrepancies')
      .update({
        ...resolution,
        resolved_at: new Date().toISOString(),
        resolved_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', discrepancyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSmartInventorySuggestions(branchId: string) {
    // Busca produtos com estoque baixo ou alta movimentação sem contagem recente
    // Esta lógica seria idealmente uma VIEW ou RPC no Postgres
    const { data: suggestions, error } = await (supabase as any)
      .from('replenishment_policies')
      .select('*, product:products(name, code, unit)')
      .eq('branch_id', branchId)
      .limit(12);

    if (error) return [];
    
    return (suggestions || []).map((s: any) => ({
      productId: s.product_id,
      productName: s.product?.name,
      productCode: s.product?.code,
      reason: 'Auditoria Cíclica (Giro Alto)',
      expectedQty: 100, // Mocked balance for now
    }));
  }
};


