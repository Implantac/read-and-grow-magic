# Plano de Evolução Enterprise: Fase 4 - Expansão e Refinamento UX

Este plano detalha a transição da Fase 3 (Governança) para a Fase 4 (Expansão Operacional), focando na consolidação dos fluxos O2C/P2P e na padronização da experiência do usuário (UX) em conformidade com as diretrizes de "Software House".

## 1. Consolidação do Núcleo Operacional (O2C/P2P)
- **Unificação de Hooks**: Consolidar `useOrders` e `useAccountsReceivable` para garantir que o faturamento dispare automaticamente a criação de títulos financeiros e rascunhos de NF-e.
- **Hardening de Status**: Evoluir os enums de status para estados imutáveis protegidos por RLS e Triggers, similares ao Ledger implementado na Fase 3.

## 2. Padronização de UX/UI Professional
- **Operational Feedback**: Implementar `OperationalFeedback` em todos os diálogos de confirmação (Excluir, Cancelar, Aprovar).
- **Empty States**: Aplicar o componente `EmptyState` em todas as tabelas e grids quando não houver dados, removendo mensagens de texto simples.
- **Wizards Multi-etapas**: Refatorar o `CreateOrderDialog` e `UnifiedSupplyChain` para usar Steppers, reduzindo a carga cognitiva em formulários longos.

## 3. Inteligência e Automação
- **Sourcing IA**: Iniciar o motor de sugestão de compras baseado em demanda histórica e estoque mínimo (MRP básico).
- **Dashboard Executivo**: Integrar os KPIs de governança (Ledger activity) no `DailyReports`.

## Detalhes Técnicos
- Refatoração de `src/modules/commercial/Orders.tsx` para integrar `OperationalFeedback`.
- Atualização de `src/modules/admin/enterprise-config/EnterpriseConfig.tsx` com novas flags de governança.
- Limpeza de casts `as any` remanescentes em `src/services/commercial/orderService.ts`.

---
*Equipe Multidisciplinar Use Sistemas (Software House)*
