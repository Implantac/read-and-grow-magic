# ADR-0003 — WMS Wave Planning v2

Status: Accepted · Date: 2026-07-01 · Domain: Warehouse

## Contexto
`picking_waves` já existe (v1), criada manualmente. Não há motor que
agrupe pedidos pendentes por janela de expedição, transportadora ou
zona, nem balanceie entre operadores. Times operacionais criam ondas
ad-hoc, gerando desbalanceamento e rework.

## Decisão
Adicionar um **motor de planejamento** por RPC `wms_wave_plan_v2` que:

1. Seleciona `wms_picking_orders` elegíveis (status `pending`,
   `wave_id_ref IS NULL`, `company_id = caller`).
2. Aplica filtros opcionais (prioridade mínima, cutoff, transportadora,
   zona informada pelo usuário).
3. Agrupa em N ondas respeitando `max_orders_per_wave` e faz
   **round-robin** entre `operators` para balancear carga.
4. Modo `dry_run` retorna simulação (nenhuma escrita) — modo `commit`
   cria as ondas e atualiza `wave_id_ref` atomicamente.

Sem quebra: v1 (`createWave` manual) segue funcionando. Novos campos
adicionados são opcionais.

## Consequências
+ Redução de ondas mal-balanceadas.
+ Base para v3 (slotting-aware, ML de tempo de picking).
− Ainda não considera peso/volume nem tempo real de percurso —
  planejado para v3.
