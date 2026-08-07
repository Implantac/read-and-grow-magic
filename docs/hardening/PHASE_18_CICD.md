# CI/CD Hardening (Fase 18)

A Fase 18 consolida a automação de verificações de qualidade e segurança em cada Pull Request, garantindo que o "Hardening" não seja perdido durante a evolução do projeto.

## Pipelines Reforçados

### CI (`.github/workflows/ci.yml`)
- **Lint (Strict)**: Executa `scripts/lint-ci.mjs`, bloqueando o pipeline em qualquer erro ou warning relevante (exceto `no-explicit-any` que está em transição).
- **Typecheck**: Execução nativa do TypeScript via `tsgo` para garantir integridade de contratos.
- **Thresholds**: Validação dinâmica do cache do ESLint para evitar degradação de performance do lint em CI.
- **Build Guard**: Verificação de compilação Vite antes de qualquer aprovação.

### E2E (`.github/workflows/e2e.yml`)
- **Playwright Headless**: Execução completa dos "Golden Paths" (Sales, Purchase, Production) e isolamento de Tenant.
- **RLS Static Check**: Verificação de políticas de banco via `scripts/rls-static-check.mjs`.
- **PR Summaries**: Comentários automáticos nos PRs com o status dos testes E2E e link para artefatos de depuração.

## Defesa de Tenant em CI
O pipeline E2E inclui testes específicos que validam que dados criados por um `tenant_id` não são visíveis por outros, servindo como uma barreira automatizada contra regressões de multi-tenancy.

## Definition of Done (CI/CD)
Nenhum Pull Request deve ser mesclado se houver falha em qualquer um dos seguintes portões:
1. Sucesso no Lint e Typecheck.
2. Sucesso no Build de produção.
3. Sucesso em todos os testes Unitários e de Integração.
4. Sucesso nos testes E2E de Caminho Crítico.
5. Sucesso nos testes de Isolamento de RLS.
