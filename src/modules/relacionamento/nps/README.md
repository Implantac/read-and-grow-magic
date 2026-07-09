# Módulo NPS & Relacionamento

Central de experiência do cliente do ERP. Cobre ciclo completo: campanhas → convites → coleta pública → análise por IA → follow-up de detratores → relatórios executivos.

## Telas (`/relacionamento/nps/*`)

| Rota | Função |
| --- | --- |
| `dashboard` | KPIs (NPS, taxa de resposta), CSAT/CES, evolução mensal, distribuição, cidades, críticos, últimas respostas. |
| `campanhas` | CRUD de campanhas com público-alvo, canal, período. |
| `pesquisas` | Editor de perguntas (NPS, CSAT, CES, texto, escala). Reordenação e pré-visualização pública. |
| `convites` | Fila de convites por e-mail/WhatsApp com token único e status. |
| `respostas` | Lista paginada de respostas com sentimento IA, comentários e drilldown. |
| `followups` | Retenção de detratores: tarefas com prazo, ações rápidas (ligar/WhatsApp/e-mail), KPIs de SLA. |
| `relatorios` | Analítico comparativo período-a-período, drilldown por dimensão, export XLSX/CSV/PDF. |
| `relatorios-salvos` | Configurações salvas de relatórios reutilizáveis. |
| `templates` | Modelos de e-mail/WhatsApp com variáveis (`{{cliente}}`, `{{link}}`). |
| `automacoes` | Regras `on event → action` (webhook, e-mail, tarefa). |
| `logs` | Auditoria de webhooks, alertas e automações com payload expansível. |
| `configuracoes` | Ajustes gerais, alertas de detrator, integrações. |

## Backend (Supabase)

**Tabelas:** `nps_campaigns`, `nps_questions`, `nps_invites`, `nps_tokens`, `nps_answers`, `nps_answer_items`, `nps_followups`, `nps_templates`, `nps_automations`, `nps_webhooks`, `nps_alerts_config`, `nps_reports`, `nps_logs`, `nps_question_bank`. Todas com RLS por `company_id`.

**Edge Functions:**
- `nps-public-submit` — endpoint público de resposta (valida token, grava resposta, dispara IA/webhooks/alertas).
- `nps-ai-analyze` — extrai sentimento, resumo, categorias, keywords via Lovable AI Gateway.
- `nps-send-invite` — envia convite por canal configurado (e-mail/WhatsApp).
- `nps-webhooks-dispatch` — entrega eventos a endpoints do cliente.
- `nps-alerts-dispatch` — dispara alertas internos em detratores.
- `nps-automation-dispatch` — executor de regras de automação.

**Trigger:** `nps_auto_create_followup` cria automaticamente um `nps_followup` (prazo 2 dias) quando resposta é `detractor`.

## IA Executiva

Tool `consultar_nps` em `ai-executive` com modos:
`resumo`, `tendencia`, `detratores`, `comentarios_recentes`, `followups`, `csat_ces`.
Filtra por `company_id` do usuário e `periodo_dias` (default 30).

## Métricas suportadas

- **NPS** = %Promotores − %Detratores (escala 0-10).
- **CSAT** — média em escala 1-5, % de satisfeitos (≥4).
- **CES** — média em escala 1-7, % baixo esforço (≤3).

## Testes

- `.lovable/e2e/nps.spec.ts` — smoke de navegação por todas as abas com detecção de erros de console.

## Convenções

- PT-BR em toda a UI.
- Dark Mode Premium (tokens semânticos, sem cores hard-coded).
- Tokens de resposta são single-use por padrão; expiram com a campanha.
- Comentários com ≥5 chars disparam análise IA em fire-and-forget.
