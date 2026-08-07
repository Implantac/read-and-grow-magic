import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

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
    const { data, error } = await supabase
      .from('operational_tasks')
      .select('*')
      .eq('branch_id', branchId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  },

  async createTask(task: TablesInsert<'operational_tasks'>) {
    const { data, error } = await supabase
      .from('operational_tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async resolveDiscrepancy(discrepancyId: string, resolution: { notes: string; status: string }) {
    const { data, error } = await supabase
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
  }
};
