/**
 * BUSINESS KNOWLEDGE REGISTRY — USE ERP
 * ------------------------------------------------------------------
 * Base de conhecimento central que ALIMENTA TODOS os agentes de IA
 * (Cérebro Nativo, IA Executiva, IA Fiscal, PCP, Comercial etc.).
 *
 * Regras:
 *  - Cada módulo tem regras de negócio, KPIs, fórmulas e guardrails.
 *  - Todas as consultas devem respeitar `company_id` (multi-tenant).
 *  - Todos os valores em BRL, pt-BR, padrão executivo.
 *  - Nenhuma alucinação: se não houver dado real, dizer "sem dados".
 *
 * Governance: UEEF Constitution v1.0 · Blueprint UEOS.
 * ------------------------------------------------------------------
 */

export type KnowledgeModule =
  | 'GOVERNANCE'
  | 'MULTITENANT'
  | 'FINANCEIRO'
  | 'CONTABIL'
  | 'FISCAL'
  | 'COMERCIAL'
  | 'COMPRAS'
  | 'ESTOQUE'
  | 'WMS'
  | 'TMS'
  | 'PRODUCAO'
  | 'RH'
  | 'CRM'
  | 'PROJETOS'
  | 'SRE'
  | 'LGPD'
  | 'AI_GUARDRAILS';

export const KNOWLEDGE: Record<KnowledgeModule, string> = {
  GOVERNANCE: `
## 🏛️ GOVERNANÇA — UEEF Constitution v1.0
- Evolution Mode obrigatório: Diagnóstico → Mapeamento → Desenho → Implementação → Review Loop → Entrega.
- **Nunca reconstruir**; sempre evoluir sobre o que já existe.
- Toda decisão deve responder: gera lucro? reduz manual? melhora decisão? aumenta produtividade? reduz erro? simplifica? escala?
- Toda resposta termina com AÇÃO ou DECISÃO executável.
- Idioma: pt-BR executivo. Moeda: **R$**. Números em negrito.
`,
  MULTITENANT: `
## 🏢 MULTI-TENANT (SaaS)
- Tabela raiz: \`companies\` (empresa) e \`branches\` (filial).
- **TODA consulta** filtra por \`company_id\` do usuário autenticado (RLS).
- Usuário pode ter múltiplas empresas via \`user_roles\` (roles: admin, system_admin, manager, operator, viewer).
- Módulos liberados por plano em \`plan_modules\` + \`subscriptions\`.
- Feature-gate: use \`FeatureGate\`/\`<Can>\` no frontend e \`has_role()\` no banco.
- Cotas de IA em \`billing_meters\`/\`usage_tracking\` — respeitar hard-cap.
- Auditoria em \`system_audit_logs\` para toda ação sensível.
`,
  FINANCEIRO: `
## 💰 FINANCEIRO (AP / AR / Tesouraria / DRE)
Tabelas: accounts_payable, accounts_receivable, bank_accounts, bank_transactions, cash_flow_entries, financial_ledger, financial_boletos, pix_charges, financial_settlements, financial_recurring, financial_health_scores.

### Regras de negócio
- Título vencido = due_date < CURRENT_DATE AND status IN ('pending','partial').
- Inadimplência (%) = (Σ AR vencidos > 30d) / (Σ AR total do mês) × 100.
- DSO = (AR médio × 30) / faturamento mensal.
- DPO = (AP médio × 30) / compras mensais.
- Ciclo de caixa = DSO + DIO − DPO.
- Fluxo de caixa 30 dias = saldo bancário + AR previsto − AP previsto por semana.
- Juros/multa padrão: 2% multa + 1%/mês pró-rata (config em financial_charges_rules).
- PIX/Boleto conciliam via bank_match_rules → bank_match_suggestions (score ≥ 0.85 auto-match).
- DRE gerencial por cost_center; nunca por accounting_accounts (evita duplicar contábil).

### KPIs prioritários
Saldo líquido, Runway (meses), Margem operacional, EBITDA, Ticket médio de recebimento, % inadimplência 30/60/90.

### Alertas críticos
- Runway < 60 dias → 🔴 crítico.
- AR > 90d sem contato → gerar collection_action.
- Falta de conciliação diária > 3 dias → notificar CFO.
`,
  CONTABIL: `
## 📚 CONTÁBIL
Tabelas: chart_of_accounts, accounting_accounts, accounting_periods, journal_entries, journal_entry_lines, accounting_entries, accounting_items.

- Partida dobrada: Σ débito == Σ crédito por journal_entry.
- Períodos com status 'closed' são imutáveis — bloquear qualquer lançamento.
- Toda NF-e autorizada dispara trigger contábil (Receita × Cliente).
- Balancete deve fechar por mês antes de qualquer transmissão fiscal.
- Reconciliação de razão auxiliar (AP/AR) vs. contas contábeis é obrigatória mensalmente.
`,
  FISCAL: `
## 🧾 FISCAL BRASILEIRO
Tabelas: nfe, nfe_items, nfce, nfce_items, cte, mdfe, fiscal_documents, fiscal_rules, tax_rules, tax_icms_st_rules, tax_difal_rules, fiscal_reports, sped_files, reinf_events, reinf_periods, reinf_transmissions.

### Regras
- NF-e 4.00: só transmitir com XML validado; contingência SVC se rejeição autorizador.
- Cálculo automático via tax_rules por CFOP × NCM × UF origem/destino.
- ICMS-ST: quando produto listado em tax_icms_st_rules, adicionar MVA e ST.
- DIFAL EC 87/15: consumidor final não-contribuinte interestadual (tax_difal_rules).
- PIS/COFINS: regime (cumulativo 3.65% / não-cumulativo 9.25%) definido em companies.tax_regime.
- IPI: apenas indústria/equiparado; alíquota TIPI por NCM.
- SPED Fiscal (EFD ICMS/IPI): mensal, entrega dia 25 do mês seguinte.
- SPED Contribuições: mensal, dia 14.
- EFD-Reinf: eventos R-1000..R-4080. R-4020 (retenções PJ/PF) fecha mensalmente antes de transmitir.
- MDF-e obrigatório para transporte próprio interestadual > R$ 10k.

### Guardrails
- Nunca sugerir "não tributar" sem consultar tax_rules.
- Nunca alterar NF-e autorizada — apenas Carta de Correção (CC-e) ou cancelamento (< 24h).
- Todo cancelamento gera event em fiscal_documents com justificativa.
`,
  COMERCIAL: `
## 🛒 COMERCIAL / VENDAS
Tabelas: orders, order_items, quotations, sales, sales_reps, sales_funnel, sales_targets, seller_daily_targets, sales_campaigns, commissions, commission_rules, commission_policies.

### Lifecycle do pedido (18 status)
draft → quotation → approved → credit_check → stock_reserved → picking → packed → invoiced → shipped → delivered → completed.
Bifurcações: blocked_credit, blocked_stock, cancelled, returned.

### Regras
- Aprovação obrigatória se: valor > limite de alçada do vendedor OU cliente com risco 🔴.
- Reserva de estoque (stock_reservations) só após aprovação.
- Faturamento gera NF-e automaticamente e baixa AR.
- Comissão calculada em commissions ao atingir status 'invoiced' conforme commission_policies.
- Preço mínimo = product.cost × (1 + margem_minima do cost_center).

### KPIs
Ticket médio, Taxa de conversão do funil, CAC, LTV, Forecast Monte Carlo (ai_sales_scores).
`,
  COMPRAS: `
## 🛍️ COMPRAS
Tabelas: purchase_orders, purchase_order_items, purchase_approval_rules, suppliers, supplier_metrics, quotations.

- Aprovação hierárquica por valor (purchase_approval_rules) com SLA rastreado.
- 3 cotações obrigatórias acima de R$ 5.000 (parametrizável).
- Supplier score = OTD × Qualidade × Preço competitivo (supplier_metrics).
- PO só recebe estoque via receiving_orders → wms_receiving_items (WMS).
- Bloquear PO se supplier com pendência fiscal (CND vencida).
`,
  ESTOQUE: `
## 📦 ESTOQUE
Tabelas: products, stock_balances, stock_lots, stock_movements, stock_reservations, product_costs, categories.

- Kardex: toda movimentação em stock_movements (in/out/transfer/adjust).
- Curva ABC recalculada semanalmente.
- Custo médio ponderado atualizado a cada entrada (product_costs).
- Proteção contra exclusão: produto com movimento não pode ser deletado — apenas inativar.
- Reserva reduz stock_available sem afetar stock_on_hand.
- Alerta estoque mínimo → gerar sugestão em purchase_orders.
`,
  WMS: `
## 🏭 WMS (Warehouse Management)
Tabelas: warehouses, warehouse_zones, warehouse_locations, wms_events, wms_tasks, wms_receiving_orders, wms_picking_orders, picking_waves, picking_tasks, putaway_tasks, replenishment_tasks, wms_shipments, wms_quality_checks, wms_returns, wms_kits, wms_docks, yard_appointments.

### Regras
- 3 níveis: Warehouse → Zone → Location (rua-coluna-nível).
- Slotting inteligente: alta rotação (A) perto de docas; refrigerados em zonas específicas.
- FIFO/FEFO por stock_lots.expiry_date; nunca picar lote vencido.
- Picking wave otimiza rota (TSP heurística) e balanceia por operador.
- Cross-docking: recebe → picking → shipping sem armazenar (< 4h).
- Cycle count contínuo: itens A trimestral, B semestral, C anual.
- Quality Hold: produto em wms_quality_checks status 'quarantine' não pode ser expedido.
- RFID events (rfid_events) atualizam location automaticamente.

### KPIs
Ocupação por zona, OTD picking, Acurácia inventário, produtividade operador (linhas/h).
`,
  TMS: `
## 🚚 TMS (Transporte)
Tabelas: carriers, vehicles, delivery_routes, route_stops, route_costs, delivery_tracking, delivery_proof, shipment_orders, shipment_items, distribution_centers, loading_docks.

- Roteirização multi-stop com janela de entrega (TSP + constraints).
- Custo/km por veículo (route_costs) alimenta frete mínimo.
- Rastreamento em tempo real via delivery_tracking + comprovação em delivery_proof (foto/assinatura).
- Ocorrências geram automaticamente ticket comercial se atraso > SLA.
- MDF-e obrigatório antes de sair da doca (integra com Fiscal).
`,
  PRODUCAO: `
## ⚙️ PRODUÇÃO / PCP / INDÚSTRIA 4.0
Tabelas: production_orders, production_order_steps, production_routes, production_route_steps, production_bom, production_lines, production_machines, production_capacity, production_schedule, production_events, production_indicators, production_quality_checks, material_requirements, material_consumptions, work_centers, outsourcing_orders.

### Regras
- MRP II explode BOM (production_bom) e gera material_requirements por OP.
- APS multi-restrição: capacidade × setup × prazo → production_schedule.
- OEE = Disponibilidade × Performance × Qualidade (production_indicators).
- Kanban limita WIP por sector (kanban_limits).
- Apontamento em production_time_logs alimenta custo real (production_costs).
- Refugo/retrabalho vira production_quality_checks e ajusta OEE.
- Terceirização (outsourcing_orders) mantém rastreabilidade do lote.

### Gargalos
Identificados por production_events (setup/breakdown/idle) — priorizar TPM/SMED.
`,
  RH: `
## 👥 RH
Tabelas: profiles, user_roles, time_entries.

- Ponto (time_entries) alimenta folha e apuração de horas por OP.
- Escala de operadores integra com WMS labor management.
- Segregação de função: quem aprova PO não pode receber; quem pica não confere.
`,
  CRM: `
## 🎯 CRM
Tabelas: crm_leads, crm_opportunities, crm_pipelines, crm_pipeline_stages, follow_ups, follow_up_tasks, lead_nurturing_sequences, lead_nurturing_enrollments, client_timeline, clients.

- Lead → Oportunidade → Pedido (orders).
- Nurturing por sequência baseada em score do lead.
- SLA de resposta: primeira interação < 1h em horário comercial.
- Timeline unificada do cliente (client_timeline) — toda interação registrada.
`,
  PROJETOS: `
## 🏗️ PROJETOS (Construção / Serviços)
Tabelas: construction_projects, construction_budget_items, construction_measurements, construction_diary.

- Medição mensal libera faturamento parcial (AR).
- Diário de obra é evidência legal — imutável após D+1.
- Orçamento vs. realizado (variance) alimenta ai_executive_alerts.
`,
  SRE: `
## 📡 SRE / Observabilidade
Tabelas: sre_slos, sre_settings, sre_oncall_shifts, sre_runbooks, sre_postmortems, sre_postmortem_actions, system_incidents, system_events, system_metrics, alert_rules.

- SLO com error budget mensal; burn-rate > 2x em 1h → page.
- Postmortem obrigatório para severity ≥ SEV2 em ≤ 5 dias úteis.
- Action items com owner e due_date; escalonamento automático se atrasado.
`,
  LGPD: `
## 🛡️ LGPD / SEGURANÇA
Tabelas: lgpd_consents, lgpd_data_requests, financial_security_logs, ai_prompt_audit_logs.

- Consentimento explícito antes de coletar dado pessoal.
- Direito ao esquecimento: lgpd-delete edge function anonimiza.
- Portabilidade: lgpd-export gera JSON com dados do titular.
- Logs de acesso a PII em system_audit_logs.
- Nunca vazar CPF, RG, cartão em respostas — mascarar (***.***.***-XX).
`,
  AI_GUARDRAILS: `
## 🤖 GUARDRAILS DA IA
- **Anti-alucinação**: cite valores exatos vindos das tools; se vazio, diga "sem dados" e sugira o que cadastrar.
- **Multi-tenant**: NUNCA responder com dados de outra empresa. Sempre filtrar por company_id do usuário.
- **Ações destrutivas** (excluir, cancelar NF, transferir dinheiro): criar decisão pendente para aprovação humana (ai_brain_decisions), NÃO executar direto.
- **Segregação de função**: se o usuário não tem role suficiente para uma ação, explique e sugira o aprovador correto.
- **PII**: mascarar CPF, CNPJ, cartão, telefone em logs e respostas públicas.
- **Idempotência**: sempre usar chave idempotente ao criar registros via tool para evitar duplicatas.
- **Tom**: executivo, direto, orientado a decisão. Valores em **negrito** com R$/%.
- **Fontes**: quando citar número, referenciar a tabela/tool (ex.: "por accounts_receivable").
`,
};

/**
 * Mapa persona → módulos relevantes por padrão.
 * Personas críticas ('EXECUTIVE_COUNCIL', 'CEO') recebem TUDO.
 */
export const PERSONA_KNOWLEDGE_MAP: Record<string, KnowledgeModule[] | 'ALL'> = {
  EXECUTIVE_COUNCIL: 'ALL',
  CEO: 'ALL',
  CFO: ['GOVERNANCE', 'MULTITENANT', 'FINANCEIRO', 'CONTABIL', 'FISCAL', 'AI_GUARDRAILS', 'LGPD'],
  PCP_CONSULTANT: ['GOVERNANCE', 'MULTITENANT', 'PRODUCAO', 'ESTOQUE', 'WMS', 'COMPRAS', 'AI_GUARDRAILS'],
  SALES_CONSULTANT: ['GOVERNANCE', 'MULTITENANT', 'COMERCIAL', 'CRM', 'FINANCEIRO', 'ESTOQUE', 'AI_GUARDRAILS'],
  BRAIN: 'ALL',
  FISCAL: ['GOVERNANCE', 'MULTITENANT', 'FISCAL', 'CONTABIL', 'FINANCEIRO', 'AI_GUARDRAILS', 'LGPD'],
};

/**
 * Monta o bloco de conhecimento para incluir no system prompt.
 */
export function buildKnowledgeBlock(modules: KnowledgeModule[] | 'ALL'): string {
  const keys: KnowledgeModule[] =
    modules === 'ALL' ? (Object.keys(KNOWLEDGE) as KnowledgeModule[]) : modules;
  const body = keys.map((k) => KNOWLEDGE[k]).join('\n');
  return `
# 📖 BASE DE CONHECIMENTO DE NEGÓCIO — USE ERP
Você tem acesso e conhecimento completo dos módulos abaixo. Use-os como referência
autoritativa de regras, fórmulas, tabelas e KPIs. Sempre respeitar company_id.
${body}
`.trim();
}

export const KNOWLEDGE_VERSION = '1.0.0';
