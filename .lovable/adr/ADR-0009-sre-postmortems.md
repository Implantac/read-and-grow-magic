# ADR-0009 — SRE Postmortems estruturados

Status: Accepted · Date: 2026-07-01 · Domain: SRE

## Contexto
Após Sprints 15–18 (on-call, burn scan, auto-notify, timeline), faltava
um registro estruturado de aprendizado pós-incidente. Documentos livres
não permitem consolidar MTTR, causas recorrentes ou action items.

## Decisão
Nova tabela `sre_postmortems` isolada por `company_id` via RLS
(`get_user_company_id`), referenciando `system_incidents` e `sre_slos`
(ON DELETE SET NULL para preservar histórico). Campos: título, resumo,
impacto, causa raiz, timeline, action_items (JSONB), severidade, status
(draft/published/closed) e `published_at`.

RPC `sre_postmortems_by_slo(_slo_id, _days)` — SECURITY DEFINER, tenant
scoped, para futuras visões consolidadas.

UI `/sre/postmortems` para criar rascunhos, publicar e excluir.

## Consequências
+ Aprendizado organizacional persistente por SLO/incidente.
+ Base para métricas de recorrência e maturidade SRE.
− MVP não implementa action_items granulares (owner, due) — próxima sprint.
