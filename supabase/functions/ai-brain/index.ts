// deno-lint-ignore-file no-explicit-any
// ============================================================
// AI BRAIN — Cérebro Nativo do ERP
// Orquestrador multi-agente + memória + decisões com guardrails
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const MODEL = "google/gemini-2.5-flash";
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ─────────────────────────────────────────────
// AGENT ORCHESTRATION — invoca agentes em paralelo
// ─────────────────────────────────────────────
async function invokeAgent(name: string, body: any, authHeader?: string) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader || `Bearer ${SERVICE_ROLE}`,
        apikey: SERVICE_ROLE,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { error: `${name} ${res.status}` };
    return await res.json();
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

async function gatherSnapshot(authHeader?: string) {
  const [exec, fin, finIntel] = await Promise.allSettled([
    invokeAgent("ai-executive", { action: "dashboard", months: 6 }, authHeader),
    invokeAgent("financial-insights", {}, authHeader),
    invokeAgent("financial-intelligence?action=compute", {}, authHeader),
  ]);
  return {
    executive: exec.status === "fulfilled" ? exec.value : { error: "failed" },
    financial_insights: fin.status === "fulfilled" ? fin.value : { error: "failed" },
    financial_intelligence: finIntel.status === "fulfilled" ? finIntel.value : { error: "failed" },
  };
}

// ─────────────────────────────────────────────
// MEMORY
// ─────────────────────────────────────────────
async function loadMemories(userId?: string, limit = 30) {
  const q = admin
    .from("ai_brain_memory")
    .select("category,key,value,importance,scope,updated_at")
    .order("importance", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (userId) q.or(`user_id.eq.${userId},scope.in.(global,company)`);
  const { data } = await q;
  return data || [];
}

async function saveMemory(m: {
  user_id?: string;
  scope?: string;
  category: string;
  key: string;
  value: any;
  importance?: number;
  source?: string;
}) {
  await admin.from("ai_brain_memory").upsert(
    {
      user_id: m.user_id || null,
      scope: m.scope || (m.user_id ? "user" : "global"),
      category: m.category,
      key: m.key,
      value: m.value,
      importance: m.importance ?? 5,
      source: m.source || "agent:brain",
    },
    { onConflict: "scope,user_id,key" },
  );
}

// ─────────────────────────────────────────────
// LLM CALL — synthesis with structured JSON
// ─────────────────────────────────────────────
async function callLLM(systemPrompt: string, userPrompt: string) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM ${res.status}: ${text}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch {
    return { raw: content };
  }
}

// ─────────────────────────────────────────────
// GUARDRAILS — quais decisões podem auto-executar
// ─────────────────────────────────────────────
// (SAFE_ACTIONS defined below)

// ─────────────────────────────────────────────
// ACTION EXECUTOR — efeitos reais
// ─────────────────────────────────────────────
const SAFE_ACTIONS = new Set([
  "create_alert",
  "notify_user",
  "log_observation",
  "save_memory",
  "generate_report",
]);

async function executeAction(action: any, userId?: string) {
  const tool = action?.tool;
  const p = action?.params || {};
  try {
    switch (tool) {
      case "create_alert": {
        const { data, error } = await admin.from("financial_alerts").insert({
          alert_type: p.alert_type || "brain_insight",
          severity: p.severity || "medium",
          title: p.title || "Alerta do Cérebro",
          description: p.description || "",
          entity_type: p.entity_type || null,
          entity_id: p.entity_id || null,
        }).select().single();
        if (error) throw error;
        return { ok: true, alert_id: data.id };
      }
      case "notify_user": {
        const { data, error } = await admin.from("notifications").insert({
          user_id: userId || null,
          type: p.type || "info",
          title: p.title || "Cérebro do ERP",
          description: p.description || "",
          module: p.module || "Cérebro",
        }).select().single();
        if (error) throw error;
        return { ok: true, notification_id: data.id };
      }
      case "save_memory": {
        await saveMemory({
          user_id: userId,
          category: p.category || "fact",
          key: p.key || `auto_${Date.now()}`,
          value: p.value,
          importance: p.importance ?? 5,
        });
        return { ok: true };
      }
      case "log_observation":
      case "generate_report":
        return { ok: true, note: `${tool} registrado` };
      default:
        return { ok: false, note: `tool ${tool} requer execução manual` };
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

function classifyDecision(d: any) {
  const impact = (d.impact_level || "medium").toLowerCase();
  const risk = (d.risk_level || "low").toLowerCase();
  const action = d.proposed_action?.tool || "";
  const autoExecutable =
    SAFE_ACTIONS.has(action) && risk === "low" && impact !== "critical";
  return {
    auto_executable: autoExecutable,
    requires_approval: !autoExecutable,
    status: autoExecutable ? "auto_executed" : "pending",
  };
}

const BRAIN_SYSTEM = `Você é o CÉREBRO NATIVO do ERP — núcleo estratégico que orquestra TODOS os módulos.

PERSONALIDADE:
- Consultor sênior + COO + CFO digital.
- Direto, estratégico, focado em RESULTADO e DECISÃO.
- Fala em português brasileiro, sem jargão técnico desnecessário.


REGRAS CRÍTICAS:
- DADOS REAIS APENAS. NUNCA invente números. Se faltar dado, diga "dados insuficientes".
- Cite valores exatos como evidência (em **R$**, **%**, **datas**).
- Use emojis de status: ✅ ⚠️ 🔴 🔵 💡 📈 📉
- Sempre proponha AÇÕES executáveis, não só análises.

RETORNE SEMPRE JSON VÁLIDO no formato:
{
  "veredicto": "1-2 frases impactantes resumindo a situação",
  "saude_geral": "ok|alerta|critico",
  "kpis_chave": [{"nome":"...","valor":"...","status":"ok|alerta|critico"}],
  "riscos": [{"titulo":"...","impacto":"alto|medio|baixo","acao":"..."}],
  "oportunidades": [{"titulo":"...","valor_estimado":"R$ X","acao":"..."}],
  "decisoes": [
    {
      "module": "financeiro|comercial|producao|fiscal|estoque|global",
      "decision_type": "alert|recommendation|action|automation",
      "title": "...",
      "rationale": "por que (com evidências)",
      "impact_level": "low|medium|high|critical",
      "risk_level": "low|medium|high",
      "confidence": 0.85,
      "evidence": {"dados_usados":"..."},
      "proposed_action": {"tool":"create_alert|notify_user|log_observation|save_memory|generate_report|<custom>","params":{}}
    }
  ],
  "memorias_a_salvar": [{"category":"pattern|fact","key":"...","value":"...","importance":7}]
}`;

// ─────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────
async function handleAnalyze(userId: string | undefined, authHeader?: string, mode = "analyze") {
  const t0 = Date.now();
  const { data: run } = await admin
    .from("ai_brain_runs")
    .insert({
      user_id: userId || null,
      trigger: "manual",
      mode,
      agents_used: ["ai-executive", "financial-insights", "financial-intelligence"],
      status: "running",
    })
    .select()
    .single();

  try {
    const [snapshot, memories] = await Promise.all([
      gatherSnapshot(authHeader),
      loadMemories(userId, 20),
    ]);

    const userPrompt = `# CONTEXTO DO NEGÓCIO (dados reais agora)

## Memórias de longo prazo
${JSON.stringify(memories, null, 2)}

## Snapshot dos agentes
### Executivo (KPIs, vendas, clientes)
${JSON.stringify(snapshot.executive?.kpis || snapshot.executive, null, 2).slice(0, 4000)}

### Insights financeiros
${JSON.stringify(snapshot.financial_insights, null, 2).slice(0, 2000)}

### Inteligência financeira (score, alertas)
${JSON.stringify(snapshot.financial_intelligence, null, 2).slice(0, 2000)}

# TAREFA
Analise tudo, gere veredicto, riscos, oportunidades e DECISÕES executáveis. Marque o risco e impacto corretamente.
Modo: ${mode === "autopilot" ? "AUTOPILOT — sugira ações de baixo risco que podem ser auto-executadas" : "ANÁLISE — foque em diagnóstico e recomendações"}.`;

    const structured = await callLLM(BRAIN_SYSTEM, userPrompt);

    // Persiste decisões com guardrails
    const decisions = Array.isArray(structured.decisoes) ? structured.decisoes : [];
    for (const d of decisions) {
      const g = classifyDecision(d);
      let executionResult: any = null;
      if (g.auto_executable) {
        executionResult = await executeAction(d.proposed_action, userId);
      }
      const { error } = await admin.from("ai_brain_decisions").insert({
        run_id: run?.id,
        user_id: userId || null,
        module: d.module || "global",
        decision_type: d.decision_type || "recommendation",
        title: d.title || "Decisão sem título",
        rationale: d.rationale || "",
        impact_level: d.impact_level || "medium",
        risk_level: d.risk_level || "low",
        confidence: Number(d.confidence) || 0.7,
        evidence: d.evidence || {},
        proposed_action: d.proposed_action || {},
        auto_executable: g.auto_executable,
        requires_approval: g.requires_approval,
        status: g.status,
        executed_at: g.auto_executable ? new Date().toISOString() : null,
        execution_result: executionResult,
      });
      if (!error) createdCount++;
    }


    // Persiste memórias propostas
    const mems = Array.isArray(structured.memorias_a_salvar) ? structured.memorias_a_salvar : [];
    for (const m of mems) {
      try {
        await saveMemory({
          user_id: userId,
          category: m.category || "pattern",
          key: String(m.key || `mem_${Date.now()}`).slice(0, 200),
          value: m.value,
          importance: Number(m.importance) || 5,
        });
      } catch { /* ignore dup */ }
    }

    await admin
      .from("ai_brain_runs")
      .update({
        status: "completed",
        structured,
        synthesis: structured.veredicto || null,
        decisions_count: createdCount,
        duration_ms: Date.now() - t0,
      })
      .eq("id", run!.id);

    return {
      run_id: run?.id,
      structured,
      decisions_created: createdCount,
      memories_saved: mems.length,
      duration_ms: Date.now() - t0,
    };
  } catch (e: any) {
    await admin
      .from("ai_brain_runs")
      .update({ status: "failed", error: e?.message || String(e), duration_ms: Date.now() - t0 })
      .eq("id", run!.id);
    throw e;
  }
}

async function handleChat(userId: string | undefined, messages: any[], authHeader?: string) {
  const [snapshot, memories] = await Promise.all([
    gatherSnapshot(authHeader),
    loadMemories(userId, 15),
  ]);

  const ctx = `# CONTEXTO ATUAL DO NEGÓCIO
## Memórias relevantes
${JSON.stringify(memories.slice(0, 10), null, 2)}

## Snapshot resumido
KPIs: ${JSON.stringify(snapshot.executive?.kpis || {}, null, 2).slice(0, 1500)}
Score financeiro: ${JSON.stringify(snapshot.financial_intelligence?.score || {}, null, 2).slice(0, 500)}`;

  const sys = `Você é o CÉREBRO do ERP — consultor sênior do negócio. Use o contexto abaixo (dados REAIS) para responder com precisão. Cite números exatos quando relevante. Seja direto e proponha ações.

${ctx}`;

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: sys }, ...messages],
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { content: data?.choices?.[0]?.message?.content || "" };
}

async function handleApprove(decisionId: string, approve: boolean, userId?: string) {
  const { data: dec, error: e0 } = await admin
    .from("ai_brain_decisions").select("*").eq("id", decisionId).single();
  if (e0) throw e0;

  if (!approve) {
    const { data, error } = await admin.from("ai_brain_decisions")
      .update({ status: "rejected", approved_by: userId || null, approved_at: new Date().toISOString() })
      .eq("id", decisionId).select().single();
    if (error) throw error;
    return data;
  }

  // Approved → executa ação real
  const execResult = await executeAction(dec.proposed_action, userId);
  const { data, error } = await admin.from("ai_brain_decisions")
    .update({
      status: execResult.ok ? "executed" : "approved",
      approved_by: userId || null,
      approved_at: new Date().toISOString(),
      executed_at: execResult.ok ? new Date().toISOString() : null,
      execution_result: execResult,
    })
    .eq("id", decisionId).select().single();
  if (error) throw error;
  return data;
}


// ─────────────────────────────────────────────
// SERVER
// ─────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "analyze";
    const authHeader = req.headers.get("Authorization") || undefined;

    // Auth user (best effort)
    let userId: string | undefined;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await admin.auth.getUser(token);
      userId = data.user?.id;
    }

    let result: any;
    switch (action) {
      case "analyze":
        result = await handleAnalyze(userId, authHeader, "analyze");
        break;
      case "autopilot":
        result = await handleAnalyze(userId, authHeader, "autopilot");
        break;
      case "chat":
        result = await handleChat(userId, body.messages || [], authHeader);
        break;
      case "approve_decision":
        result = await handleApprove(body.decision_id, true, userId);
        break;
      case "reject_decision":
        result = await handleApprove(body.decision_id, false, userId);
        break;
      case "save_memory":
        await saveMemory({ ...body.memory, user_id: userId });
        result = { ok: true };
      case "list_memories":
        result = { memories: await loadMemories(userId, 100) };
        break;
      case "execute_decision": {
        const { data: dec, error: e0 } = await admin
          .from("ai_brain_decisions").select("*").eq("id", body.decision_id).single();
        if (e0) throw e0;
        const r = await executeAction(dec.proposed_action, userId);
        await admin.from("ai_brain_decisions").update({
          status: r.ok ? "executed" : "approved",
          executed_at: r.ok ? new Date().toISOString() : null,
          execution_result: r,
        }).eq("id", body.decision_id);
        result = r;
        break;
      }
      case "cron_run":
        result = await handleAnalyze(undefined, undefined, "autopilot");
        break;

      default:
        return new Response(JSON.stringify({ error: `unknown action ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[ai-brain] error", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
