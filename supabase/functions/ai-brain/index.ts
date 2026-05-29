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
  const [exec, fin, finIntel, com, prod] = await Promise.allSettled([
    invokeAgent("ai-executive", { action: "dashboard", months: 6 }, authHeader),
    invokeAgent("financial-insights", {}, authHeader),
    invokeAgent("financial-intelligence?action=compute", {}, authHeader),
    invokeAgent("ai-commercial", { action: "overview" }, authHeader),
    invokeAgent("ai-production", { action: "kpis" }, authHeader),
  ]);
  const pick = (r: PromiseSettledResult<any>) =>
    r.status === "fulfilled" ? r.value : { error: "failed" };
  return {
    executive: pick(exec),
    financial_insights: pick(fin),
    financial_intelligence: pick(finIntel),
    commercial: pick(com),
    production: pick(prod),
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
  "create_follow_up_task",
  "escalate_alert",
  "send_pix_reminder",
]);

// Tools que NUNCA podem ser auto-executadas, mesmo low-risk
const RISKY_ACTIONS = new Set([
  "block_client",
  "reschedule_production_order",
  "request_quotation",
  "create_purchase_order",
  "release_order_block",
  "mark_invoice_paid",
  "assign_sales_rep",
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
      case "escalate_alert": {
        const { data, error } = await admin.from("financial_alerts").insert({
          alert_type: p.alert_type || "brain_escalation",
          severity: "critical",
          title: p.title || "🔴 Escalação do Cérebro",
          description: p.description || "",
          entity_type: p.entity_type || null,
          entity_id: p.entity_id || null,
        }).select().single();
        if (error) throw error;
        // notifica admins
        const { data: admins } = await admin.from("user_roles").select("user_id").eq("role", "admin");
        for (const a of admins || []) {
          await admin.from("notifications").insert({
            user_id: a.user_id,
            type: "critical",
            title: `🔴 ${p.title || "Escalação crítica do Cérebro"}`,
            description: p.description || "",
            module: "Cérebro",
          });
        }
        return { ok: true, alert_id: data.id, admins_notified: (admins || []).length };
      }
      case "notify_user": {
        const { data, error } = await admin.from("notifications").insert({
          user_id: p.user_id || userId || null,
          type: p.type || "info",
          title: p.title || "Cérebro do ERP",
          description: p.description || "",
          module: p.module || "Cérebro",
        }).select().single();
        if (error) throw error;
        return { ok: true, notification_id: data.id };
      }
      case "send_pix_reminder": {
        // Cobrança suave: notifica + cria alerta financeiro
        const desc = p.description || `Lembrete de PIX pendente${p.amount ? ` — R$ ${p.amount}` : ""}`;
        const { data: admins } = await admin.from("user_roles").select("user_id").in("role", ["admin", "manager"]);
        for (const a of admins || []) {
          await admin.from("notifications").insert({
            user_id: a.user_id,
            type: "warning",
            title: p.title || "💸 Lembrete de cobrança PIX",
            description: desc,
            module: "Financeiro",
          });
        }
        return { ok: true, recipients: (admins || []).length };
      }
      case "create_follow_up_task": {
        const { data, error } = await admin.from("follow_up_tasks").insert({
          client_id: p.client_id || null,
          client_name: p.client_name || null,
          sales_rep_id: p.sales_rep_id || null,
          action_type: p.action_type || "follow_up",
          title: p.title || "Follow-up sugerido pelo Cérebro",
          description: p.description || "",
          scheduled_date: p.scheduled_date || new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10),
          priority: p.priority || "medium",
          channel: p.channel || "whatsapp",
          suggested_message: p.suggested_message || null,
          ai_generated: true,
          status: "pending",
        }).select().single();
        if (error) throw error;
        return { ok: true, task_id: data.id };
      }
      case "block_client": {
        if (!p.client_id) return { ok: false, error: "client_id obrigatório" };
        const { error: e1 } = await admin.from("clients")
          .update({ status: "blocked" })
          .eq("id", p.client_id);
        if (e1) throw e1;
        // registra histórico via order_blocks se houver order_id
        if (p.order_id) {
          await admin.from("order_blocks").insert({
            order_id: p.order_id,
            block_type: "credit",
            block_reason: p.reason || "Bloqueio recomendado pelo Cérebro",
            description: p.description || "",
            blocked_by: "ai-brain",
            status: "active",
            approval_level: "manager",
          });
        }
        return { ok: true, client_id: p.client_id };
      }
      case "reschedule_production_order": {
        if (!p.order_id || !p.new_due_date) return { ok: false, error: "order_id e new_due_date obrigatórios" };
        const { data, error } = await admin.from("production_orders")
          .update({ due_date: p.new_due_date, notes: `[Cérebro] ${p.reason || "Replanejamento"}` })
          .eq("id", p.order_id).select().single();
        if (error) throw error;
        return { ok: true, order_id: data.id, new_due_date: p.new_due_date };
      }
      case "request_quotation": {
        return { ok: true, note: "Cotação registrada como sugestão — compras deve criar manualmente" };
      }
      case "create_purchase_order": {
        if (!p.supplier_name) return { ok: false, error: "supplier_name obrigatório" };
        const number = `PO-AI-${Date.now().toString().slice(-8)}`;
        const { data, error } = await admin.from("purchase_orders").insert({
          number,
          supplier_id: p.supplier_id || null,
          supplier_name: p.supplier_name,
          date: new Date().toISOString(),
          expected_delivery: p.expected_delivery || null,
          total: p.total || 0,
          subtotal: p.subtotal || p.total || 0,
          payment_terms: p.payment_terms || null,
          status: "draft",
          priority: p.priority || "medium",
          buyer_name: "Cérebro IA",
          notes: `[Cérebro] ${p.notes || "PO sugerida"}`,
        }).select().single();
        if (error) throw error;
        return { ok: true, po_id: data.id, number };
      }
      case "release_order_block": {
        if (!p.block_id) return { ok: false, error: "block_id obrigatório" };
        const { data, error } = await admin.from("order_blocks").update({
          status: "released",
          released_by: "ai-brain",
          released_at: new Date().toISOString(),
          release_justification: p.justification || "Liberado pelo Cérebro",
        }).eq("id", p.block_id).select().single();
        if (error) throw error;
        return { ok: true, block_id: data.id };
      }
      case "mark_invoice_paid": {
        if (!p.receivable_id) return { ok: false, error: "receivable_id obrigatório" };
        const now = new Date().toISOString();
        const { data, error } = await admin.from("accounts_receivable").update({
          status: "paid",
          payment_date: p.payment_date || now,
          paid_amount: p.paid_amount || p.amount || null,
          open_amount: 0,
          notes: `[Cérebro] ${p.notes || "Baixa manual sugerida"}`,
        }).eq("id", p.receivable_id).select().single();
        if (error) throw error;
        return { ok: true, receivable_id: data.id };
      }
      case "assign_sales_rep": {
        if (!p.client_id || !p.sales_rep_id) return { ok: false, error: "client_id e sales_rep_id obrigatórios" };
        const { data, error } = await admin.from("clients").update({
          sales_rep_id: p.sales_rep_id,
          commercial_notes: p.notes ? `[Cérebro] ${p.notes}` : null,
        }).eq("id", p.client_id).select().single();
        if (error) throw error;
        return { ok: true, client_id: data.id, sales_rep_id: p.sales_rep_id };
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
      "proposed_action": {"tool":"<tool_name>","params":{...}}
    }
  ],
  "memorias_a_salvar": [{"category":"pattern|fact","key":"...","value":"...","importance":7}]
}

CATÁLOGO DE TOOLS DISPONÍVEIS:
- create_alert (params: alert_type, severity, title, description, entity_type?, entity_id?) — cria alerta financeiro [SAFE]
- escalate_alert (title, description) — alerta crítico + notifica todos admins [SAFE]
- notify_user (user_id?, title, description, type?, module?) — envia notificação [SAFE]
- send_pix_reminder (title?, description, amount?) — alerta cobrança PIX para financeiro [SAFE]
- create_follow_up_task (client_id, client_name, title, description, scheduled_date, priority?, channel?, suggested_message?) — cria tarefa de follow-up comercial [SAFE]
- save_memory (category, key, value, importance) — salva conhecimento de longo prazo [SAFE]
- log_observation (description) — registra observação [SAFE]
- generate_report (description) — sinaliza geração de relatório [SAFE]
- block_client (client_id, reason, order_id?, description?) — BLOQUEIA cliente por crédito [REQUER APROVAÇÃO]
- reschedule_production_order (order_id, new_due_date, reason) — reagenda OP [REQUER APROVAÇÃO]
- request_quotation (description) — sugere cotação ao setor de compras [REQUER APROVAÇÃO]
- create_purchase_order (supplier_name, supplier_id?, total, expected_delivery?, notes?) — cria PO em rascunho [REQUER APROVAÇÃO]
- release_order_block (block_id, justification) — libera bloqueio comercial [REQUER APROVAÇÃO]
- mark_invoice_paid (receivable_id, paid_amount?, payment_date?, notes?) — dá baixa em título a receber [REQUER APROVAÇÃO]
- assign_sales_rep (client_id, sales_rep_id, notes?) — atribui vendedor a cliente [REQUER APROVAÇÃO]`;

// Schema das tools para o chat (OpenAI tool calling)
const BRAIN_TOOLS = [
  { type: "function", function: { name: "create_alert", description: "Cria alerta financeiro", parameters: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, severity: { type: "string", enum: ["low", "medium", "high", "critical"] }, alert_type: { type: "string" } }, required: ["title", "description"] } } },
  { type: "function", function: { name: "escalate_alert", description: "Cria alerta crítico e notifica todos admins. Use só quando algo é realmente urgente", parameters: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"] } } },
  { type: "function", function: { name: "notify_user", description: "Envia notificação ao usuário atual", parameters: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, module: { type: "string" } }, required: ["title", "description"] } } },
  { type: "function", function: { name: "send_pix_reminder", description: "Cria lembrete de cobrança PIX para o time financeiro", parameters: { type: "object", properties: { description: { type: "string" }, amount: { type: "number" }, title: { type: "string" } }, required: ["description"] } } },
  { type: "function", function: { name: "create_follow_up_task", description: "Cria tarefa de follow-up comercial para um cliente", parameters: { type: "object", properties: { client_id: { type: "string" }, client_name: { type: "string" }, title: { type: "string" }, description: { type: "string" }, scheduled_date: { type: "string", description: "YYYY-MM-DD" }, channel: { type: "string", enum: ["whatsapp", "email", "phone", "visit"] }, priority: { type: "string", enum: ["low", "medium", "high"] }, suggested_message: { type: "string" } }, required: ["title", "description"] } } },
  { type: "function", function: { name: "save_memory", description: "Salva conhecimento de longo prazo", parameters: { type: "object", properties: { category: { type: "string" }, key: { type: "string" }, value: {}, importance: { type: "number" } }, required: ["category", "key", "value"] } } },
  { type: "function", function: { name: "block_client", description: "BLOQUEIA cliente por crédito. Ação destrutiva — sempre vai para aprovação humana", parameters: { type: "object", properties: { client_id: { type: "string" }, reason: { type: "string" }, description: { type: "string" } }, required: ["client_id", "reason"] } } },
  { type: "function", function: { name: "reschedule_production_order", description: "Reagenda OP. Vai para aprovação humana", parameters: { type: "object", properties: { order_id: { type: "string" }, new_due_date: { type: "string", description: "YYYY-MM-DD" }, reason: { type: "string" } }, required: ["order_id", "new_due_date", "reason"] } } },
  { type: "function", function: { name: "create_purchase_order", description: "Cria ordem de compra em rascunho. Vai para aprovação humana", parameters: { type: "object", properties: { supplier_name: { type: "string" }, supplier_id: { type: "string" }, total: { type: "number" }, expected_delivery: { type: "string" }, notes: { type: "string" } }, required: ["supplier_name"] } } },
  { type: "function", function: { name: "release_order_block", description: "Libera bloqueio comercial de um pedido. Vai para aprovação humana", parameters: { type: "object", properties: { block_id: { type: "string" }, justification: { type: "string" } }, required: ["block_id", "justification"] } } },
  { type: "function", function: { name: "mark_invoice_paid", description: "Dá baixa em título a receber. Vai para aprovação humana", parameters: { type: "object", properties: { receivable_id: { type: "string" }, paid_amount: { type: "number" }, payment_date: { type: "string" }, notes: { type: "string" } }, required: ["receivable_id"] } } },
  { type: "function", function: { name: "assign_sales_rep", description: "Atribui vendedor a um cliente. Vai para aprovação humana", parameters: { type: "object", properties: { client_id: { type: "string" }, sales_rep_id: { type: "string" }, notes: { type: "string" } }, required: ["client_id", "sales_rep_id"] } } },
];

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
      agents_used: ["ai-executive", "financial-insights", "financial-intelligence", "ai-commercial", "ai-production"],
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
    let createdCount = 0;
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

  const sys = `Você é o CÉREBRO do ERP — consultor sênior do negócio. Use o contexto (dados REAIS) para responder com precisão. Cite números exatos. Seja direto e PROATIVO: quando o usuário pedir uma ação executável (criar alerta, agendar follow-up, cobrar PIX, bloquear cliente, reagendar OP), use as TOOLS disponíveis em vez de só descrever. Para ações destrutivas (block_client, reschedule_production_order), a tool registra como pendente para aprovação humana — execute mesmo assim, é só uma proposta.

${ctx}`;

  const convo: any[] = [{ role: "system", content: sys }, ...messages];
  const executed: any[] = [];
  let finalContent = "";

  for (let step = 0; step < 5; step++) {
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages: convo, tools: BRAIN_TOOLS, tool_choice: "auto" }),
    });
    if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const msg = data?.choices?.[0]?.message;
    if (!msg) break;
    convo.push(msg);

    const toolCalls = msg.tool_calls || [];
    if (!toolCalls.length) {
      finalContent = msg.content || "";
      break;
    }

    for (const tc of toolCalls) {
      const name = tc.function?.name;
      let args: any = {};
      try { args = JSON.parse(tc.function?.arguments || "{}"); } catch { /* */ }

      const isRisky = RISKY_ACTIONS.has(name);
      let result: any;

      if (isRisky) {
        // Cria decisão pendente em vez de executar
        const { data: dec } = await admin.from("ai_brain_decisions").insert({
          user_id: userId || null,
          module: "chat",
          decision_type: "action",
          title: `[Chat] ${name}`,
          rationale: `Solicitada via chat — requer aprovação humana`,
          impact_level: "high",
          risk_level: "high",
          confidence: 0.8,
          evidence: { source: "chat", args },
          proposed_action: { tool: name, params: args },
          auto_executable: false,
          requires_approval: true,
          status: "pending",
        }).select().single();
        result = { ok: false, pending_approval: true, decision_id: dec?.id, message: `Ação ${name} criada como decisão pendente — aprove no painel do Cérebro.` };
      } else {
        result = await executeAction({ tool: name, params: args }, userId);
        // audita no histórico de decisões
        await admin.from("ai_brain_decisions").insert({
          user_id: userId || null,
          module: "chat",
          decision_type: "action",
          title: `[Chat] ${name}`,
          rationale: "Executada via chat",
          impact_level: "medium",
          risk_level: "low",
          confidence: 0.9,
          evidence: { source: "chat", args },
          proposed_action: { tool: name, params: args },
          auto_executable: true,
          requires_approval: false,
          status: result.ok ? "auto_executed" : "approved",
          executed_at: result.ok ? new Date().toISOString() : null,
          execution_result: result,
        });
      }

      executed.push({ tool: name, args, result });
      convo.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
    }
  }

  return { content: finalContent || "✅ Ações executadas.", actions: executed };
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
        break;
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
