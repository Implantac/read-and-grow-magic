// Fase 1 — Enterprise AI Insight edge function
// Contract: { entityKey, value, delta, goal, horizon } -> { insight }
// Uses Lovable AI Gateway with gemini-3-flash-preview and returns a strict JSON.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  entityKey: string;
  value?: number | string;
  delta?: { day?: number; week?: number; month?: number; year?: number };
  goal?: number;
  horizon?: string;
  companyId?: string;
}

const ENTITY_HINTS: Record<string, { agent: string; hint: string }> = {
  revenue: { agent: "CFO", hint: "Faturamento consolidado. Investigar mix de produtos, clientes que reduziram compras, sazonalidade." },
  gross_margin: { agent: "CFO", hint: "Margem bruta. Investigar CMV, descontos, política de preço." },
  accounts_receivable: { agent: "CFO", hint: "Contas a receber com aging. Priorizar cobrança > 30d." },
  accounts_payable: { agent: "CFO", hint: "Contas a pagar por vencimento. Antecipar com desconto quando viável." },
  cash_position: { agent: "CFO", hint: "Saldo consolidado. Revisar previsão 30d." },
  wms_occupancy: { agent: "COO", hint: "Ocupação de armazém. Slotting ABC, remover SKUs lentos." },
  wms_sla: { agent: "COO", hint: "SLA de tarefas WMS. Balancear picking." },
  oee: { agent: "COO", hint: "OEE de produção. Reduzir setup, atacar paradas." },
  pipeline_amount: { agent: "CRO", hint: "Pipeline comercial em R$. Acionar leads maduros." },
  conversion_rate: { agent: "CRO", hint: "Conversão do funil. Aplicar playbook, revisar objeções." },
  churn_rate: { agent: "CRO", hint: "Churn de clientes. Ativar retenção CS." },
  nfe_rejected: { agent: "COO", hint: "NF-e rejeitadas. Corrigir cadastro/regras fiscais." },
};

async function callGateway(prompt: string, system: string): Promise<any> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`gateway ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    if (!body.entityKey) {
      return new Response(JSON.stringify({ error: "entityKey required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hint = ENTITY_HINTS[body.entityKey] ?? { agent: "CTO", hint: "Indicador genérico." };
    const system = `Você é um consultor Enterprise ${hint.agent} de ERP. Responda SEMPRE em JSON válido no schema:
{
 "root_cause": string (1-2 frases, PT-BR),
 "operational_impact": string (1 frase, PT-BR),
 "financial_impact": number (BRL, 0 se não estimável),
 "risk_score": number (0-100),
 "forecast": string (1 frase, PT-BR),
 "action_plan": [ { "title": string, "owner": string?, "due": string? } ] (3-5 itens),
 "automations": [ { "label": string, "action": string } ] (0-3 itens)
}
Sem markdown, sem texto fora do JSON.`;

    const prompt = `Indicador: ${body.entityKey} (${hint.hint})
Valor atual: ${body.value ?? "N/A"}
Deltas: ${JSON.stringify(body.delta ?? {})}
Meta: ${body.goal ?? "N/A"}
Horizonte de análise: ${body.horizon ?? "month"}
Explique O QUE está acontecendo, POR QUE está acontecendo e O QUE fazer agora.`;

    let insight;
    try {
      insight = await callGateway(prompt, system);
    } catch (e) {
      // Fallback determinístico se AI indisponível
      const dm = body.delta?.month ?? 0;
      insight = {
        root_cause: `${body.entityKey} apresenta variação de ${dm.toFixed(1)}% no mês.`,
        operational_impact: "Análise IA indisponível no momento — usando modo narrativa.",
        financial_impact: 0,
        risk_score: Math.abs(dm) > 10 ? 60 : 30,
        forecast: "Sem previsão gerada.",
        action_plan: [
          { title: "Revisar dados de origem" },
          { title: "Consultar Cérebro para análise contextual" },
        ],
        automations: [],
      };
    }

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
