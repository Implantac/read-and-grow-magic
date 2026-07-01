/**
 * Fase 1 — Enterprise Entity Registry
 *
 * Central catalog that maps a KPI/entity key to the data sources needed by the
 * DrillDownDrawer: source table, timeline view, related items, and business
 * copy ("what/why/what-now"). Adoption is opt-in — components that don't
 * declare a key simply won't get a drill-down button.
 */
export type EntityKey =
  | "revenue"
  | "gross_margin"
  | "accounts_receivable"
  | "accounts_payable"
  | "cash_position"
  | "wms_occupancy"
  | "wms_sla"
  | "oee"
  | "pipeline_amount"
  | "conversion_rate"
  | "churn_rate"
  | "nfe_rejected";

export interface EntityDefinition {
  key: EntityKey;
  label: string;
  unit: "currency" | "percent" | "count" | "hours";
  /** Domain owner — used by the AI panel to route the analysis persona. */
  agent: "cfo" | "ceo" | "coo" | "cro";
  /** Table used for the raw drill-down list. */
  sourceTable?: string;
  /** SQL fragment for `order_by` on drill-down list. */
  orderBy?: string;
  /** Related tables the drawer can open in tabs. */
  related?: Array<{ label: string; table: string; fk: string }>;
  /** Business narrative for empty AI/telemetry fallback. */
  narrative?: {
    what: string;
    why: string;
    next: string;
  };
}

export const entityRegistry: Record<EntityKey, EntityDefinition> = {
  revenue: {
    key: "revenue",
    label: "Faturamento",
    unit: "currency",
    agent: "cfo",
    sourceTable: "sales",
    orderBy: "sale_date desc",
    related: [
      { label: "Pedidos", table: "orders", fk: "id" },
      { label: "Clientes", table: "clients", fk: "id" },
      { label: "Contas a Receber", table: "accounts_receivable", fk: "sale_id" },
    ],
    narrative: {
      what: "Receita reconhecida no período consultado.",
      why: "Depende de volume de vendas, mix de produtos e política comercial.",
      next: "Comparar com meta, verificar clientes que reduziram compras e acionar campanha.",
    },
  },
  gross_margin: {
    key: "gross_margin",
    label: "Margem Bruta",
    unit: "percent",
    agent: "cfo",
    sourceTable: "sales",
    narrative: {
      what: "Percentual de margem sobre a receita.",
      why: "Custo de mercadoria, descontos e impostos afetam diretamente.",
      next: "Revisar CMV, descontos aplicados e composição de mix.",
    },
  },
  accounts_receivable: {
    key: "accounts_receivable",
    label: "Contas a Receber",
    unit: "currency",
    agent: "cfo",
    sourceTable: "accounts_receivable",
    orderBy: "due_date asc",
    related: [
      { label: "Clientes", table: "clients", fk: "client_id" },
      { label: "Cobranças", table: "collection_actions", fk: "receivable_id" },
    ],
    narrative: {
      what: "Saldo a receber e aging.",
      why: "Depende de prazo médio, política de cobrança e inadimplência.",
      next: "Priorizar cobranças em atraso > 30 dias e revisar limite de crédito.",
    },
  },
  accounts_payable: {
    key: "accounts_payable",
    label: "Contas a Pagar",
    unit: "currency",
    agent: "cfo",
    sourceTable: "accounts_payable",
    orderBy: "due_date asc",
    related: [{ label: "Fornecedores", table: "suppliers", fk: "supplier_id" }],
    narrative: {
      what: "Compromissos a pagar por vencimento.",
      why: "Programação de fluxo e prazo médio de fornecedores.",
      next: "Antecipar pagamentos com desconto e renegociar vencimentos.",
    },
  },
  cash_position: {
    key: "cash_position",
    label: "Posição de Caixa",
    unit: "currency",
    agent: "cfo",
    sourceTable: "bank_accounts",
    narrative: {
      what: "Saldo consolidado das contas bancárias.",
      why: "Entradas AR menos saídas AP mais conciliações.",
      next: "Revisar previsão 30d e antecipar recebíveis se houver risco.",
    },
  },
  wms_occupancy: {
    key: "wms_occupancy",
    label: "Ocupação do Armazém",
    unit: "percent",
    agent: "coo",
    sourceTable: "warehouse_locations",
    narrative: {
      what: "Percentual de posições ocupadas.",
      why: "Recebimentos, expedições e slotting afetam o índice.",
      next: "Rodar slotting ABC e mover SKUs lentos para zonas frias.",
    },
  },
  wms_sla: {
    key: "wms_sla",
    label: "SLA WMS",
    unit: "percent",
    agent: "coo",
    sourceTable: "wms_tasks",
    narrative: {
      what: "Tarefas concluídas dentro do prazo.",
      why: "Backlog, produtividade de picking e ondas influenciam.",
      next: "Balancear carga entre operadores e liberar novas ondas.",
    },
  },
  oee: {
    key: "oee",
    label: "OEE",
    unit: "percent",
    agent: "coo",
    sourceTable: "production_indicators",
    narrative: {
      what: "Eficiência global de equipamentos.",
      why: "Disponibilidade × Performance × Qualidade.",
      next: "Reduzir setup, eliminar paradas não planejadas e priorizar OPs.",
    },
  },
  pipeline_amount: {
    key: "pipeline_amount",
    label: "Pipeline Comercial",
    unit: "currency",
    agent: "cro",
    sourceTable: "crm_opportunities",
    narrative: {
      what: "Valor total em oportunidades abertas.",
      why: "Depende de geração de leads e taxa de conversão.",
      next: "Acionar leads em estágio avançado e revisar propostas paradas.",
    },
  },
  conversion_rate: {
    key: "conversion_rate",
    label: "Taxa de Conversão",
    unit: "percent",
    agent: "cro",
    sourceTable: "crm_opportunities",
    narrative: {
      what: "Oportunidades ganhas / total do funil.",
      why: "Qualidade do lead, follow-up e argumentação impactam.",
      next: "Aplicar playbook comercial e revisar objeções recorrentes.",
    },
  },
  churn_rate: {
    key: "churn_rate",
    label: "Churn de Clientes",
    unit: "percent",
    agent: "cro",
    sourceTable: "clients",
    narrative: {
      what: "Clientes ativos que deixaram de comprar.",
      why: "Preço, atendimento ou concorrência podem ser causas.",
      next: "Ativar cross-sell/up-sell e retenção via CS.",
    },
  },
  nfe_rejected: {
    key: "nfe_rejected",
    label: "NF-e Rejeitadas",
    unit: "count",
    agent: "coo",
    sourceTable: "nfe",
    narrative: {
      what: "Notas rejeitadas pela SEFAZ.",
      why: "Divergência cadastral, CST ou CFOP incorretos.",
      next: "Corrigir cadastro e retransmitir; revisar regra fiscal.",
    },
  },
};

export function getEntity(key: EntityKey): EntityDefinition | undefined {
  return entityRegistry[key];
}
