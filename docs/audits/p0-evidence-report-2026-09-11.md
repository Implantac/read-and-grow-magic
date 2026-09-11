# Relatório de evidências — Lote P0

Data: 11/09/2026

## Entregue

- Baseline reproduzível por `npm run baseline` em `docs/governance/BASELINE_CURRENT.md`.
- Matriz de rastreabilidade dos fluxos críticos em `docs/governance/TRACEABILITY_MATRIX.md`.
- Execução Vitest oficializada no projeto e no pipeline.
- Pipeline bloqueante com testes, RLS, build e auditoria de dependências.
- RLS deixa de ser aprovado silenciosamente quando a conexão de validação não existe.
- As duas suítes Playwright são descobertas pelo comando E2E crítico.
- Isolamento multiempresa possui teste real com duas identidades distintas.
- Fluxo logístico-fiscal não retorna sucesso quando a fixture não existe.
- Golden paths ainda não implementados foram convertidos de aprovações constantes para pendências explícitas.

## Evidência executada

- Typecheck: aprovado.
- Vitest: 14 arquivos e 95 testes aprovados.
- Descoberta E2E: 10 testes em 6 arquivos, incluindo isolamento e rastreabilidade logístico-fiscal.
- Build observado: aprovado.
- Gate RLS sem credencial: bloqueou corretamente.
- Banco atual: `stock_movements`, `wms_receiving_orders` e `wms_picking_orders` possuem políticas com isolamento por empresa; os vazamentos apontados por migrations históricas não estão ativos.

## Pendências bloqueantes

- O2C, P2P e PCP precisam de fixtures determinísticas antes de se tornarem testes executáveis.
- O CI precisa receber duas contas de empresas distintas e a conexão restrita para testes RLS.
- O lint atual expõe 23 erros e 35 avisos preexistentes; não foram mascarados nem corrigidos fora do escopo deste lote.
- A emissão fiscal real e o PDV offline exigem o próximo incremento de idempotência e validação de infraestrutura fiscal.

## Decisão

A Fase 0 está concluída. A Fase 6 permanece parcial: o pipeline já bloqueia falhas reais, mas os golden paths O2C, P2P e PCP ainda não possuem preparação determinística de dados.