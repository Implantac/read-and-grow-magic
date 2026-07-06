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

// Cursor keyset: ordenação estável por (date desc, id desc). O cursor
// carrega a última tupla vista — evita OFFSET grande (que reescaneia todo
// o prefixo) e é robusto a inserts concorrentes. Formato: base64 de
// {"d": ISO, "i": uuid}. Assinatura não é necessária: RLS já garante que
// o usuário só enxerga tuplas do próprio tenant, e o cursor só influencia
// ordenação — nunca autoriza acesso.
type CursorPayload = { d: string; i: string };
function encodeCursor(p: CursorPayload): string {
  return btoa(JSON.stringify(p));
}
function decodeCursor(raw: string): CursorPayload | null {
  try {
    const p = JSON.parse(atob(raw));
    if (typeof p?.d === "string" && typeof p?.i === "string") return p;
    return null;
  } catch {
    return null;
  }
}

export default defineTool({
  name: "list_orders",
  title: "Listar pedidos",
  description:
    "Lista pedidos comerciais (orders) filtrando por status e intervalo de datas (campo `date`). " +
    "Respeita RLS multi-tenant. Ordenação estável por (date desc, id desc). " +
    "Paginação por cursor keyset: passe `cursor` (retornado como `next_cursor` na resposta anterior) " +
    "para buscar a próxima página. `has_more=true` indica que existem mais resultados.",
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
    limit: z
      .number()
      .int()
      .positive()
      .max(100)
      .optional()
      .describe("Máximo de resultados por página (padrão 20, teto 100)."),
    cursor: z
      .string()
      .optional()
      .describe(
        "Cursor opaco de paginação (use `next_cursor` da resposta anterior). Ignorar na primeira chamada.",
      ),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, date_from, date_to, limit, cursor }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = userClient(ctx);
    const pageSize = limit ?? 20;

    // Busca pageSize+1 para detectar has_more sem SELECT count(*).
    let q = supabase
      .from("orders")
      .select(
        "id, number, client_name, date, delivery_date, total, status, priority, payment_method",
      )
      .order("date", { ascending: false })
      .order("id", { ascending: false })
      .limit(pageSize + 1);

    if (status) q = q.eq("status", status);
    if (date_from) q = q.gte("date", `${date_from}T00:00:00.000Z`);
    if (date_to) q = q.lte("date", `${date_to}T23:59:59.999Z`);

    if (cursor) {
      const c = decodeCursor(cursor);
      if (!c) {
        return {
          content: [{ type: "text", text: "Cursor inválido." }],
          isError: true,
        };
      }
      // Keyset (date desc, id desc): próxima página são as tuplas
      // (date < c.d) OR (date = c.d AND id < c.i).
      q = q.or(`date.lt.${c.d},and(date.eq.${c.d},id.lt.${c.i})`);
    }

    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    const rowsAll = (data ?? []) as Array<{ id: string; date: string; total: number | null }>;
    const hasMore = rowsAll.length > pageSize;
    const rows = hasMore ? rowsAll.slice(0, pageSize) : rowsAll;
    const last = rows[rows.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor({ d: last.date, i: last.id }) : null;
    const pageTotal = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);

    return {
      content: [
        {
          type: "text",
          text:
            `Página com ${rows.length} pedidos (soma R$ ${pageTotal.toFixed(2)})` +
            (hasMore ? " — há mais resultados (use next_cursor)." : " — fim dos resultados.") +
            `\n\n${JSON.stringify(rows, null, 2)}`,
        },
      ],
      structuredContent: {
        rows,
        count: rows.length,
        total_amount: pageTotal,
        has_more: hasMore,
        next_cursor: nextCursor,
      },
    };
  },
});
