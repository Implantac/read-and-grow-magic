# Mapa Arquitetural - READ & GROW
Data: 2026-08-06

## Visão Geral
Sistema ERP multi-tenant focado em automação industrial, logística (WMS) e inteligência financeira.

## Camadas de Responsabilidade
1.  **Apresentação (UI)**: Componentes React em `src/modules` e `src/components`. Seguem o design system baseado em Shadcn/Tailwind.
2.  **Estado & Sincronização**: TanStack Query para dados assíncronos e hooks nativos para estado local.
3.  **Hooks de Dados**: Localizados em `src/hooks`, encapsulam as chamadas ao Supabase.
4.  **Backend (Supabase/PostgreSQL)**:
    *   **RLS**: Camada primária de segurança.
    *   **Edge Functions**: Processamentos pesados (NF-e, Auditoria).
    *   **Triggers**: Integridade de estoque e logs.

## Fluxos de Segurança
- **Identidade**: Via Supabase Auth.
- **Autorização**: Baseada em `profiles` + `user_roles`.
- **Tenant**: Filtro mandatório por `company_id` em todas as tabelas transacionais.
