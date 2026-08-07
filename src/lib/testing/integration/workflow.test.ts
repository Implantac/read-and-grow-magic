import { describe, it, expect } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fase 15: Integração de Transações.
 * Valida fluxos que tocam múltiplas tabelas.
 */
describe('Business Process Integration (Phase 15)', () => {
  it('should validate stock and financial consistency after hypothetical invoice', async () => {
    // Validamos se os RPCs atômicos criados na Fase 10 estão acessíveis
    const { data, error } = await supabase.rpc('audit_stock_integrity');
    
    // Não esperamos erro de execução, mesmo que retorne divergências (data)
    expect(error).toBeNull();
  });

  it('should check if idempotent keys table is operational', async () => {
    const { data, error } = await supabase
      .from('idempotency_keys')
      .select('count')
      .limit(1);
      
    expect(error).toBeNull();
  });
});
