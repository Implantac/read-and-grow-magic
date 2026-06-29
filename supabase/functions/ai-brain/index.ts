// deno-lint-ignore-file no-explicit-any
// ============================================================
// AI BRAIN — Cérebro Nativo do ERP
// Orquestrador multi-agente + memória + decisões com guardrails
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveContextByIds, branchScope, requireModule, enforceQuota, type TenantContext } from "../_shared/tenant.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { recordUsage } from "../_shared/usage.ts";
import { instrument, contextFromAuth } from "../_shared/observability.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-branch-id",
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

// Snapshot cache em memória (TTL 3 min) — PER-TENANT para evitar vazamento entre empresas
const SNAPSHOT_TTL_MS = 3 * 60 * 1000;
const snapshotCache = new Map<string, { at: number; data: any }>();

async function gatherSnapshot(authHeader?: string, companyId?: string | null, force = false) {
  const cacheKey = `${companyId || "anon"}|${authHeader ? "auth" : "service"}`;
  const cached = snapshotCache.get(cacheKey);
  if (!force && cached && Date.now() - cached.at < SNAPSHOT_TTL_MS) {
    return cached.data;
  }
  const [exec, fin, finIntel, com, prod] = await Promise.allSettled([
    invokeAgent("ai-executive", { action: "dashboard", months: 6 }, authHeader),
    invokeAgent("financial-insights", {}, authHeader),
    invokeAgent("financial-intelligence?action=compute", {}, authHeader),
    invokeAgent("ai-commercial", { action: "overview" }, authHeader),
    invokeAgent("ai-production", { action: "kpis" }, authHeader),
  ]);
  const pick = (r: PromiseSettledResult<any>) =>
    r.status === "fulfilled" ? r.value : { error: "failed" };
  const data = {
    executive: pick(exec),
    financial_insights: pick(fin),
    financial_intelligence: pick(finIntel),
    commercial: pick(com),
    production: pick(prod),
  };
  snapshotCache.set(cacheKey, { at: Date.now(), data });
  // LRU simples: limita a 50 tenants em memória
  if (snapshotCache.size > 50) {
    const oldest = [...snapshotCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) snapshotCache.delete(oldest[0]);
  }
  return data;
}

// Resumo das últimas decisões pendentes para incluir no contexto do chat (tenant-scoped)
async function loadPendingSummary(companyId: string | null, limit = 8) {
  let q = admin
    .from("ai_brain_decisions")
    .select("id,module,title,impact_level,risk_level,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (companyId) q = q.eq("company_id", companyId);
  else q = q.is("company_id", null);
  const { data } = await q;
  return data || [];
}


// ─────────────────────────────────────────────
// MEMORY (tenant-scoped)
// ─────────────────────────────────────────────
async function loadMemories(userId?: string, companyId?: string | null, limit = 30) {
  let q = admin
    .from("ai_brain_memory")
    .select("category,key,value,importance,scope,updated_at")
    .order("importance", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);
  // Isolamento: memórias do usuário OU da empresa OU globais da própria empresa
  if (companyId && userId) {
    q = q.or(
      `and(scope.eq.user,user_id.eq.${userId}),and(scope.in.(company,global),company_id.eq.${companyId})`,
    );
  } else if (companyId) {
    q = q.eq("company_id", companyId);
  } else if (userId) {
    q = q.eq("user_id", userId);
  }
  const { data } = await q;
  return data || [];
}


async function saveMemory(m: {
  user_id?: string;
  company_id?: string | null;
  scope?: string;
  category: string;
  key: string;
  value: any;
  importance?: number;
  source?: string;
}) {
  const scope = m.scope || (m.user_id ? "user" : (m.company_id ? "company" : "global"));
  await admin.from("ai_brain_memory").upsert(
    {
      user_id: m.user_id || null,
      company_id: m.company_id ?? null,
      scope,
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
// LLM CALL — synthesis with structured JSON + retry em 429
// ─────────────────────────────────────────────
async function callLLM(systemPrompt: string, userPrompt: string) {
  const doFetch = () => fetch(GATEWAY, {
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
  let res = await doFetch();
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 1500));
    res = await doFetch();
  }
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

async function executeAction(action: any, userId?: string, companyId?: string | null) {
  const tool = action?.tool;
  const p = action?.params || {};
  if (!companyId) {
    return { ok: false, error: "company_id ausente — ação ignorada para preservar isolamento multi-tenant" };
  }
  try {
    switch (tool) {
      case "create_alert": {
        const { data, error } = await admin.from("financial_alerts").insert({
          company_id: companyId,
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
          company_id: companyId,
          alert_type: p.alert_type || "brain_escalation",
          severity: "critical",
          title: p.title || "🔴 Escalação do Cérebro",
          description: p.description || "",
          entity_type: p.entity_type || null,
          entity_id: p.entity_id || null,
        }).select().single();
        if (error) throw error;
        // notifica admins DA MESMA EMPRESA apenas
        const { data: admins } = await admin.from("user_roles")
          .select("user_id")
          .eq("role", "admin")
          .eq("company_id", companyId);
        for (const a of admins || []) {
          await admin.from("notifications").insert({
            company_id: companyId,
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
        if (p.user_id && p.user_id !== userId) {
          const { data: prof } = await admin.from("profiles").select("company_id").eq("id", p.user_id).maybeSingle();
          if ((prof as any)?.company_id !== companyId) {
            return { ok: false, error: "user_id pertence a outra empresa" };
          }
        }
        const { data, error } = await admin.from("notifications").insert({
          company_id: companyId,
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
        const desc = p.description || `Lembrete de PIX pendente${p.amount ? ` — R$ ${p.amount}` : ""}`;
        const { data: admins } = await admin.from("user_roles")
          .select("user_id")
          .in("role", ["admin", "manager"])
          .eq("company_id", companyId);
        for (const a of admins || []) {
          await admin.from("notifications").insert({
            company_id: companyId,
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
          company_id: companyId,
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
        const { error: e1, data: updated } = await admin.from("clients")
          .update({ status: "blocked" })
          .eq("id", p.client_id)
          .eq("company_id", companyId)
          .select("id").maybeSingle();
        if (e1) throw e1;
        if (!updated) return { ok: false, error: "cliente não encontrado neste tenant" };
        if (p.order_id) {
          await admin.from("order_blocks").insert({
            company_id: companyId,
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
          .eq("id", p.order_id)
          .eq("company_id", companyId)
          .select().maybeSingle();
        if (error) throw error;
        if (!data) return { ok: false, error: "OP não encontrada neste tenant" };
        return { ok: true, order_id: data.id, new_due_date: p.new_due_date };
      }
      case "request_quotation": {
        const number = `COT-AI-${Date.now().toString().slice(-8)}`;
        const validUntil = p.valid_until || new Date(Date.now() + 15 * 86400000).toISOString();
        const { data, error } = await admin.from("quotations").insert({
          company_id: companyId,
          number,
          client_id: p.client_id || null,
          client_name: p.client_name || p.supplier_name || "Cotação Cérebro",
          valid_until: validUntil,
          subtotal: p.subtotal || p.total || 0,
          discount: 0,
          total: p.total || 0,
          status: "draft",
          notes: `[Cérebro] ${p.description || p.notes || "Cotação sugerida pelo Cérebro"}`,
        }).select().single();
        if (error) throw error;
        const { data: buyers } = await admin.from("user_roles")
          .select("user_id")
          .in("role", ["admin", "manager"])
          .eq("company_id", companyId);
        for (const b of buyers || []) {
          await admin.from("notifications").insert({
            company_id: companyId,
            user_id: b.user_id,
            type: "info",
            title: `📋 Nova cotação sugerida: ${number}`,
            description: p.description || "Cérebro recomenda nova cotação",
            module: "Compras",
          });
        }
        return { ok: true, quotation_id: data.id, number };
      }

      case "create_purchase_order": {
        if (!p.supplier_name) return { ok: false, error: "supplier_name obrigatório" };
        const number = `PO-AI-${Date.now().toString().slice(-8)}`;
        const { data, error } = await admin.from("purchase_orders").insert({
          company_id: companyId,
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
        }).eq("id", p.block_id).eq("company_id", companyId).select().maybeSingle();
        if (error) throw error;
        if (!data) return { ok: false, error: "bloqueio não encontrado neste tenant" };
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
        }).eq("id", p.receivable_id).eq("company_id", companyId).select().maybeSingle();
        if (error) throw error;
        if (!data) return { ok: false, error: "título não encontrado neste tenant" };
        return { ok: true, receivable_id: data.id };
      }
      case "assign_sales_rep": {
        if (!p.client_id || !p.sales_rep_id) return { ok: false, error: "client_id e sales_rep_id obrigatórios" };
        const { data, error } = await admin.from("clients").update({
          sales_rep_id: p.sales_rep_id,
          commercial_notes: p.notes ? `[Cérebro] ${p.notes}` : null,
        }).eq("id", p.client_id).eq("company_id", companyId).select().maybeSingle();
        if (error) throw error;
        if (!data) return { ok: false, error: "cliente não encontrado neste tenant" };
        return { ok: true, client_id: data.id, sales_rep_id: p.sales_rep_id };
      }
      case "save_memory": {
        await saveMemory({
          user_id: userId,
          company_id: companyId,
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
async function handleAnalyze(userId: string | undefined, authHeader?: string, mode = "analyze", companyId?: string | null) {
  const t0 = Date.now();
  const { data: run } = await admin
    .from("ai_brain_runs")
    .insert({
      company_id: companyId || null,
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
      gatherSnapshot(authHeader, companyId),
      loadMemories(userId, companyId, 20),
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
        executionResult = await executeAction(d.proposed_action, userId, companyId);
      }
      const { error } = await admin.from("ai_brain_decisions").insert({
        company_id: companyId || null,
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
          company_id: companyId,
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

// ─────────────────────────────────────────────
// AGENT PERSONAS — foco especializado por área
// ─────────────────────────────────────────────
const AGENT_PERSONAS: Record<string, { label: string; focus: string }> = {
  geral: { label: "Cérebro Geral", focus: "Visão 360° do negócio. Equilibra todas as áreas." },
  financeiro: { label: "CFO Digital", focus: "Foque em caixa, AP/AR, DRE, inadimplência, fluxo. Priorize liquidez e margem. Tom de CFO sênior." },
  comercial: { label: "Diretor Comercial", focus: "Foque em pipeline, conversão, ticket médio, vendedores, clientes-chave. Tom de Head of Sales." },
  fiscal: { label: "Auditor Fiscal", focus: "Foque em NF-e, impostos (ICMS/PIS/COFINS/IPI), SPED, divergências e compliance. Tom técnico-fiscal." },
  logistica: { label: "Diretor de Operações", focus: "Foque em WMS, TMS, expedições, picking, lead-time, ocupação de CDs. Tom de COO." },
  qualidade: { label: "Gestor de Qualidade", focus: "Foque em defeitos, devoluções, inspeções, quarentena, NCs. Tom técnico-industrial." },
  producao: { label: "Gerente de PCP", focus: "Foque em OEE, MRP, gargalos, capacidade, ordens de produção. Tom de PCP/Indústria 4.0." },
};

// Aliases UI → backend (front-end usa nomes em inglês em algumas telas)
const AGENT_ALIASES: Record<string, string> = {
  general: "geral",
  financial: "financeiro",
  commercial: "comercial",
  operational: "logistica",
  operations: "logistica",
  production: "producao",
  quality: "qualidade",
  cfo: "financeiro",
  sales: "comercial",
};

function resolveAgent(id?: string): string {
  const raw = String(id || "geral").toLowerCase();
  return AGENT_PERSONAS[raw] ? raw : (AGENT_ALIASES[raw] || "geral");
}

async function handleChat(userId: string | undefined, messages: any[], authHeader?: string, agent = "geral", companyId?: string | null) {
  const persona = AGENT_PERSONAS[resolveAgent(agent)];
  const [snapshot, memories, pending] = await Promise.all([
    gatherSnapshot(authHeader, companyId),
    loadMemories(userId, companyId, 15),
    loadPendingSummary(companyId ?? null, 8),
  ]);


  const ctx = `# CONTEXTO ATUAL DO NEGÓCIO
## Memórias relevantes
${JSON.stringify(memories.slice(0, 10), null, 2)}

## Snapshot resumido
KPIs: ${JSON.stringify(snapshot.executive?.kpis || {}, null, 2).slice(0, 1500)}
Score financeiro: ${JSON.stringify(snapshot.financial_intelligence?.score || {}, null, 2).slice(0, 500)}

## Decisões pendentes (aguardando aprovação humana)
${pending.length ? pending.map((d: any) => `- [${d.impact_level}] ${d.module} · ${d.title} (${d.id.slice(0, 8)})`).join("\n") : "Nenhuma pendência."}`;

  const sys = `Você é o ${persona.label} — agente especializado do Cérebro do ERP.
FOCO: ${persona.focus}
Use o contexto (dados REAIS) para responder com precisão. Cite números exatos. Seja direto e PROATIVO: quando o usuário pedir uma ação executável, use as TOOLS disponíveis. Ações destrutivas viram decisões pendentes para aprovação humana — execute mesmo assim, é só uma proposta. Se houver decisões pendentes relevantes, mencione-as.

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
          company_id: companyId || null,
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
        result = await executeAction({ tool: name, params: args }, userId, companyId);
        // audita no histórico de decisões
        await admin.from("ai_brain_decisions").insert({
          company_id: companyId || null,
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

async function handleApprove(decisionId: string, approve: boolean, userId: string | undefined, callerCompany: string | null) {
  if (!callerCompany) {
    const err: any = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  let q = admin.from("ai_brain_decisions").select("*").eq("id", decisionId);
  q = q.eq("company_id", callerCompany);
  const { data: dec, error: e0 } = await q.maybeSingle();
  if (e0) throw e0;
  if (!dec) {
    const err: any = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  if (!approve) {
    const { data, error } = await admin.from("ai_brain_decisions")
      .update({ status: "rejected", approved_by: userId || null, approved_at: new Date().toISOString() })
      .eq("id", decisionId).eq("company_id", callerCompany).select().single();
    if (error) throw error;
    return data;
  }

  // Approved → executa ação real
  const execResult = await executeAction(dec.proposed_action, userId, callerCompany);
  const { data, error } = await admin.from("ai_brain_decisions")
    .update({
      status: execResult.ok ? "executed" : "approved",
      approved_by: userId || null,
      approved_at: new Date().toISOString(),
      executed_at: execResult.ok ? new Date().toISOString() : null,
      execution_result: execResult,
    })
    .eq("id", decisionId).eq("company_id", callerCompany).select().single();
  if (error) throw error;
  return data;
}


// ─────────────────────────────────────────────
// WEEKLY LEARNING — analisa rejeitadas e salva lições
// ─────────────────────────────────────────────
async function handleWeeklyLearning() {
  // Itera por tenant para preservar isolamento das lições aprendidas
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: companies } = await admin.from("companies").select("id");
  const results: any[] = [];

  for (const c of (companies ?? [])) {
    const companyId = (c as any).id as string;
    const { data: rejected } = await admin
      .from("ai_brain_decisions")
      .select("module,title,rationale,impact_level,risk_level,confidence,proposed_action,created_at")
      .eq("company_id", companyId)
      .eq("status", "rejected")
      .gte("created_at", since)
      .limit(100);

    if (!rejected?.length) {
      try {
        await saveMemory({
          company_id: companyId,
          scope: "company",
          category: "lesson_learned",
          key: `weekly_${new Date().toISOString().slice(0, 10)}`,
          value: "Nenhuma rejeição na semana — Cérebro bem calibrado.",
          importance: 4,
          source: "weekly_learning",
        });
      } catch { /* ignore */ }
      results.push({ company_id: companyId, rejected: 0, lessons_saved: 0 });
      continue;
    }

    const prompt = `Você é o CÉREBRO em modo auto-aprendizado. Abaixo estão decisões REJEITADAS por humanos na última semana (tenant ${companyId}).
Identifique PADRÕES de erro e gere até 5 lições para evitar repetir esses erros.

Decisões rejeitadas:
${JSON.stringify(rejected, null, 2).slice(0, 8000)}

Retorne JSON: {"lessons":[{"category":"lesson_learned","key":"evitar_X_quando_Y","value":"regra clara em 1 frase","importance":7}]}`;

    let saved = 0;
    try {
      const out = await callLLM(
        "Você é um analista que extrai aprendizados de decisões rejeitadas. Retorne JSON válido.",
        prompt,
      );
      const lessons = Array.isArray(out.lessons) ? out.lessons : [];
      for (const l of lessons) {
        try {
          await saveMemory({
            company_id: companyId,
            scope: "company",
            category: l.category || "lesson_learned",
            key: String(l.key || `lesson_${Date.now()}_${saved}`).slice(0, 200),
            value: l.value,
            importance: Number(l.importance) || 7,
            source: "weekly_learning",
          });
          saved++;
        } catch { /* ignore */ }
      }
    } catch (e: any) {
      results.push({ company_id: companyId, rejected: rejected.length, lessons_saved: 0, error: e?.message || String(e) });
      continue;
    }
    results.push({ company_id: companyId, rejected: rejected.length, lessons_saved: saved });
  }

  return { ok: true, companies: results.length, results };
}


// ─────────────────────────────────────────────
// SERVER
// ─────────────────────────────────────────────
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const ALLOWED_BRAIN_ACTIONS = new Set([
      "analyze","autopilot","chat","approve_decision","reject_decision","save_memory",
      "list_memories","feedback_decision","reinforce_memory","invalidate_cache",
      "notify_critical","execute_decision","cron_run","weekly_learning",
    ]);
    const action = body.action || "analyze";
    if (typeof action !== "string" || !ALLOWED_BRAIN_ACTIONS.has(action)) {
      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Validate UUIDs for decision actions
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const DECISION_ACTIONS = new Set(["approve_decision","reject_decision","feedback_decision","execute_decision"]);
    if (DECISION_ACTIONS.has(action) && (typeof body.decisionId !== "string" || !UUID_RE.test(body.decisionId))) {
      return new Response(JSON.stringify({ error: "decisionId inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authHeader = req.headers.get("Authorization") || undefined;

    // Cron-only actions: require CRON_SECRET header (Supabase scheduled functions).
    const CRON_ACTIONS = new Set(["cron_run", "weekly_learning"]);
    const CRON_SECRET = Deno.env.get("CRON_SECRET");
    if (CRON_ACTIONS.has(action)) {
      const provided = req.headers.get("x-cron-secret");
      if (!CRON_SECRET || provided !== CRON_SECRET) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let userId: string | undefined;
    let userRole: string | null = null;
    let callerCompany: string | null = null;
    let callerScope: string[] | null = null;
    if (!CRON_ACTIONS.has(action)) {
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await admin.auth.getUser(token);
      if (error || !data?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = data.user.id;

      // Rate limit per user: 60 req/min — protege contra loops/abuso de IA
      const rl = checkRateLimit({ key: `ai-brain:${userId}`, limit: 60, windowMs: 60_000 });
      if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

      const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", userId).order("role").limit(1).maybeSingle();
      userRole = (roleRow as any)?.role || null;
      const { data: profileRow } = await admin.from("profiles").select("company_id, default_branch_id").eq("id", userId).maybeSingle();
      callerCompany = (profileRow as any)?.company_id || null;

      // Privileged actions require admin/manager
      const PRIVILEGED = new Set([
        "approve_decision", "reject_decision", "execute_decision",
        "autopilot", "notify_critical", "invalidate_cache",
      ]);
      if (PRIVILEGED.has(action) && !["admin", "manager"].includes(userRole || "")) {
        return new Response(JSON.stringify({ error: "Forbidden: admin/manager required" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Tenant-scoped actions require a resolved company_id
      const TENANT_SCOPED = new Set([
        "approve_decision", "reject_decision", "execute_decision",
        "feedback_decision", "reinforce_memory",
      ]);
      if (TENANT_SCOPED.has(action) && !callerCompany) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Resolve branch context (optional — branch filtering applies only to
      // tables with branch_id; ai_brain_* tables are company-scoped).
      if (callerCompany) {
        const ctx = await resolveContextByIds(req, {
          userId,
          companyId: callerCompany,
          defaultBranchId: (profileRow as any)?.default_branch_id ?? null,
        });
        if (!ctx.ok) {
          return new Response(JSON.stringify({ error: ctx.message }), {
            status: ctx.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const moduleDenied = await requireModule(ctx as TenantContext, 'executivo');
        if (moduleDenied) return moduleDenied;
        const quotaDenied = await enforceQuota(ctx as TenantContext, 'ai_calls', 1);
        if (quotaDenied) return quotaDenied;
        callerScope = branchScope(ctx as TenantContext);
      }
    }
    void callerScope; // reserved for downstream branch-aware reads


    let result: any;
    switch (action) {
      case "analyze":
        result = await handleAnalyze(userId, authHeader, "analyze", callerCompany);
        break;
      case "autopilot":
        result = await handleAnalyze(userId, authHeader, "autopilot", callerCompany);
        break;
      case "chat":
        result = await handleChat(userId, body.messages || [], authHeader, body.agent || "geral", callerCompany);
        break;
      case "approve_decision":
        result = await handleApprove(body.decision_id, true, userId, callerCompany);
        break;
      case "reject_decision":
        result = await handleApprove(body.decision_id, false, userId, callerCompany);
        break;

      case "save_memory":
        await saveMemory({ ...body.memory, user_id: userId, company_id: callerCompany });
        result = { ok: true };
        break;
      case "list_memories":
        result = { memories: await loadMemories(userId, callerCompany, 100) };
        break;



      case "feedback_decision": {

        // Usuário aprova ou critica uma decisão executada — vira aprendizado
        const { decision_id, rating, comment } = body;
        if (!decision_id || !["up", "down"].includes(rating)) {
          result = { ok: false, error: "decision_id e rating ('up'|'down') obrigatórios" };
          break;
        }
        const { data: dec } = await admin.from("ai_brain_decisions")
          .select("title,module,rationale,proposed_action,impact_level,company_id").eq("id", decision_id).eq("company_id", callerCompany!).maybeSingle();
        if (!dec) { result = { ok: false, error: "decisão não encontrada" }; break; }

        await saveMemory({
          user_id: userId,
          company_id: callerCompany,
          category: rating === "up" ? "positive_feedback" : "lesson_learned",
          key: `feedback_${decision_id}`,
          value: {
            rating, comment: comment || null,
            decision: { title: dec.title, module: dec.module, action: dec.proposed_action, impact: dec.impact_level },
            note: rating === "up"
              ? "Padrão aprovado pelo humano — repetir em contextos similares."
              : "Padrão rejeitado pelo humano — evitar em contextos similares.",
          },
          importance: rating === "down" ? 8 : 6,
          source: "user_feedback",
        });

        result = { ok: true, registered: true };
        break;
      }
      case "reinforce_memory": {
        // Aumenta importância de uma memória citada/usada com sucesso
        const { memory_key, delta } = body;
        if (!memory_key) { result = { ok: false, error: "memory_key obrigatório" }; break; }
        const { data: mem } = await admin.from("ai_brain_memory")
          .select("id,importance").eq("key", memory_key).eq("company_id", callerCompany!).maybeSingle();
        if (!mem) { result = { ok: false, error: "memória não encontrada" }; break; }
        const next = Math.min(10, (mem.importance || 5) + (Number(delta) || 1));
        await admin.from("ai_brain_memory").update({ importance: next }).eq("id", mem.id).eq("company_id", callerCompany!);

        result = { ok: true, new_importance: next };
        break;
      }
      case "invalidate_cache":
        // Limpa só o cache do tenant atual (preserva isolamento)
        if (callerCompany) {
          for (const k of [...snapshotCache.keys()]) {
            if (k.startsWith(`${callerCompany}|`)) snapshotCache.delete(k);
          }
        } else {
          snapshotCache.clear();
        }
        result = { ok: true, cleared: true };
        break;




      case "notify_critical": {
        const webhook = Deno.env.get("BRAIN_WEBHOOK_URL");
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { data: crits } = await admin
          .from("ai_brain_decisions")
          .select("id,module,title,rationale,impact_level,confidence,created_at,proposed_action")
          .eq("status", "pending")
          .in("impact_level", ["critical", "high"])
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(20);
        if (!webhook) { result = { ok: false, skipped: true, reason: "BRAIN_WEBHOOK_URL not configured", count: crits?.length || 0 }; break; }
        if (!crits?.length) { result = { ok: true, sent: 0, message: "Nenhuma decisão crítica recente." }; break; }
        const payload = {
          source: "ai-brain",
          generated_at: new Date().toISOString(),
          critical_count: crits.filter((c: any) => c.impact_level === "critical").length,
          high_count: crits.filter((c: any) => c.impact_level === "high").length,
          summary: crits.map((c: any) => `[${c.impact_level.toUpperCase()}] ${c.module} · ${c.title}`).join("\n"),
          decisions: crits,
        };
        const r = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((e) => ({ ok: false, status: 0, statusText: String(e) } as any));
        result = { ok: (r as any).ok, status: (r as any).status, sent: crits.length };
        break;
      }
      case "execute_decision": {
        const { data: dec, error: e0 } = await admin
          .from("ai_brain_decisions").select("*").eq("id", body.decision_id).eq("company_id", callerCompany!).maybeSingle();
        if (e0) throw e0;
        if (!dec) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const r = await executeAction(dec.proposed_action, userId, callerCompany);
        await admin.from("ai_brain_decisions").update({
          status: r.ok ? "executed" : "approved",
          executed_at: r.ok ? new Date().toISOString() : null,
          execution_result: r,
        }).eq("id", body.decision_id).eq("company_id", callerCompany!);
        result = r;
        break;
      }

      case "cron_run": {
        // Cron iterates per tenant — never auto-execute actions with NULL company_id
        const { data: companies } = await admin.from("companies").select("id");
        const runs: any[] = [];
        for (const c of (companies ?? [])) {
          try {
            const r = await handleAnalyze(undefined, undefined, "autopilot", (c as any).id);
            runs.push({ company_id: (c as any).id, ok: true, run_id: r?.run_id });
          } catch (e: any) {
            runs.push({ company_id: (c as any).id, ok: false, error: e?.message ?? String(e) });
          }
        }
        result = { ok: true, companies: runs.length, runs };
        break;
      }
      case "weekly_learning":
        result = await handleWeeklyLearning();
        break;


      default:
        return new Response(JSON.stringify({ error: `unknown action ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    await recordUsage(callerCompany, "ai_call", 1, { source: "ai-brain", action });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[ai-brain] error", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

Deno.serve(instrument(handler, { source: "ai-brain", getContext: contextFromAuth }));
