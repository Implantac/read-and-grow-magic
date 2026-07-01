# ADR-0008 — Auto-notify de incidentes + Timeline por SLO

Status: Accepted · Date: 2026-07-01 · Domain: SRE

## Contexto
Após Sprint 17, o burn scan roda a cada 5 min e abre incidentes,
mas o e-mail para on-call/admins dependia de invocação manual da
Edge Function `notify-incident-email`. Além disso, não havia
visão histórica dos incidentes por SLO.

## Decisão
1. Trigger `trg_notify_incident_email` em `system_incidents` que,
   ao inserir incidente `critical`, chama via `pg_net` a função
   `notify-incident-email` com o `incident_id`. A função já lida
   com quiet hours, deduplicação de destinatários e suppressão.
2. RPC `sre_slo_incident_timeline(slo_id, days)` — SECURITY DEFINER,
   isolada por `company_id` via `get_user_company_id(auth.uid())`.
3. UI: botão **Timeline** em cada linha do `/sre/slo` abrindo
   dialog com MTTA/MTTR por incidente.

## Consequências
+ Notificação instantânea sem depender de cron adicional.
+ Base histórica para relatórios de confiabilidade por domínio.
− Depende de `pg_net` e da anon key (já usada por outros crons).
