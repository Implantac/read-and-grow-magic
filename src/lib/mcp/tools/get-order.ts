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
  name: "get_order",
  title: "Buscar pedido por ID",
  description:
    "Retorna um pedido comercial (orders) pelo `order_id` com seus itens (order_items). Respeita RLS multi-tenant — só retorna o pedido se o usuário tiver acesso.",
  inputSchema: {
    order_id: z.string().uuid().describe("UUID do pedido."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = userClient(ctx);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `id, number, client_id, client_name, date, delivery_date,
         subtotal, discount, shipping, total,
         payment_method, payment_condition,
         status, priority,
         sales_rep_id, sales_rep_name,
         fulfillment_status, production_status, separation_status,
         conference_status, billing_status, shipment_status,
         commercial_approval, financial_approval,
         notes, created_at, updated_at,
         items:order_items(id, product_id, product_name, product_code, quantity, unit_price, discount, total)`,
      )
      .eq("id", order_id)
      .maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!data) {
      return {
        content: [{ type: "text", text: "Pedido não encontrado ou sem permissão de acesso." }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { order: data },
    };
  },
});
