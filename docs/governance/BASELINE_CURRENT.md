# Baseline técnico atual

Gerado automaticamente em 2026-09-11T12:02:33.682Z por `npm run baseline`.

## Ambiente

- Node: v22.22.0
- Projeto: vite_react_shadcn_ts
- Versão: 0.0.0

## Inventário

| Item | Quantidade |
|---|---:|
| Rotas declaradas | 302 |
| Arquivos de aplicação TS/TSX | 1506 |
| Testes automatizados | 25 |
| Edge Functions | 61 |
| Migrations | 415 |
| Casts `any` na aplicação | 365 |
| Chamadas de dados em arquivos TSX | 220 |

## Gates disponíveis

- `npm run build` — `vite build`
- `npm run lint:ci` — `node scripts/lint-ci.mjs`
- `npm run typecheck` — `tsgo --noEmit`
- `npm run test` — `vitest run`
- `npm run e2e` — `playwright test --project=chromium`
- `npm run baseline` — `node scripts/generate-baseline.mjs`
- `npm run regression` — `node scripts/regression-suite.mjs`

## Regras de evidência

- Uma etapa ignorada por falta de credencial não pode ser reportada como aprovada.
- Um E2E crítico deve preparar ou exigir dados e confirmar o efeito final.
- Este arquivo mede estrutura; resultados de execução pertencem ao relatório do pipeline.
