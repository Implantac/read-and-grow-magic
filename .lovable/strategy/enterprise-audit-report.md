# Auditoria e Plano de Implementação: READ & GROW Enterprise

## 1. Arquitetura Atual vs. Alvo

### Estado Atual (Diagnóstico)
O sistema possui uma fundação sólida baseada em **Domínios**, **Eventos** e **Orquestradores**. A infraestrutura utiliza Supabase (RLS ativado) e React com Zustand para estado global e Event Bus.

**Pontos Críticos Identificados:**
- **Risco de Duplicidade:** Módulos como `Inventory`, `WMS` e `Store Operations` possuem áreas de intersecção que podem gerar lógica redundante.
- **Acoplamento de Eventos:** O `EventBus` foi estabilizado para evitar o erro #185, mas a cadeia de eventos cross-module ainda precisa de maior rastreabilidade (`correlation_id`).
- **Workflow Logístico:** A `transferWorkflow` está funcional, mas a blindagem contra ajustes diretos de estoque fora do workflow ainda é parcial.

---

## 2. Mapa de Domínios e Responsabilidades

| Domínio | Responsabilidade Central | Status Atual |
| :--- | :--- | :--- |
| **CORE** | Identidade, Tenant, Eventos, Configuração, Auditoria | **Estabilizado (P0)** |
| **INVENTORY** | **Verdade Única do Estoque**. Saldo, Reserva, Trânsito, Kardex | **Robustecendo (P2)** |
| **COMMERCIAL** | Vendas, Pedidos (O2C), Preços, Clientes | **Operacional** |
| **STORE OPS** | Experiência "Minha Loja", Tarefas, Recebimento Operacional | **Em Expansão (P3)** |
| **WMS** | Execução Física (Picking, Packing, Expedição, Endereçamento) | **Integrando (P6)** |
| **FINANCIAL** | Contas AP/AR, Fluxo de Caixa, Conciliação | **Operacional (P8)** |
| **FISCAL** | Documentos Fiscais (NF-e, etc), Impostos, SPED | **Operacional (P8)** |

---

## 3. Matriz de Entidades e Donos (Contratos P1)

| Entidade | Dono (Escrita) | Consumidores Principais | Eventos Publicados |
| :--- | :--- | :--- | :--- |
| `stock_balances` | **Inventory** | WMS, Commercial, Production | `STOCK_MOVED` |
| `transfer_orders` | **WMS / Store Ops** | Inventory, Fiscal, Financial | `TRANSFER_SHIPPED`, `TRANSFER_RECEIVED` |
| `operational_tasks` | **Core / Orchestration** | Store Ops, WMS | `TASK_COMPLETED` |
| `audit_logs` | **Core** | Todos os módulos | - |

---

## 4. Plano de Implementação Priorizado

### P0 — Estabilização e Arquitetura (FINALIZADO/MANUTENÇÃO)
- [x] Fix React #185 (Double-Lock Event Bus).
- [x] Atomic Session Sync no `EnterpriseContext`.
- [ ] Implementar `RenderDepthMonitor` em rotas críticas para prevenção de regressão.

### P1 — Core + Contratos (PRÓXIMO PASSO)
- [ ] Centralizar Políticas de Tenant (Ex: `allow_negative_stock`) em um `PolicyEngine` no Core.
- [ ] Padronizar o `correlation_id` em todos os `audit_logs` e `ledger`.

### P2 — Estoque (Fonte Única)
- [ ] Blindar `adjust_stock` RPC para exigir um `origin_type` e `origin_id`.
- [ ] Consolidar a visualização de Kardex cross-module.

### P3 — Operação de Loja (Cockpit "Minha Loja")
- [ ] Evoluir o `StoreCentral.tsx` para ser o ponto de entrada único.
- [ ] Widget de "Ações Urgentes" baseado em exceções (Ruptura, Atraso).

### P4 — Transferências (Workflow End-to-End)
- [ ] Integrar emissão automática de NF-e de transferência no status `EXPEDIDA`.
- [ ] Workflow de Divergência automático no recebimento.

### P5 — Reabastecimento (Motor de Inteligência)
- [ ] Evoluir `SmartReplenishment` com dados de previsão de vendas do Comercial.

---

## 5. Riscos e Mitigação
- **Risco:** Duplicação de lógica de cálculo de impostos entre Comercial e Fiscal.
- **Mitigação:** Toda regra de imposto deve residir no `fiscalService` e ser consumida pelo `Commercial` via hook.

**Status da Auditoria:** Concluída. Pronto para iniciar P1.
