// Testes de integração para handlers da edge function `ai-executive`.
// Invoca `handleCEOBrief` e `handleAutoPilotRun` com um mock do supabase client
// e valida o JSON real produzido (Response body) contém data_status: "insufficient"
// quando o guard anti-alucinação bloqueia.
//
// Executar: deno test supabase/functions/ai-executive/integration_test.ts --allow-env --allow-net

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleCEOBrief, handleAutoPilotRun } from "./index.ts";

// ─── Mock do supabase client ──────────────────────────────────────
// Implementa apenas os métodos da chain usados em fetchAllData:
//   .from(table).select(...).order(...).limit(...).eq(...).then(cb).catch(cb)
// Cada terminal (limit/order/eq) resolve para { data, error }.
// Para inserts (ai_action_logs, ai_executive_alerts) implementa .insert().

interface FromConfig {
  data?: any[];
  error?: any;
}

function createMockSupabase(tableData: Record<string, any[]> = {}) {
  const inserts: Array<{ table: string; row: any }> = [];

  function makeQuery(table: string): any {
    const result = { data: tableData[table] ?? [], error: null };
    const chain: any = {
      select: () => chain,
      order: () => chain,
      limit: () => chain,
      eq: () => chain,
      gte: () => chain,
      lte: () => chain,
      single: () => Promise.resolve(result),
      // Faz a chain ser "thenable" — `await chain` resolve para `{ data, error }`
      then: (onFulfilled: any, onRejected?: any) =>
        Promise.resolve(result).then(onFulfilled, onRejected),
      catch: (onRejected: any) => Promise.resolve(result).catch(onRejected),
    };
    return chain;
  }

  return {
    from: (table: string) => ({
      ...makeQuery(table),
      insert: (row: any) => {
        inserts.push({ table, row });
        return Promise.resolve({ data: row, error: null });
      },
      upsert: (row: any) => {
        inserts.push({ table, row });
        return Promise.resolve({ data: row, error: null });
      },
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
    _inserts: inserts,
  };
}

const corsHeaders = { "Access-Control-Allow-Origin": "*" };

// ─── CEO Brief ────────────────────────────────────────────────────

Deno.test("Integration: handleCEOBrief com banco vazio retorna data_status='insufficient'", async () => {
  const supabase = createMockSupabase(); // todas tabelas vazias
  const response = await handleCEOBrief(supabase, "fake-key", corsHeaders);

  assertEquals(response.status, 200);
  const body = await response.json();

  assertEquals(body.data_status, "insufficient", "JSON deve sinalizar dados insuficientes");
  assertEquals(body.risks, [], "Sem riscos inventados");
  assertEquals(body.plan, [], "Sem plano inventado");
  assertEquals(body.decisions, [], "Sem decisões inventadas");
  assert(
    body.ceo_analysis.toLowerCase().includes("insuficiente"),
    `ceo_analysis deve mencionar insuficiência. Recebido: ${body.ceo_analysis}`,
  );
  // ceo_structured deve ter arrays vazios
  assertEquals(body.ceo_structured?.kpis ?? [], []);
  assertEquals(body.ceo_structured?.riscos ?? [], []);
  assertEquals(body.ceo_structured?.decisoes ?? [], []);
});

Deno.test("Integration: handleCEOBrief com apenas clientes (sem core) ainda bloqueia", async () => {
  const supabase = createMockSupabase({
    clients: [{ id: "c1", name: "Cliente Teste", total_purchases: 0 }],
  });
  const response = await handleCEOBrief(supabase, "fake-key", corsHeaders);
  const body = await response.json();

  assertEquals(body.data_status, "insufficient");
  assertEquals(body.decisions, []);
});

Deno.test("Integration: handleCEOBrief com apenas produtos cadastrados ainda bloqueia", async () => {
  const supabase = createMockSupabase({
    products: [{ id: "p1", name: "Produto X", price: 100, stock_current: 5 }],
  });
  const response = await handleCEOBrief(supabase, "fake-key", corsHeaders);
  const body = await response.json();

  assertEquals(body.data_status, "insufficient");
});

// ─── AutoPilot ────────────────────────────────────────────────────

Deno.test("Integration: handleAutoPilotRun com banco vazio retorna data_status='insufficient'", async () => {
  const supabase = createMockSupabase();
  const response = await handleAutoPilotRun(supabase, "fake-key", corsHeaders);

  assertEquals(response.status, 200);
  const body = await response.json();

  assertEquals(body.data_status, "insufficient");
  assertEquals(body.executed, [], "AutoPilot não pode executar ações sem dados");
  assertEquals(body.decisions, []);
  assertEquals(body.risks, []);
  assertEquals(body.forecast, null);
  assert(
    body.summary?.toLowerCase().includes("pausado"),
    `summary deve indicar pausa. Recebido: ${body.summary}`,
  );
});

Deno.test("Integration: handleAutoPilotRun NÃO insere alertas/logs quando bloqueado", async () => {
  const supabase = createMockSupabase();
  await handleAutoPilotRun(supabase, "fake-key", corsHeaders);

  // Nenhum INSERT em ai_action_logs ou ai_executive_alerts deve ter ocorrido
  const sideEffects = supabase._inserts.filter(
    (i) => i.table === "ai_action_logs" || i.table === "ai_executive_alerts",
  );
  assertEquals(sideEffects.length, 0, "AutoPilot não pode gerar efeitos colaterais sem dados reais");
});

Deno.test("Integration: handleAutoPilotRun com apenas insights antigos (sem core) ainda bloqueia", async () => {
  const supabase = createMockSupabase({
    insights: [{ id: "old", title: "Insight antigo", status: "active" }],
    alerts: [{ id: "a1", title: "Alerta antigo" }],
  });
  const response = await handleAutoPilotRun(supabase, "fake-key", corsHeaders);
  const body = await response.json();

  assertEquals(body.data_status, "insufficient");
  assertEquals(body.executed, []);
});

// ─── Sanity: shape do Response ────────────────────────────────────

Deno.test("Integration: handlers retornam Response com Content-Type JSON", async () => {
  const supabase = createMockSupabase();
  const ceoResp = await handleCEOBrief(supabase, "fake-key", corsHeaders);
  const apResp = await handleAutoPilotRun(supabase, "fake-key", corsHeaders);

  assert(ceoResp.headers.get("Content-Type")?.includes("application/json"));
  assert(apResp.headers.get("Content-Type")?.includes("application/json"));
});
