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

## Onda 7 — QR Code

Componente `QRCodeDialog.tsx` (usa `qrcode.react`) exibe QR do link do token, com ações Copiar / Baixar SVG / Imprimir (folha pronta para balcão, embalagem ou NF). Disponível na aba **Convites** (botão QR por convite).

## Onda 8 — Timeline unificada do cliente

Trigger `nps_answer_to_timeline` (AFTER INSERT em `nps_answers`) grava automaticamente um evento na `client_timeline` do cliente vinculado, com título `NPS <score> — <categoria>`, comentário resumido e metadata (score, category, campaign_id, channel, origin). Assim o cadastro do cliente (Detalhes → Timeline) mostra o NPS lado a lado com contatos, propostas, pedidos e ocorrências, sem lógica adicional no frontend.

## Onda 9 — SMS (stub)

O canal `sms` já existe em `nps_invites.channel` e `nps-send-invite`, mas ainda **loga apenas**. Para ativar, adicionar secret `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` (ou provider preferido como Zenvia) e completar o branch do canal em `nps-send-invite/index.ts` — a estrutura de retry/error/logging já está no lugar.

## Onda 10 — White-label / domínio próprio (fora do escopo de código)

A página pública já usa branding da campanha (logo, cores, título, mensagem). Para expor em domínio próprio do cliente (`empresa.com.br/nps/<token>`), é necessário configurar Custom Domain no host + rewrite para o mesmo `index.html`. Nenhuma mudança de código adicional é necessária — o roteador React resolve `/nps/:token` em qualquer origem.

## Ondas 11–17 — Customer Experience Center

Módulo evoluiu de "NPS" para **Customer Experience Center**, mantendo 100% retrocompatibilidade (rotas antigas preservadas). Novas capacidades:

- **Onda 11 — Customer Health Score** (`cx_health_scores` + `cx_health_weights`, edge `cx-health-recalc`): pontuação 0-100 por cliente com tiers `excellent/good/attention/critical`. Pesos configuráveis por tenant (frequência, valor, recência, NPS, chamados, atrasos, devoluções, engajamento). UI: `/relacionamento/nps/health`.
- **Onda 12 — Churn Prediction** (`cx_churn_predictions`, edge `cx-churn-predict`): probabilidade + risco + motivos + resumo IA + ações sugeridas. Roda sobre clientes com Health em `attention`/`critical`. UI: `/relacionamento/nps/churn`.
- **Onda 13 — Survey Templates** (`cx_survey_templates`): 6 templates públicos seed (NPS, CSAT, CES 2.0, Likert, Emoji, Estrelas). Tenants podem criar seus próprios. UI: `/relacionamento/nps/cx-templates`.
- **Onda 14 — Workflow Builder** (`cx_workflows` + `cx_workflow_runs`): fluxos no-code com trigger/nodes/edges em JSONB. UI base para CRUD; editor visual react-flow em roadmap. `/relacionamento/nps/workflows`.
- **Onda 15 — White-label** (concluída na Onda 10 + branding por campanha).
- **Onda 16 — IA de clusterização e resumo executivo** (`cx_comment_clusters` + `cx_executive_summaries`, edges `cx-ai-cluster` e `cx-executive-summary`): agrupa comentários por tema (positivo/neutro/negativo) e gera resumo executivo em PT-BR com insights e recomendações. UI: `/relacionamento/nps/clusters` e `/resumo-executivo`.
- **Onda 17 — Rebrand para CX Center**: cabeçalho e nav atualizados; alias `/cx/*` redireciona para `/relacionamento/nps/*` (URLs antigas continuam válidas).

**Tabelas novas:** `cx_health_scores`, `cx_health_weights`, `cx_churn_predictions`, `cx_survey_templates`, `cx_workflows`, `cx_workflow_runs`, `cx_comment_clusters`, `cx_executive_summaries`.
**Edge functions novas:** `cx-health-recalc`, `cx-churn-predict`, `cx-ai-cluster`, `cx-executive-summary`.

Todas RLS-isoladas por `company_id`. IA usa Lovable AI Gateway (`google/gemini-2.5-flash`) via `LOVABLE_API_KEY` (server-only).


