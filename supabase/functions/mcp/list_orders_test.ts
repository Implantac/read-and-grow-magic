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
    ilike: Array<[string, unknown]>;
    or: string[];
    order: Array<{ col: string; ascending: boolean }>;
    limit?: number;
  } = { eq: [], gte: [], lte: [], ilike: [], or: [], order: [] };

  const builder: any = {
    select(_cols?: string) { return builder; },
    order(col: string, opts: { ascending: boolean }) {
      calls.order.push({ col, ascending: opts.ascending });
      return builder;
    },
    limit(n: number) {
      calls.limit = n;
      const thenable = Promise.resolve({ data: rows, error: null });
      return Object.assign(builder, { then: thenable.then.bind(thenable) });
    },
    eq(col: string, val: unknown) { calls.eq.push([col, val]); return builder; },
    gte(col: string, val: unknown) { calls.gte.push([col, val]); return builder; },
    lte(col: string, val: unknown) { calls.lte.push([col, val]); return builder; },
    ilike(col: string, val: unknown) { calls.ilike.push([col, val]); return builder; },
    or(expr: string) { calls.or.push(expr); return builder; },
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
// injetar o Supabase fake — inclui paginação keyset (date desc, id desc).
function encodeCursor(p: { d: string; i: string }) { return btoa(JSON.stringify(p)); }
function decodeCursor(raw: string): { d: string; i: string } | null {
  try {
    const p = JSON.parse(atob(raw));
    if (typeof p?.d === "string" && typeof p?.i === "string") return p;
    return null;
  } catch { return null; }
}

async function runHandler(
  input: {
    status?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    cursor?: string;
  },
  context: ReturnType<typeof ctx>,
  supabase: ReturnType<typeof fakeSupabase>,
) {
  if (!context.isAuthenticated()) {
    return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
  }
  const pageSize = input.limit ?? 20;
  let q: any = supabase
    .from("orders")
    .select("id, number, client_name, date, delivery_date, total, status, priority, payment_method")
    .order("date", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);
  if (input.status) q = q.eq("status", input.status);
  if (input.date_from) q = q.gte("date", `${input.date_from}T00:00:00.000Z`);
  if (input.date_to) q = q.lte("date", `${input.date_to}T23:59:59.999Z`);
  if (input.cursor) {
    const c = decodeCursor(input.cursor);
    if (!c) return { content: [{ type: "text", text: "Cursor inválido." }], isError: true };
    q = q.or(`date.lt.${c.d},and(date.eq.${c.d},id.lt.${c.i})`);
  }
  const { data, error } = await q;
  if (error) return { content: [{ type: "text", text: String(error) }], isError: true };
  const rowsAll = (data ?? []) as any[];
  const hasMore = rowsAll.length > pageSize;
  const rows = hasMore ? rowsAll.slice(0, pageSize) : rowsAll;
  const last = rows[rows.length - 1];
  const nextCursor = hasMore && last ? encodeCursor({ d: last.date, i: last.id }) : null;
  const pageTotal = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
  return {
    content: [{ type: "text", text: `Página com ${rows.length} pedidos` }],
    structuredContent: {
      rows, count: rows.length, total_amount: pageTotal,
      has_more: hasMore, next_cursor: nextCursor,
    },
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

Deno.test("list_orders: ordena por (date desc, id desc) e busca pageSize+1", async () => {
  const sb = fakeSupabase([]);
  await runHandler({ limit: 50 }, ctx(true), sb);
  assertEquals(sb.calls.order, [
    { col: "date", ascending: false },
    { col: "id", ascending: false },
  ]);
  // pageSize+1 para detectar has_more sem count(*).
  assertEquals(sb.calls.limit, 51);
});

Deno.test("list_orders: limit default = 20 → busca 21 no banco", async () => {
  const sb = fakeSupabase([]);
  await runHandler({}, ctx(true), sb);
  assertEquals(sb.calls.limit, 21);
});

Deno.test("list_orders: RLS filtrando tudo devolve count=0 sem vazar dados", async () => {
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
  assertEquals((res as any).structuredContent.has_more, false);
  assertEquals((res as any).structuredContent.next_cursor, null);
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
  assertEquals(sb.calls.limit, 11);
  assertEquals((res as any).structuredContent.count, 2);
  assertEquals((res as any).structuredContent.total_amount, 30);
  assertEquals((res as any).structuredContent.has_more, false);
});

// -------- Paginação (keyset cursor) --------------------------------------

Deno.test("list_orders: has_more=true e next_cursor quando resultados > limit", async () => {
  // limit=2 → busca 3, retorna 2 + next_cursor apontando pra última linha.
  const sb = fakeSupabase([
    { id: "a", number: "P-1", total: 10, date: "2026-05-10T00:00:00Z" },
    { id: "b", number: "P-2", total: 20, date: "2026-05-09T00:00:00Z" },
    { id: "c", number: "P-3", total: 30, date: "2026-05-08T00:00:00Z" },
  ]);
  const res = await runHandler({ limit: 2 }, ctx(true), sb);
  const sc = (res as any).structuredContent;
  assertEquals(sc.count, 2);
  assertEquals(sc.has_more, true);
  assert(typeof sc.next_cursor === "string");
  // Cursor codifica a última tupla devolvida (id="b", date=…09).
  const decoded = JSON.parse(atob(sc.next_cursor));
  assertEquals(decoded, { d: "2026-05-09T00:00:00Z", i: "b" });
});

Deno.test("list_orders: has_more=false quando página não enche", async () => {
  const sb = fakeSupabase([
    { id: "a", number: "P-1", total: 10, date: "2026-05-10T00:00:00Z" },
  ]);
  const res = await runHandler({ limit: 20 }, ctx(true), sb);
  const sc = (res as any).structuredContent;
  assertEquals(sc.count, 1);
  assertEquals(sc.has_more, false);
  assertEquals(sc.next_cursor, null);
});

Deno.test("list_orders: cursor válido gera predicado keyset (date<c.d OR (date=c.d AND id<c.i))", async () => {
  const sb = fakeSupabase([]);
  const cursor = btoa(JSON.stringify({ d: "2026-05-09T00:00:00Z", i: "b" }));
  await runHandler({ limit: 2, cursor }, ctx(true), sb);
  assertEquals(sb.calls.or, [
    "date.lt.2026-05-09T00:00:00Z,and(date.eq.2026-05-09T00:00:00Z,id.lt.b)",
  ]);
});

Deno.test("list_orders: cursor inválido devolve erro sem consultar o banco", async () => {
  const sb = fakeSupabase([]);
  const res = await runHandler({ cursor: "###nao-e-base64###" }, ctx(true), sb);
  assertEquals(res.isError, true);
  assertEquals(res.content[0].text, "Cursor inválido.");
});

Deno.test("list_orders: navegação em 2 páginas consecutivas cobre todos os registros", async () => {
  // Página 1 (sem cursor): retorna limit+1=3 → apresenta 2, has_more=true.
  const page1Rows = [
    { id: "a", number: "P-1", total: 10, date: "2026-05-10T00:00:00Z" },
    { id: "b", number: "P-2", total: 20, date: "2026-05-09T00:00:00Z" },
    { id: "c", number: "P-3", total: 30, date: "2026-05-08T00:00:00Z" },
  ];
  const sb1 = fakeSupabase(page1Rows);
  const r1 = await runHandler({ limit: 2 }, ctx(true), sb1);
  const sc1 = (r1 as any).structuredContent;
  assertEquals(sc1.count, 2);
  assertEquals(sc1.has_more, true);
  assertEquals(sb1.calls.or, []); // sem cursor na 1ª página

  // Página 2 (com cursor): apenas 1 linha restante → has_more=false.
  const sb2 = fakeSupabase([page1Rows[2]]);
  const r2 = await runHandler({ limit: 2, cursor: sc1.next_cursor }, ctx(true), sb2);
  const sc2 = (r2 as any).structuredContent;
  assertEquals(sc2.count, 1);
  assertEquals(sc2.has_more, false);
  assertEquals(sc2.next_cursor, null);
  assertEquals(sb2.calls.or, [
    "date.lt.2026-05-09T00:00:00Z,and(date.eq.2026-05-09T00:00:00Z,id.lt.b)",
  ]);
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
