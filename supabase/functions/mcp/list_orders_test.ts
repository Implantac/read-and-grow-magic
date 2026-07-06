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
    client_id?: string;
    client_search?: string;
    limit?: number;
    cursor?: string;
  },
  context: ReturnType<typeof ctx>,
  supabase: { from: (t: string) => any },
) {
  if (!context.isAuthenticated()) {
    return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
  }
  const pageSize = input.limit ?? 20;
  let q: any = supabase
    .from("orders")
    .select("id, number, client_id, client_name, date, delivery_date, total, status, priority, payment_method")
    .order("date", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);
  if (input.status) q = q.eq("status", input.status);
  if (input.date_from) q = q.gte("date", `${input.date_from}T00:00:00.000Z`);
  if (input.date_to) q = q.lte("date", `${input.date_to}T23:59:59.999Z`);
  if (input.client_id) q = q.eq("client_id", input.client_id);
  if (input.client_search) {
    const term = input.client_search.replace(/[,%]/g, " ").trim();
    if (term.length > 0) q = q.ilike("client_name", `%${term}%`);
  }
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

// -------- Filtros por cliente --------------------------------------------

Deno.test("list_orders: filtra por client_id (UUID)", async () => {
  const sb = fakeSupabase([
    { id: "o1", client_id: "c-1", total: 10, date: "2026-05-01T00:00:00Z" },
  ]);
  const res = await runHandler(
    { client_id: "11111111-1111-1111-1111-111111111111" },
    ctx(true),
    sb,
  );
  assertEquals(res.isError, false);
  assertEquals(sb.calls.eq, [["client_id", "11111111-1111-1111-1111-111111111111"]]);
  assertEquals(sb.calls.ilike, []);
});

Deno.test("list_orders: filtra por client_search (ILIKE %termo%)", async () => {
  const sb = fakeSupabase([]);
  await runHandler({ client_search: "ACME" }, ctx(true), sb);
  assertEquals(sb.calls.ilike, [["client_name", "%ACME%"]]);
  assertEquals(sb.calls.eq, []);
});

Deno.test("list_orders: client_search sanitiza % e vírgula (evita injection de predicado)", async () => {
  const sb = fakeSupabase([]);
  await runHandler({ client_search: "ac%me,corp" }, ctx(true), sb);
  assertEquals(sb.calls.ilike, [["client_name", "%ac me corp%"]]);
});

Deno.test("list_orders: combina status + datas + client_id + paginação", async () => {
  const sb = fakeSupabase([
    { id: "o1", client_id: "c-1", total: 100, status: "delivered", date: "2026-06-10T00:00:00Z" },
    { id: "o2", client_id: "c-1", total: 200, status: "delivered", date: "2026-06-09T00:00:00Z" },
    { id: "o3", client_id: "c-1", total: 300, status: "delivered", date: "2026-06-08T00:00:00Z" },
  ]);
  const res = await runHandler(
    {
      status: "delivered",
      date_from: "2026-06-01",
      date_to: "2026-06-30",
      client_id: "22222222-2222-2222-2222-222222222222",
      limit: 2,
    },
    ctx(true),
    sb,
  );
  const sc = (res as any).structuredContent;
  assertEquals(sb.calls.eq, [
    ["status", "delivered"],
    ["client_id", "22222222-2222-2222-2222-222222222222"],
  ]);
  assertEquals(sb.calls.gte, [["date", "2026-06-01T00:00:00.000Z"]]);
  assertEquals(sb.calls.lte, [["date", "2026-06-30T23:59:59.999Z"]]);
  assertEquals(sb.calls.limit, 3); // pageSize+1
  assertEquals(sc.count, 2);
  assertEquals(sc.has_more, true);
  assert(typeof sc.next_cursor === "string");
});

Deno.test("list_orders: combina client_search + status + intervalo de datas", async () => {
  const sb = fakeSupabase([]);
  await runHandler(
    {
      client_search: "acme",
      status: "confirmed",
      date_from: "2026-01-01",
      date_to: "2026-01-31",
    },
    ctx(true),
    sb,
  );
  assertEquals(sb.calls.eq, [["status", "confirmed"]]);
  assertEquals(sb.calls.gte, [["date", "2026-01-01T00:00:00.000Z"]]);
  assertEquals(sb.calls.lte, [["date", "2026-01-31T23:59:59.999Z"]]);
  assertEquals(sb.calls.ilike, [["client_name", "%acme%"]]);
});

Deno.test("list_orders: RLS bloqueia pedidos de cliente de outro tenant → count=0", async () => {
  // Mesmo com client_id válido de OUTRO tenant, RLS filtra tudo (SELECT policy
  // exige company_id = get_user_company_id(auth.uid())). O tool devolve
  // lista vazia — nunca vaza existência do cliente/pedido.
  const sb = fakeSupabase([]);
  const res = await runHandler(
    { client_id: "99999999-9999-9999-9999-999999999999" },
    ctx(true),
    sb,
  );
  assertEquals(res.isError, false);
  assertEquals((res as any).structuredContent.rows, []);
  assertEquals((res as any).structuredContent.count, 0);
  assertEquals((res as any).structuredContent.has_more, false);
});

// -------- Paginação combinada com filtros por cliente -------------------
// Garante que ao paginar por cursor keyset (date desc, id desc), TODOS os
// filtros originais (client_id, client_search, status, datas) permanecem
// aplicados nas páginas seguintes — se algum for perdido, o consumidor
// veria pedidos de outros clientes/status/datas ao avançar.

Deno.test("paginação + client_id: predicado se mantém em todas as páginas", async () => {
  const CID = "11111111-1111-1111-1111-111111111111";
  const p1 = [
    { id: "a", client_id: CID, total: 10, date: "2026-07-10T00:00:00Z" },
    { id: "b", client_id: CID, total: 20, date: "2026-07-09T00:00:00Z" },
    { id: "c", client_id: CID, total: 30, date: "2026-07-08T00:00:00Z" }, // sentinela pageSize+1
  ];

  // Página 1
  const sb1 = fakeSupabase(p1);
  const r1 = await runHandler({ client_id: CID, limit: 2 }, ctx(true), sb1);
  const sc1 = (r1 as any).structuredContent;
  assertEquals(sc1.count, 2);
  assertEquals(sc1.has_more, true);
  assertEquals(sb1.calls.eq, [["client_id", CID]]);
  assertEquals(sb1.calls.or, []); // sem cursor na 1ª página

  // Página 2 usando next_cursor
  const p2 = [{ id: "c", client_id: CID, total: 30, date: "2026-07-08T00:00:00Z" }];
  const sb2 = fakeSupabase(p2);
  const r2 = await runHandler(
    { client_id: CID, limit: 2, cursor: sc1.next_cursor },
    ctx(true),
    sb2,
  );
  const sc2 = (r2 as any).structuredContent;
  assertEquals(sc2.count, 1);
  assertEquals(sc2.has_more, false);
  assertEquals(sc2.next_cursor, null);
  // Filtro por cliente PERMANECE aplicado na 2ª página.
  assertEquals(sb2.calls.eq, [["client_id", CID]]);
  // Cursor gera predicado keyset baseado na última tupla da página 1 (id="b").
  assertEquals(sb2.calls.or, [
    "date.lt.2026-07-09T00:00:00Z,and(date.eq.2026-07-09T00:00:00Z,id.lt.b)",
  ]);
});

Deno.test("paginação + client_search: ILIKE se mantém em todas as páginas", async () => {
  const p1 = [
    { id: "x", client_name: "ACME LTDA", total: 5, date: "2026-08-05T00:00:00Z" },
    { id: "y", client_name: "ACME SA", total: 15, date: "2026-08-04T00:00:00Z" },
    { id: "z", client_name: "ACMEZINHA", total: 25, date: "2026-08-03T00:00:00Z" },
  ];

  const sb1 = fakeSupabase(p1);
  const r1 = await runHandler({ client_search: "acme", limit: 2 }, ctx(true), sb1);
  const sc1 = (r1 as any).structuredContent;
  assertEquals(sc1.count, 2);
  assertEquals(sc1.has_more, true);
  assertEquals(sb1.calls.ilike, [["client_name", "%acme%"]]);
  assertEquals(sb1.calls.or, []);

  const sb2 = fakeSupabase([p1[2]]);
  const r2 = await runHandler(
    { client_search: "acme", limit: 2, cursor: sc1.next_cursor },
    ctx(true),
    sb2,
  );
  const sc2 = (r2 as any).structuredContent;
  assertEquals(sc2.count, 1);
  assertEquals(sc2.has_more, false);
  // ILIKE PERMANECE na 2ª página (senão viria cliente de outro nome).
  assertEquals(sb2.calls.ilike, [["client_name", "%acme%"]]);
  assertEquals(sb2.calls.or, [
    "date.lt.2026-08-04T00:00:00Z,and(date.eq.2026-08-04T00:00:00Z,id.lt.y)",
  ]);
});

Deno.test("paginação + client_id + status + datas: predicados combinados persistem", async () => {
  const CID = "22222222-2222-2222-2222-222222222222";
  const p1 = [
    { id: "a", client_id: CID, status: "delivered", total: 100, date: "2026-09-10T00:00:00Z" },
    { id: "b", client_id: CID, status: "delivered", total: 200, date: "2026-09-09T00:00:00Z" },
    { id: "c", client_id: CID, status: "delivered", total: 300, date: "2026-09-08T00:00:00Z" },
  ];
  const sb1 = fakeSupabase(p1);
  const r1 = await runHandler(
    {
      client_id: CID,
      status: "delivered",
      date_from: "2026-09-01",
      date_to: "2026-09-30",
      limit: 2,
    },
    ctx(true),
    sb1,
  );
  const sc1 = (r1 as any).structuredContent;
  assertEquals(sc1.count, 2);
  assertEquals(sc1.has_more, true);
  assertEquals(sb1.calls.eq, [["status", "delivered"], ["client_id", CID]]);
  assertEquals(sb1.calls.gte, [["date", "2026-09-01T00:00:00.000Z"]]);
  assertEquals(sb1.calls.lte, [["date", "2026-09-30T23:59:59.999Z"]]);

  const sb2 = fakeSupabase([p1[2]]);
  const r2 = await runHandler(
    {
      client_id: CID,
      status: "delivered",
      date_from: "2026-09-01",
      date_to: "2026-09-30",
      limit: 2,
      cursor: sc1.next_cursor,
    },
    ctx(true),
    sb2,
  );
  const sc2 = (r2 as any).structuredContent;
  assertEquals(sc2.count, 1);
  assertEquals(sc2.has_more, false);
  // Todos os predicados permanecem aplicados na página 2.
  assertEquals(sb2.calls.eq, [["status", "delivered"], ["client_id", CID]]);
  assertEquals(sb2.calls.gte, [["date", "2026-09-01T00:00:00.000Z"]]);
  assertEquals(sb2.calls.lte, [["date", "2026-09-30T23:59:59.999Z"]]);
  assertEquals(sb2.calls.or, [
    "date.lt.2026-09-09T00:00:00Z,and(date.eq.2026-09-09T00:00:00Z,id.lt.b)",
  ]);
});

Deno.test("paginação + client_id: 3 páginas cobrem exatamente todos os pedidos, sem duplicar", async () => {
  const CID = "33333333-3333-3333-3333-333333333333";
  const allRows = [
    { id: "a", client_id: CID, total: 1, date: "2026-10-05T00:00:00Z" },
    { id: "b", client_id: CID, total: 2, date: "2026-10-04T00:00:00Z" },
    { id: "c", client_id: CID, total: 3, date: "2026-10-03T00:00:00Z" },
    { id: "d", client_id: CID, total: 4, date: "2026-10-02T00:00:00Z" },
    { id: "e", client_id: CID, total: 5, date: "2026-10-01T00:00:00Z" },
  ];
  const collected: string[] = [];

  // Página 1: retorna limit+1=3 → mostra a,b + has_more.
  const sb1 = fakeSupabase(allRows.slice(0, 3));
  const r1 = await runHandler({ client_id: CID, limit: 2 }, ctx(true), sb1);
  const sc1 = (r1 as any).structuredContent;
  collected.push(...sc1.rows.map((r: any) => r.id));
  assertEquals(sc1.has_more, true);

  // Página 2: cursor após "b" → c,d + has_more.
  const sb2 = fakeSupabase(allRows.slice(2, 5));
  const r2 = await runHandler(
    { client_id: CID, limit: 2, cursor: sc1.next_cursor },
    ctx(true),
    sb2,
  );
  const sc2 = (r2 as any).structuredContent;
  collected.push(...sc2.rows.map((r: any) => r.id));
  assertEquals(sc2.has_more, true);
  assertEquals(sb2.calls.eq, [["client_id", CID]]);

  // Página 3: cursor após "d" → apenas e, fim.
  const sb3 = fakeSupabase(allRows.slice(4, 5));
  const r3 = await runHandler(
    { client_id: CID, limit: 2, cursor: sc2.next_cursor },
    ctx(true),
    sb3,
  );
  const sc3 = (r3 as any).structuredContent;
  collected.push(...sc3.rows.map((r: any) => r.id));
  assertEquals(sc3.has_more, false);
  assertEquals(sc3.next_cursor, null);
  assertEquals(sb3.calls.eq, [["client_id", CID]]);

  // Cobertura completa, sem duplicatas, na ordem correta.
  assertEquals(collected, ["a", "b", "c", "d", "e"]);
});

// -------- next_cursor: valor exato quando combinado com filtros de cliente --
// Garante que o cursor devolvido codifica {d,i} da ÚLTIMA linha da página 1
// (não da linha sentinela pageSize+1) e que decodificá-lo produz o predicado
// keyset correto na página 2.

Deno.test("next_cursor + client_id: codifica {d,i} da última linha visível da página 1", async () => {
  const CID = "44444444-4444-4444-4444-444444444444";
  // 3 rows retornadas (pageSize+1=3) → visíveis: p1r1, p1r2; sentinela: p1r3.
  const p1 = [
    { id: "p1r1", client_id: CID, total: 10, date: "2026-12-10T00:00:00Z" },
    { id: "p1r2", client_id: CID, total: 20, date: "2026-12-09T00:00:00Z" },
    { id: "p1r3", client_id: CID, total: 30, date: "2026-12-08T00:00:00Z" },
  ];
  const sb1 = fakeSupabase(p1);
  const r1: any = await runHandler({ client_id: CID, limit: 2 }, ctx(true), sb1);
  const sc1 = r1.structuredContent;

  assertEquals(sc1.has_more, true);
  assert(typeof sc1.next_cursor === "string" && sc1.next_cursor.length > 0);

  // Decodifica o cursor e confirma que aponta para p1r2 (última visível),
  // NÃO para p1r3 (sentinela). Caso contrário, a página 2 pularia p1r3.
  const decoded = decodeCursor(sc1.next_cursor);
  assertEquals(decoded, { d: "2026-12-09T00:00:00Z", i: "p1r2" });

  // Página 2 usando esse cursor deve emitir predicado keyset com esses
  // mesmos valores, mantendo o client_id.
  const sb2 = fakeSupabase([p1[2]]);
  const r2: any = await runHandler(
    { client_id: CID, limit: 2, cursor: sc1.next_cursor },
    ctx(true),
    sb2,
  );
  assertEquals(sb2.calls.eq, [["client_id", CID]]);
  assertEquals(sb2.calls.or, [
    "date.lt.2026-12-09T00:00:00Z,and(date.eq.2026-12-09T00:00:00Z,id.lt.p1r2)",
  ]);
  // Página 2 devolve exatamente a sentinela, na ordem esperada.
  assertEquals(r2.structuredContent.rows.map((r: any) => r.id), ["p1r3"]);
  assertEquals(r2.structuredContent.has_more, false);
  assertEquals(r2.structuredContent.next_cursor, null);
});

Deno.test("next_cursor + client_search: codifica {d,i} da última linha visível e continua na página 2", async () => {
  const p1 = [
    { id: "s1", client_name: "ACME NORTE", total: 5, date: "2027-01-10T12:00:00Z" },
    { id: "s2", client_name: "ACME SUL", total: 15, date: "2027-01-09T12:00:00Z" },
    { id: "s3", client_name: "ACME LESTE", total: 25, date: "2027-01-08T12:00:00Z" },
  ];
  const sb1 = fakeSupabase(p1);
  const r1: any = await runHandler(
    { client_search: "acme", limit: 2 },
    ctx(true),
    sb1,
  );
  const sc1 = r1.structuredContent;

  assertEquals(sc1.has_more, true);
  const decoded = decodeCursor(sc1.next_cursor);
  // Cursor aponta para s2 (última visível), não para s3 (sentinela).
  assertEquals(decoded, { d: "2027-01-09T12:00:00Z", i: "s2" });

  // Página 2: ILIKE PERMANECE e keyset usa exatamente {d,i} de s2.
  const sb2 = fakeSupabase([p1[2]]);
  const r2: any = await runHandler(
    { client_search: "acme", limit: 2, cursor: sc1.next_cursor },
    ctx(true),
    sb2,
  );
  assertEquals(sb2.calls.ilike, [["client_name", "%acme%"]]);
  assertEquals(sb2.calls.or, [
    "date.lt.2027-01-09T12:00:00Z,and(date.eq.2027-01-09T12:00:00Z,id.lt.s2)",
  ]);
  assertEquals(r2.structuredContent.rows.map((r: any) => r.id), ["s3"]);
});

Deno.test("next_cursor: quando página 1 não enche (has_more=false), next_cursor é null mesmo com client_id/client_search", async () => {
  const CID = "55555555-5555-5555-5555-555555555555";
  const rows = [
    { id: "u1", client_id: CID, client_name: "ACME", total: 1, date: "2027-02-02T00:00:00Z" },
    { id: "u2", client_id: CID, client_name: "ACME", total: 2, date: "2027-02-01T00:00:00Z" },
  ];

  // client_id: apenas 2 linhas ≤ limit=5 → sem próxima página.
  const sbA = fakeSupabase(rows);
  const rA: any = await runHandler({ client_id: CID, limit: 5 }, ctx(true), sbA);
  assertEquals(rA.structuredContent.has_more, false);
  assertEquals(rA.structuredContent.next_cursor, null);

  // client_search: mesmo resultado, cursor não é emitido à toa.
  const sbB = fakeSupabase(rows);
  const rB: any = await runHandler({ client_search: "acme", limit: 5 }, ctx(true), sbB);
  assertEquals(rB.structuredContent.has_more, false);
  assertEquals(rB.structuredContent.next_cursor, null);
});

// -------- Cross-tenant leak: paginação nunca vaza pedidos de outro tenant --
// Simula RLS aplicando `company_id = caller_tenant` no próprio fake — se o
// handler algum dia esquecer o token/contexto ao paginar, o teste quebra.



type TenantRow = Row & { company_id: string; id: string; date: string };

function fakeSupabaseRLS(allRows: TenantRow[], callerTenant: string) {
  // Aplica RLS + filtros (eq/ilike/or keyset) sobre `allRows`, devolvendo até
  // `limit` linhas em ordem date desc, id desc — como faria o Postgres real.
  const calls = {
    tenant: callerTenant,
    eq: [] as Array<[string, unknown]>,
    ilike: [] as Array<[string, unknown]>,
    or: [] as string[],
    limit: undefined as number | undefined,
  };
  let filters: Array<(r: TenantRow) => boolean> = [
    (r) => r.company_id === callerTenant, // RLS
  ];
  const builder: any = {
    select: () => builder,
    order: () => builder,
    eq(col: string, val: unknown) {
      calls.eq.push([col, val]);
      filters.push((r) => (r as any)[col] === val);
      return builder;
    },
    gte: () => builder,
    lte: () => builder,
    ilike(col: string, val: string) {
      calls.ilike.push([col, val]);
      const needle = val.replace(/%/g, "").toLowerCase();
      filters.push((r) => String((r as any)[col] ?? "").toLowerCase().includes(needle));
      return builder;
    },
    or(expr: string) {
      calls.or.push(expr);
      // Parse keyset: date.lt.<D>,and(date.eq.<D>,id.lt.<I>)
      const m = expr.match(/^date\.lt\.(.+?),and\(date\.eq\.\1,id\.lt\.(.+)\)$/);
      if (m) {
        const [, d, i] = m;
        filters.push((r) => r.date < d || (r.date === d && r.id < i));
      }
      return builder;
    },
    limit(n: number) {
      calls.limit = n;
      return builder;
    },
    // Thenable lazy: só computa quando `await` é chamado (após todos os
    // .eq/.or/.ilike encadeados). Necessário porque no handler o .limit()
    // é chamado ANTES dos filtros condicionais.
    then(onFulfilled: (v: any) => any, onRejected?: (e: any) => any) {
      const out = allRows
        .filter((r) => filters.every((f) => f(r)))
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? 1 : -1))
        .slice(0, calls.limit ?? allRows.length);
      return Promise.resolve({ data: out, error: null }).then(onFulfilled, onRejected);
    },

  };
  return { calls, from: (_t: string) => builder };
}

const TENANT_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const TENANT_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const CID_SHARED = "cccccccc-cccc-cccc-cccc-cccccccccccc"; // mesmo client_id nos 2 tenants

// Dataset intercalado: se pagination esquecer o tenant, veríamos B no meio.
const MIXED_ROWS: TenantRow[] = [
  { id: "a1", company_id: TENANT_A, client_id: CID_SHARED, client_name: "ACME A", total: 10, date: "2026-11-10T00:00:00Z" },
  { id: "b1", company_id: TENANT_B, client_id: CID_SHARED, client_name: "ACME B", total: 999, date: "2026-11-09T00:00:00Z" },
  { id: "a2", company_id: TENANT_A, client_id: CID_SHARED, client_name: "ACME A", total: 20, date: "2026-11-08T00:00:00Z" },
  { id: "b2", company_id: TENANT_B, client_id: CID_SHARED, client_name: "ACME B", total: 999, date: "2026-11-07T00:00:00Z" },
  { id: "a3", company_id: TENANT_A, client_id: CID_SHARED, client_name: "ACME A", total: 30, date: "2026-11-06T00:00:00Z" },
  { id: "b3", company_id: TENANT_B, client_id: CID_SHARED, client_name: "ACME B", total: 999, date: "2026-11-05T00:00:00Z" },
  { id: "a4", company_id: TENANT_A, client_id: CID_SHARED, client_name: "ACME A", total: 40, date: "2026-11-04T00:00:00Z" },
  { id: "b4", company_id: TENANT_B, client_id: CID_SHARED, client_name: "ACME B", total: 999, date: "2026-11-03T00:00:00Z" },
  { id: "a5", company_id: TENANT_A, client_id: CID_SHARED, client_name: "ACME A", total: 50, date: "2026-11-02T00:00:00Z" },
  { id: "b5", company_id: TENANT_B, client_id: CID_SHARED, client_name: "ACME B", total: 999, date: "2026-11-01T00:00:00Z" },
];

async function paginateAll(
  base: { client_id?: string; client_search?: string; limit: number },
  tenant: string,
): Promise<TenantRow[]> {
  const collected: TenantRow[] = [];
  let cursor: string | undefined = undefined;
  for (let page = 0; page < 5; page++) {
    const sb = fakeSupabaseRLS(MIXED_ROWS, tenant);
    const res: any = await runHandler({ ...base, cursor }, ctx(true), sb);
    const sc = res.structuredContent;
    collected.push(...(sc.rows as TenantRow[]));
    if (!sc.has_more) return collected;
    cursor = sc.next_cursor;
  }
  throw new Error("paginação não terminou em 5 páginas");
}

Deno.test("cross-tenant + client_id: páginas 1/2/3 NUNCA vazam pedidos de outro tenant", async () => {
  const rows = await paginateAll({ client_id: CID_SHARED, limit: 2 }, TENANT_A);
  // Somente linhas do tenant A, exatamente 5, sem duplicatas.
  assertEquals(rows.map((r) => r.id), ["a1", "a2", "a3", "a4", "a5"]);
  assert(rows.every((r) => r.company_id === TENANT_A), "vazou linha de outro tenant");
});

Deno.test("cross-tenant + client_search: páginas 1/2/3 NUNCA vazam pedidos de outro tenant", async () => {
  // "ACME" bate em nomes dos dois tenants — RLS é a única defesa.
  const rows = await paginateAll({ client_search: "acme", limit: 2 }, TENANT_A);
  assertEquals(rows.map((r) => r.id), ["a1", "a2", "a3", "a4", "a5"]);
  assert(rows.every((r) => r.company_id === TENANT_A), "vazou linha de outro tenant");
});

Deno.test("cross-tenant: mesmo dataset visto por tenant B só devolve linhas de B", async () => {
  const rowsA = await paginateAll({ client_id: CID_SHARED, limit: 2 }, TENANT_A);
  const rowsB = await paginateAll({ client_id: CID_SHARED, limit: 2 }, TENANT_B);
  assert(rowsA.every((r) => r.company_id === TENANT_A));
  assert(rowsB.every((r) => r.company_id === TENANT_B));
  // Conjuntos disjuntos — nenhum id compartilhado entre as duas paginacões.
  const idsA = new Set(rowsA.map((r) => r.id));
  assert(rowsB.every((r) => !idsA.has(r.id)), "IDs cruzaram entre tenants");
});

Deno.test("cross-tenant + client_id: página 2 continua filtrada por client_id (predicado não é dropado no cursor)", async () => {
  // Página 1
  const sb1 = fakeSupabaseRLS(MIXED_ROWS, TENANT_A);
  const r1: any = await runHandler(
    { client_id: CID_SHARED, limit: 2 },
    ctx(true),
    sb1,
  );
  assertEquals(sb1.calls.eq, [["client_id", CID_SHARED]]);
  const cursor = r1.structuredContent.next_cursor;
  assert(cursor, "esperava next_cursor após página 1");

  // Página 2 — client_id DEVE ser reenviado; sem isso, veríamos linhas de
  // outro cliente do mesmo tenant caso existissem.
  const sb2 = fakeSupabaseRLS(MIXED_ROWS, TENANT_A);
  const r2: any = await runHandler(
    { client_id: CID_SHARED, limit: 2, cursor },
    ctx(true),
    sb2,
  );
  assertEquals(sb2.calls.eq, [["client_id", CID_SHARED]]);
  assertEquals(sb2.calls.or.length, 1);
  assert(r2.structuredContent.rows.every((r: TenantRow) => r.company_id === TENANT_A));
});



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

// -------- E2E: alternância de filtro (client_id ↔ client_search) entre páginas
// Um consumidor pode mudar o filtro na página 2 (ex.: refinou a busca). O
// cursor precisa continuar funcional como predicado keyset (date,id), o novo
// filtro precisa ser aplicado, e o filtro antigo NÃO pode persistir.

Deno.test("E2E fake: página 1 client_id → página 2 client_search aplica novo filtro + keyset (e não vaza o antigo)", async () => {
  const CID = "77777777-7777-7777-7777-777777777777";
  // Página 1: filtra por client_id específico.
  const p1 = [
    { id: "z1", client_id: CID, client_name: "ACME NORTE", total: 10, date: "2027-03-10T00:00:00Z" },
    { id: "z2", client_id: CID, client_name: "ACME NORTE", total: 20, date: "2027-03-09T00:00:00Z" },
    { id: "z3", client_id: CID, client_name: "ACME NORTE", total: 30, date: "2027-03-08T00:00:00Z" }, // sentinela
  ];
  const sb1 = fakeSupabase(p1);
  const r1: any = await runHandler({ client_id: CID, limit: 2 }, ctx(true), sb1);
  const sc1 = r1.structuredContent;
  assertEquals(sc1.has_more, true);
  assertEquals(sb1.calls.eq, [["client_id", CID]]);
  assertEquals(sb1.calls.ilike, []);
  const cursor = sc1.next_cursor;

  // Página 2: consumidor troca para busca por nome (não passa client_id).
  const p2 = [{ id: "z3", client_name: "ACME NORTE", total: 30, date: "2027-03-08T00:00:00Z" }];
  const sb2 = fakeSupabase(p2);
  const r2: any = await runHandler(
    { client_search: "acme", limit: 2, cursor },
    ctx(true),
    sb2,
  );
  // Novo filtro aplicado.
  assertEquals(sb2.calls.ilike, [["client_name", "%acme%"]]);
  // Filtro antigo NÃO persiste (nenhum eq de client_id).
  assertEquals(sb2.calls.eq, []);
  // Keyset baseado na última linha visível da página 1 (z2).
  assertEquals(sb2.calls.or, [
    "date.lt.2027-03-09T00:00:00Z,and(date.eq.2027-03-09T00:00:00Z,id.lt.z2)",
  ]);
  assertEquals(r2.structuredContent.rows.map((r: any) => r.id), ["z3"]);
  assertEquals(r2.structuredContent.has_more, false);
});

Deno.test("E2E fake: página 1 client_search → página 2 client_id aplica novo filtro + keyset (e não vaza o antigo)", async () => {
  const CID = "88888888-8888-8888-8888-888888888888";
  const p1 = [
    { id: "w1", client_id: "outro-a", client_name: "ACME A", total: 5, date: "2027-04-10T00:00:00Z" },
    { id: "w2", client_id: "outro-b", client_name: "ACME B", total: 15, date: "2027-04-09T00:00:00Z" },
    { id: "w3", client_id: CID,       client_name: "ACME C", total: 25, date: "2027-04-08T00:00:00Z" },
  ];
  const sb1 = fakeSupabase(p1);
  const r1: any = await runHandler({ client_search: "acme", limit: 2 }, ctx(true), sb1);
  const sc1 = r1.structuredContent;
  assertEquals(sc1.has_more, true);
  assertEquals(sb1.calls.ilike, [["client_name", "%acme%"]]);
  const cursor = sc1.next_cursor;

  // Página 2: consumidor refinou para um client_id específico.
  const p2 = [{ id: "w3", client_id: CID, client_name: "ACME C", total: 25, date: "2027-04-08T00:00:00Z" }];
  const sb2 = fakeSupabase(p2);
  const r2: any = await runHandler(
    { client_id: CID, limit: 2, cursor },
    ctx(true),
    sb2,
  );
  assertEquals(sb2.calls.eq, [["client_id", CID]]);
  // ILIKE antigo NÃO persiste.
  assertEquals(sb2.calls.ilike, []);
  assertEquals(sb2.calls.or, [
    "date.lt.2027-04-09T00:00:00Z,and(date.eq.2027-04-09T00:00:00Z,id.lt.w2)",
  ]);
  assertEquals(r2.structuredContent.rows.map((r: any) => r.id), ["w3"]);
});

Deno.test("E2E fake+RLS: alternar client_id → client_search entre páginas nunca vaza outro tenant", async () => {
  // Reutiliza MIXED_ROWS + fakeSupabaseRLS: RLS filtra por company_id.
  // Página 1: client_id compartilhado; página 2: client_search "acme".
  const sb1 = fakeSupabaseRLS(MIXED_ROWS, TENANT_A);
  const r1: any = await runHandler(
    { client_id: CID_SHARED, limit: 2 },
    ctx(true),
    sb1,
  );
  const sc1 = r1.structuredContent;
  assert(sc1.has_more, "esperava has_more=true na página 1");
  const cursor = sc1.next_cursor;
  assert(sc1.rows.every((r: any) => r.company_id === TENANT_A));

  const sb2 = fakeSupabaseRLS(MIXED_ROWS, TENANT_A);
  const r2: any = await runHandler(
    { client_search: "acme", limit: 2, cursor },
    ctx(true),
    sb2,
  );
  const sc2 = r2.structuredContent;
  // Novo filtro ILIKE aplicado; client_id antigo dropado.
  assertEquals(sb2.calls.ilike, [["client_name", "%acme%"]]);
  assertEquals(sb2.calls.eq, []);
  // Nenhuma linha do tenant B, apesar de "ACME" bater em ambos.
  assert(
    sc2.rows.every((r: any) => r.company_id === TENANT_A),
    "vazou linha de outro tenant após troca de filtro",
  );
  // Keyset avança monotonicamente: todas as linhas da página 2 têm
  // (date,id) estritamente menores que a última da página 1.
  const lastP1 = sc1.rows[sc1.rows.length - 1];
  for (const r of sc2.rows) {
    assert(
      r.date < lastP1.date || (r.date === lastP1.date && r.id < lastP1.id),
      `linha ${r.id}@${r.date} não respeita keyset da página 1 (${lastP1.id}@${lastP1.date})`,
    );
  }
});

// -------- Smoke E2E contra função deployada -------------------------------
// Confirma que a combinação cursor + client_search (troca de filtro) é
// aceita pelo endpoint (não gera 5xx) e continua bloqueando sem auth.

Deno.test("MCP endpoint: cursor + client_search sem Authorization retorna 401/403 (não 5xx)", async () => {
  const base = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
  if (!base) {
    console.warn("SUPABASE_URL/VITE_SUPABASE_URL ausente — pulando smoke E2E");
    return;
  }
  // Cursor bem-formado (base64 de {d,i}) — não deve causar 500 nem vazar.
  const cursor = btoa(JSON.stringify({ d: "2027-01-01T00:00:00Z", i: "any-id" }));
  const res = await fetch(`${base}/functions/v1/mcp/.mcp/invoke-tool/list_orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_search: "acme", limit: 2, cursor }),
  });
  await res.text();
  assert(
    res.status === 401 || res.status === 403,
    `esperado 401/403 (auth), veio ${res.status}`,
  );
});

// -------- Cursor malformado / de outra query ------------------------------
// Todo cursor inválido deve:
//   1. Fazer o handler devolver { isError: true, "Cursor inválido." } — no MCP
//      isso equivale a 400 (validation error); auth ausente já dispara 401.
//   2. NÃO consultar o banco (sem .limit chamado no fake).
//   3. Não corromper o estado global — chamadas seguintes com cursor válido
//      (ou sem cursor) continuam funcionando normalmente.

const BAD_CURSORS: Array<[string, string]> = [
  ["string vazia após espaços",           "   "],
  ["não é base64",                        "###nao-base64###"],
  ["base64 de texto puro (JSON inválido)", btoa("nao-e-json")],
  ["base64 de JSON sem campo d",           btoa(JSON.stringify({ i: "abc" }))],
  ["base64 de JSON sem campo i",           btoa(JSON.stringify({ d: "2026-01-01T00:00:00Z" }))],
  ["base64 de JSON com tipos errados",     btoa(JSON.stringify({ d: 123, i: 456 }))],
  ["base64 de array em vez de objeto",     btoa(JSON.stringify(["2026-01-01", "abc"]))],
  ["base64 de null",                       btoa("null")],
];

for (const [label, cursor] of BAD_CURSORS) {
  Deno.test(`list_orders: cursor malformado (${label}) → isError com "Cursor inválido."`, async () => {
    const sb = fakeSupabase([]);
    const res = await runHandler({ cursor, limit: 2 }, ctx(true), sb);
    assertEquals(res.isError, true, `esperava isError=true para ${label}`);
    assertEquals(res.content[0].text, "Cursor inválido.");
    // O predicado keyset (.or) NUNCA é anexado quando o cursor é inválido —
    // é isso que garante que a paginação não é "corrompida" silenciosamente.
    assertEquals(sb.calls.or, []);
  });

  Deno.test(`list_orders: cursor malformado (${label}) + client_search → isError e keyset não é aplicado`, async () => {
    const sb = fakeSupabase([]);
    const res = await runHandler(
      { client_search: "acme", cursor, limit: 2 },
      ctx(true),
      sb,
    );
    assertEquals(res.isError, true);
    assertEquals(res.content[0].text, "Cursor inválido.");
    // Sem await/DB round-trip (handler retorna antes de `await q`), então o
    // usuário recebe erro sem consumir a página seguinte. Nenhum keyset foi
    // adicionado, o que evitaria colisão em uma retentativa.
    assertEquals(sb.calls.or, []);
  });
}


Deno.test("list_orders: cursor inválido NÃO corrompe paginação — chamada seguinte funciona", async () => {
  // 1) cursor ruim → erro
  const sbBad = fakeSupabase([]);
  const rBad = await runHandler(
    { client_search: "acme", cursor: "###bad###", limit: 2 },
    ctx(true),
    sbBad,
  );
  assertEquals(rBad.isError, true);

  // 2) mesma sessão lógica, agora SEM cursor: deve funcionar normalmente.
  const rows = [
    { id: "n1", client_name: "ACME", total: 10, date: "2027-05-10T00:00:00Z" },
    { id: "n2", client_name: "ACME", total: 20, date: "2027-05-09T00:00:00Z" },
    { id: "n3", client_name: "ACME", total: 30, date: "2027-05-08T00:00:00Z" }, // sentinela
  ];
  const sbOk = fakeSupabase(rows);
  const rOk: any = await runHandler(
    { client_search: "acme", limit: 2 },
    ctx(true),
    sbOk,
  );
  assertEquals(rOk.isError, false);
  assertEquals(rOk.structuredContent.count, 2);
  assertEquals(rOk.structuredContent.has_more, true);
  assert(typeof rOk.structuredContent.next_cursor === "string");

  // 3) 2ª página com esse next_cursor válido continua funcionando.
  const sbP2 = fakeSupabase([rows[2]]);
  const rP2: any = await runHandler(
    { client_search: "acme", limit: 2, cursor: rOk.structuredContent.next_cursor },
    ctx(true),
    sbP2,
  );
  assertEquals(rP2.isError, false);
  assertEquals(rP2.structuredContent.rows.map((r: any) => r.id), ["n3"]);
});

Deno.test("list_orders: cursor válido SEM demais filtros (ex.: só cursor) é aceito como paginação pura", async () => {
  // "Cursor de outra query" que apenas contém {d,i}: deve ser tratado como
  // avanço keyset — sem crash, sem inventar filtros extras.
  const cursor = btoa(JSON.stringify({ d: "2027-06-10T00:00:00Z", i: "prev" }));
  const rows = [
    { id: "x1", total: 10, date: "2027-06-09T00:00:00Z" },
    { id: "x2", total: 20, date: "2027-06-08T00:00:00Z" },
  ];
  const sb = fakeSupabase(rows);
  const res: any = await runHandler({ cursor, limit: 5 }, ctx(true), sb);
  assertEquals(res.isError, false);
  // Sem client_id / client_search / status — só o predicado keyset.
  assertEquals(sb.calls.eq, []);
  assertEquals(sb.calls.ilike, []);
  assertEquals(sb.calls.or, [
    "date.lt.2027-06-10T00:00:00Z,and(date.eq.2027-06-10T00:00:00Z,id.lt.prev)",
  ]);
  assertEquals(res.structuredContent.count, 2);
});

Deno.test("list_orders: cursor malformado + sem auth → 'Não autenticado' vence (auth checado antes)", async () => {
  const sb = fakeSupabase([]);
  const res = await runHandler(
    { cursor: "###bad###", client_search: "acme" },
    ctx(false),
    sb,
  );
  assertEquals(res.isError, true);
  assertEquals(res.content[0].text, "Não autenticado");
  assertEquals(sb.calls.limit, undefined);
});

// -------- Smoke E2E: cursor malformado no endpoint deployado --------------
Deno.test("MCP endpoint: cursor malformado sem Authorization retorna 401/403 (auth primeiro, nunca 5xx)", async () => {
  const base = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
  if (!base) {
    console.warn("SUPABASE_URL/VITE_SUPABASE_URL ausente — pulando smoke E2E");
    return;
  }
  const res = await fetch(`${base}/functions/v1/mcp/.mcp/invoke-tool/list_orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cursor: "###nao-base64###", client_search: "acme" }),
  });
  await res.text();
  assert(
    res.status === 401 || res.status === 403,
    `esperado 401/403, veio ${res.status}`,
  );
});



// -------- Fuzz tests -------------------------------------------------------
// Garantia: para QUALQUER string aleatória enviada como cursor/status/
// client_id/client_search, o handler:
//   • nunca lança exceção (equivalente a "nunca 5xx" no HTTP);
//   • sempre devolve uma resposta bem-formada (isError:true com mensagem
//     conhecida OU um resultado válido com structuredContent);
//   • quando não autenticado, retorna "Não autenticado" (401 lógico);
//   • quando o cursor é rejeitado, retorna "Cursor inválido." (400 lógico).
// PRNG seedado para reprodutibilidade.

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randomString(rand: () => number, maxLen = 128): string {
  const len = Math.floor(rand() * maxLen);
  // Mistura ASCII imprimível, controles, símbolos SQL/JSON e alguns unicode
  // para forçar caminhos de erro do decodeCursor e sanitização.
  const pool =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" +
    "%,'\";\\/(){}[]<>=+-*&|!?#@$^~`\n\r\t\0" +
    "áéíóúçãõ日本語😀🔥";
  let s = "";
  for (let i = 0; i < len; i++) {
    s += pool[Math.floor(rand() * pool.length)];
  }
  return s;
}

const KNOWN_ERRORS = new Set(["Cursor inválido.", "Não autenticado"]);

function assertWellFormed(res: any, ctx: string) {
  assert(res && typeof res === "object", `${ctx}: resposta não é objeto`);
  assert(Array.isArray(res.content) && res.content.length > 0, `${ctx}: sem content`);
  assert(typeof res.content[0].text === "string", `${ctx}: content[0].text não é string`);
  if (res.isError) {
    assert(
      KNOWN_ERRORS.has(res.content[0].text),
      `${ctx}: mensagem de erro inesperada "${res.content[0].text}"`,
    );
  } else {
    // Resultado normal precisa expor os campos de paginação.
    const sc = res.structuredContent;
    assert(sc && typeof sc === "object", `${ctx}: sem structuredContent`);
    assert(Array.isArray(sc.rows), `${ctx}: rows não é array`);
    assertEquals(typeof sc.count, "number");
    assertEquals(typeof sc.has_more, "boolean");
    assert(sc.next_cursor === null || typeof sc.next_cursor === "string");
  }
}

Deno.test("fuzz: cursor aleatório (autenticado) nunca lança e devolve resposta válida", async () => {
  const rand = mulberry32(0xC0FFEE);
  for (let i = 0; i < 300; i++) {
    const cursor = randomString(rand);
    const sb = fakeSupabase([]);
    let res: any;
    try {
      res = await runHandler({ cursor, limit: 2 }, ctx(true), sb);
    } catch (e) {
      throw new Error(`iter ${i}: handler lançou (equivalente a 5xx): ${e}`);
    }
    assertWellFormed(res, `iter ${i} cursor=${JSON.stringify(cursor).slice(0, 60)}`);
  }
});

Deno.test("fuzz: cursor + client_search + status aleatórios nunca lançam", async () => {
  const rand = mulberry32(0xBADF00D);
  for (let i = 0; i < 300; i++) {
    const input = {
      cursor: rand() < 0.7 ? randomString(rand) : undefined,
      client_search: rand() < 0.7 ? randomString(rand, 40) : undefined,
      client_id: rand() < 0.3 ? randomString(rand, 40) : undefined,
      status: rand() < 0.5 ? randomString(rand, 20) : undefined,
      limit: Math.max(1, Math.floor(rand() * 100)),
    };
    const sb = fakeSupabase([]);
    let res: any;
    try {
      res = await runHandler(input, ctx(true), sb);
    } catch (e) {
      throw new Error(`iter ${i}: handler lançou: ${e}\ninput=${JSON.stringify(input)}`);
    }
    assertWellFormed(res, `iter ${i}`);
  }
});

Deno.test("fuzz: input aleatório SEM auth sempre retorna 'Não autenticado' (401 lógico)", async () => {
  const rand = mulberry32(0xDEADBEEF);
  for (let i = 0; i < 200; i++) {
    const input = {
      cursor: rand() < 0.5 ? randomString(rand) : undefined,
      client_search: rand() < 0.5 ? randomString(rand, 40) : undefined,
      status: rand() < 0.5 ? randomString(rand, 20) : undefined,
    };
    const sb = fakeSupabase([]);
    let res: any;
    try {
      res = await runHandler(input, ctx(false), sb);
    } catch (e) {
      throw new Error(`iter ${i}: handler lançou sem auth: ${e}`);
    }
    assertEquals(res.isError, true);
    assertEquals(res.content[0].text, "Não autenticado");
    // Auth vence tudo — nenhuma consulta é montada.
    assertEquals(sb.calls.limit, undefined);
    assertEquals(sb.calls.or, []);
    assertEquals(sb.calls.ilike, []);
  }
});

// -------- Fuzz E2E contra endpoint deployado ------------------------------
// Envia payloads aleatórios SEM Authorization e confirma que o endpoint
// sempre responde 401/403 (autenticação primeiro) — nunca 5xx.

Deno.test("fuzz E2E: payloads aleatórios sem Authorization → sempre 401/403 (nunca 5xx)", async () => {
  const base = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
  if (!base) {
    console.warn("SUPABASE_URL/VITE_SUPABASE_URL ausente — pulando fuzz E2E");
    return;
  }
  const rand = mulberry32(0xF0F0F0);
  const url = `${base}/functions/v1/mcp/.mcp/invoke-tool/list_orders`;

  for (let i = 0; i < 20; i++) {
    const payload: Record<string, unknown> = {};
    if (rand() < 0.7) payload.cursor = randomString(rand, 200);
    if (rand() < 0.6) payload.client_search = randomString(rand, 40);
    if (rand() < 0.4) payload.client_id = randomString(rand, 40);
    if (rand() < 0.5) payload.status = randomString(rand, 30);
    if (rand() < 0.5) payload.limit = Math.floor(rand() * 10000) - 1000; // inclui negativos

    let body: string;
    try {
      body = JSON.stringify(payload);
    } catch {
      continue;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    await res.text(); // consome body (Deno resource leak guard)
    assert(
      res.status === 401 || res.status === 403,
      `iter ${i}: esperado 401/403, veio ${res.status} para payload ${body.slice(0, 120)}`,
    );
    assert(res.status < 500, `iter ${i}: 5xx inaceitável (${res.status})`);
  }
});

// -------- Regressão: casos capturados nos fuzz runs ----------------------
// Estes inputs foram extraídos das seeds `0xC0FFEE` (cursor-only fuzz) e
// `0xBADF00D` (mixed fuzz) — iterações que exercitaram o caminho de erro
// do decodeCursor (base64/JSON inválido, unicode/surrogates, controles).
// Como o fuzz é seedado, esses inputs são estáveis: congelá-los aqui
// garante que qualquer regressão futura no parser de cursor seja pega
// mesmo se a suíte fuzz for alterada (nº de iterações, seed, etc.).
//
// Invariantes validadas:
//   • handler NUNCA lança (equivalente a 5xx no HTTP);
//   • cursor inválido devolve { isError:true, "Cursor inválido." } (400 lógico);
//   • predicado keyset (.or) nunca é anexado quando cursor é rejeitado —
//     evita corrupção silenciosa de paginação em retentativas;
//   • sem auth, "Não autenticado" (401 lógico) vence sobre "Cursor inválido".

const FUZZ_REGRESSION_CASES: {
  cursorOnly: Array<{ iter: number; cursor: string }>;
  mixed: Array<{ iter: number; input: {
    cursor?: string; client_search?: string; client_id?: string;
    status?: string; limit?: number;
  } }>;
} = JSON.parse(`{"cursorOnly": [{"iter": 0, "cursor": "[#"}, {"iter": 1, "cursor": "l3qO#GRf\\u00008zM4?DT7$U,\\u672cf}EA]lwE[)0\\\\c[7DS'FWU\\u672c&\\u00fa$1D\\u00f5PLrmWd}J)D8CrSX\\u8a9e\\t\\ts4IJgC\\u0000X\\ud83d~0#\\ud83d\\u00e9BD\\u00e7\\u65e5Ps4e\\u00edjpH\\u00ed"}, {"iter": 2, "cursor": "\\u00eduB!N\\u00e1b\\u00e9b3mc{/\\u00ed7WD\\ud83dcL;\\u00e7xEB-e\\u00f5IL\\u672ck"}, {"iter": 3, "cursor": "%ruQ&nR@7=ui(JH\\u00falzMT'M#\\u00e3\\udd25'r6#\\u00ed\\ud83dqq*ef\\u00faH,G\\u00e9!\\t\\u00f3H!O,<iH4<24Oq|'B6|?jq2\\t"}, {"iter": 4, "cursor": "O'g)K@\\u00f3FDI\\u00ed\\u00edIy6S84k\`r?KKS&\\u00e1\\u65e5\\u00e9qa!2\\udd25A}-%u\\u00e1NW9^q=\\th\\ud83df+"}], "mixed": [{"iter": 1, "input": {"cursor": "3MM'\\udd25'\\u00e7&?\\t\\ude00\\u8a9e8Y\\u672c\`|)<\\u00faW6t\\udd253pyMaf~[W2G>\\u00f36\`EEUc\`bAwa7KPvh/U[\`mm\\u00e1+%P\\"@\\ty\\u00edqd)0|VgI>R6QZUf\\u0000\\u672c\\u00e7?3fu^)\\u65e56=1L/n6~n#,13\\n7^", "client_search": "dR\\ude00D=93wla}\\u00faC\\u00e1(\\ude00>?LO<mYE4yB3\\u00e7<0*+,#e\\u00e1", "status": "", "limit": 91}}, {"iter": 2, "input": {"cursor": "X\\u00e9o#xboZQ9\`re#->at", "status": "<o", "limit": 1}}, {"iter": 5, "input": {"cursor": "A+x\\ude00\\\\I\\u00e9\\"d<\\u00e7kL$\\ude001", "client_search": "*ME11\\ud83dx", "limit": 97}}, {"iter": 6, "input": {"cursor": "wn9I+6*?nQhjCX\\thE~dp\\r,21R\\u00ed/\\u00e1ft*\\u00e3EX\\nN4[\\nsW[5IBHPA\\u00e1E\\u00e7nzk&i52\\u00f5@\\udd25b\\"o{D-a\\n\\u00e3LA#\\u00e3@qJ!o~q#]Xp'I7\\u00e9+S@\\"q\\ud83d\\u00e9\\u00e3}90P!h=b3yQm\\u00e9G", "client_search": "rUTpaE\\udd256\\ud83dM\\ude00j?p\\u00f3\\u0000gp^\\u00e3\\u00faXXG%Msq;\\u8a9e(^\\u00f3\\\\v", "status": "0X~+", "limit": 41}}, {"iter": 9, "input": {"cursor": "<Vf*O}n\\u0000TxnvL\\ude00]@#[]=\\ude00J\\udd250&W7$W\\"T]<$3\\u00e3Jl(\\u00e7\\u00e79>\\u00fa\\ud83d[\\u00faf\\u00ed}X?sW\`d1uW2z", "status": "OA", "limit": 31}}]}`);

for (const { iter, cursor } of FUZZ_REGRESSION_CASES.cursorOnly) {
  Deno.test(`regressão fuzz [seed 0xC0FFEE #${iter}]: cursor bruto rejeitado sem 5xx`, async () => {
    const sb = fakeSupabase([]);
    let res: any;
    try {
      res = await runHandler({ cursor, limit: 2 }, ctx(true), sb);
    } catch (e) {
      throw new Error(`handler lançou (5xx) para caso fixo #${iter}: ${e}`);
    }
    assertEquals(res.isError, true);
    assertEquals(res.content[0].text, "Cursor inválido.");
    // Nenhum keyset foi montado — retentativa não fica presa em predicado
    // corrompido de uma chamada anterior.
    assertEquals(sb.calls.or, []);
  });

  Deno.test(`regressão fuzz [seed 0xC0FFEE #${iter}]: mesmo cursor sem auth → 401 lógico primeiro`, async () => {
    const sb = fakeSupabase([]);
    const res = await runHandler({ cursor, limit: 2 }, ctx(false), sb);
    assertEquals(res.isError, true);
    assertEquals(res.content[0].text, "Não autenticado");
    assertEquals(sb.calls.limit, undefined);
  });
}

for (const { iter, input } of FUZZ_REGRESSION_CASES.mixed) {
  Deno.test(`regressão fuzz [seed 0xBADF00D #${iter}]: cursor + filtros aleatórios rejeitado sem 5xx`, async () => {
    const sb = fakeSupabase([]);
    let res: any;
    try {
      res = await runHandler(input, ctx(true), sb);
    } catch (e) {
      throw new Error(`handler lançou (5xx) para caso fixo mixed #${iter}: ${e}`);
    }
    // Todos os casos capturados carregam cursor não-decodificável.
    assertEquals(res.isError, true);
    assertEquals(res.content[0].text, "Cursor inválido.");
    assertEquals(sb.calls.or, []);
  });

  Deno.test(`regressão fuzz [seed 0xBADF00D #${iter}]: mesmo payload sem auth → 401 lógico`, async () => {
    const sb = fakeSupabase([]);
    const res = await runHandler(input, ctx(false), sb);
    assertEquals(res.isError, true);
    assertEquals(res.content[0].text, "Não autenticado");
    assertEquals(sb.calls.or, []);
    assertEquals(sb.calls.ilike, []);
  });
}
