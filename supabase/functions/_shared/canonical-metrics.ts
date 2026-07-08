// deno-lint-ignore-file no-explicit-any
// ============================================================
// CANONICAL METRICS — Fonte única de verdade para IAs
// ------------------------------------------------------------
// Este módulo espelha EXATAMENTE `src/hooks/system/useDashboardData.ts`
// para que todos os resumos gerados por qualquer IA (ai-executive,
// ai-brain, ai-insight, financial-insights, daily-executive-report,
// etc.) partam da MESMA base de números e MESMAS definições.
//
// Regra de ouro: qualquer valor citado por uma IA deve existir aqui.
// Se um valor não está presente, a IA deve dizer "dados insuficientes".
// ============================================================
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const CANONICAL_METRICS_VERSION = "1.0.0";

export interface CanonicalMetrics {
  available: boolean;
  reason?: string;
  version: string;
  reference_date: string;
  periodo: { mes_atual_inicio: string; mes_atual_fim: string };
  counts: Record<string, number>;
  fonte: string;
  comercial: {
    faturamento_mes: number;
    faturamento_mes_anterior: number;
    faturamento_trend_pct: number;
    ticket_medio: number;
    pedidos_mes_count: number;
    pedidos_pendentes: number;
    clientes_ativos: number;
  };
  financeiro: {
    ar_pending_total: number;
    ar_pending_count: number;
    ar_overdue_total: number;
    ar_overdue_count: number;
    ar_top5: Array<{ id: string; client_id?: string; valor: number; due_date?: string; vencido?: boolean }>;
    ap_pending_total: number;
    ap_pending_count: number;
    ap_overdue_total: number;
    ap_overdue_count: number;
    ap_top5: Array<{ id: string; supplier_id?: string; valor: number; due_date?: string; vencido?: boolean }>;
    saldo_liquido: number;
  };
  fiscal: { nfe_autorizadas_mes: number; nfe_rascunho: number };
  producao: { op_ativas: number; op_concluidas_total: number };
  compras: { aguardando_aprovacao: number };
  _definitions: Record<string, string>;
  _regra: string;
}

/**
 * DEFINIÇÕES CANÔNICAS — usadas por TODAS as IAs.
 * Qualquer variação = bug. Não crie definições paralelas em outros lugares.
 */
export const CANONICAL_DEFINITIONS: Record<string, string> = {
  faturamento_mes:
    "Soma de sales.total onde status='completed' e date no mês corrente. Idêntico ao Dashboard Consolidado.",
  ar_pending_total:
    "Soma de accounts_receivable.amount onde status='pending' (não usar open_amount). Idêntico ao Dashboard.",
  ar_overdue_total:
    "Subconjunto de ar_pending onde due_date < hoje. Não inclui parciais.",
  ap_pending_total:
    "Soma de accounts_payable.amount onde status='pending'. Idêntico ao Dashboard.",
  ap_overdue_total:
    "Subconjunto de ap_pending onde due_date < hoje.",
  saldo_liquido: "ar_pending_total - ap_pending_total.",
  pedidos_mes_count: "orders.date no mês corrente.",
  clientes_ativos: "clients.status='active'.",
  op_ativas: "production_orders.status ∈ {in_progress, started}.",
  compras_aguardando_aprovacao: "purchase_orders.status ∈ {draft, pending}.",
};

const TABLES_TO_COUNT = [
  "clients", "suppliers", "products", "orders",
  "accounts_payable", "accounts_receivable", "financial_ledger",
  "nfe", "production_orders", "stock_balances", "purchase_orders",
  "quotations", "financial_alerts",
];

/**
 * Constrói o snapshot canônico para uma empresa.
 * Se companyId for null/undefined retorna { available: false }.
 */
export async function buildCanonicalMetrics(
  admin: SupabaseClient,
  companyId: string | null | undefined,
): Promise<CanonicalMetrics> {
  const base = {
    version: CANONICAL_METRICS_VERSION,
    reference_date: "",
    periodo: { mes_atual_inicio: "", mes_atual_fim: "" },
    counts: {},
    fonte: "Espelha useDashboardData.ts — mesmos filtros do Dashboard Consolidado",
    comercial: {
      faturamento_mes: 0, faturamento_mes_anterior: 0, faturamento_trend_pct: 0,
      ticket_medio: 0, pedidos_mes_count: 0, pedidos_pendentes: 0, clientes_ativos: 0,
    },
    financeiro: {
      ar_pending_total: 0, ar_pending_count: 0, ar_overdue_total: 0, ar_overdue_count: 0, ar_top5: [],
      ap_pending_total: 0, ap_pending_count: 0, ap_overdue_total: 0, ap_overdue_count: 0, ap_top5: [],
      saldo_liquido: 0,
    },
    fiscal: { nfe_autorizadas_mes: 0, nfe_rascunho: 0 },
    producao: { op_ativas: 0, op_concluidas_total: 0 },
    compras: { aguardando_aprovacao: 0 },
    _definitions: CANONICAL_DEFINITIONS,
    _regra: "Estes números são idênticos aos exibidos no Dashboard Consolidado. Qualquer valor não presente aqui = 'dados insuficientes'.",
  };

  if (!companyId) {
    return { available: false, reason: "sem company_id", ...base };
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59).toISOString();

  const counts: Record<string, number> = {};
  await Promise.all(TABLES_TO_COUNT.map(async (t) => {
    const { count } = await admin.from(t).select("id", { count: "exact", head: true }).eq("company_id", companyId);
    counts[t] = count ?? 0;
  }));

  const [salesCurRes, salesPrevRes] = await Promise.all([
    admin.from("sales").select("total,status,date").gte("date", monthStart).lte("date", monthEnd).eq("company_id", companyId),
    admin.from("sales").select("total,status,date").gte("date", prevMonthStart).lte("date", prevMonthEnd).eq("company_id", companyId),
  ]);
  const salesCur = (salesCurRes.data || []).filter((s: any) => s.status === "completed");
  const salesPrev = (salesPrevRes.data || []).filter((s: any) => s.status === "completed");
  const faturamento_mes = +salesCur.reduce((s: number, r: any) => s + (Number(r.total) || 0), 0).toFixed(2);
  const faturamento_mes_anterior = +salesPrev.reduce((s: number, r: any) => s + (Number(r.total) || 0), 0).toFixed(2);
  const faturamento_trend_pct = faturamento_mes_anterior > 0
    ? +(((faturamento_mes - faturamento_mes_anterior) / faturamento_mes_anterior) * 100).toFixed(2)
    : 0;
  const ticket_medio = salesCur.length > 0 ? +(faturamento_mes / salesCur.length).toFixed(2) : 0;

  const { data: arData } = await admin.from("accounts_receivable")
    .select("id,client_id,amount,due_date,status").eq("status", "pending").eq("company_id", companyId).limit(2000);
  const arRows = (arData || []).map((r: any) => ({
    id: r.id, client_id: r.client_id,
    valor: Number(r.amount) || 0,
    due_date: r.due_date,
    vencido: r.due_date && r.due_date < todayStr,
  }));
  const ar_pending_total = +arRows.reduce((s, r) => s + r.valor, 0).toFixed(2);
  const ar_overdue = arRows.filter(r => r.vencido);
  const ar_overdue_total = +ar_overdue.reduce((s, r) => s + r.valor, 0).toFixed(2);
  const ar_top5 = [...arRows].sort((a, b) => b.valor - a.valor).slice(0, 5);

  const { data: apData } = await admin.from("accounts_payable")
    .select("id,supplier_id,amount,due_date,status").eq("status", "pending").eq("company_id", companyId).limit(2000);
  const apRows = (apData || []).map((r: any) => ({
    id: r.id, supplier_id: r.supplier_id,
    valor: Number(r.amount) || 0,
    due_date: r.due_date,
    vencido: r.due_date && r.due_date < todayStr,
  }));
  const ap_pending_total = +apRows.reduce((s, r) => s + r.valor, 0).toFixed(2);
  const ap_overdue = apRows.filter(r => r.vencido);
  const ap_overdue_total = +ap_overdue.reduce((s, r) => s + r.valor, 0).toFixed(2);
  const ap_top5 = [...apRows].sort((a, b) => b.valor - a.valor).slice(0, 5);
  const saldo_liquido = +(ar_pending_total - ap_pending_total).toFixed(2);

  const { data: ordersMonth } = await admin.from("orders")
    .select("id,status,total,priority,created_at,date")
    .gte("date", monthStart).lte("date", monthEnd).eq("company_id", companyId).limit(2000);
  const ordersMes = ordersMonth || [];
  const pedidos_mes_count = ordersMes.length;
  const pedidos_pendentes = ordersMes.filter((o: any) => o.status === "pending").length;

  const { count: clientes_ativos } = await admin.from("clients")
    .select("id", { count: "exact", head: true }).eq("status", "active").eq("company_id", companyId);

  const { data: nfeMonth } = await admin.from("nfe")
    .select("id,status,total").gte("issue_date", monthStart).eq("company_id", companyId).limit(2000);
  const nfes = nfeMonth || [];
  const nfe_autorizadas = nfes.filter((n: any) => n.status === "authorized").length;
  const nfe_rascunho = nfes.filter((n: any) => n.status === "draft").length;

  const { data: prodOrdersData } = await admin.from("production_orders")
    .select("id,status,quantity,produced_quantity").eq("company_id", companyId).limit(2000);
  const prodOrders = prodOrdersData || [];
  const op_ativas = prodOrders.filter((o: any) => ["in_progress", "started"].includes(o.status)).length;
  const op_concluidas = prodOrders.filter((o: any) => o.status === "completed").length;

  const { data: purchData } = await admin.from("purchase_orders")
    .select("id,status,total").eq("company_id", companyId).limit(2000);
  const purchases = purchData || [];
  const compras_aprovacao = purchases.filter((o: any) => ["draft", "pending"].includes(o.status)).length;

  return {
    available: true,
    version: CANONICAL_METRICS_VERSION,
    reference_date: todayStr,
    periodo: { mes_atual_inicio: monthStart.slice(0, 10), mes_atual_fim: monthEnd.slice(0, 10) },
    counts,
    fonte: "Espelha useDashboardData.ts — mesmos filtros do Dashboard Consolidado",
    comercial: {
      faturamento_mes, faturamento_mes_anterior, faturamento_trend_pct,
      ticket_medio, pedidos_mes_count, pedidos_pendentes,
      clientes_ativos: clientes_ativos ?? 0,
    },
    financeiro: {
      ar_pending_total, ar_pending_count: arRows.length, ar_overdue_total, ar_overdue_count: ar_overdue.length, ar_top5,
      ap_pending_total, ap_pending_count: apRows.length, ap_overdue_total, ap_overdue_count: ap_overdue.length, ap_top5,
      saldo_liquido,
    },
    fiscal: { nfe_autorizadas_mes: nfe_autorizadas, nfe_rascunho },
    producao: { op_ativas, op_concluidas_total: op_concluidas },
    compras: { aguardando_aprovacao: compras_aprovacao },
    _definitions: CANONICAL_DEFINITIONS,
    _regra: "Estes números são idênticos aos exibidos no Dashboard Consolidado. Qualquer divergência = bug. Qualquer valor não presente aqui = 'dados insuficientes'.",
  };
}

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
const pct = (n: number) => `${(Number(n) || 0).toFixed(1)}%`;

/**
 * Formata a métrica canônica como bloco de texto para injetar no system prompt.
 * Todas as IAs devem receber ESTE bloco — a versão textual da fonte única.
 */
export function formatCanonicalBlock(m: CanonicalMetrics): string {
  if (!m.available) {
    return `\n# 📊 MÉTRICAS CANÔNICAS (Fonte única de verdade)\nDados insuficientes: ${m.reason || "empresa não identificada"}.\nNão invente números. Responda que faltam cadastros.\n`;
  }
  const c = m.comercial, f = m.financeiro;
  return `
# 📊 MÉTRICAS CANÔNICAS — FONTE ÚNICA DE VERDADE (v${m.version})
_Referência: ${m.reference_date} • Período: ${m.periodo.mes_atual_inicio} → ${m.periodo.mes_atual_fim}_
_Estes números são IDÊNTICOS aos exibidos no Dashboard Consolidado. Qualquer valor citado deve vir daqui._

## Comercial
- Faturamento mês: **${brl(c.faturamento_mes)}** (mês anterior: ${brl(c.faturamento_mes_anterior)} • variação **${pct(c.faturamento_trend_pct)}**)
- Ticket médio: **${brl(c.ticket_medio)}**
- Pedidos no mês: **${c.pedidos_mes_count}** (pendentes: ${c.pedidos_pendentes})
- Clientes ativos: **${c.clientes_ativos}**

## Financeiro
- A receber (pendentes): **${brl(f.ar_pending_total)}** em ${f.ar_pending_count} títulos
- A receber vencidos: **${brl(f.ar_overdue_total)}** em ${f.ar_overdue_count} títulos
- A pagar (pendentes): **${brl(f.ap_pending_total)}** em ${f.ap_pending_count} títulos
- A pagar vencidos: **${brl(f.ap_overdue_total)}** em ${f.ap_overdue_count} títulos
- Saldo líquido (AR - AP): **${brl(f.saldo_liquido)}**

## Fiscal / Produção / Compras
- NF-e autorizadas no mês: **${m.fiscal.nfe_autorizadas_mes}** • rascunho: ${m.fiscal.nfe_rascunho}
- OPs ativas: **${m.producao.op_ativas}** • concluídas (total): ${m.producao.op_concluidas_total}
- Compras aguardando aprovação: **${m.compras.aguardando_aprovacao}**

## Regras
- Cite APENAS valores presentes neste bloco. Não recalcule por conta própria.
- Formate SEMPRE como **R$ X.XXX,XX** e porcentagens em **negrito** (**15,5%**).
- Se um número que o usuário pediu não está aqui, responda "dados insuficientes" e sugira o cadastro.
`.trim();
}
