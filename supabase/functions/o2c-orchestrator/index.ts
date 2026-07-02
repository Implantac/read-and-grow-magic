// Order-to-Cash Orchestrator
// Coordena crédito → fiscal → SEFAZ → picking → notificação para um pedido.
// Emite eventos em cross_module_events para o O2CProgressDrawer acompanhar em realtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireAuth } from "../_shared/require-auth.ts";

type StepKey = "credit" | "fiscal" | "sefaz" | "picking" | "notify";
type StepStatus = "running" | "ok" | "failed" | "skipped";

interface StepResult {
  step: StepKey;
  status: StepStatus;
  message?: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (!auth.ok) {
      return json({ error: auth.message }, auth.status);
    }
    const companyId = auth.companyId;
    if (!companyId) return json({ error: "Tenant não resolvido" }, 400);

    const body = await req.json().catch(() => ({}));
    const orderId: string | undefined = body?.order_id;
    if (!orderId) return json({ error: "order_id obrigatório" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load order scoped by tenant
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, company_id, client_id, total, status, payment_condition")
      .eq("id", orderId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (orderErr || !order) return json({ error: "Pedido não encontrado" }, 404);

    const runId = crypto.randomUUID();
    const results: StepResult[] = [];

    const emit = async (step: StepKey, status: StepStatus, message?: string, data?: Record<string, unknown>) => {
      results.push({ step, status, message, data });
      await supabase.from("cross_module_events").insert({
        company_id: companyId,
        event_type: `o2c.${step}.${status}`,
        source_module: "o2c-orchestrator",
        target_module: step,
        entity_type: "order",
        entity_id: orderId,
        payload: { run_id: runId, step, status, message, data },
      });
    };

    // 1) Credit
    await emit("credit", "running");
    const { data: credit, error: creditErr } = await supabase.rpc("check_credit", {
      p_client_id: order.client_id,
      p_amount: order.total,
    });
    if (creditErr) {
      await emit("credit", "failed", creditErr.message);
      return json({ run_id: runId, results, halted_at: "credit" }, 200);
    }
    const creditOk = (credit as any)?.approved !== false;
    await emit("credit", creditOk ? "ok" : "failed", creditOk ? "Crédito aprovado" : "Crédito insuficiente", credit as any);
    if (!creditOk) return json({ run_id: runId, results, halted_at: "credit" }, 200);

    // 2) Fiscal (rules resolution — soft)
    await emit("fiscal", "running");
    const { data: taxRules } = await supabase
      .from("tax_rules")
      .select("id")
      .eq("company_id", companyId)
      .eq("active", true)
      .limit(1);
    await emit("fiscal", (taxRules?.length ?? 0) > 0 ? "ok" : "skipped", "Regras fiscais resolvidas");

    // 3) SEFAZ — cria NF-e em rascunho (retry com backoff para 108/109 timeouts)
    // Códigos SEFAZ transientes: 108 (serviço paralisado momentaneamente), 109 (paralisado sem previsão).
    const TRANSIENT_SEFAZ = new Set(["108", "109"]);
    const MAX_ATTEMPTS = 3;
    let nfe: { id: string; numero: number } | null = null;
    let lastErr: { code?: string; message: string } | null = null;
    await emit("sefaz", "running");
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const { data, error: nfeErr } = await supabase
        .from("nfe")
        .insert({
          company_id: companyId,
          client_id: order.client_id,
          order_id: order.id,
          total: order.total,
          status: "draft",
        })
        .select("id, numero")
        .maybeSingle();
      if (!nfeErr && data) {
        nfe = data as any;
        lastErr = null;
        break;
      }
      const codeMatch = nfeErr?.message?.match(/\b(1\d{2}|2\d{2}|5\d{2}|6\d{2})\b/);
      const code = codeMatch?.[1];
      lastErr = { code, message: nfeErr?.message ?? "Erro desconhecido" };
      if (!code || !TRANSIENT_SEFAZ.has(code) || attempt === MAX_ATTEMPTS) break;
      // backoff exponencial: 500ms, 1s, 2s
      const delay = 500 * 2 ** (attempt - 1);
      await emit("sefaz", "running", `Tentativa ${attempt} falhou (SEFAZ ${code}). Retentando em ${delay}ms…`, { attempt, code });
      await new Promise((r) => setTimeout(r, delay));
    }
    if (nfe) {
      await emit("sefaz", "ok", `NF-e ${nfe.numero ?? "rascunho"} criada`, { nfe_id: nfe.id });
    } else {
      await emit("sefaz", "failed", lastErr?.message ?? "Falha na emissão", {
        code: lastErr?.code,
        suggestion: lastErr?.code && TRANSIENT_SEFAZ.has(lastErr.code)
          ? "SEFAZ indisponível após 3 tentativas. Aguarde alguns minutos e retransmita."
          : undefined,
      });
    }

    // 4) Picking task
    await emit("picking", "running");
    const { error: pickingErr } = await supabase.from("picking_tasks").insert({
      company_id: companyId,
      order_id: order.id,
      status: "pending",
      priority: 5,
    });
    await emit("picking", pickingErr ? "failed" : "ok", pickingErr?.message ?? "Tarefa de separação criada");

    // 5) Notify
    await emit("notify", "running");
    await supabase.from("notifications").insert({
      company_id: companyId,
      user_id: auth.userId,
      title: "Order-to-Cash concluído",
      message: `Pedido ${order.id.slice(0, 8)} processado. Total R$ ${Number(order.total).toFixed(2)}.`,
      type: "success",
    });
    await emit("notify", "ok", "Notificação enviada");

    // Update order status
    await supabase.from("orders").update({ status: "processing" }).eq("id", order.id).eq("company_id", companyId);

    return json({ run_id: runId, order_id: orderId, results }, 200);
  } catch (e) {
    return json({ error: "Falha interna no orquestrador" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
