import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

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
  name: "search_products",
  title: "Buscar produtos",
  description:
    "Lista produtos do estoque do usuário. Filtra por termo (nome/SKU) e retorna até `limit` resultados. Respeita RLS multi-tenant.",
  inputSchema: {
    query: z.string().trim().optional().describe("Termo de busca por nome ou SKU."),
    limit: z.number().int().positive().max(50).optional().describe("Máximo de resultados (padrão 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = userClient(ctx);
    const max = limit ?? 20;
    let q = supabase.from("products").select("id, sku, name, unit, sale_price, stock_quantity").limit(max);
    if (query && query.length > 0) {
      const term = `%${query}%`;
      q = q.or(`name.ilike.${term},sku.ilike.${term}`);
    }
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { rows: data ?? [], count: data?.length ?? 0 },
    };
  },
});
