# Plano de Implementação: Evolução ERP Enterprise

Este plano detalha a estratégia para transformar o READ & GROW em uma plataforma ERP Enterprise integrada, seguindo a ordem de prioridade definida pela Auditoria Técnica.

## FASE P0 — Estabilização e Arquitetura
**Objetivo:** Garantir a saúde do Core e prevenir regressões de renderização.
- Implementar monitoramento de profundidade de renderização em rotas críticas.
- Refinar o `EventBus` para suportar `correlation_id` nativamente.

## FASE P1 — Core + Contratos
**Objetivo:** Definir a governança de dados.
- Criar o `PolicyEngine` centralizado no Core para gerir capacidades por Tenant.
- Padronizar contratos de eventos cross-module (Schemas de Eventos).

## FASE P2 — Estoque (Fonte Única da Verdade)
**Objetivo:** Centralizar toda movimentação física e lógica.
- Migrar lógicas dispersas de ajuste de saldo para o `InventoryOrchestrator`.
- Implementar o `MovementLedger` com rastreabilidade total (Quem, Quando, Por que, Documento Origem).

## FASE P3 — Operação de Loja ("Minha Loja")
**Objetivo:** Unificar a experiência do usuário final.
- Consolidar `StoreCentral` como cockpit único, eliminando navegação fragmentada.
- Implementar a "Fila Única de Trabalho" baseada em `operational_tasks`.

## FASES SUBSEQUENTES (P4 a P10)
- **P4/P5:** Workflow de Transferência e Motor de Reabastecimento com IA.
- **P6:** Integração invisível do WMS nas tarefas de loja.
- **P7/P8:** Fechamento dos ciclos de Compras, Produção, Fiscal e Financeiro.
- **P9/P10:** Central de Exceções e Inteligência Preditiva.

## Detalhes Técnicos
- **Correlation ID:** UUID único gerado no início de um processo (ex: Solicitação de Compra) que viaja por todos os logs e tabelas até o fim (ex: Pagamento/Escrituração).
- **Eventual Consistency:** Uso de processamento assíncrono para operações não críticas (notificações, BI) via Event Bus.
- **RLS Hardening:** Garantir que o isolamento de Tenant e Filial seja imposto no banco, não no código.
