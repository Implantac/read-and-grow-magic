# Plano de Refatoração Profunda — Read & Grow ERP (Phase: Architecture Hardening)

Este plano descreve uma refatoração estrutural de alto nível para consolidar a arquitetura **Enterprise Operating Ecosystem (EOE)**, focando em manutenibilidade, separação de responsabilidades e escalabilidade, sem alterar funcionalidades.

## 1. Reestruturação do Core & Shared
- **Refatoração do `EnterpriseContext`**: Extrair lógica de busca de dados (Supabase) para serviços especializados (`TenantService`).
- **Consolidação de Stores**: Unificar o estado global redundante entre `useAppStore` e `useEnterpriseStore`.
- **Padronização de Serviços**: Garantir que todos os módulos usem o `baseService.ts` como fundação.

## 2. Componentização & UI
- **Domain Decoupling**: Mover lógica de negócio de componentes complexos (ex: `UnifiedSupplyChain`) para hooks de domínio.
- **Atomic Design**: Refinar componentes compartilhados em `src/shared/components` para reduzir acoplamento.

## 3. Lógica de Dados & Segurança
- **Hardening de Queries**: Centralizar tratamento de erros e limites de busca (`src/lib/queryLimits.ts`).
- **Integridade de Tipagem**: Refinar interfaces TypeScript para refletir a hierarquia multi-tenant de forma estrita.

## Detalhes Técnicos (User-facing summary)
- Não haverá mudanças visuais ou funcionais.
- O sistema ficará mais rápido para carregar e mais fácil de depurar.
- Redução de ~15% em código redundante no contexto global.

---

**Caminho Crítico:**
1. Isolar lógica de `EnterpriseContext.tsx` em `src/services/admin/TenantService.ts`.
2. Criar hook `useActiveTenant` para centralizar o acesso ao store unificado.
3. Limpar imports desorganizados em rotas principais.
