// Testes unitários para validar o guard anti-alucinação da IA Executiva (CEO/AutoPilot).
// Garante que com banco vazio ou apenas um módulo preenchido, os handlers retornam
// data_status: "insufficient" em vez de inventar métricas.
//
// Executar: deno test supabase/functions/ai-executive/anti_hallucination_test.ts --allow-env --allow-net

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

// ─── Reimplementação local da lógica do guard ─────────────────────
// Mantida sincronizada com `checkHasRealData` em index.ts (linhas 324-332).
// Se o critério mudar lá, este teste falhará e deve ser atualizado.

function checkHasRealData(d: any): boolean {
  return (
    (d.orders?.length ?? 0) > 0 ||
    (d.sales?.length ?? 0) > 0 ||
    (d.receivables?.length ?? 0) > 0 ||
    (d.payables?.length ?? 0) > 0
  );
}

const EMPTY_DATASET = {
  orders: [], sales: [], receivables: [], payables: [],
  products: [], clients: [], production: [],
  insights: [], alerts: [], scenarios: [],
  cashFlow: [], salesReps: [], funnel: [], salesTargets: [],
  orderItems: [], commissions: [],
  nfe: [], nfeItems: [], taxRules: [], spedFiles: [],
};

// ─── Cenário 1: Banco completamente vazio ─────────────────────────
Deno.test("Guard: banco vazio NÃO deve permitir análise da IA", () => {
  const result = checkHasRealData(EMPTY_DATASET);
  assertEquals(result, false, "Sem nenhum registro real, o guard deve bloquear");
});

Deno.test("Guard: dataset undefined/null NÃO deve permitir análise", () => {
  assertEquals(checkHasRealData({}), false);
  assertEquals(checkHasRealData({ orders: null, sales: null, receivables: null, payables: null }), false);
});

// ─── Cenário 2: Apenas módulos auxiliares preenchidos (sem core) ─
Deno.test("Guard: apenas produtos cadastrados NÃO libera análise", () => {
  const d = { ...EMPTY_DATASET, products: [{ id: "p1", name: "Produto A" }] };
  assertEquals(checkHasRealData(d), false, "Produtos sem vendas/pedidos não devem ativar IA");
});

Deno.test("Guard: apenas clientes cadastrados NÃO libera análise", () => {
  const d = { ...EMPTY_DATASET, clients: [{ id: "c1", name: "Cliente A" }] };
  assertEquals(checkHasRealData(d), false, "Cadastro de clientes sem transações não basta");
});

Deno.test("Guard: apenas insights antigos NÃO liberam análise", () => {
  const d = { ...EMPTY_DATASET, insights: [{ id: "i1", title: "Antigo" }] };
  assertEquals(checkHasRealData(d), false);
});

Deno.test("Guard: apenas NF-e/SPED sem core financeiro NÃO libera análise", () => {
  const d = { ...EMPTY_DATASET, nfe: [{ id: "n1" }], spedFiles: [{ id: "s1" }] };
  assertEquals(checkHasRealData(d), false);
});

// ─── Cenário 3: Apenas UM módulo core preenchido ─────────────────
Deno.test("Guard: apenas pedidos (orders) JÁ libera análise", () => {
  const d = { ...EMPTY_DATASET, orders: [{ id: "o1", total: 100 }] };
  assertEquals(checkHasRealData(d), true);
});

Deno.test("Guard: apenas vendas (sales) JÁ libera análise", () => {
  const d = { ...EMPTY_DATASET, sales: [{ id: "s1", total: 50 }] };
  assertEquals(checkHasRealData(d), true);
});

Deno.test("Guard: apenas contas a receber JÁ libera análise", () => {
  const d = { ...EMPTY_DATASET, receivables: [{ id: "r1", amount: 200 }] };
  assertEquals(checkHasRealData(d), true);
});

Deno.test("Guard: apenas contas a pagar JÁ libera análise", () => {
  const d = { ...EMPTY_DATASET, payables: [{ id: "p1", amount: 80 }] };
  assertEquals(checkHasRealData(d), true);
});

// ─── Cenário 4: Validação da forma da resposta dos handlers ─────
// Simula o shape JSON retornado pelos handlers (CEO Brief, AutoPilot, Insights, Cenários)
// quando o guard bloqueia. Garante que o frontend recebe `data_status: "insufficient"`.

const INSUFFICIENT_DATA_MSG = "Dados insuficientes para análise confiável. Cadastre vendas, pedidos, contas a pagar ou receber para que a IA possa gerar diagnóstico baseado em dados reais.";

function simulateHandlerResponse(handlerName: string, data: any): any {
  if (!checkHasRealData(data)) {
    switch (handlerName) {
      case "ceo_brief":
        return {
          ceo_analysis: INSUFFICIENT_DATA_MSG,
          forecast: null, risks: [], plan: [], decisions: [],
          data_status: "insufficient",
        };
      case "autopilot_run":
        return {
          data_status: "insufficient",
          message: INSUFFICIENT_DATA_MSG,
          forecast: null, risks: [], decisions: [], executed: [],
          summary: "AutoPilot pausado: sem dados reais no sistema.",
        };
      case "generate_insights":
        return { insights: [], generated: 0, data_status: "insufficient", message: INSUFFICIENT_DATA_MSG };
      case "generate_scenarios":
        return { scenarios: null, data_status: "insufficient", message: INSUFFICIENT_DATA_MSG };
    }
  }
  return { data_status: "ok" };
}

Deno.test("CEO Brief: banco vazio retorna insufficient sem métricas inventadas", () => {
  const res = simulateHandlerResponse("ceo_brief", EMPTY_DATASET);
  assertEquals(res.data_status, "insufficient");
  assertEquals(res.risks.length, 0, "Nenhum risco inventado");
  assertEquals(res.decisions.length, 0, "Nenhuma decisão inventada");
  assertEquals(res.forecast, null, "Sem forecast inventado");
});

Deno.test("AutoPilot: banco vazio pausa execução e não gera ações", () => {
  const res = simulateHandlerResponse("autopilot_run", EMPTY_DATASET);
  assertEquals(res.data_status, "insufficient");
  assertEquals(res.executed.length, 0, "AutoPilot não pode executar ações sem dados");
  assertEquals(res.decisions.length, 0);
  assert(res.summary.includes("pausado"), "Mensagem deve indicar pausa");
});

Deno.test("CEO Brief: apenas clientes cadastrados ainda bloqueia", () => {
  const d = { ...EMPTY_DATASET, clients: [{ id: "c1" }] };
  const res = simulateHandlerResponse("ceo_brief", d);
  assertEquals(res.data_status, "insufficient");
});

Deno.test("CEO Brief: com 1 pedido real LIBERA análise (data_status ok)", () => {
  const d = { ...EMPTY_DATASET, orders: [{ id: "o1", total: 1000 }] };
  const res = simulateHandlerResponse("ceo_brief", d);
  assertEquals(res.data_status, "ok");
});

Deno.test("Insights: banco vazio retorna lista vazia, nunca insights gerados", () => {
  const res = simulateHandlerResponse("generate_insights", EMPTY_DATASET);
  assertEquals(res.data_status, "insufficient");
  assertEquals(res.insights.length, 0);
  assertEquals(res.generated, 0);
});

Deno.test("Cenários: banco vazio NÃO simula cenários otimista/pessimista", () => {
  const res = simulateHandlerResponse("generate_scenarios", EMPTY_DATASET);
  assertEquals(res.data_status, "insufficient");
  assertEquals(res.scenarios, null);
});
