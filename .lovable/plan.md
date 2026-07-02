
# Blueprint Comercial 360° — Consolidação

Baseado no diagnóstico do módulo atual (`src/modules/commercial/*`, `src/components/commercial/*`) e no roadmap já entregue (Sprints 1–13: Cadastro PF/PJ dinâmico, ATP, Crédito, Kanban Unificado, Margem em tempo real, Alertas). Este blueprint fecha as **lacunas remanescentes** para atingir 100% da visão apresentada.

---

## Diagnóstico — o que já existe

| Bloco da visão | Status atual | Arquivo/Recurso |
|---|---|---|
| Cadastro PF/PJ dinâmico (CNPJ/CEP autofill) | ✅ Implementado | `ClientFormDialog.tsx` + BrasilAPI/ViaCEP |
| Painel Único de Vendas (card único) | ⚠️ Parcial | `CreateOrderDialog.tsx` (multi-step, não card único) |
| Semáforo Crédito + ATP | ✅ | `CreditBadge`, `AtpLineIndicator` |
| Margem em tempo real | ✅ | `ProfitabilityCard`, `MarginBadge` |
| Alertas de margem crítica | ✅ | `commercial_alerts` + realtime |
| Cadastro Universal de Produtos (abas condicionais) | ❌ Ausente | `pages/inventory/Products.tsx` genérico |
| Perfil comercial sugerido (Atacado/Varejo) | ❌ Ausente | — |
| Resumo instantâneo do cliente (Crédito/Última compra/Perfil Ouro) | ⚠️ Existe crédito, falta tier e recência | `ClientSelector` |
| Frete CIF rateado automático nos itens | ❌ | — |
| O2C automatizado (crédito → fiscal → SEFAZ → picking → boleto) | ⚠️ Parcial (crédito e AR ok) | Falta orquestração explícita SEFAZ→Picking→Notificação |
| Tratamento humano de rejeição SEFAZ | ⚠️ Log existe, sem CTA "atualizar cadastro agora" | `fiscal_documents` |
| Notificação DANFE+Boleto via WhatsApp/Email pós-emissão | ⚠️ Templates existem, sem trigger automático | `whatsapp_templates` |

---

## Escopo desta consolidação (4 Sprints)

### Sprint A — Cadastro Universal de Produtos com Gatilho por Categoria
- **DB**: acrescentar em `products`:
  - `item_kind` enum (`service`, `resale`, `manufactured`) — dispara UI condicional
  - `requires_lot_tracking` boolean (auto quando categoria = Alimentos/Farma/Química)
  - `iss_code` / `nbs_code` (serviço)
  - `multi_ean` jsonb (revenda)
  - `bom_ready` boolean espelhado de `product_materials`
- **UI**: refatorar `Products.tsx` → wizard de 1 tela com **abas condicionais**:
  1. Padrão (sempre visível)
  2. Engenharia/BOM (só `manufactured`)
  3. Rastreabilidade (só se `requires_lot_tracking`)
  4. Tributária (NCM lookup + preview cruzando UF cliente)
  5. Fiscal Serviço (só `service`)
- Componente novo: `ProductKindSelector.tsx` + `ProductConditionalTabs.tsx`.

### Sprint B — Painel Único de Vendas (Card-based, uma tela só)
- Refatorar `CreateOrderDialog.tsx` de `Dialog` multi-step → página `SalesDesk.tsx` (rota `/comercial/pdv`) com **3 cards empilhados sempre visíveis**:
  - **Card 1 — Cliente**: busca fonética (pg_trgm), ao selecionar exibe chips:
    - Crédito disponível (verde/amarelo/vermelho)
    - Última compra (dias)
    - Tier: Bronze/Prata/Ouro/Diamante (calculado por RPC `get_client_tier(client_id)` baseado em faturamento 12m)
    - Tabela de preço sugerida (Atacado se PJ, Varejo se PF)
  - **Card 2 — Itens**: linha de digitação estilo e-commerce (`Command` do shadcn) + linhas com margem em tempo real (já existe).
  - **Card 3 — Pagamento & Logística**: condição + forma + transportadora; se CIF, rateia frete → chama RPC `apportion_freight(order_id)` que atualiza `order_items.freight_share` e recompõe base ICMS.
- Componente novo: `SalesDeskLayout.tsx`, `ClientInstantSummary.tsx`, `FreightApportionment.tsx`.

### Sprint C — Perfil Comercial e Recomendação de Tabela
- **DB**:
  - Tabela `client_commercial_profiles` (client_id, tier, suggested_price_list_id, credit_score, last_purchase_at, ltv_12m) — materialized view refresh diário via `pg_cron`.
  - `price_lists` já existe? Se não, criar (`id`, `name`, `kind` = wholesale/retail, `discount_pct`).
- **RPC** `suggest_commercial_profile(client_id)` retorna `{ price_list_id, payment_terms_suggested, tier }`.
- UI: ao selecionar cliente no Card 1, popular defaults no Card 3 automaticamente (usuário pode sobrescrever).

### Sprint D — Order-to-Cash Orquestrado + Tratamento Humanizado
- **Edge Function** `o2c-orchestrator`:
  1. `check_credit` + `check_atp` (bloqueia com toast se falhar)
  2. `calculate_taxes` (motor fiscal existente por NCM×UF)
  3. `emit_nfe` (integra `fiscal_documents`)
  4. Se **SEFAZ reject**: grava `nfe_rejections` com `friendly_message` (mapa de códigos SEFAZ→PT-BR) e abre modal `NfeRejectionDialog.tsx` com CTA **"Atualizar cadastro agora"** que navega ao `ClientFormDialog` no campo problemático.
  5. Sucesso: dispara trigger `after_nfe_authorized` → cria `picking_task` ordenada por `warehouse_locations.aisle,rack` + insere `accounts_receivable` (já existe) + chama edge `notify-customer-danfe` que envia WhatsApp/Email com DANFE+Boleto usando `whatsapp_templates`.
- Componentes novos: `O2CProgressDrawer.tsx` (mostra as 5 etapas em tempo real via realtime em `cross_module_events`), `NfeRejectionDialog.tsx`.

---

## Detalhes técnicos

**Migrations necessárias**
```sql
-- Sprint A
ALTER TABLE products
  ADD COLUMN item_kind text CHECK (item_kind IN ('service','resale','manufactured')) DEFAULT 'resale',
  ADD COLUMN requires_lot_tracking boolean DEFAULT false,
  ADD COLUMN iss_code text, ADD COLUMN nbs_code text,
  ADD COLUMN multi_ean jsonb DEFAULT '[]'::jsonb;

-- Sprint C
CREATE MATERIALIZED VIEW client_commercial_profiles AS
  SELECT c.id AS client_id, c.company_id,
    CASE WHEN sum(o.total) > 500000 THEN 'diamond'
         WHEN sum(o.total) > 100000 THEN 'gold'
         WHEN sum(o.total) > 20000  THEN 'silver'
         ELSE 'bronze' END AS tier,
    max(o.created_at) AS last_purchase_at,
    coalesce(sum(o.total) FILTER (WHERE o.created_at > now() - interval '12 months'),0) AS ltv_12m
  FROM clients c LEFT JOIN orders o ON o.client_id = c.id
  GROUP BY c.id, c.company_id;

CREATE UNIQUE INDEX ON client_commercial_profiles(client_id);
-- pg_cron: refresh diário 03:00
```

**RLS**: todas as novas estruturas escopadas por `company_id = get_user_company_id(auth.uid())`.

**Rotas novas**
- `/comercial/pdv` → `SalesDesk.tsx` (Painel Único)
- Mantém `/comercial/pedidos` (lista/kanban) intacto.

**Componentes reutilizados** (não recriar): `ClientSelector`, `OrderItemsEditor`, `ProfitabilityCard`, `AtpLineIndicator`, `CreditBadge`.

---

## Ordem de execução sugerida
1. Sprint A (Produtos Universal) — desbloqueia BOM/Rastreabilidade
2. Sprint C (Perfil Comercial) — pré-requisito do Card 1
3. Sprint B (Painel Único) — consome A + C
4. Sprint D (O2C Orquestrado) — fecha o ciclo

**Fora do escopo desta rodada** (já existentes/futuros): comissionamento, forecasting Monte Carlo, gamificação — permanecem inalterados.

---

Aprovar para iniciar pelo **Sprint A** ou reordenar?
