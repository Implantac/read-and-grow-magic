# ADR-0010 — Action items granulares em Postmortems SRE

Status: Accepted · Date: 2026-07-01 · Domain: SRE

## Contexto
Sprint 19 entregou postmortems como registro estruturado, mas mantinha
`action_items` apenas como JSONB livre — impossível cobrar owner, prazo
ou aparecer em inbox do responsável.

## Decisão
Tabela dedicada `sre_postmortem_actions` isolada por `company_id` via
RLS (`get_user_company_id(auth.uid())`), com owner, due_at, status
(open/in_progress/done/cancelled) e priority.

RPCs SECURITY DEFINER:
- `sre_postmortem_action_upsert` — cria/edita validando tenancy do postmortem
- `sre_postmortem_action_set_status` — transição segura por escopo
- `sre_postmortem_actions_inbox` — retorna pendências (opcionalmente do usuário)

UI: painel expansível em `/sre/postmortems` (componente `PostmortemActions`) e
card `SREActionsInboxCard` na `/workflows/inbox` para consolidar ações.

## Consequências
+ Accountability real: cada ação tem responsável, prazo e status.
+ Integração natural com a Inbox do usuário (sem novo canal separado).
− Ainda sem notificações por e-mail — próxima sprint pode reaproveitar
  `notify-incident-email` para lembrar owners de ações vencendo.
