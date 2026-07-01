
# Auditoria & Evolução USE ERP — Modo Software House

Vou operar como time multidisciplinar (Product/Design/Eng/QA/Security/Business) seguindo a **Constituição UEEF** ("Evolve, Never Rebuild"). Nada será reescrito do zero — cada intervenção é cirúrgica e passa pelo Review Loop.

## Fase 1 — Diagnóstico (sem código)

Auditoria estruturada gerando um relatório vivo em `.lovable/audit-2026-07.md` com:

**1.1 Inventário**
- Mapa de todas as rotas (App.tsx + 11 arquivos de Routes) → status (ativa/órfã/duplicada), gate de plano, permissão exigida
- Mapa de módulos × telas × hooks × serviços × tabelas
- Detecção de telas fantasmas (arquivo existe, rota não), rotas quebradas, imports mortos

**1.2 Análise por dimensão (score 0-5 por tela)**
- **UX/Fluxo**: nº de cliques para tarefa-alvo, dead-ends, breadcrumbs, empty states, feedback de erro
- **Design**: aderência ao Dark Premium (#1A2234/#FF9800), consistência de PageHeader/KPICard, densidade, hierarquia tipográfica, responsividade real (375/768/1440)
- **Engenharia**: uso de React Query, invalidations, N+1, bundle por rota, lazy loading correto, memoização
- **QA**: estados loading/error/empty, validações, edge cases (0 registros, +10k registros), acessibilidade (ARIA, contraste, foco)
- **Negócio**: regra faltante, KPI incorreto, integração cross-module ausente, oportunidade de automação/IA

**1.3 Entregável do diagnóstico**
- Heatmap de saúde por módulo (13 módulos × 5 dimensões)
- Top 20 quick-wins (≤2h cada)
- Top 10 refactors estratégicos
- Top 5 novos fluxos "wow" (ex: Command Palette global, Assistente contextual por tela, Onboarding guiado, Comparador de cenários)

## Fase 2 — Ondas de evolução (após você aprovar o diagnóstico)

Cada onda = 1 sprint focado, com Review Loop (Arch→QA→Sec→Biz) e critério de aceite mensurável.

**Onda A — Fundamentos de Navegação & Design System**
- Command Palette global (Cmd+K) com busca fuzzy em rotas/registros/ações
- Breadcrumbs dinâmicos + histórico de navegação
- Padronização final de PageHeader/EmptyState/ErrorBoundary em 100% das telas
- Skeleton loaders consistentes (substituir spinners)
- Refino de contraste/tipografia/spacing tokens

**Onda B — UX Surpresa**
- Quick Actions contextuais por tela (FAB inteligente)
- Assistente Cérebro embutido lateral (drawer) com contexto da tela atual
- Tour guiado on-demand por módulo
- Filtros salvos + views compartilhadas por usuário
- Notificações inline não-intrusivas (toasts agrupados)

**Onda C — Regras de Negócio & Cross-Module**
- Corrigir lacunas detectadas no diagnóstico (ex: aprovações sem SLA, títulos sem categoria default, OPs sem apontamento)
- Reforçar triggers que faltarem company_id (padrão dos bugs já vistos)
- Novos KPIs derivados: DSO, DPO, Giro, OEE consolidado, Fill Rate WMS

**Onda D — QA & Observabilidade**
- Testes Vitest para hooks críticos (lifecycle de pedido, geração de AR/AP, reservas de estoque)
- Playwright smoke em 10 fluxos principais
- Instrumentação SRE de erros por tela

## Governança
- Cada onda começa com ADR curto em `.lovable/adr/`
- Nada de mocks; dados reais via Supabase
- PT-BR em tudo
- Sem quebrar rotas/URLs existentes (Evolution Mode)

## Próximo passo
Aprove este plano e eu **começo imediatamente pela Fase 1 (Diagnóstico)** — que é read-only, sem alterar código, e entrega o relatório `.lovable/audit-2026-07.md` para você priorizar as ondas.
