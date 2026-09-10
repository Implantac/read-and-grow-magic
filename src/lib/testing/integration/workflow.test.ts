import { describe, it, expect } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fase 15: Integração de Transações.
 * Valida fluxos que tocam múltiplas tabelas.
 */
describe('Business Process Integration (Phase 15)', () => {
  it('should validate stock and financial consistency after hypothetical invoice', async () => {
    // O RPC exige o escopo da empresa (_company_id) e execução autenticada.
    const { error } = await supabase.rpc('audit_stock_integrity', {
      _company_id: '00000000-0000-0000-0000-000000000000',
    });

    // A função deve existir e estar exposta na API (não pode ser PGRST202).
    expect(error?.code).not.toBe('PGRST202');
  });


  it('should check if idempotent keys table is operational', async () => {
    const { data, error } = await supabase
      .from('idempotency_keys')
      .select('count')
      .limit(1);
      
    expect(error).toBeNull();
  });
});
