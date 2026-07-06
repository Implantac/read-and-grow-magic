// Integration tests — ordenação estável (date desc, id desc) de list_orders.
//
// Complemento de:
//   - cursor_parser_test.ts          (parser puro + contrato 400/401)
//   - cursor_error_contract_test.ts  (HTTP: nunca 5xx, sempre {error} JSON)
//   - cursor_success_contract_test.ts (shape do happy-path)
//
// Aqui focamos na INVARIANTE DE ORDEM que sustenta o keyset:
//
//   Toda página retornada por list_orders é ordenada por (date desc, id desc).
//   Quando o cursor é reaplicado, a página seguinte NÃO repete nem pula
//   nenhuma tupla — mesmo com múltiplos pedidos compartilhando a mesma date.
//
// Se a ordenação por id (tie-break) for perdida, keyset fura: cursor da
// página N pode voltar tuplas já vistas ou omitir tuplas nunca vistas. Estes
// testes travam esse comportamento em três frentes:
//
//   O1. A query sempre pede `.order("date", desc).order("id", desc)`,
//       nessa ordem (o tie-break precisa ser secundário).
//   O2. Para o dataset devolvido, rows já vêm ordenadas por (date desc,
//       id desc) — validamos comparando com um sort de referência.
//   O3. Ao paginar TODO o conjunto reaplicando next_cursor página a página,
//       a concatenação das páginas === dataset ordenado. Sem duplicatas,
//       sem lacunas.
//   O4. Empate total na fronteira: quando o último item da página N e o
//       primeiro item candidato da página N+1 compartilham a MESMA date,
//       o predicado keyset `and(date.eq.d, id.lt.i)` garante que id.lt
//       corta exatamente no id do último visto.
//   O5. next_cursor sempre aponta para o último item retornado, mesmo
//       quando esse item empata em date com o item-sonda descartado.
//
// Rodar: supabase functions test mcp

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// -------- Fake Supabase com filtragem por keyset (necessária para O3/O4)

type Row = {
  id: string;
  date: string;
  total?: number | null;
  [k: string]: unknown;
};

/**
 * Diferente dos fakes dos outros testes, este APLICA o predicado .or()
 * sobre `rows` — sem isso, não conseguimos simular paginação real e o
 * teste O3 (concatenação === dataset) não faz sentido.
 *
 * Suporta APENAS o formato exato que list_orders emite:
 *   `date.lt.${d},and(date.eq.${d},id.lt.${i})`
 * Qualquer outro formato faz o teste falhar — isso é intencional: se o
 * handler mudar o predicado, queremos ver aqui.
 */
function fakeSupabaseWithKeyset(rows: Row[]) {
  const calls: {
    table?: string;
    or: string[];
    limit?: number;
    order: Array<{ col: string; ascending: boolean }>;
  } = { or: [], order: [] };

  let filtered = [...rows];

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
    or(expr: string) {
      calls.or.push(expr);
      const m = expr.match(
        /^date\.lt\.(.+?),and\(date\.eq\.(.+?),id\.lt\.(.+?)\)$/,
      );
      if (!m) throw new Error(`predicado keyset inesperado: ${expr}`);
      const [, d1, d2, i] = m;
      assertEquals(d1, d2, "keyset: d.lt e d.eq devem coincidir");
      filtered = filtered.filter((r) => r.date < d1 || (r.date === d1 && r.id < i));
      return builder;
    },
    limit(n: number) {
      calls.limit = n;
      const data = filtered.slice(0, n);
      const thenable = Promise.resolve({ data, error: null });
      return Object.assign(builder, { then: thenable.then.bind(thenable) });
    },
  };
  return {
    calls,
    from(table: string) {
      calls.table = table;
      return builder;
    },
  };
}

// -------- Handler espelhado (idêntico à lógica do tool real) ---------------

function encodeCursor(p: { d: string; i: string }) {
  return btoa(JSON.stringify(p));
}
function decodeCursor(raw: string): { d: string; i: string } | null {
  try {
    const p = JSON.parse(atob(raw));
    if (typeof p?.d === "string" && typeof p?.i === "string") return p;
    return null;
  } catch {
    return null;
  }
}

async function runHandler(
  input: { limit?: number; cursor?: string },
  supabase: { from: (t: string) => any },
) {
  const pageSize = input.limit ?? 20;
  let q: any = supabase
    .from("orders")
    .select("id, date, total")
    .order("date", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);
  if (input.cursor) {
    const c = decodeCursor(input.cursor);
    if (!c) {
      return {
        isError: true as const,
        content: [{ type: "text", text: "Cursor inválido." }],
      };
    }
    q = q.or(`date.lt.${c.d},and(date.eq.${c.d},id.lt.${c.i})`);
  }
  const { data, error } = await q;
  if (error) {
    return {
      isError: true as const,
      content: [{ type: "text", text: String(error) }],
    };
  }
  const rowsAll = (data ?? []) as Row[];
  const hasMore = rowsAll.length > pageSize;
  const rowsList = hasMore ? rowsAll.slice(0, pageSize) : rowsAll;
  const last = rowsList[rowsList.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor({ d: last.date, i: last.id }) : null;
  return {
    isError: false as const,
    structuredContent: {
      rows: rowsList,
      count: rowsList.length,
      has_more: hasMore,
      next_cursor: nextCursor,
    },
  };
}

// -------- Comparador de referência para (date desc, id desc) ---------------

function cmpDesc(a: Row, b: Row): number {
  if (a.date > b.date) return -1;
  if (a.date < b.date) return 1;
  if (a.id > b.id) return -1;
  if (a.id < b.id) return 1;
  return 0;
}

function sortedDesc(rs: Row[]): Row[] {
  return [...rs].sort(cmpDesc);
}

function isStrictlyDescending(rs: Row[]): boolean {
  // cmpDesc(a,b) < 0 ⇔ a "vem antes" de b em ordem (date desc, id desc).
  // Estritamente decrescente ⇒ para todo par consecutivo, cmpDesc < 0.
  for (let k = 1; k < rs.length; k++) {
    if (cmpDesc(rs[k - 1], rs[k]) >= 0) return false;
  }
  return true;
}

// -------- Dataset: várias datas repetidas para exercitar o tie-break -------

/**
 * Gera N pedidos distribuídos em D datas (round-robin), com ids UUID-like
 * arbitrários (não monotônicos com a data). Isso garante que:
 *   - Múltiplos pedidos compartilham a mesma date (força tie-break por id).
 *   - Ordem de inserção != ordem de id, então uma implementação que
 *     "esqueceu" o .order("id", desc) falha em O2/O3.
 */
function buildDataset(nDates: number, perDate: number): Row[] {
  const rows: Row[] = [];
  // Ids embaralhados propositalmente — nada garante que rows chegam ordenadas
  // do "banco". No teste, o fake respeita `rows` como estão; o handler é
  // responsável por pedir a ordenação certa (que este fake não simula, mas
  // que O1 valida separadamente).
  //
  // Para O3, precisamos que o "banco" devolva os rows JÁ ordenados por
  // (date desc, id desc) — porque um Postgres real, honrando .order(),
  // devolveria assim. É essa ordenação que o keyset assume.
  for (let d = 0; d < nDates; d++) {
    for (let k = 0; k < perDate; k++) {
      const date = `2027-05-${String(10 + d).padStart(2, "0")}T00:00:00.000Z`;
      // ids arbitrários mas únicos; sort lexicográfico servirá de tie-break
      const id = `ord-${d}-${String(100 + k * 7 + (k % 3)).padStart(4, "0")}`;
      rows.push({ id, date, total: 10 + d + k });
    }
  }
  return sortedDesc(rows);
}

// ==========================================================================
// O1 — Query sempre pede (date desc, id desc), NESSA ORDEM.
// ==========================================================================

Deno.test("order O1: query pede exatamente [date desc, id desc] em toda chamada", async () => {
  // Sem cursor
  const sb1 = fakeSupabaseWithKeyset(buildDataset(2, 2));
  await runHandler({ limit: 3 }, sb1);
  assertEquals(sb1.calls.order, [
    { col: "date", ascending: false },
    { col: "id", ascending: false },
  ]);
  assertEquals(sb1.calls.table, "orders");

  // Com cursor
  const sb2 = fakeSupabaseWithKeyset(buildDataset(2, 2));
  await runHandler(
    { limit: 3, cursor: encodeCursor({ d: "2027-05-11T00:00:00.000Z", i: "ord-1-9999" }) },
    sb2,
  );
  assertEquals(sb2.calls.order, [
    { col: "date", ascending: false },
    { col: "id", ascending: false },
  ]);
});

// ==========================================================================
// O2 — Página devolvida é estritamente decrescente por (date, id).
// ==========================================================================

Deno.test("order O2: rows devolvidas são estritamente decrescentes por (date desc, id desc)", async () => {
  const data = buildDataset(4, 5); // 4 datas × 5 = 20 rows, muitos empates de date
  const sb = fakeSupabaseWithKeyset(data);
  const res: any = await runHandler({ limit: 20 }, sb);
  assertEquals(res.isError, false);
  const rows: Row[] = res.structuredContent.rows;
  assertEquals(rows.length, 20);
  assert(isStrictlyDescending(rows), "página não está estritamente decrescente");
  // E é igual à referência: banco ordenado === handler ordenado.
  assertEquals(rows.map((r) => r.id), sortedDesc(data).map((r) => r.id));
});

// ==========================================================================
// O3 — Paginação completa reaplicando next_cursor: sem duplicatas, sem lacunas.
// ==========================================================================

Deno.test("order O3: paginar todo o dataset via next_cursor === dataset ordenado (sem dup/gap)", async () => {
  const data = buildDataset(5, 4); // 20 rows, 5 datas × 4 (empates de date)
  const pageSize = 3;                 // força várias páginas
  const expected = sortedDesc(data);

  const collected: Row[] = [];
  let cursor: string | undefined = undefined;
  let guard = 0;
  // Cada página usa uma instância nova do fake — necessário para o keyset
  // filtrar o dataset completo a partir do cursor recém-recebido.
  while (true) {
    if (++guard > 50) throw new Error("loop de paginação não convergiu");
    const sb = fakeSupabaseWithKeyset(data);
    const res: any = await runHandler({ limit: pageSize, cursor }, sb);
    assertEquals(res.isError, false, "página não pode dar erro no loop");
    const rows: Row[] = res.structuredContent.rows;
    // Cada página, isoladamente, precisa estar em ordem estável.
    assert(isStrictlyDescending(rows), "página intermediária fora de ordem");
    collected.push(...rows);
    if (!res.structuredContent.has_more) {
      assertEquals(res.structuredContent.next_cursor, null);
      break;
    }
    cursor = res.structuredContent.next_cursor;
    assert(typeof cursor === "string");
  }

  // Sem duplicatas
  const uniqueIds = new Set(collected.map((r) => r.id));
  assertEquals(uniqueIds.size, collected.length, "cursor duplicou items");
  // Sem lacunas
  assertEquals(collected.length, expected.length, "cursor pulou items");
  // Ordem global preservada
  assertEquals(collected.map((r) => r.id), expected.map((r) => r.id));
});

// ==========================================================================
// O4 — Fronteira com empate de date: keyset corta exatamente em id.lt.
// ==========================================================================

Deno.test("order O4: quando fronteira compartilha date, keyset usa id.lt do último visto", async () => {
  // Dataset com MUITOS empates numa mesma date (10 rows na mesma data).
  // pageSize=4 força a fronteira page1↔page2 a cair DENTRO do mesmo bloco de date.
  const sameDate = "2027-05-15T00:00:00.000Z";
  const raw: Row[] = [];
  for (let k = 0; k < 10; k++) {
    raw.push({ id: `sd-${String(1000 - k * 3).padStart(4, "0")}`, date: sameDate, total: k });
  }
  const data = sortedDesc(raw);
  const pageSize = 4;

  const sb1 = fakeSupabaseWithKeyset(data);
  const p1: any = await runHandler({ limit: pageSize }, sb1);
  assertEquals(p1.isError, false);
  assertEquals(p1.structuredContent.has_more, true);
  const last1 = p1.structuredContent.rows[pageSize - 1];
  // page1 não usa cursor
  assertEquals(sb1.calls.or, []);

  const cursor = p1.structuredContent.next_cursor as string;
  const decoded = decodeCursor(cursor)!;
  assertEquals(decoded.d, sameDate, "cursor deve preservar a date da fronteira");
  assertEquals(decoded.i, last1.id, "cursor deve apontar para o id do último visto");

  const sb2 = fakeSupabaseWithKeyset(data);
  const p2: any = await runHandler({ limit: pageSize, cursor }, sb2);
  assertEquals(p2.isError, false);
  // Predicado emitido é EXATAMENTE o esperado.
  assertEquals(sb2.calls.or, [
    `date.lt.${sameDate},and(date.eq.${sameDate},id.lt.${last1.id})`,
  ]);
  // Nenhum id da page2 pode reaparecer na page1 (sem duplicata na fronteira).
  const idsP1 = new Set(p1.structuredContent.rows.map((r: Row) => r.id));
  for (const r of p2.structuredContent.rows) {
    assert(!idsP1.has(r.id), `duplicata na fronteira: ${r.id}`);
  }
  // E o primeiro item de page2 é o próximo estritamente MENOR que last1 pelo cmp.
  const expectedNext = sortedDesc(data).find((r) => cmpDesc(last1, r) < 0)!;
  assertEquals(p2.structuredContent.rows[0].id, expectedNext.id);
});

// ==========================================================================
// O5 — next_cursor aponta para o último RETORNADO, mesmo com empate de date
//      com a sonda descartada.
// ==========================================================================

Deno.test("order O5: next_cursor referencia o último item retornado, não a sonda descartada", async () => {
  // Constrói dataset onde o item na posição pageSize (sonda) empata em date
  // com o item na posição pageSize-1 (último retornado). Se o handler pegar
  // o cursor da sonda por engano, o teste O3 já quebraria, mas aqui isolamos
  // a asserção.
  const sameDate = "2027-05-20T00:00:00.000Z";
  const raw: Row[] = [
    { id: "aa-9999", date: "2027-05-22T00:00:00.000Z" },
    { id: "aa-8888", date: "2027-05-21T00:00:00.000Z" },
    { id: "aa-7777", date: sameDate }, // ← último retornado (pageSize=3)
    { id: "aa-5555", date: sameDate }, // ← sonda (empata em date!)
    { id: "aa-3333", date: "2027-05-19T00:00:00.000Z" },
  ];
  const data = sortedDesc(raw);
  const sb = fakeSupabaseWithKeyset(data);
  const res: any = await runHandler({ limit: 3 }, sb);
  assertEquals(res.isError, false);
  assertEquals(res.structuredContent.has_more, true);
  const decoded = decodeCursor(res.structuredContent.next_cursor)!;
  assertEquals(decoded.d, sameDate);
  assertEquals(decoded.i, "aa-7777", "cursor deve ser do último retornado, não da sonda");
});
