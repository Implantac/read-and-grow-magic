import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnterprise } from "@/core/auth/EnterpriseContext";
import { toast } from "sonner";

export type TransferStatus = 
  | 'SUGERIDA' 
  | 'APROVADA' 
  | 'RESERVADA' 
  | 'SEPARAÇÃO' 
  | 'CONFERÊNCIA' 
  | 'EXPEDIDA' 
  | 'EM TRÂNSITO' 
  | 'RECEBIDA' 
  | 'CONFERIDA' 
  | 'ENCERRADA';

export function useSupplyChainExecution() {
  const { currentBranch } = useEnterprise();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.id;

  const tasksQuery = useQuery({
    queryKey: ['supply-chain-tasks', branchId],
    queryFn: async () => {
      if (!branchId) return [];
      
      // Busca transferências onde a unidade atual é origem ou destino e precisa de ação
      const { data, error } = await supabase
        .from('stock_transfer_orders')
        .select(`
          *,
          origin:origin_unit_id(name),
          destination:destination_unit_id(name),
          items:stock_transfer_items(
            *,
            product:product_id(name, code)
          )
        `)
        .or(`origin_unit_id.eq.${branchId},destination_unit_id.eq.${branchId}`)
        .not('current_status', 'in', '("ENCERRADA","CANCELADA")')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!branchId,
  });

  const inTransitQuery = useQuery({
    queryKey: ['stock-in-transit', branchId],
    queryFn: async () => {
      if (!branchId) return [];
      const { data, error } = await supabase
        .from('stock_transfer_orders')
        .select(`
          *,
          origin:origin_unit_id(name),
          items:stock_transfer_items(
            *,
            product:product_id(name, code)
          )
        `)
        .eq('destination_unit_id', branchId)
        .eq('current_status', 'EM TRÂNSITO');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!branchId,
  });

  return {
    tasks: tasksQuery.data || [],
    inTransit: inTransitQuery.data || [],
    isLoading: tasksQuery.isLoading || inTransitQuery.isLoading,
    refetch: () => {
      tasksQuery.refetch();
      inTransitQuery.refetch();
    }
  };
}
