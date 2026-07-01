// ============================================================
// DATA TOOLS — Ferramentas de leitura cross-module (multi-tenant)
// Usadas pelos agentes de IA para consultar dados vivos do ERP.
// Todas as consultas são estritamente scoped por company_id.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Whitelist de tabelas legíveis + colunas seguras
const READ_WHITELIST: Record<string, string> = {
  clients: "id,name,document,status,credit_limit,total_purchased,created_at",
  suppliers: "id,name,document,status,created_at",
  products: "id,sku,name,category,stock_quantity,price,cost,status",
  orders: "id,number,client_name,total,status,created_at,delivery_date",
  accounts_payable: "id,supplier_name,amount,due_date,status,paid_at",
  accounts_receivable: "id,client_name,amount,due_date,status,paid_amount,open_amount",
  financial_ledger: "id,entry_date,description,amount,type,category_id",
  nfe: "id,number,client_name,total,status,issue_date",
  production_orders: "id,number,product_name,quantity,status,due_date,priority",
  stock_balances: "id,product_id,warehouse_id,quantity,reserved_quantity",
  wms_tasks: "id,task_type,status,priority,created_at,assigned_to",
  financial_alerts: "id,alert_type,severity,title,description,created_at",
  ai_brain_decisions: "id,module,title,impact_level,risk_level,status,created_at",
  purchase_orders: "id,number,supplier_name,total,status,expected_delivery",
  quotations: "id,number,client_name,total,status,valid_until",
  sales: "id,total,status,created_at,client_name",
  sre_postmortems: "id,title,severity,status,created_at",
};

const ALLOWED_OPS = new Set(["eq", "gt", "gte", "lt", "lte", "in", "like", "ilike", "is"]);

export interface QueryInput {
  table: string;
  filters?: Array<{ column: string; op: string; value: any }>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

export async function runReadQuery(companyId: string, q: QueryInput) {
  if (!companyId) return { ok: false, error: "company_id obrigatório" };
  const cols = READ_WHITELIST[q.table];
  if (!cols) return { ok: false, error: `Tabela ${q.table} não liberada para consulta` };

  let query: any = admin.from(q.table).select(cols).eq("company_id", companyId);
  for (const f of q.filters || []) {
    if (!ALLOWED_OPS.has(f.op)) continue;
    if (!/^[a-z_][a-z0-9_]*$/i.test(f.column)) continue;
    query = query[f.op](f.column, f.value);
  }
  if (q.order?.column && /^[a-z_][a-z0-9_]*$/i.test(q.order.column)) {
    query = query.order(q.order.column, { ascending: q.order.ascending !== false });
  }
  query = query.limit(Math.min(Math.max(q.limit ?? 20, 1), 100));

  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };
  return { ok: true, count: data?.length || 0, rows: data || [] };
}

export async function runAggregate(companyId: string, table: string, agg: "count" | "sum", column?: string) {
  if (!companyId) return { ok: false, error: "company_id obrigatório" };
  if (!READ_WHITELIST[table]) return { ok: false, error: `Tabela ${table} não liberada` };
  if (agg === "count") {
    const { count, error } = await admin.from(table).select("id", { count: "exact", head: true }).eq("company_id", companyId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, agg: "count", value: count || 0 };
  }
  if (agg === "sum" && column) {
    const { data, error } = await admin.from(table).select(column).eq("company_id", companyId).limit(10000);
    if (error) return { ok: false, error: error.message };
    const total = (data || []).reduce((s: number, r: any) => s + (Number(r[column]) || 0), 0);
    return { ok: true, agg: "sum", column, value: total, sampled: data?.length || 0 };
  }
  return { ok: false, error: "agregação inválida" };
}

// Schema OpenAI tool-calling exportado para os agentes
export const DATA_TOOL_SCHEMAS = [
  {
    type: "function",
    function: {
      name: "query_data",
      description: `Consulta dados vivos do ERP (leitura, tenant-scoped). Tabelas: ${Object.keys(READ_WHITELIST).join(", ")}.`,
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", enum: Object.keys(READ_WHITELIST) },
          filters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                column: { type: "string" },
                op: { type: "string", enum: [...ALLOWED_OPS] },
                value: {},
              },
              required: ["column", "op", "value"],
            },
          },
          order: {
            type: "object",
            properties: { column: { type: "string" }, ascending: { type: "boolean" } },
          },
          limit: { type: "number", minimum: 1, maximum: 100 },
        },
        required: ["table"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "aggregate_data",
      description: "Calcula agregações (count/sum) em uma tabela permitida do tenant.",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", enum: Object.keys(READ_WHITELIST) },
          agg: { type: "string", enum: ["count", "sum"] },
          column: { type: "string" },
        },
        required: ["table", "agg"],
      },
    },
  },
];

export const DATA_TOOL_NAMES = new Set(["query_data", "aggregate_data"]);

export async function dispatchDataTool(name: string, args: any, companyId: string) {
  if (name === "query_data") return runReadQuery(companyId, args);
  if (name === "aggregate_data") return runAggregate(companyId, args.table, args.agg, args.column);
  return { ok: false, error: `tool ${name} não encontrada` };
}
