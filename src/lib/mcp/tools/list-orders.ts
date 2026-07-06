import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

declare const process: { env: Record<string, string | undefined> };

function userClient(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

const STATUS_VALUES = [
  "pending",
  "confirmed",
  "processing",
  "separated",
  "invoiced",
  "shipped",
  "delivered",
  "cancelled",
  "quote",
  "awaiting_commercial_approval",
  "awaiting_financial_approval",
  "blocked",
  "awaiting_separation",
  "in_separation",
  "awaiting_production",
  "in_production",
  "partial_production",
  "awaiting_conference",
  "conferenced",
  "awaiting_billing",
] as const;

export default defineTool({
  name: "list_orders",
  title: "Listar pedidos",
  description:
    "Lista pedidos comerciais (orders) filtrando por status e intervalo de datas (campo `date`). Respeita RLS multi-tenant e retorna até `limit` registros ordenados por data desc.",
  inputSchema: {
    status: z.enum(STATUS_VALUES).optional().describe("Filtra pelo status do pedido."),
    date_from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Data inicial (YYYY-MM-DD), inclusive."),
    date_to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Data final (YYYY-MM-DD), inclusive."),
    limit: z.number().int().positive().max(100).optional().describe("Máximo de resultados (padrão 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, date_from, date_to, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = userClient(ctx);
    let q = supabase
      .from("orders")
      .select(
        "id, number, client_name, date, delivery_date, total, status, priority, payment_method",
      )
      .order("date", { ascending: false })
      .limit(limit ?? 20);
    if (status) q = q.eq("status", status);
    if (date_from) q = q.gte("date", `${date_from}T00:00:00.000Z`);
    if (date_to) q = q.lte("date", `${date_to}T23:59:59.999Z`);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const total = (data ?? []).reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);
    return {
      content: [
        {
          type: "text",
          text: `Encontrados ${data?.length ?? 0} pedidos (soma R$ ${total.toFixed(2)})\n\n${JSON.stringify(
            data ?? [],
            null,
            2,
          )}`,
        },
      ],
      structuredContent: { rows: data ?? [], count: data?.length ?? 0, total_amount: total },
    };
  },
});
