import { test } from '@playwright/test';

test.describe('Produção - Golden Path', () => {
  test.fixme('deve completar fluxo completo de manufatura (PCP)', async () => {
    // 1. Definição de BOM (Estrutura)
    // 2. Cálculo de Necessidade (MRP)
    // 3. Ordem de Produção (OP)
    // 4. Reserva de Insumos
    // 5. Apontamento de Produção
    // 6. Controle de Qualidade
    // 7. Entrada de Produto Acabado no Estoque
    // Pendente: fixture determinística e asserções de consumo, qualidade e saldo final.
  });
});
