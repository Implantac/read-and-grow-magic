# Master Transformation Audit (Diagnóstico Mestre) - 2026-08-11

## 1. Estado Atual
O projeto Use ERP & WMS possui uma base técnica robusta (React, Vite, Supabase) e uma amplitude funcional vasta, cobrindo desde CRM até PCP Industrial e WMS. O desafio atual é a **profundidade operacional** e a **coesão sistêmica**. O sistema opera em modo Multi-tenant com RLS rigoroso e possui governança de dados via Ledger Logístico (Fase 3/4).

## 2. Arquitetura Atual
- **Frontend**: SPA React com Vite. Design System baseado em Shadcn/UI (Prefix `ui/base`).
- **Navegação**: Estrutura modular em `src/config/navigation/sections`.
- **Layout**: `MainLayout` com `Sidebar`, `Topbar`, `Breadcrumbs`, `CommandPalette` (Busca Global) e `BrainDrawer` (IA).
- **Backend**: Supabase (Auth, DB, Realtime, Edge Functions).
- **Camada de Dados**: React Query + Services/Hooks customizados em `src/services` e `src/hooks`.

## 3. Domínios e Módulos
- **CORE/ADMIN**: Gestão de empresas, usuários, permissões (RBAC) e auditoria.
- **COMERCIAL**: CRM, Pedidos, Orçamentos, Funil e Inteligência de Vendas.
- **LOGÍSTICA/WMS**: Estoque Matrix, Kardex, Picking/Packing, Rastreabilidade e Movimentação entre Unidades.
- **PRODUÇÃO/PCP**: Ordens de Produção, OEE, IoT Telemetry e PCP Inteligente.
- **FINANCEIRO**: Tesouraria, Contas A Pagar/Receber, Fluxo de Caixa e Conciliação.
- **FISCAL**: Emissão NF-e/NFCe, SPED e Regras Tributárias.

## 4. Processos Empresariais Mapeados
- **Order-to-Cash (O2C)**: Implementado do pedido à entrega, com integração financeira.
- **Procure-to-Pay (P2P)**: Presente na automação de compras (MRP) e contas a pagar.
- **Supply Chain**: Modelo Hub-and-Spoke para abastecimento de rede.

## 5. Funcionalidades Completas (A)
- **Autenticação & Multi-tenancy**: RLS e isolamento por `company_id`.
- **RBAC**: Permissões granulares implementadas.
- **Auditoria**: Logs de segurança e Ledger Logístico imutável.
- **Busca Global**: `CommandPalette` funcional (Ctrl+K).
- **Notificações**: `NotificationsMenu` e `useNotifications` integrados.

## 6. Funcionalidades Parciais (B)
- **Visões 360°**: `Client360Drawer` e `Sales360` existem, mas faltam visões equivalentes para **Produto 360** (WMS/Industrial) e **Fornecedor 360**.
- **Lifecycle das Entidades**: Estados implementados visualmente (wizards), mas falta padronização de "Workflow Engine" para aprovações transversais (ex: descontos comerciais que afetam financeiro).

## 7. Funcionalidades Isoladas (C)
- **NPS**: Micro-serviço funcional, mas carece de gatilhos automáticos após entrega final no WMS/TMS.

## 8. Duplicações Reais
- **Hooks de Dados**: Identificada sobreposição em hooks de `Orders`, `Customers` e `Inventory` (estoque v1 vs estoque matrix).

## 9. Problemas de UX
- **Padronização de Feedbacks**: Algumas telas novas ainda carecem de `OperationalFeedback` (Loading/Empty/Error) consistente.
- **Breadcrumbs**: Implementado no layout global, mas nem todas as rotas profundas mapeiam corretamente o caminho hierárquico.

## 10. Problemas Arquiteturais
- **Inter-módulos**: O módulo comercial acessa diretamente tabelas de estoque em alguns pontos, violando a fronteira de domínios (Service -> Service).

## 11. Plano de Execução (Próximos Passos)

### Backlog P0 (Bloqueadores)
- [ ] Verificação final de isolamento RLS em tabelas de auditoria cruzada.

### Backlog P1 (Críticos - Faltantes)
- [ ] **Produto 360**: Tela centralizando dados de estoque, vendas, produção e custos para um SKU.
- [ ] **Fornecedor 360**: Tela centralizando compras, prazos, qualidade e financeiro.
- [ ] **Workflow Engine Central**: Módulo para configurar alçadas de aprovação (Compras > X, Desconto > Y).
- [ ] **Padronização de Lifecycle**: Unificar `OrderStatus`, `MovementStatus` e `ProductionStatus` em um motor de estados consistente.

### Backlog P2 (Alto)
- [ ] Consolidação de hooks duplicados (Commercial/CRM).
- [ ] Refatoração de componentes gigantes (> 400 linhas) identificados na auditoria técnica.

---
*Assinado: Software House Completa (Analista, Arquiteto e Desenvolvedores)*
