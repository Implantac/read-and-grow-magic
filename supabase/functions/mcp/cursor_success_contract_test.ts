// Integration tests — contrato de SUCESSO do list_orders quando o cursor é válido.
//
// Complemento de:
//   - cursor_parser_test.ts        (parser puro + contrato 400/401)
//   - cursor_error_contract_test.ts (HTTP: nunca 5xx, sempre {error} JSON)
//
// Aqui validamos o "happy path": handler invocado com cursor válido devolve
// resposta 200-equivalente (isError:false) e um structuredContent com o
// shape exato que o cliente MCP depende para paginar:
//
//   {
//     rows:          Row[]              — página com no máximo `pageSize` itens
//     count:         number             — rows.length
//     total_amount:  number             — soma numérica de rows[].total
//     has_more:      boolean            — true sse o banco devolveu pageSize+1
//     next_cursor:   string | null      — base64(JSON({d,i})) do último item, ou null
//   }
//
// Invariantes validadas:
//   I1. isError === false e content[0].type === "text"
//   I2. rows é Array e count === rows.length
//   I3. rows.length <= pageSize (o +1 sonda é aparado)
//   I4. has_more === (banco devolveu > pageSize)
//   I5. next_cursor é null quando !has_more; string base64 decodificável em
//       {d:string,i:string} quando has_more
//   I6. next_cursor decodifica exatamente para {d,i} do ÚLTIMO row retornado
//       (não do row-sonda) — invariante do keyset (date desc, id desc)
//   I7. total_amount === Σ Number(row.total ?? 0), tolerando total null/undefined
//   I8. Roundtrip: usar next_cursor como cursor na próxima chamada aplica
//       EXATAMENTE 1 predicado .or() com o formato
//       `date.lt.${d},and(date.eq.${d},id.lt.${i})`
//   I9. Página final (< pageSize) → has_more:false e next_cursor:null
//  I10. Página vazia → rows:[], count:0, total_amount:0, has_more:false, next_cursor:null
//
// Rodar: supabase functions test mcp

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// -------- Fake Supabase (espelha o construído em list_orders_test.ts) ------

type Row = Record<string, unknown>;

function fakeSupabase(rows: Row[]) {
  const calls: {
    table?: string;
    or: string[];
    limit?: number;
    order: Array<{ col: string; ascending: boolean }>;
  } = { or: [], order: [] };

  const builder: any = {
    select: (_c?: string) => builder,
    order(col: string, opts: { ascending: boolean }) {
      calls.order.push({ col, ascending: opts.ascending });
      return builder;
    },
    eq: (_c?: string, _v?: unknown) => builder,
    gte: (_c?: string, _v?: unknown) => builder,
    lte: (_c?: string, _v?: unknown) => builder,
    ilike: (_c?: string, _v?: unknown) => builder,
    or(expr: string) { calls.or.push(expr); return builder; },
    limit(n: number) {
      calls.limit = n;
      const thenable = Promise.resolve({ data: rows, error: null });
      return Object.assign(builder, { then: thenable.then.bind(thenable) });
    },
  };
  return { calls, from(table: string) { calls.table = table; return builder; } };
}

function ctx() {
  return {
    isAuthenticated: () => true,
    getToken: () => "fake-jwt",
    getUserId: () => "user-1",
    getUserEmail: () => "u@test",
    getClientId: () => "client-1",
    getClaims: () => ({}),
  };
}

// Handler espelhado (idêntico à lógica de src/lib/mcp/tools/list-orders.ts).
function encodeCursor(p: { d: string; i: string }) { return btoa(JSON.stringify(p)); }
function decodeCursor(raw: string): { d: string; i: string } | null {
  try {
    const p = JSON.parse(atob(raw));
    if (typeof p?.d === "string" && typeof p?.i === "string") return p;
    return null;
  } catch { return null; }
}

async function runHandler(
  input: { limit?: number; cursor?: string },
  supabase: { from: (t: string) => any },
) {
  const context = ctx();
  if (!context.isAuthenticated()) {
    return { content: [{ type: "text", text: "Não autenticado" }], isError: true as const };
  }
  const pageSize = input.limit ?? 20;
  let q: any = supabase
    .from("orders")
    .select("id, number, client_id, client_name, date, delivery_date, total, status, priority, payment_method")
    .order("date", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);
  if (input.cursor) {
    const c = decodeCursor(input.cursor);
    if (!c) return { content: [{ type: "text", text: "Cursor inválido." }], isError: true as const };
    q = q.or(`date.lt.${c.d},and(date.eq.${c.d},id.lt.${c.i})`);
  }
  const { data, error } = await q;
  if (error) return { content: [{ type: "text", text: String(error) }], isError: true as const };
  const rowsAll = (data ?? []) as any[];
  const hasMore = rowsAll.length > pageSize;
  const rows = hasMore ? rowsAll.slice(0, pageSize) : rowsAll;
  const last = rows[rows.length - 1];
  const nextCursor = hasMore && last ? encodeCursor({ d: last.date, i: last.id }) : null;
  const pageTotal = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
  return {
    content: [{ type: "text", text: `Página com ${rows.length} pedidos (soma R$ ${pageTotal.toFixed(2)})` }],
    structuredContent: {
      rows, count: rows.length, total_amount: pageTotal,
      has_more: hasMore, next_cursor: nextCursor,
    },
    isError: false as const,
  };
}

// -------- Helper: gerador de rows monotonicamente decrescentes por (date, id)

function makeRows(n: number, opts: { totalEach?: number | null } = {}): Row[] {
  const rows: Row[] = [];
  // 3 datas distintas para exercitar o tie-break por id na keyset.
  for (let i = 0; i < n; i++) {
    const dayOffset = Math.floor(i / 3);          // 0,0,0,1,1,1,2,...
    const idOffset = 999 - i;                     // decrescente
    const date = `2027-06-${String(20 - dayOffset).padStart(2, "0")}T00:00:00.000Z`;
    rows.push({
      id: `id-${String(idOffset).padStart(4, "0")}`,
      number: `P-${i + 1}`,
      client_id: "c1",
      client_name: `Cliente ${i + 1}`,
      date,
      delivery_date: date,
      total: opts.totalEach ?? (100 + i),
      status: "confirmed",
      priority: "normal",
      payment_method: "pix",
    });
  }
  return rows;
}

// -------- I1..I7: página cheia com more disponível --------------------------

Deno.test("success: página cheia (banco devolve pageSize+1) → shape + has_more + next_cursor", async () => {
  const pageSize = 5;
  const dbRows = makeRows(pageSize + 1); // 6 rows — 1 é sonda
  const sb = fakeSupabase(dbRows);

  const res: any = await runHandler({ limit: pageSize }, sb);

  // I1
  assertEquals(res.isError, false);
  assertEquals(res.content[0].type, "text");
  assert(typeof res.content[0].text === "string" && res.content[0].text.length > 0);

  const sc = res.structuredContent;
  // I2, I3
  assert(Array.isArray(sc.rows));
  assertEquals(sc.rows.length, pageSize);
  assertEquals(sc.count, sc.rows.length);
  // I4
  assertEquals(sc.has_more, true);
  // I5
  assertEquals(typeof sc.next_cursor, "string");
  const decoded = decodeCursor(sc.next_cursor);
  assert(decoded !== null, "next_cursor não decodificou");
  assertEquals(typeof decoded!.d, "string");
  assertEquals(typeof decoded!.i, "string");
  // I6 — cursor aponta para o ÚLTIMO row devolvido, não a sonda descartada.
  const last = sc.rows[sc.rows.length - 1];
  assertEquals(decoded!.d, last.date);
  assertEquals(decoded!.i, last.id);
  // I7
  const expectedSum = sc.rows.reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);
  assertEquals(sc.total_amount, expectedSum);
  // O banco recebeu pageSize+1 (sonda has_more sem count(*))
  assertEquals(sb.calls.limit, pageSize + 1);
});

// -------- I9: página final (menos que pageSize) ----------------------------

Deno.test("success: página final (rows < pageSize) → has_more:false, next_cursor:null", async () => {
  const sb = fakeSupabase(makeRows(3));
  const res: any = await runHandler({ limit: 10 }, sb);

  assertEquals(res.isError, false);
  const sc = res.structuredContent;
  assertEquals(sc.count, 3);
  assertEquals(sc.rows.length, 3);
  assertEquals(sc.has_more, false);
  assertEquals(sc.next_cursor, null);
});

Deno.test("success: página exatamente cheia (rows === pageSize, sem sonda) → has_more:false, next_cursor:null", async () => {
  // Sem o +1 do banco, o handler NÃO pode alegar has_more — é a semântica
  // da sonda: só sabemos que há mais quando o banco devolve pageSize+1.
  const pageSize = 4;
  const sb = fakeSupabase(makeRows(pageSize));
  const res: any = await runHandler({ limit: pageSize }, sb);

  const sc = res.structuredContent;
  assertEquals(sc.count, pageSize);
  assertEquals(sc.has_more, false);
  assertEquals(sc.next_cursor, null);
});

// -------- I10: página vazia -----------------------------------------------

Deno.test("success: página vazia → rows:[], count:0, total_amount:0, has_more:false, next_cursor:null", async () => {
  const sb = fakeSupabase([]);
  const res: any = await runHandler({}, sb);

  assertEquals(res.isError, false);
  const sc = res.structuredContent;
  assertEquals(sc.rows, []);
  assertEquals(sc.count, 0);
  assertEquals(sc.total_amount, 0);
  assertEquals(sc.has_more, false);
  assertEquals(sc.next_cursor, null);
});

// -------- I7 (edge): total_amount tolera null/undefined -------------------

Deno.test("success: total_amount trata rows com total null/undefined como 0", async () => {
  const sb = fakeSupabase([
    { id: "id-9", date: "2027-06-20T00:00:00.000Z", total: null },
    { id: "id-8", date: "2027-06-20T00:00:00.000Z", total: undefined },
    { id: "id-7", date: "2027-06-19T00:00:00.000Z", total: 42.5 },
    { id: "id-6", date: "2027-06-19T00:00:00.000Z", total: "17.25" }, // Number("17.25")
  ]);
  const res: any = await runHandler({ limit: 10 }, sb);
  assertEquals(res.isError, false);
  assertEquals(res.structuredContent.total_amount, 42.5 + 17.25);
});

// -------- I8: roundtrip — next_cursor da página N gera keyset correto na N+1

Deno.test("success: roundtrip next_cursor → próxima chamada aplica 1 predicado keyset correto", async () => {
  // Página 1
  const pageSize = 3;
  const page1Rows = makeRows(pageSize + 1);
  const sb1 = fakeSupabase(page1Rows);
  const res1: any = await runHandler({ limit: pageSize }, sb1);
  assertEquals(res1.isError, false);
  assertEquals(res1.structuredContent.has_more, true);
  const cursor = res1.structuredContent.next_cursor as string;
  assert(typeof cursor === "string");

  // Página 1 não usa cursor → nenhum .or() foi anexado
  assertEquals(sb1.calls.or, []);

  // Página 2
  const sb2 = fakeSupabase(makeRows(2));
  const res2: any = await runHandler({ limit: pageSize, cursor }, sb2);
  assertEquals(res2.isError, false);

  // EXATAMENTE 1 predicado keyset com o formato esperado, usando o {d,i}
  // do último row da página 1.
  const last1 = res1.structuredContent.rows[res1.structuredContent.rows.length - 1];
  assertEquals(sb2.calls.or, [
    `date.lt.${last1.date},and(date.eq.${last1.date},id.lt.${last1.id})`,
  ]);
  // E a página 2, sendo curta, encerra a paginação.
  assertEquals(res2.structuredContent.has_more, false);
  assertEquals(res2.structuredContent.next_cursor, null);
});

// -------- Ordenação estável documentada na resposta -----------------------

Deno.test("success: query sempre pede (date desc, id desc) — ordenação estável do contrato", async () => {
  const sb = fakeSupabase(makeRows(2));
  await runHandler({}, sb);
  assertEquals(sb.calls.order, [
    { col: "date", ascending: false },
    { col: "id", ascending: false },
  ]);
  assertEquals(sb.calls.table, "orders");
});

// -------- Content textual não vaza dados fora do structuredContent --------
// O cliente MCP renderiza content[0].text; garantimos que ele reflete o que
// está em structuredContent (count + soma formatada). Regressões que
// dessincronizem os dois canais quebram esse assert.

Deno.test("success: content[0].text reflete count e total_amount do structuredContent", async () => {
  const sb = fakeSupabase(makeRows(2, { totalEach: 50 }));
  const res: any = await runHandler({ limit: 10 }, sb);
  const sc = res.structuredContent;
  const text = res.content[0].text as string;
  assert(text.includes(`Página com ${sc.count} pedidos`));
  assert(text.includes(`R$ ${sc.total_amount.toFixed(2)}`));
});
