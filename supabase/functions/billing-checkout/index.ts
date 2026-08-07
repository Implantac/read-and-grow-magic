// Cria a fatura de assinatura (SaaS) e, quando há PSP configurado, a sessão de pagamento.
// Nunca ativa plano pago diretamente: a ativação só ocorre no webhook após confirmação.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-branch-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = await requireAuth(req, { roles: ["admin"] });
  if (!auth.ok) return json({ error: auth.message }, auth.status);
  if (!auth.companyId) return json({ error: "Empresa não identificada" }, 400);

  const rl = checkRateLimit({ key: `billing-checkout:${auth.userId}`, limit: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

  let body: { plan_id?: string; cycle?: string; return_url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Payload inválido" }, 400);
  }

  const planId = String(body.plan_id ?? "");
  const cycle = body.cycle === "annual" ? "annual" : "monthly";
  if (!planId) return json({ error: "plan_id obrigatório" }, 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: plan, error: planErr } = await admin
    .from("plans")
    .select("id, name, price_monthly, price_annual, trial_days, is_active")
    .eq("id", planId)
    .maybeSingle();
  if (planErr) {
    console.error("[billing-checkout] plan lookup failed", planErr.message);
    return json({ error: "Erro ao carregar plano" }, 500);
  }
  if (!plan || plan.is_active === false) return json({ error: "Plano indisponível" }, 404);

  // Valor sempre calculado no servidor (nunca vem do cliente).
  const amount = Number(cycle === "annual" ? plan.price_annual : plan.price_monthly) || 0;

  const { data: currentSub } = await admin
    .from("subscriptions")
    .select("id, external_customer_id")
    .eq("company_id", auth.companyId)
    .maybeSingle();

  // Plano gratuito: ativa imediatamente (não há cobrança envolvida).
  if (amount <= 0) {
    const now = new Date();
    const end = new Date(now);
    cycle === "annual" ? end.setFullYear(end.getFullYear() + 1) : end.setMonth(end.getMonth() + 1);
    const { error } = await admin.from("subscriptions").upsert(
      {
        company_id: auth.companyId,
        plan_id: plan.id,
        status: "active",
        billing_cycle: cycle,
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
        cancel_at_period_end: false,
      },
      { onConflict: "company_id" },
    );
    if (error) {
      console.error("[billing-checkout] free activation failed", error.message);
      return json({ error: "Não foi possível ativar o plano" }, 500);
    }
    return json({ ok: true, mode: "free", activated: true });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const provider = stripeKey ? "stripe" : "manual";
  const dueDate = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

  const { data: invoice, error: invErr } = await admin
    .from("subscription_invoices")
    .insert({
      company_id: auth.companyId,
      subscription_id: currentSub?.id ?? null,
      plan_id: plan.id,
      billing_cycle: cycle,
      amount,
      currency: "BRL",
      status: "pending",
      provider,
      due_date: dueDate,
      created_by: auth.userId,
      metadata: { plan_name: plan.name },
    })
    .select("id")
    .single();
  if (invErr) {
    console.error("[billing-checkout] invoice insert failed", invErr.message);
    return json({ error: "Não foi possível gerar a fatura" }, 500);
  }

  if (!stripeKey) {
    // Sem PSP configurado: fatura fica pendente aguardando confirmação via webhook.
    return json({
      ok: true,
      mode: "manual",
      invoice_id: invoice.id,
      amount,
      message:
        "Fatura gerada. A assinatura será ativada assim que o pagamento for confirmado pelo provedor.",
    });
  }

  // Stripe Checkout (assinatura recorrente com preço dinâmico)
  const origin = req.headers.get("origin") ?? "";
  const returnUrl = body.return_url && body.return_url.startsWith(origin) ? body.return_url : origin;
  const form = new URLSearchParams({
    mode: "subscription",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "brl",
    "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)),
    "line_items[0][price_data][recurring][interval]": cycle === "annual" ? "year" : "month",
    "line_items[0][price_data][product_data][name]": `Use ERP — ${plan.name}`,
    success_url: `${returnUrl}/dashboard?billing=success`,
    cancel_url: `${returnUrl}/upgrade?billing=cancelled`,
    "metadata[invoice_id]": invoice.id,
    "metadata[company_id]": auth.companyId,
    "metadata[plan_id]": plan.id,
    "metadata[billing_cycle]": cycle,
    "subscription_data[metadata][invoice_id]": invoice.id,
    "subscription_data[metadata][company_id]": auth.companyId,
  });
  if (plan.trial_days > 0) {
    form.set("subscription_data[trial_period_days]", String(plan.trial_days));
  }
  if (currentSub?.external_customer_id) form.set("customer", currentSub.external_customer_id);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  const session = await res.json();
  if (!res.ok) {
    console.error("[billing-checkout] stripe error", session?.error?.message);
    await admin.from("subscription_invoices").update({ status: "failed" }).eq("id", invoice.id);
    return json({ error: "Falha ao iniciar o pagamento" }, 502);
  }

  await admin
    .from("subscription_invoices")
    .update({ external_invoice_id: session.id, checkout_url: session.url })
    .eq("id", invoice.id);

  return json({ ok: true, mode: "stripe", invoice_id: invoice.id, checkout_url: session.url });
});
