import { supabase } from "@/integrations/supabase/client";

/**
 * IA CORPORATIVA - CÉREBRO EMPRESARIAL
 * Provedor de inteligência cross-módulo
 */

export const askCorporateBrain = async (question: string, context: any) => {
  const { data, error } = await supabase.functions.invoke('ai-brain', {
    body: { question, context }
  });

  if (error) throw error;
  return data;
};

export const getStrategicInsights = async (module: string, companyId: string) => {
  const { data } = await supabase
    .from('ai_action_logs')
    .select('*')
    .eq('company_id', companyId)
    .eq('module', module)
    .order('created_at', { ascending: false })
    .limit(5);
    
  return data;
};
