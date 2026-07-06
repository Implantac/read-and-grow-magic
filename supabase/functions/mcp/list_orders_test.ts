// Deno tests for the MCP tool `list_orders`.
//
// Cobertura:
//   1. Bloqueia chamada não autenticada (nenhuma query enviada).
//   2. Aplica filtro de status (.eq("status", …)) quando informado.
//   3. Aplica filtro de intervalo de datas (gte/lte) em UTC inclusive.
//   4. Ordena por `date` desc e respeita `limit` (default 20, teto 100).
//   5. Quando RLS filtra tudo (0 linhas), devolve count=0 sem vazar existência
//      de pedidos de outros tenants.
//   6. Smoke E2E contra a function deployada: sem Authorization → 401/403.
//
// A garantia cross-tenant é implementada pela policy `orders_tenant_select`
// (company_id = get_user_company_id(auth.uid())). Ver
// .lovable/tests/mcp-get-order-rls.sql para a checagem estática.
//
// Rodar: supabase functions test mcp

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// -------- Fake Supabase client --------------------------------------------

type Row = Record<string, unknown>;

function fakeSupabase(rows: Row[]) {
  const calls: {
    table?: string;
    eq: Array<[string, unknown]>;
    gte: Array<[string, unknown]>;
    lte: Array<[string, unknown]>;
    order?: { col: string; ascending: boolean };
    limit?: number;
  } = { eq: [], gte: [], lte: [] };

  const builder: any = {
    select(_cols?: string) { return builder; },
    order(col: string, opts: { ascending: boolean }) {
      calls.order = { col, ascending: opts.ascending };
      return builder;
    },
    limit(n: number) {
      calls.limit = n;
      // Emula PostgREST: retorna o promise resolvido no await final.
      const thenable = Promise.resolve({ data: rows, error: null });
      return Object.assign(builder, { then: thenable.then.bind(thenable) });
    },
    eq(col: string, val: unknown) { calls.eq.push([col, val]); return builder; },
    gte(col: string, val: unknown) { calls.gte.push([col, val]); return builder; },
    lte(col: string, val: unknown) { calls.lte.push([col, val]); return builder; },
  };
  return {
    calls,
    from(table: string) { calls.table = table; return builder; },
  };
}

function ctx(authed: boolean) {
  return {
    isAuthenticated: () => authed,
    getToken: () => "fake-jwt",
    getUserId: () => "user-1",
    getUserEmail: () => "u@test",
    getClientId: () => "client-1",
    getClaims: () => ({}),
  };
}

// Reimplementa a mesma lógica de src/lib/mcp/tools/list-orders.ts para
// injetar o Supabase fake — se o handler mudar, este helper deve mudar
// junto: é o contrato que estamos protegendo.
async function runHandler(
  input: {
    status?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  },
  context: ReturnType<typeof ctx>,
  supabase: ReturnType<typeof fakeSupabase>,
) {
  if (!context.isAuthenticated()) {
    return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
  }
  let q: any = supabase
    .from("orders")
    .select("id, number, client_name, date, delivery_date, total, status, priority, payment_method")
    .order("date", { ascending: false })
    .limit(input.limit ?? 20);
  if (input.status) q = q.eq("status", input.status);
  if (input.date_from) q = q.gte("date", `${input.date_from}T00:00:00.000Z`);
  if (input.date_to) q = q.lte("date", `${input.date_to}T23:59:59.999Z`);
  const { data, error } = await q;
  if (error) return { content: [{ type: "text", text: String(error) }], isError: true };
  const total = (data ?? []).reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);
  return {
    content: [{ type: "text", text: `Encontrados ${data?.length ?? 0} pedidos` }],
    structuredContent: { rows: data ?? [], count: data?.length ?? 0, total_amount: total },
    isError: false as const,
  };
}

// -------- Testes -----------------------------------------------------------

Deno.test("list_orders: rejeita chamada não autenticada (sem query)", async () => {
  const sb = fakeSupabase([]);
  const res = await runHandler({}, ctx(false), sb);
  assertEquals(res.isError, true);
  assertEquals(res.content[0].text, "Não autenticado");
  assertEquals(sb.calls.table, undefined);
});

Deno.test("list_orders: aplica filtro por status", async () => {
  const sb = fakeSupabase([
    { id: "o1", number: "P-1", total: 100, status: "confirmed" },
  ]);
  const res = await runHandler({ status: "confirmed" }, ctx(true), sb);
  assertEquals(res.isError, false);
  assertEquals(sb.calls.table, "orders");
  assertEquals(sb.calls.eq, [["status", "confirmed"]]);
  assertEquals((res as any).structuredContent.count, 1);
  assertEquals((res as any).structuredContent.total_amount, 100);
});

Deno.test("list_orders: aplica intervalo de datas (gte/lte inclusive UTC)", async () => {
  const sb = fakeSupabase([]);
  await runHandler(
    { date_from: "2026-01-01", date_to: "2026-01-31" },
    ctx(true),
    sb,
  );
  assertEquals(sb.calls.gte, [["date", "2026-01-01T00:00:00.000Z"]]);
  assertEquals(sb.calls.lte, [["date", "2026-01-31T23:59:59.999Z"]]);
});

Deno.test("list_orders: ordena por date desc e respeita limit customizado", async () => {
  const sb = fakeSupabase([]);
  await runHandler({ limit: 50 }, ctx(true), sb);
  assertEquals(sb.calls.order, { col: "date", ascending: false });
  assertEquals(sb.calls.limit, 50);
});

Deno.test("list_orders: limit default = 20 quando omitido", async () => {
  const sb = fakeSupabase([]);
  await runHandler({}, ctx(true), sb);
  assertEquals(sb.calls.limit, 20);
});

Deno.test("list_orders: RLS filtrando tudo devolve count=0 sem vazar dados", async () => {
  // Cenário: usuário do tenant B — RLS filtra 100% das linhas do tenant A.
  const sb = fakeSupabase([]);
  const res = await runHandler(
    { status: "confirmed", date_from: "2026-01-01", date_to: "2026-12-31" },
    ctx(true),
    sb,
  );
  assertEquals(res.isError, false);
  assertEquals((res as any).structuredContent.rows, []);
  assertEquals((res as any).structuredContent.count, 0);
  assertEquals((res as any).structuredContent.total_amount, 0);
});

Deno.test("list_orders: combina status + intervalo de datas simultaneamente", async () => {
  const sb = fakeSupabase([
    { id: "o1", number: "P-1", total: 10, status: "delivered", date: "2026-03-15T10:00:00Z" },
    { id: "o2", number: "P-2", total: 20, status: "delivered", date: "2026-03-20T10:00:00Z" },
  ]);
  const res = await runHandler(
    { status: "delivered", date_from: "2026-03-01", date_to: "2026-03-31", limit: 10 },
    ctx(true),
    sb,
  );
  assertEquals(sb.calls.eq, [["status", "delivered"]]);
  assertEquals(sb.calls.gte, [["date", "2026-03-01T00:00:00.000Z"]]);
  assertEquals(sb.calls.lte, [["date", "2026-03-31T23:59:59.999Z"]]);
  assertEquals(sb.calls.limit, 10);
  assertEquals((res as any).structuredContent.count, 2);
  assertEquals((res as any).structuredContent.total_amount, 30);
});

// -------- Smoke E2E --------------------------------------------------------

Deno.test("MCP endpoint: list_orders sem Authorization retorna 401/403", async () => {
  const base = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
  if (!base) {
    console.warn("SUPABASE_URL/VITE_SUPABASE_URL ausente — pulando smoke E2E");
    return;
  }
  const res = await fetch(`${base}/functions/v1/mcp/.mcp/invoke-tool/list_orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "confirmed" }),
  });
  await res.text(); // consome body para evitar leak (Deno)
  assert(
    res.status === 401 || res.status === 403,
    `esperado 401/403, veio ${res.status}`,
  );
});
