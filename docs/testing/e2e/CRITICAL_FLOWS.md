# Fluxos Críticos de Teste E2E - READ & GROW
Data: 2026-08-06

## Fluxo 1: Reserva de Estoque e Venda
1. Selecionar Produto A (Estoque: 1).
2. Tentar reservar 1 unidade.
3. Tentar reservar +1 unidade (deve falhar).
4. Concluir venda.
5. Validar baixa física.

## Fluxo 2: Pagamento e Conciliação
1. Criar Título a Receber.
2. Registrar Recebimento Parcial.
3. Importar OFX.
4. Auto-conciliar.
5. Validar saldo na conta bancária.

## Fluxo 3: Emissão de NF-e
1. Gerar Pedido.
2. Emitir NF-e.
3. Validar Status SEFAZ.
4. Validar Registro no Fiscal.
