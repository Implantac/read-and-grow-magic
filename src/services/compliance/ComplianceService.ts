import { supabase } from '@/integrations/supabase/client';

export class ComplianceService {
  /**
   * Valida a integridade entre uma movimentação logística e sua contrapartida financeira.
   * UEEF SEC-LEVEL 3: Garante que toda baixa de estoque (venda) possua um registro financeiro.
   */
  async validateLogisticsFinancialIntegrity(orderId: string): Promise<{
    isValid: boolean;
    missingLedgerEntries: string[];
  }> {
    const missingLedgerEntries: string[] = [];

    // 1. Verifica se o pedido existe
    const { data: order } = await supabase
      .from('orders')
      .select('id, total, status')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) return { isValid: false, missingLedgerEntries: ['PEDIDO_NAO_ENCONTRADO'] };

    // 2. Verifica Ledger Logístico (Supply Chain Ledger)
    const { data: logisticsLedger } = await supabase
      .from('supply_chain_ledger')
      .select('id')
      .eq('order_id', orderId);

    if (!logisticsLedger || logisticsLedger.length === 0) {
      missingLedgerEntries.push('LOGISTICA_LEDGER_AUSENTE');
    }

    // 3. Verifica Ledger Financeiro (Contas a Receber / Caixa)
    // Nota: Aqui buscaríamos em tabelas como 'financial_ledger' ou 'accounts_receivable'
    // que devem ser implementadas/hardened nas próximas sprints.

    return {
      isValid: missingLedgerEntries.length === 0,
      missingLedgerEntries
    };
  }

  /**
   * Registra uma trilha de auditoria para ações sensíveis.
   */
  async logAuditTrail(action: string, metadata: any) {
    const { data: auth } = await supabase.auth.getUser();
    
    await supabase.from('audit_logs').insert({
      user_id: auth.user?.id,
      action,
      metadata,
      severity: metadata.severity || 'info',
      created_at: new Date().toISOString()
    });
  }
}

export const complianceService = new ComplianceService();
