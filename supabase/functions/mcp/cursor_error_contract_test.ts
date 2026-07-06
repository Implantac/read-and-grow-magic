// Testes de integração — validam o CONTRATO de erro HTTP do endpoint MCP
// deployado quando o cursor é rejeitado (ou a chamada é rejeitada antes,
// no auth). Objetivo: garantir que 400/401 tenham body determinístico e
// que NENHUM payload malformado dispare 5xx.
//
// Observação sobre auth:
//   O endpoint `/functions/v1/mcp` é envelopado por OAuth Bearer (MCP).
//   Sem `Authorization` ou com Bearer inválido, o gateway responde 401
//   ANTES do tool ser invocado — então este arquivo cobre apenas o
//   contrato do 401 (auth). O caminho "cursor rejeitado dentro do tool"
//   (400 lógico via `isError:true`) já é coberto por
//   `cursor_parser_test.ts` (unit) e `list_orders_test.ts` (regressão de
//   handler). Isso reflete o comportamento real em produção: um cliente
//   MCP anônimo NUNCA chega ao decodeCursor — auth vence.
//
// Invariantes validadas:
//   1. Status é 401 (auth vence tudo), nunca 5xx.
//   2. Content-Type application/json e body é JSON parseável.
//   3. Body tem shape { error: string } — nada de stack trace, nada de
//      leakar mensagens internas ("Cursor inválido.", nome de função, etc.).
//   4. Header WWW-Authenticate presente (RFC 7235) apontando pro OAuth
//      resource metadata do MCP.
//   5. CORS respondido corretamente: `access-control-allow-origin: *` e
//      preflight OPTIONS não vaza 5xx.
//   6. Fuzz: 25 payloads aleatórios (cursor lixo, JSON quebrado, headers
//      esquisitos) — todos 401, nenhum 5xx.
//
// Rodar: supabase functions test mcp

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const BASE =
  Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? "";
const MCP_URL = `${BASE}/functions/v1/mcp`;

function skipIfNoBase(): boolean {
  if (!BASE) {
    console.warn("SUPABASE_URL/VITE_SUPABASE_URL ausente — pulando teste de integração");
    return true;
  }
  return false;
}

// Contrato: qualquer resposta HTTP do endpoint MCP tem que ser bem-formada.
async function assertErrorContract(
  res: Response,
  ctx: string,
): Promise<{ status: number; body: any }> {
  const status = res.status;
  const raw = await res.text();

  // Regra 1: nunca 5xx.
  assert(
    status < 500,
    `${ctx}: 5xx inaceitável — HTTP ${status} body=${raw.slice(0, 200)}`,
  );
  // Regra 2: erro esperado sempre na faixa 4xx (aqui em prática 401).
  assert(
    status >= 400 && status < 500,
    `${ctx}: esperado 4xx, veio ${status}`,
  );
  // Regra 3: JSON parseável.
  const ct = res.headers.get("content-type") ?? "";
  assert(
    ct.toLowerCase().includes("application/json"),
    `${ctx}: content-type inesperado "${ct}"`,
  );
  let body: any;
  try {
    body = JSON.parse(raw);
  } catch (e) {
    throw new Error(`${ctx}: body não é JSON: ${raw.slice(0, 200)} (${e})`);
  }
  // Regra 4: shape { error: string }.
  assertEquals(typeof body?.error, "string", `${ctx}: body.error precisa ser string`);
  assert(body.error.length > 0, `${ctx}: body.error vazio`);
  // Regra 5: nunca vaza stack ou nome de arquivo interno.
  const forbidden = ["at file://", "Stack:", "TypeError:", "SyntaxError:", "\n    at "];
  for (const needle of forbidden) {
    assert(
      !raw.includes(needle),
      `${ctx}: body vazou traço interno ("${needle}"): ${raw.slice(0, 200)}`,
    );
  }
  return { status, body };
}

// -------- 401 shape com cursor rejeitado ----------------------------------

Deno.test("integração: cursor malformado sem auth → 401 com { error: 'unauthorized' }", async () => {
  if (skipIfNoBase()) return;
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "tools/call",
      params: { name: "list_orders", arguments: { cursor: "###bad###" } },
    }),
  });
  const { status, body } = await assertErrorContract(res, "cursor malformado");
  assertEquals(status, 401);
  assertEquals(body.error, "unauthorized");
  // WWW-Authenticate obrigatório em 401 (RFC 7235).
  const wwwAuth = res.headers.get("www-authenticate") ?? "";
  assert(
    /^Bearer\b/i.test(wwwAuth),
    `WWW-Authenticate ausente/incorreto: "${wwwAuth}"`,
  );
});

Deno.test("integração: cursor válido sem auth → mesmo 401 (auth vence 200/tool result)", async () => {
  if (skipIfNoBase()) return;
  const validCursor = btoa(JSON.stringify({ d: "2027-01-01T00:00:00Z", i: "x" }));
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "tools/call",
      params: { name: "list_orders", arguments: { cursor: validCursor } },
    }),
  });
  const { status, body } = await assertErrorContract(res, "cursor válido s/ auth");
  assertEquals(status, 401);
  assertEquals(body.error, "unauthorized");
  // Body NÃO pode mencionar "Cursor" — auth precede a validação do tool.
  assert(
    !JSON.stringify(body).toLowerCase().includes("cursor"),
    `body vazou detalhe do tool: ${JSON.stringify(body)}`,
  );
});

Deno.test("integração: Bearer inválido + cursor lixo → 401 (não 5xx, mesmo contrato)", async () => {
  if (skipIfNoBase()) return;
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer not-a-real-jwt-just-garbage",
    },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "tools/call",
      params: { name: "list_orders", arguments: { cursor: "###bad###" } },
    }),
  });
  const { status } = await assertErrorContract(res, "bearer inválido");
  assertEquals(status, 401);
});

Deno.test("integração: JSON body malformado sem auth → 401 (auth vence parse do body)", async () => {
  if (skipIfNoBase()) return;
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{this is not json",
  });
  const { status } = await assertErrorContract(res, "body malformado");
  assertEquals(status, 401);
});

Deno.test("integração: body vazio sem auth → 401 (não 5xx)", async () => {
  if (skipIfNoBase()) return;
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "",
  });
  const { status } = await assertErrorContract(res, "body vazio");
  assertEquals(status, 401);
});

// -------- CORS -----------------------------------------------------------

Deno.test("integração: OPTIONS preflight não vaza 5xx e libera CORS", async () => {
  if (skipIfNoBase()) return;
  const res = await fetch(MCP_URL, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization,content-type",
    },
  });
  await res.text();
  assert(res.status < 500, `preflight retornou 5xx: ${res.status}`);
  assert(res.status < 400 || res.status === 401, `preflight status inesperado: ${res.status}`);
  const allowOrigin = res.headers.get("access-control-allow-origin");
  assert(allowOrigin, "preflight sem access-control-allow-origin");
});

Deno.test("integração: 401 inclui access-control-allow-origin (erro cruzando CORS)", async () => {
  if (skipIfNoBase()) return;
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": "https://example.com" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call",
      params: { name: "list_orders", arguments: { cursor: "###bad###" } } }),
  });
  await assertErrorContract(res, "cors + cursor ruim");
  assert(
    res.headers.get("access-control-allow-origin"),
    "resposta 401 sem CORS — cliente browser não conseguiria ler o body",
  );
});

// -------- Fuzz de integração ---------------------------------------------

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
function randomString(rand: () => number, maxLen = 200): string {
  const len = Math.floor(rand() * maxLen);
  const pool =
    "abcdefghijklmnopqrstuvwxyz0123456789%,'\";\\/(){}[]<>=+-*&|!?#@$^~`\n\r\t";
  let s = "";
  for (let i = 0; i < len; i++) s += pool[Math.floor(rand() * pool.length)];
  return s;
}

Deno.test("integração fuzz: 25 payloads com cursor lixo → todos 401 com body consistente", async () => {
  if (skipIfNoBase()) return;
  const rand = mulberry32(0xC0DE1234);
  for (let i = 0; i < 25; i++) {
    const args: Record<string, unknown> = { cursor: randomString(rand) };
    if (rand() < 0.5) args.client_search = randomString(rand, 40);
    if (rand() < 0.3) args.client_id = randomString(rand, 40);
    if (rand() < 0.4) args.limit = Math.floor(rand() * 500) - 100; // inclui negativos

    const res = await fetch(MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: i, method: "tools/call",
        params: { name: "list_orders", arguments: args },
      }),
    });
    const { status, body } = await assertErrorContract(res, `fuzz #${i}`);
    // Mesmo contrato para todo mundo — reforça determinismo do erro.
    assertEquals(status, 401, `fuzz #${i}: status inesperado`);
    assertEquals(body.error, "unauthorized", `fuzz #${i}: body.error mudou`);
  }
});
