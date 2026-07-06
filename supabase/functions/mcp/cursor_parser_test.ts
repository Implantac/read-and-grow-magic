// Unit tests para o parser/validador de cursor usado por `list_orders`.
//
// Escopo: função pura `decodeCursor` + contrato de rejeição.
// Invariantes verificadas:
//   1. decodeCursor NUNCA lança — qualquer input string devolve `null` ou
//      `{d:string, i:string}`. Isso é o que garante que o handler nunca
//      degenere em 5xx por causa de cursor malformado.
//   2. Aceita exatamente o formato produzido por `encodeCursor` (roundtrip).
//   3. Rejeita silenciosamente (retorna null): base64 quebrado, JSON quebrado,
//      tipos errados, campos faltando, primitivos, arrays, objetos aninhados,
//      objetos com campos extras onde d/i não são strings, strings vazias
//      (mas apenas quando o payload não parseia — {d:"", i:""} decodifica).
//   4. Handler mapeia null → 400 lógico ("Cursor inválido.", isError:true),
//      sem tocar o Supabase (sem `.or()` extra). Auth ausente vence e vira
//      401 lógico ("Não autenticado"), mesmo com cursor válido.
//
// Rodar: supabase functions test mcp

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// -------- SUT: parser puro (espelha src/lib/mcp/tools/list-orders.ts) -----
// Mantido em sincronia manual com o handler. Qualquer divergência aqui
// significa que o teste está errado — nunca "flexibilize" para acompanhar
// uma mudança no parser sem atualizar o handler primeiro.
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

// -------- Property 1: nunca lança para qualquer string --------------------

Deno.test("decodeCursor: nunca lança — retorna null ou payload válido", () => {
  const inputs: string[] = [
    "",
    " ",
    "   \t\n",
    "###",
    "not-base64!",
    "====",
    "AAAA", // base64 válido → \0\0\0 → JSON inválido
    "eyJ9", // "{}" cortado
    "eyJ9==",
    "%%%",
    "\0",
    "\uFFFD",
    "🔥",
    "a".repeat(10_000),
    btoa("undefined"),
    btoa("NaN"),
    btoa("Infinity"),
    btoa("<script>alert(1)</script>"),
    btoa("'; DROP TABLE orders; --"),
    btoa("{\"__proto__\":{\"polluted\":true}}"),
  ];
  for (const raw of inputs) {
    const out = decodeCursor(raw);
    assert(
      out === null || (typeof out.d === "string" && typeof out.i === "string"),
      `decodeCursor(${JSON.stringify(raw).slice(0, 60)}) retornou tipo inválido: ${JSON.stringify(out)}`,
    );
  }
});

// -------- Property 2: roundtrip encode/decode -----------------------------

Deno.test("decodeCursor: roundtrip com encodeCursor preserva {d,i}", () => {
  const samples: CursorPayload[] = [
    { d: "2027-01-01T00:00:00.000Z", i: "11111111-2222-3333-4444-555555555555" },
    { d: "1970-01-01T00:00:00Z", i: "abc" },
    { d: "2099-12-31T23:59:59.999Z", i: "z" },
    // Payloads com caracteres que o Postgres precisaria escapar no `.or()`
    // — o parser apenas devolve; a sanitização é responsabilidade do caller
    // (RLS + PostgREST) — o que importa aqui é que o parser aceita e não crasha.
    { d: "2027-01-01T00:00:00Z", i: "id,with,commas" },
    { d: "2027-01-01T00:00:00Z", i: "id'quote" },
    { d: "2027-01-01T00:00:00Z", i: "áéíóú-日本-🔥" },
  ];
  for (const s of samples) {
    const back = decodeCursor(encodeCursor(s));
    assertEquals(back, s, `roundtrip falhou para ${JSON.stringify(s)}`);
  }
});

// -------- Property 3: casos de rejeição categorizados ---------------------

const REJECTED: Array<[string, string]> = [
  ["string vazia",                       ""],
  ["espaços",                            "   "],
  ["não-base64",                         "###nao-base64###"],
  ["base64 válido / JSON inválido",      btoa("nao-e-json")],
  ["base64 de número",                   btoa("42")],
  ["base64 de bool",                     btoa("true")],
  ["base64 de null",                     btoa("null")],
  ["base64 de string JSON",              btoa("\"foo\"")],
  ["base64 de array",                    btoa(JSON.stringify(["2027-01-01", "abc"]))],
  ["objeto sem d",                       btoa(JSON.stringify({ i: "abc" }))],
  ["objeto sem i",                       btoa(JSON.stringify({ d: "2027-01-01" }))],
  ["objeto {} vazio",                    btoa("{}")],
  ["d numérico, i numérico",             btoa(JSON.stringify({ d: 1, i: 2 }))],
  ["d string, i numérico",               btoa(JSON.stringify({ d: "2027-01-01", i: 42 }))],
  ["d nulo",                             btoa(JSON.stringify({ d: null, i: "abc" }))],
  ["d objeto aninhado",                  btoa(JSON.stringify({ d: { nested: "x" }, i: "abc" }))],
  ["i array",                            btoa(JSON.stringify({ d: "2027-01-01", i: ["a"] }))],
  ["truncado no meio do base64",         btoa(JSON.stringify({ d: "2027", i: "x" })).slice(0, -3)],
];

for (const [label, cursor] of REJECTED) {
  Deno.test(`decodeCursor: rejeita — ${label}`, () => {
    assertEquals(decodeCursor(cursor), null);
  });
}

// -------- Property 4: aceita mesmo com campos extras + d/i vazios ---------
// Documenta o comportamento atual: o parser só exige TIPO string em d/i,
// não faz validação semântica (ISO date, UUID). Congela isso para pegar
// regressões acidentais que "apertem" a validação sem atualizar o handler.

Deno.test("decodeCursor: aceita objeto com campos extras se d/i são strings", () => {
  const raw = btoa(JSON.stringify({ d: "2027-01-01T00:00:00Z", i: "abc", extra: 1 }));
  assertEquals(decodeCursor(raw), { d: "2027-01-01T00:00:00Z", i: "abc", extra: 1 } as any);
});

Deno.test("decodeCursor: aceita d/i vazios (contrato documentado, sem validação semântica)", () => {
  const raw = btoa(JSON.stringify({ d: "", i: "" }));
  assertEquals(decodeCursor(raw), { d: "", i: "" });
});

// -------- Fake Supabase mínimo para verificar o contrato de rejeição ------

function fakeSupabase() {
  const calls = { or: [] as string[], limit: undefined as number | undefined };
  const builder: any = {
    select: (_c?: string) => builder,
    order: (_c?: string, _o?: unknown) => builder,
    eq: (_c?: string, _v?: unknown) => builder,
    gte: (_c?: string, _v?: unknown) => builder,
    lte: (_c?: string, _v?: unknown) => builder,
    ilike: (_c?: string, _v?: unknown) => builder,
    or: (expr: string) => { calls.or.push(expr); return builder; },
    limit(n: number) {
      calls.limit = n;
      const thenable = Promise.resolve({ data: [], error: null });
      return Object.assign(builder, { then: thenable.then.bind(thenable) });
    },
  };
  return { calls, from: () => builder };
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

// Handler mínimo que exercita SOMENTE o pipe cursor → validação → resposta.
// Espelha exatamente a ordem de checks do handler real:
//   auth → decodeCursor → (rejeita OU anexa .or()).
async function runCursorPipe(
  cursor: string,
  authed: boolean,
  sb: ReturnType<typeof fakeSupabase>,
) {
  if (!ctx(authed).isAuthenticated()) {
    return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
  }
  let q: any = sb.from("orders").select().order().limit(21);
  const c = decodeCursor(cursor);
  if (!c) return { content: [{ type: "text", text: "Cursor inválido." }], isError: true };
  q = q.or(`date.lt.${c.d},and(date.eq.${c.d},id.lt.${c.i})`);
  const { data, error } = await q;
  return { content: [{ type: "text", text: "ok" }], isError: false, data, error };
}

// -------- Property 5: contrato 400 lógico para todo cursor rejeitado ------

for (const [label, cursor] of REJECTED) {
  Deno.test(`pipe: cursor "${label}" → 400 lógico ("Cursor inválido.") sem tocar keyset`, async () => {
    const sb = fakeSupabase();
    let res: any;
    try {
      res = await runCursorPipe(cursor, true, sb);
    } catch (e) {
      throw new Error(`5xx: pipe lançou para "${label}": ${e}`);
    }
    assertEquals(res.isError, true);
    assertEquals(res.content[0].text, "Cursor inválido.");
    // Predicado keyset NUNCA é anexado quando o cursor é rejeitado — impede
    // que uma retentativa herde um `.or()` corrompido da chamada anterior.
    assertEquals(sb.calls.or, []);
  });
}

// -------- Property 6: 401 vence 400 (auth primeiro) -----------------------

Deno.test("pipe: sem auth + cursor válido → 'Não autenticado' (401 vence)", async () => {
  const sb = fakeSupabase();
  const validCursor = encodeCursor({ d: "2027-01-01T00:00:00Z", i: "abc" });
  const res = await runCursorPipe(validCursor, false, sb);
  assertEquals(res.isError, true);
  assertEquals(res.content[0].text, "Não autenticado");
  // Auth vence tudo — o pipe não montou query nem chamou decodeCursor de fato.
  assertEquals(sb.calls.limit, undefined);
  assertEquals(sb.calls.or, []);
});

Deno.test("pipe: sem auth + cursor inválido → 'Não autenticado' (auth vence 'Cursor inválido.')", async () => {
  const sb = fakeSupabase();
  const res = await runCursorPipe("###bad###", false, sb);
  assertEquals(res.isError, true);
  assertEquals(res.content[0].text, "Não autenticado");
  assertEquals(sb.calls.or, []);
});

// -------- Property 7: cursor válido monta EXATAMENTE 1 predicado keyset ---

Deno.test("pipe: cursor válido → aplica exatamente um predicado keyset e não é erro", async () => {
  const sb = fakeSupabase();
  const raw = encodeCursor({ d: "2027-06-10T00:00:00Z", i: "prev-id" });
  const res: any = await runCursorPipe(raw, true, sb);
  assertEquals(res.isError, false);
  assertEquals(sb.calls.or, [
    "date.lt.2027-06-10T00:00:00Z,and(date.eq.2027-06-10T00:00:00Z,id.lt.prev-id)",
  ]);
});
