# Master Plan — Fase de Governança e Consolidação (Equipe Software House)

Este plano visa elevar o patamar de profissionalização do Read & Grow, transformando a amplitude funcional em profundidade operacional, conforme a nova diretriz de "Software House".

## 1. Discovery & Baseline (Fase 0) - CONCLUÍDO
Realizamos uma auditoria profunda do estado atual, mapeando diretórios, serviços, hooks e o esquema do banco de dados.
- Criado `docs/governance/MASTER_TRANSFORMATION_AUDIT.md` (Relatório mestre).
- Criado `docs/governance/CURRENT_STATE.md` (Status técnico atual).
- Criado `docs/architecture/SYSTEM_MAP.md` (Mapa de domínios).
- Criado `docs/business/BUSINESS_PROCESSES.md` (Mapeamento de O2C, P2P, etc).

## 2. Refatoração de Coesão e Limpeza Técnica (Fase 1)
O foco é remover redundâncias e garantir segurança total nos dados.
- **AUD-3 Hardening**: Remoção de casts `as any` remanescentes na camada de `services/operational`.
- **Consolidação de Hooks**: Unificar hooks de busca de produtos e clientes que hoje estão duplicados em diferentes módulos.
- **Reforço de Tipos**: Garantir que as respostas do Supabase usem as definições de `Database['public']['Tables']` de ponta a ponta.

## 3. Padronização de UX/UI (Fase 2)
Implementar uma linguagem visual única para estados de carregamento e feedback.
- Criação de um componente `OperationalFeedback` centralizado para lidar com erros contextuais de negócio (ex: falta de estoque com botão de ação).
- Implementação de `EmptyState` profissional em todas as tabelas de listagem.

## 4. Profundidade no Fluxo de Supply Chain (Fase 3)
Evoluir a Central de Abastecimento para suportar o blueprint operacional total.
- **Ledger Logístico**: Implementar a gravação imutável de cada mudança de estado no fluxo de movimentação (Solicitado -> Separado -> Expedido).
- **Torre de Controle**: Adicionar indicadores de "Divergência de Recebimento" e "Lead Time Real vs Esperado".

## Detalhes Técnicos
- **Isolamento**: Manutenção rigorosa das políticas RLS com foco no `get_user_company_id`.
- **Performance**: Adição de índices sugeridos na auditoria para as tabelas de `supply_chain_movements`.
- **QA**: Implementação de testes E2E para o fluxo crítico de Transferência entre Unidades.

Não faremos reescritas desnecessárias; a evolução será incremental e segura.
