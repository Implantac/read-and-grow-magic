# Mapa de Processos Empresariais (Business Processes)

Este documento define os fluxos operacionais ponta a ponta do READ & GROW, garantindo que a tecnologia suporte o negócio de forma coesa.

## 1. Order-to-Cash (O2C)
O ciclo completo desde a intenção de compra até o reconhecimento da receita.
- **Trigger**: Cliente solicita orçamento ou faz pedido no PDV/Ecommerce.
- **Fluxo**:
  1. **Orçamento**: Registro da intenção com validade de preço.
  2. **Aprovação**: Checagem de crédito (`useCreditCheck`) e margem (`useOrderProfitability`).
  3. **Pedido**: Conversão de orçamento em pedido firme.
  4. **Reserva**: Bloqueio de estoque físico no WMS (`stock_balances`).
  5. **Separação (Picking)**: Geração de tarefa no WMS para o estoquista.
  6. **Faturamento**: Emissão de NF-e e geração de título no Financeiro.
  7. **Expedição**: Despacho com rastreabilidade via Manifesto/TMS.
  8. **Financeiro**: Lançamento em Contas a Receber.
  9. **Conciliação**: Baixa automática via importação de extrato/PIX.
  10. **NPS**: Disparo de pesquisa de satisfação pós-entrega.

## 2. Procure-to-Pay (P2P)
Gestão do suprimento e relacionamento com fornecedores.
- **Trigger**: Ruptura de estoque (MRP) ou solicitação manual.
- **Fluxo**:
  1. **Solicitação**: Necessidade de compra identificada.
  2. **Cotação**: Comparativo entre fornecedores cadastrados.
  3. **Aprovação**: Fluxo de alçada baseado em valor/centro de custo.
  4. **Pedido de Compra**: Envio formal ao fornecedor.
  5. **Recebimento**: Conferência cega via WMS (`WMSConference`).
  6. **Entrada**: Registro da NF-e de entrada e atualização do Kardex.
  7. **Financeiro**: Lançamento em Contas a Pagar.
  8. **Pagamento**: Baixa via remessa bancária ou PIX.

## 3. Planejamento e Controle de Produção (PCP)
Transformação de materiais com foco em eficiência (OEE).
- **Trigger**: Pedido de venda (MTO) ou previsão de demanda (MTS).
- **Fluxo**:
  1. **MRP**: Explosão da árvore de produtos (BOM) e cálculo de faltas.
  2. **Ordem de Produção (OP)**: Documento mestre de fabricação.
  3. **Separação**: Envio de insumos para a linha de produção.
  4. **Apontamento**: Registro de início, paradas e fim via terminal industrial.
  5. **Qualidade**: Inspeção baseada em amostragens ou 100%.
  6. **Produto Acabado**: Entrada no estoque e encerramento da OP.

## 4. Supply Chain (Abastecimento Unificado)
Movimentação entre unidades da rede (Hub-and-Spoke).
- **Origens**: Fábrica ou Centro de Distribuição (CD).
- **Destinos**: Lojas ou CDs regionais.
- **Fluxo**:
  1. **Solicitação de Ressuprimento**: Baseada em estoque mínimo ou sugestão IA.
  2. **Aprovação**: Validação pela central de abastecimento.
  3. **Transferência**: Geração de NF-e de transferência e saída do estoque.
  4. **Trânsito**: Monitoramento via Torre de Controle.
  5. **Recebimento**: Conferência na unidade de destino e entrada no saldo local.

---
*Assinado: Analista de Sistemas & Product Manager (Software House)*
