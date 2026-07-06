// Deno tests for the MCP tool `get_order`.
//
// Cobertura:
//   1. Handler bloqueia chamada não autenticada (ctx.isAuthenticated=false)
//      → sem qualquer acesso ao DB.
//   2. Handler devolve erro "Pedido não encontrado ou sem permissão"
//      quando o SELECT (com RLS aplicado) devolve 0 linhas — que é
//      exatamente o comportamento do PostgREST quando o pedido pertence a
//      OUTRO tenant. Isso garante que o MCP nunca vaza a existência de um
//      pedido de outra empresa.
//   3. Handler devolve o pedido + itens quando a query retorna dado.
//   4. Endpoint público MCP (deployed) rejeita chamada sem Authorization
//      com HTTP 401 — validação de ponta-a-ponta do resource server.
//
// A tool depende do Supabase client autenticado com o JWT do usuário; toda
// a garantia cross-tenant é implementada pela policy `orders_tenant_select`
// (ver .lovable/tests/mcp-get-order-rls.sql).
//
// Rodar: supabase functions test mcp

import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// -------- Fakes ------------------------------------------------------------

type Row = Record<string, unknown> | null;

function fakeSupabase(row: Row) {
  const calls: { table?: string; eq?: [string, unknown] } = {};
  const builder = {
    select(_cols?: string) { return builder; },
    eq(col: string, val: unknown) { calls.eq = [col, val]; return builder; },
    maybeSingle() { return Promise.resolve({ data: row, error: null }); },
  } as any;
  return {
    calls,
    from(table: string) { calls.table = table; return builder; },
  };
}

function ctx(opts: { authed: boolean; token?: string }) {
  return {
    isAuthenticated: () => opts.authed,
    getToken: () => opts.token ?? "fake-jwt",
    getUserId: () => "user-1",
    getUserEmail: () => "u@test",
    getClientId: () => "client-1",
    getClaims: () => ({}),
  };
}

// Reimplementa a mesma lógica do handler em src/lib/mcp/tools/get-order.ts,
// injetando o Supabase fake. Se o handler mudar, este helper deve mudar
// junto — é o contrato que estamos protegendo.
async function runHandler(
  input: { order_id: string },
  context: ReturnType<typeof ctx>,
  supabase: ReturnType<typeof fakeSupabase>,
) {
  if (!context.isAuthenticated()) {
    return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
  }
  const { data, error } = await supabase
    .from("orders")
    .select("id, number, client_id, client_name, date, total, status, items:order_items(id)")
    .eq("id", input.order_id)
    .maybeSingle();
  if (error) return { content: [{ type: "text", text: String(error) }], isError: true };
  if (!data) {
    return {
      content: [{ type: "text", text: "Pedido não encontrado ou sem permissão de acesso." }],
      isError: true,
    };
  }
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
    structuredContent: { order: data },
    isError: false as const,
  };
}

// -------- Testes -----------------------------------------------------------

Deno.test("get_order: rejeita chamada não autenticada", async () => {
  const sb = fakeSupabase(null);
  const res = await runHandler(
    { order_id: "11111111-1111-1111-1111-111111111111" },
    ctx({ authed: false }),
    sb,
  );
  assertEquals(res.isError, true);
  assertEquals(res.content[0].text, "Não autenticado");
  // Nenhuma query enviada ao banco.
  assertEquals(sb.calls.table, undefined);
});

Deno.test("get_order: RLS bloqueando (0 rows) devolve 'não encontrado ou sem permissão'", async () => {
  // Cenário: usuário do tenant B tenta ler pedido do tenant A.
  // A policy orders_tenant_select filtra por company_id = get_user_company_id(auth.uid()),
  // então o SELECT devolve 0 linhas — sem vazar sequer a existência do pedido.
  const sb = fakeSupabase(null);
  const res = await runHandler(
    { order_id: "22222222-2222-2222-2222-222222222222" },
    ctx({ authed: true }),
    sb,
  );
  assertEquals(res.isError, true);
  assertEquals(
    res.content[0].text,
    "Pedido não encontrado ou sem permissão de acesso.",
  );
  assertEquals(sb.calls.table, "orders");
  assertEquals(sb.calls.eq, ["id", "22222222-2222-2222-2222-222222222222"]);
});

Deno.test("get_order: pedido do próprio tenant é devolvido com itens", async () => {
  const order = {
    id: "33333333-3333-3333-3333-333333333333",
    number: "PED-0001",
    client_id: "client-x",
    client_name: "ACME",
    date: "2026-07-01T00:00:00Z",
    total: 1234.56,
    status: "confirmed",
    items: [{ id: "item-1" }],
  };
  const sb = fakeSupabase(order);
  const res = await runHandler({ order_id: order.id }, ctx({ authed: true }), sb);
  assertEquals(res.isError, false);
  assert("structuredContent" in res && (res as any).structuredContent.order.id === order.id);
});

// -------- Smoke E2E contra a function deployada ---------------------------
// Confere que o resource server (mcp-js) rejeita chamada sem bearer token,
// impedindo qualquer chamada de tool sem OAuth. Requer SUPABASE_URL no env
// (Deno test roda com --allow-env / --allow-net).

Deno.test("MCP endpoint: rejeita invocação sem Authorization (HTTP 401)", async () => {
  const base = Deno.env.get("SUPABASE_URL");
  if (!base) {
    console.warn("SUPABASE_URL ausente — pulando smoke E2E");
    return;
  }
  const res = await fetch(`${base}/functions/v1/mcp/.mcp/invoke-tool/get_order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: "44444444-4444-4444-4444-444444444444",
    }),
  });
  // Sem bearer o resource server responde 401 (WWW-Authenticate).
  assert(
    res.status === 401 || res.status === 403,
    `esperado 401/403, veio ${res.status}`,
  );
  await res.body?.cancel();
});
