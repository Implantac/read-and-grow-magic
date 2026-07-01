# ADR-0004 — SRE SLO / Error Budget

Status: Accepted · Date: 2026-07-01 · Domain: SRE

## Contexto
Já temos `system_events` e `system_incidents`, mas nenhum contrato
explícito de disponibilidade por domínio. Times não sabem quanto
"orçamento de erro" resta por janela.

## Decisão
Criar `sre_slos` por tenant (domínio, target %, janela em dias) e RPC
`sre_slo_status` que calcula, para cada SLO:

- eventos totais na janela (fonte = domínio)
- eventos com `severity IN ('error','critical')` = falhas
- `success_rate = 1 - falhas/total`
- `error_budget_consumed_pct = (falhas / total) / (1 - target/100)`
- `burn_rate = falhas_janela_curta / (1 - target)`

UI `/sre/slo` lista SLOs com barra de burn e status (`healthy` /
`warning` / `breached`). Sem tocar em `system_events` (leitura pura).

## Consequências
+ Contrato objetivo por domínio.
+ Base para alertas proativos (Sprint futura).
− MVP não separa por endpoint/latência — apenas taxa de erro por
  domínio na janela.
