import { test, expect } from '@playwright/test';

test.describe('Compras - Golden Path', () => {
  test.fixme('deve completar fluxo completo de suprimentos', async () => {
    // 1. Necessidade/Solicitação
    // 2. Cotação de Fornecedores
    // 3. Pedido de Compra
    // 4. Recebimento (Check-in/WMS)
    // 5. Atualização de Estoque
    // 6. Registro no Contas a Pagar
    // Pendente: fixture determinística e asserções de estoque e contas a pagar.
  });
});
