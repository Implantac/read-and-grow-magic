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

export default defineTool({
  name: "list_payables",
  title: "Contas a pagar",
  description:
    "Lista títulos financeiros a pagar (accounts_payable). Filtra por status ('open', 'paid', 'overdue') e retorna até `limit` registros ordenados por vencimento.",
  inputSchema: {
    status: z.enum(["open", "paid", "overdue"]).optional().describe("Filtra pelo status do título."),
    limit: z.number().int().positive().max(100).optional().describe("Máximo de resultados (padrão 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = userClient(ctx);
    let q = supabase
      .from("accounts_payable")
      .select("id, description, supplier_name, amount, due_date, status")
      .order("due_date", { ascending: true })
      .limit(limit ?? 20);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const total = (data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
    return {
      content: [
        {
          type: "text",
          text: `Encontrados ${data?.length ?? 0} títulos (soma R$ ${total.toFixed(2)})\n\n${JSON.stringify(
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
