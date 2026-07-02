
# Evolução do Módulo Comercial — Order-to-Cash Enterprise

Roadmap incremental sobre a base atual (`sales`, `orders`, `quotations`, `crm_leads`, `crm_pipelines`, `commissions`, `tax_rules`, `nfe`, `wms_picking_orders`, `AuditTrailPanel`, `AIInsightPanel`). Nada é reconstruído — cada etapa **acopla** uma camada de inteligência ao fluxo existente.

---

## Etapa 1 — Pré-venda, CRM e Automação de Propostas

**Estado da arte (SAP/Oracle/TOTVS):** Lead scoring automático, enriquecimento por CNPJ, propostas geradas a partir de "playbooks" (matriz produto × perfil de cliente × canal), preço e desconto sugeridos por política comercial versionada, aprovação por alçada em background.

**Próximo passo (incremental):**
- Nova tabela `pricing_policies` (perfil de cliente × faixa de desconto × alçada) + RPC `suggest_price(product_id, client_id, qty)` reutilizando `product_costs` e `customer_credit_profiles`.
- `crm_leads` ganha coluna `score` alimentada por job que combina `sales_playbooks` + histórico de `sales`.
- Botão "Converter em Proposta" no lead → cria `quotations` já pré-preenchido com os itens sugeridos pela IA.

**Fator facilidade:** No formulário de proposta, um único badge lateral **"Sugestão inteligente"** mostra preço/desconto propostos com um clique "Aplicar tudo". Sem novas abas, sem novos menus.

---

## Etapa 2 — Entrada de Pedidos e Motores de Validação

**Estado da arte:** *Available-to-Promise* (ATP) em tempo real (estoque físico − reservas + ordens de produção previstas), análise de crédito instantânea (limite − AR em aberto − pedidos em curso), bloqueios automáticos com liberação por alçada.

**Próximo passo:**
- RPC `check_credit(client_id, order_total)` retornando `{approved, available_limit, blocked_reason}` usando `customer_credit_profiles` + `accounts_receivable` + `orders` (status `pending`).
- RPC `check_atp(product_id, qty, due_date)` cruzando `stock_balances`, `stock_reservations` e `production_orders`.
- Chamadas disparadas **on-blur** no item do pedido; resultado exibido inline (verde/âmbar/vermelho) sem bloquear digitação.
- Fluxo de aprovação usa `workflow_approvals` já existente.

**Fator facilidade:** Semáforo discreto ao lado da quantidade + tooltip "Disponível em 3 dias · CD-02". Se bloqueado, botão único **"Solicitar aprovação"** cria a instância de workflow.

---

## Etapa 3 — Faturamento e Motor Fiscal Integrado

**Estado da arte:** Motor fiscal pré-calcula ICMS/ST/DIFAL/PIS/COFINS/IPI **na hora da digitação**, sugere CFOP correto pela combinação origem × destino × natureza, gera NF-e em fila assíncrona com retry automático.

**Próximo passo:**
- Preview fiscal usando `tax_rules` + `tax_icms_st_rules` + `tax_difal_rules` chamado ao adicionar cada item (debounce 400ms).
- Coluna `fiscal_preview` (jsonb) em `orders` guardando o cálculo — evita recomputar no faturamento.
- Edge function `emit-nfe-batch` consumindo fila; vendedor clica "Faturar" e o pedido entra em `nfe` com status `queued`.

**Fator facilidade:** Card **"Resumo Fiscal"** colapsado no rodapé do pedido (usa `TaxSummaryCard` já existente). Vendedor só vê o total com impostos; o fiscal aparece quando ele quiser detalhar.

---

## Etapa 4 — Integração com Logística/Expedição

**Estado da arte:** Pedido aprovado gera reserva de estoque + ordem de picking automaticamente, com priorização por SLA/janela de entrega, e devolve tracking para o vendedor.

**Próximo passo:**
- Trigger `on_order_approved` já existe → estender para criar `stock_reservations` + `wms_picking_orders` na mesma transação.
- Enum de status em `orders` amplia para `picking`, `packing`, `shipped`, `delivered` (aproveita `order_status_history`).
- Realtime channel do Supabase transmite mudanças ao pedido aberto na tela.

**Fator facilidade:** `OrderTimeline` (já existe) passa a exibir os marcos WMS ao vivo. Nada muda para o vendedor além de ver as bolinhas acenderem.

---

## Etapa 5 — Visibilidade e Pós-venda

**Estado da arte:** Curva ABC dinâmica (cliente × produto × margem), churn prediction, alertas de recompra baseados em frequência histórica, NPS pós-entrega automático.

**Próximo passo:**
- View materializada `mv_customer_abc` recalculada por cron 03:00 UTC.
- Job `detect_repurchase_window` (`ai_daily_actions`): se cliente comprou a cada N dias e passou 1.5×N sem novo pedido → cria `follow_up_tasks`.
- Dashboard comercial ganha `EnterpriseKPICard` com `entityKey="sales"` para drill-down + `AIInsightPanel` já disponível.

**Fator facilidade:** Um único chip "🔔 12 clientes prontos para recomprar" no topo da tela Vendas abre o `DrillDownDrawer` com a lista acionável (WhatsApp em 1 clique via `whatsapp_templates`).

---

## Três automações de IA que transformam o vendedor

1. **Copilot de Proposta em 1 clique** — vendedor digita "orçamento para Cliente X, 200 peças modelo Y" no `BrainDrawer` global; a IA monta a proposta completa (preço, desconto, prazo, frete estimado) usando `business-knowledge.ts` + `data-tools.ts` e devolve link direto para revisar/enviar.

2. **Guardião silencioso de margem** — trigger `before_insert` em `order_items` compara preço vs. `product_costs` e, se margem < política, injeta alerta no `AIInsightPanel` do pedido *sem bloquear* — vendedor decide, IA registra em `system_audit_logs` (a trilha que acabamos de plugar).

3. **Radar de oportunidade diário** — cron 07:00 UTC (já rodando o Autopilot) roda `detect_upsell` cruzando pedidos recentes × catálogo × sazonalidade e entrega ao vendedor, no login, uma lista pronta de 5 ações do dia com script sugerido e canal (WhatsApp/e-mail/ligação).

---

## Ordem de implementação sugerida

```text
Sprint 1 → Etapa 2 (ATP + Crédito)      [maior ROI, destrava vendas]
Sprint 2 → Etapa 1 (Pricing policies)   [reduz erro de vendedor]
Sprint 3 → Etapa 3 (Preview fiscal)     [reduz retrabalho fiscal]
Sprint 4 → Etapa 4 (Timeline logística) [visibilidade end-to-end]
Sprint 5 → Etapa 5 (ABC + Recompra)     [cria receita recorrente]
Sprint 6 → 3 automações de IA           [efeito "uau" para o usuário]
```

Cada sprint é isolada, reversível por feature flag (`feature_flags` já existe) e não altera contratos de API atuais.

## Detalhes técnicos

- **Banco:** apenas *adds* (novas tabelas/RPCs/colunas jsonb). Zero `DROP`/`ALTER TYPE` destrutivo.
- **Frontend:** reaproveita `EnterpriseKPICard`, `DrillDownDrawer`, `AIInsightPanel`, `AuditTrailPanel`, `OrderTimeline`, `BrainDrawer`, `TaxSummaryCard`, `Can`, `FeatureGate`.
- **Segurança:** todas as RPCs `SECURITY DEFINER` com `SET search_path = public` + `REVOKE EXECUTE FROM PUBLIC` + `GRANT` só a `authenticated`. RLS por `company_id` mantida.
- **Observabilidade:** cada job novo registra em `system_audit_logs` (entity_name apropriado) para aparecer nos painéis de auditoria já plugados.
