# Use ERP — Estratégia de Expansão para Plataforma Moldável (2026+)

> Documento estratégico. Guia de execução dos 7 eixos de evolução da Use ERP.
> Regra UEEF: **nunca reconstruir, sempre evoluir.** Cada eixo lista o que já existe, o gap e as próximas entregas.

---

## Visão

Transformar a Use ERP de um sistema fechado em uma **plataforma moldável**: um núcleo ERP sólido (fiscal, financeiro, WMS, comercial) rodeado por camadas plugáveis (páginas, marketplace, IA, canais de venda, monetização), permitindo que cada cliente esculpa seu próprio ERP sem forks.

**Princípio arquitetural**: núcleo estável + bordas extensíveis via plugins, editores, IA e conectores.

---

## Eixo 1 — WMS Realtime & Sincronização de Estoque

### Estado atual
- Tabelas `wms_inventory_items`, `stock_balances`, `stock_movements`, `wms_movements` populadas.
- Hooks (`useWMSInventory`, `useWms`, `useWMSOperations`) fazem fetch pontual (React Query 5m staleTime ou `useEffect`).
- Trigger de integração ERP↔WMS já grava movimentações cruzadas.

### Gap
- Sem push em tempo real → operador vê estoque defasado durante picking simultâneo.
- Contagens e ajustes não refletem no dashboard sem F5.
- Sem canal único para RFID/coletor emitir eventos e a UI receber.

### Entregas
1. **Habilitar Supabase Realtime** para `wms_inventory_items`, `stock_balances`, `stock_movements`, `wms_movements`, `wms_picking_orders`, `wms_receiving_orders`.
2. **Hook `useRealtimeWMS`** que assina os canais e invalida as queries React Query correspondentes.
3. **Badge "ao vivo"** no header do módulo WMS + indicador de última atualização.
4. **Reconciliação otimista** em picking/putaway: UI atualiza local, servidor confirma via realtime.
5. **Alertas push** para estoque crítico (min stock atingido) via canal broadcast.

### KPIs
- Latência entre movimento e UI < 2s (p95).
- Redução de divergência de contagem em 40% no primeiro trimestre.

---

## Eixo 2 — Editor de Páginas Avançado

### Estado atual
- Existe editor básico de páginas/landing pages no admin.
- Sem sistema de blocos, sem preview responsivo, sem integrações externas.

### Gap
- Cliente não consegue construir uma LP de campanha sem código.
- Fontes/cores hardcoded — não usa design tokens.
- Zero integração com marketing.

### Entregas
1. **Sistema de blocos** (hero, features, CTA, form, testimonial, pricing, FAQ, footer) com schema JSON versionado.
2. **Preview multi-device** (mobile 375, tablet 768, desktop 1440) alternável em tempo real.
3. **Theme editor**: paleta de cores (HSL), font pairs, spacing scale, border radius — salvos como tokens por página.
4. **Integração Mailchimp**: bloco de formulário publica lead direto na lista via API (secret `MAILCHIMP_API_KEY`).
5. **Integração Google Analytics 4**: campo `ga4_measurement_id` por página, script injetado em runtime.
6. **A/B testing simples** com split 50/50 e leitura via GA4.

### Dependências
- Conector Mailchimp (via `standard_connectors--connect`) ou secret manual.
- Nova tabela `page_builder_pages` com JSONB `blocks`, `theme`, `analytics`.

---

## Eixo 3 — Marketplace de Aplicativos (Plugins)

### Estado atual
- `PluginMarketplace.tsx` funcional: busca, categorias, instalar/desinstalar/pausar, pin de versão, executar plugin.
- Tabelas `plugins`, `plugin_installations`.

### Gap
- Sem avaliações/reviews.
- Sem changelog visível ao usuário.
- Sem atualização automática opcional.
- Filtros limitados (categoria + busca textual apenas).

### Entregas
1. **Tabela `plugin_reviews`** (user_id, plugin_id, rating 1–5, comment, created_at) com RLS.
2. **UI de reviews** no card do plugin + página de detalhe com histograma de notas.
3. **Filtros avançados**: preço (grátis/pago), rating mínimo, módulos requeridos, ordenação (populares/novos/melhor avaliados).
4. **Toggle "atualização automática"** por instalação: se on, `pinned_version` = null e sistema aplica nova versão em janela de manutenção.
5. **Changelog** por versão do plugin exibido no dialog de versões.
6. **Screenshots/vídeo** por plugin (bucket storage `plugin-assets`).

---

## Eixo 4 — IA para Criação de Conteúdo

### Estado atual
- Lovable AI Gateway já disponível (`LOVABLE_API_KEY`).
- IA Executiva e Cérebro Nativo consomem Gemini/GPT.

### Gap
- Nenhuma superfície dedicada a **conteúdo de marketing/produto**.
- Sem templates, sem tom de voz configurável, sem geração em lote.

### Entregas
1. **Módulo "Studio de Conteúdo IA"** em `/admin/ai-studio`.
2. **Gerador de descrições de produto**: seleciona SKU → IA lê ficha técnica + categoria → gera títulos, bullets, descrição longa, SEO meta. Modelo: `google/gemini-3.5-flash`.
3. **Gerador de banners** (image gen via `google/gemini-3.1-flash-image`): prompt guiado por campanha, produto, sazonalidade.
4. **Gerador de campanhas**: e-mail + WhatsApp + Instagram caption a partir do mesmo brief.
5. **Tom de voz por tenant**: JSON `{persona, formality, keywords, forbidden_terms}` injetado no system prompt.
6. **Dados externos**: hook para consultar tendências (Google Trends via connector, se disponível) e injetar no contexto.
7. **Biblioteca de conteúdo**: tudo gerado é salvo em `ai_content_assets` para reuso e aprovação.

---

## Eixo 5 — Venda por WhatsApp e Instagram

### Estado atual
- Base comercial (pipeline, PDV) existe.
- Sem integração nativa com canais de mensagem.

### Gap
- Vendas por mensagem hoje são manuais/copy-paste.
- Sem catálogo enviado por WhatsApp, sem carrinho por DM.

### Entregas
1. **Conector WhatsApp Business API** (via Twilio ou Meta Cloud API — usar `standard_connectors--connect` quando disponível).
2. **Inbox unificada** `/relacionamento/inbox` com conversas WhatsApp + Instagram DM.
3. **Catálogo compartilhável**: link curto gera página com SKUs + botão "comprar via WhatsApp" que envia mensagem estruturada.
4. **Carrinho conversacional**: bot orienta cliente por menus (produto → variação → endereço → pagamento) e cria pedido no ERP.
5. **Automação de marketing**: régua de recuperação de carrinho abandonado, pós-venda, aniversário.
6. **Templates aprovados** (WhatsApp exige HSM) armazenados em `message_templates`.
7. **IA respondedora**: sugere resposta com base no histórico e catálogo, humano aprova.

---

## Eixo 6 — Modelo de Monetização

### Estado atual
- Estrutura SaaS multi-tenant com RLS existe.
- `subscriptions`, `plans` já presentes.

### Gap
- Planos fixos, sem addon/módulo à la carte.
- Sem billing recorrente automatizado (Stripe/Paddle não integrado).
- Sem dashboard de MRR/churn.

### Entregas
1. **Planos modulares**: plano base + addons (WMS, Fiscal Pro, IA Studio, Multi-CD) precificados independentemente.
2. **Plano customizado**: admin cria proposta com módulos + preço + prazo → cliente aceita → cobrança automática.
3. **Integração Stripe Payments** (via `payments--enable_stripe_payments`) para cobrança recorrente + webhook de cancelamento.
4. **Trial de 14 dias** por módulo com downgrade automático.
5. **Dashboard financeiro SaaS** `/admin/billing/analytics`: MRR, ARR, churn, LTV, CAC (se dados de aquisição existirem), cohort retention.
6. **Faturas via Lovable Cloud edge function** enviadas por e-mail no fechamento do ciclo.

---

## Eixo 7 — Estratégia de Longo Prazo (Plataforma Moldável)

### Visão de longo prazo
Use ERP vira **suíte modular** onde CRM, PDV, PLM e BI convivem com o núcleo transacional, todos alimentados pelo mesmo domain model.

### Entregas
1. **CRM Nativo** (`/relacionamento/crm`):
   - Timeline 360° do cliente (pedidos, tickets, NPS, mensagens WhatsApp).
   - Pipeline comercial ligado ao módulo Commercial existente.
   - Segmentação para campanhas.
2. **PDV Evolutivo** (já existe em Fiscal; evoluir):
   - Modo offline com sync ao reconectar.
   - Balcão + Delivery + Comanda (bar/restaurante).
   - Integração TEF/Pinpad e QR Code Pix.
3. **PLM (Product Lifecycle Management)** `/producao/plm`:
   - Ficha técnica versionada de produtos (BOM multi-nível).
   - Aprovações e ECO (Engineering Change Order).
   - Visão da cadeia: fornecedor → matéria-prima → produção → distribuição.
4. **BI com IA** `/executive/bi`:
   - Data marts materializados (vendas, financeiro, estoque, produção).
   - Dashboards editáveis (drag-drop) sobre esses marts.
   - **Ask-the-data** em linguagem natural: IA (`google/gemini-2.5-pro`) traduz pergunta → SQL parametrizado → gráfico.
   - Alertas inteligentes: variação anômala em KPI dispara notificação.

---

## Roadmap sugerido (4 trimestres)

```text
Q1 2026 → Eixo 1 (WMS Realtime) + Eixo 3 (Marketplace evolução)
Q2 2026 → Eixo 4 (IA Studio) + Eixo 6 (Monetização modular + Stripe)
Q3 2026 → Eixo 2 (Page Builder) + Eixo 5 (WhatsApp/Instagram)
Q4 2026 → Eixo 7 (CRM + PDV evolutivo + BI com IA + PLM MVP)
```

---

## Guardrails UEEF
- Nada é reconstruído do zero.
- Cada eixo estende módulos existentes usando design tokens, RLS e o Integration Engine (triggers Postgres).
- IA sempre via Lovable AI Gateway; nunca pedir chave ao usuário.
- PT-BR em toda UI e mensagens.
- Multi-tenant respeitado: cada tabela nova ganha RLS + GRANT + policies escopadas por `tenant_id`/`auth.uid()`.
