# Gestão de Rede: Lojas + CD + Fábrica — Fase 1 a 5

Auditoria feita antes de qualquer alteração. O que segue consolida o que já existe, corrige o que está incompleto e só cria o que realmente falta.

## O que já existe e funciona

- Ciclo de transferência com 11 status (`transferWorkflow`), log de eventos e registro de divergências.
- Estoque com quantidade, reservado e em trânsito (`adjust_stock`), sem alteração direta de saldo pelas telas.
- Motor de reposição em lote, painel de reposição e mapa da rede na Central de Loja.
- WMS completo (recebimento, ondas, picking, packing, expedição, conferência, endereços).
- Rastreabilidade fim a fim por `correlation_id` até a emissão da nota.

## Problemas confirmados

1. **"Nova Transferência" não faz nada** — o botão da tela de Transferências não abre formulário; só existem transferências criadas por sugestão.
2. **Recebimento não é por item** — o avanço de status usa uma única quantidade para todos os produtos, então falta/excesso por produto fica errado e a divergência é gravada em todos os itens.
3. **Fluxo só anda para frente** — não há rejeitar, cancelar, recebimento parcial nem recebimento com divergência.
4. **Reserva de estoque incorreta** — a reserva usa a quantidade digitada em vez da quantidade de cada item.
5. **Loja não tem tela simples de receber** — hoje o recebimento exige entender o painel de workflow.
6. **Visão da rede fragmentada** — Central de Loja, Transferências, Estoque e WMS são entradas separadas, sem visão única por unidade (loja, CD, fábrica).

## Plano de execução

### Etapa 1 — Corrigir o motor de transferência
- Transição passa a aceitar quantidades **por item** (`{ itemId, receivedQty, divergenceReason }`).
- Reserva, expedição e recebimento passam a usar a quantidade de cada item.
- Novos estados: `REJEITADA`, `CANCELADA`, `RECEBIDA PARCIAL`, `RECEBIDA COM DIVERGÊNCIA`.
- Divergência gravada só no item divergente, com motivo (falta, excesso, avaria, produto errado).
- Guarda de transição: bloqueia salto de estado inválido e repetição do mesmo estado (evita dobrar estoque).

### Etapa 2 — Criar transferência de verdade
- Formulário "Nova Transferência": origem, destino, prioridade, motivo, itens com quantidade, validação de saldo disponível na origem (saldo − reservado).
- Aprovação com regra por quantidade: abaixo do limite aprova automático, acima exige gestor.

### Etapa 3 — Recebimento à prova de erro (loja)
- Tela "Receber mercadoria": lista o que está em trânsito para a unidade.
- Por transferência: Produto | Enviado | Recebido | Divergência, com "Receber tudo" e conferência manual.
- Ao confirmar: baixa trânsito, entra no estoque da loja, fecha ou marca divergência conforme o resultado.

### Etapa 4 — Central de Gestão da Rede
- Um único módulo com abas: Visão Geral, Estoque, Reposição, Transferências, Recebimentos, Lojas, CD/Fábrica, Auditoria.
- Seletor de escopo: rede inteira, empresa, filial, CD, fábrica ou loja — reaproveitando as telas já existentes, sem duplicá-las.
- Indicadores reais: ruptura prevista, excesso, estoque parado, em trânsito, atrasado, divergências.

### Etapa 5 — Testes
- Teste E2E do ciclo: solicitar → aprovar → reservar → separar → expedir → trânsito → receber parcial → divergência → encerrar, conferindo saldo de origem, trânsito e destino em cada passo.
- Varredura autenticada das telas afetadas.

## Detalhes técnicos

- Banco: novos valores de status no log/ordem; tabela de divergências já existe e passa a receber `item_id` e motivo tipado. Toda tabela nova/alterada mantém RLS por empresa e GRANTs.
- Serviços tocados: `transferWorkflow.ts`, `replenishmentEngine.ts`, `supplyChainService.ts`, `storeService.ts`.
- Telas tocadas: `StockTransfers.tsx`, `StoreCentral.tsx`, `StoreOperations.tsx`, novo `ReceberTransferencia`, nova casca da Central da Rede.
- Sem dados fictícios: tudo lido do banco; onde não houver dado, aparece estado vazio explicativo.

## Fora desta entrega

Integração com transportadora/rastreio externo e coletor por rádio-frequência dependem de serviço de terceiro; o sistema fica preparado, sem simulação.
