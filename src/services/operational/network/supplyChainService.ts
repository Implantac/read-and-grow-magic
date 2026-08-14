import { supabase } from "@/integrations/supabase/client";
import { TransferStatus } from "@/services/operational/inventory/transferWorkflow";

export const supplyChainService = {
  /**
   * Obtém a necessidade de abastecimento para uma unidade específica,
   * cruzando o saldo projetado com as políticas de estoque.
   */
  async getUnitSupplyNeeds(branchId: string) {
    const { data: policies, error: policiesError } = await supabase
      .from('replenishment_policies')
      .select('*, product:products(name, code, min_stock, max_stock)')
      .eq('branch_id', branchId);

    if (policiesError) throw policiesError;

    const { data: balances, error: balancesError } = await supabase
      .from('stock_balances')
      .select('*')
      .eq('branch_id', branchId);

    if (balancesError) throw balancesError;

    return (policies || []).map(policy => {
      const balance = balances?.find(b => b.product_id === policy.product_id);
      const physical = Number(balance?.quantity || 0);
      const reserved = Number(balance?.reserved_qty || 0);
      // in_transit_in_quantity não existe no banco, usando 0 ou buscando de transferências se necessário
      const inTransit = 0; 
      
      const projected = physical - reserved + inTransit;
      const target = policy.min_stock || policy.product?.min_stock || 0;


      
      return {
        product_id: policy.product_id,
        name: policy.product?.name,
        code: policy.product?.code,
        projected,
        target,
        need: Math.max(0, target - projected),
        status: projected < (target * 0.3) ? 'critical' : projected < target ? 'attention' : 'normal'
      };
    }).filter(item => item.need > 0);
  }
};
