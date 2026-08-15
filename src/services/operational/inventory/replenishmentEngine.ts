import { stockEngine, ProjectedStockResult } from './stockEngine';
import { supabase } from "@/integrations/supabase/client";

export interface ReplenishmentRecommendation {
  productId: string;
  productName: string;
  branchId: string;
  branchName: string;
  requiredQty: number;
  suggestedQty: number;
  coverageResult: ProjectedStockResult;
  sourceType: 'CD' | 'STORE' | 'PURCHASE' | 'PRODUCTION';
  sourceBranchId?: string;
  sourceBranchName?: string;
  reason: string;
  urgency: 'critical' | 'attention' | 'normal';
}

export const replenishmentEngine = {
  /**
   * P10 - Replenishment Intelligence
   * Calcula a necessidade de reposição e prescreve a melhor origem.
   */
  async getPrescriptiveRecommendation(productId: string, branchId: string): Promise<ReplenishmentRecommendation | null> {
    // 1. Obter dados de estoque e política da filial destino
    const { data: stockData } = await (supabase as any)
      .from('stock_balances')
      .select('*, products(name, cost_price), branches(name, company_id)')
      .eq('branch_id', branchId)
      .eq('product_id', productId)
      .single();

    if (!stockData) return null;

    const { data: policy } = await (supabase as any)
      .from('replenishment_policies')
      .select('*')
      .eq('branch_id', branchId)
      .eq('product_id', productId)
      .maybeSingle();

    const minStock = policy?.min_stock || 10;
    const targetStock = policy?.target_stock || 30;

    const analysis = stockEngine.calculateProjected(stockData);
    
    // Análise de Ruptura Antecipada (Item 14)
    const isCritical = analysis.status === 'critical' || analysis.coverageDays < 2;
    
    if (!isCritical && analysis.status !== 'attention') {
      return null;
    }

    const requiredQty = Math.max(0, targetStock - analysis.projected);
    if (requiredQty <= 0) return null;

    const companyId = stockData.branches?.company_id;

    // 2. Localizar Melhor Origem (Motor de Origem - Item 9)
    // Prioridade: CD Central -> Lojas com Excesso -> Pedido Compra
    const { data: networkStock } = await (supabase as any)
      .from('stock_balances')
      .select('*, branches(name, type)')
      .eq('product_id', productId)
      .neq('branch_id', branchId);

    const cdSource = networkStock?.find((s: any) => s.branches?.type === 'CD' && s.quantity > requiredQty);
    
    if (cdSource) {
      return {
        productId,
        productName: stockData.products?.name,
        branchId,
        branchName: stockData.branches?.name,
        requiredQty,
        suggestedQty: requiredQty,
        coverageResult: analysis,
        sourceType: 'CD',
        sourceBranchId: cdSource.branch_id,
        sourceBranchName: cdSource.branches?.name,
        reason: analysis.coverageDays < 2 ? `Ruptura iminente em ${analysis.coverageDays.toFixed(1)} dias. CD possui disponibilidade imediata.` : 'Reposição recomendada via CD central.',
        urgency: isCritical ? 'critical' : 'attention',
        companyId
      };
    }

    const excessSource = networkStock?.find((s: any) => {
      const sAnalysis = stockEngine.calculateProjected(s);
      return sAnalysis.status === 'excess' && sAnalysis.excessQty > requiredQty;
    });

    if (excessSource) {
      return {
        productId,
        productName: stockData.products?.name,
        branchId,
        branchName: stockData.branches?.name,
        requiredQty,
        suggestedQty: requiredQty,
        coverageResult: analysis,
        sourceType: 'STORE',
        sourceBranchId: excessSource.branch_id,
        sourceBranchName: excessSource.branches?.name,
        reason: `Excesso de estoque identificado na ${excessSource.branches?.name} (${analysis.excessQty} un). Remanejamento ideal para cobertura.`,
        urgency: isCritical ? 'critical' : 'attention',
        companyId
      };
    }

    return {
      productId,
      productName: stockData.products?.name,
      branchId,
      branchName: stockData.branches?.name,
      requiredQty,
      suggestedQty: requiredQty,
      coverageResult: analysis,
      sourceType: 'PURCHASE',
      reason: 'Estoque zerado em toda a rede. Recomendação de urgência para Pedido de Compra.',
      urgency: 'critical',
      companyId
    };
  }
};
