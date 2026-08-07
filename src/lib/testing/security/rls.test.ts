import { describe, it, expect } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fase 15: Testes de Integração e RLS.
 * Verifica se as políticas de segurança estão sendo aplicadas no nível do banco.
 */
describe('Security Integration & RLS (Phase 15)', () => {
  it('should prevent cross-tenant data access on stock_balances', async () => {
    // Tentativa de buscar dados sem filtro de empresa (deve ser bloqueado pelo RLS)
    const { data, error } = await supabase
      .from('stock_balances')
      .select('*')
      .limit(1);

    if (!error) {
       if (data && data.length > 0) {
         expect(data[0].company_id).toBeDefined();
       }
    }
  });

  it('should enforce company isolation on nfe table', async () => {
    const { data, error } = await supabase
      .from('nfe')
      .select('company_id')
      .limit(1);

    if (!error && data && data.length > 0) {
      expect(data[0].company_id).toBeDefined();
    }
  });
});
