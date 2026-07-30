// Webhook de cobrança de assinaturas (SaaS). Única via de ativação/renovação de plano.
// Autenticação: assinatura Stripe (STRIPE_WEBHOOK_SECRET) ou header x-webhook-secret
// (BILLING_WEBHOOK_SECRET) para provedores genéricos.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-webhook-secret, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function verifyStripeSignature(raw: string, header: string, secret: string) {
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.split("=", 2) as [string, string]),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  // Rejeita eventos com mais de 5 minutos (proteção contra replay).
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${raw}`),
  );
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return safeEqual(expected, signature);
}

interface Normalized {
  status: "paid" | "failed" | "cancelled";
  invoice_id?: string;
  company_id?: string;
  plan_id?: string;
  billing_cycle?: string;
  external_invoice_id?: string;
  external_customer_id?: string;
  external_subscription_id?: string;
  period_end?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const raw = await req.text();
  const stripeSig = req.headers.get("stripe-signature");
  const stripeSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const genericSecret = Deno.env.get("BILLING_WEBHOOK_SECRET");
  const providedSecret = req.headers.get("x-webhook-secret");

  let provider = "manual";
  if (stripeSig) {
    if (!stripeSecret || !(await verifyStripeSignature(raw, stripeSig, stripeSecret))) {
      console.warn("[billing-webhook] invalid stripe signature");
      return json({ error: "Unauthorized" }, 401);
    }
    provider = "stripe";
  } else if (genericSecret && providedSecret && safeEqual(providedSecret, genericSecret)) {
    provider = "manual";
  } else {
    console.warn("[billing-webhook] missing/invalid webhook secret");
    return json({ error: "Unauthorized" }, 401);
  }

  let body: Record<string, any>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  let evt: Normalized | null = null;
  if (provider === "stripe") {
    const type = String(body.type ?? "");
    const obj = (body.data?.object ?? {}) as Record<string, any>;
    const meta = (obj.metadata ?? obj.subscription_details?.metadata ?? {}) as Record<string, string>;
    if (type === "checkout.session.completed" || type === "invoice.payment_succeeded") {
      evt = {
        status: "paid",
        invoice_id: meta.invoice_id,
        company_id: meta.company_id,
        plan_id: meta.plan_id,
        billing_cycle: meta.billing_cycle,
        external_invoice_id: String(obj.id ?? ""),
        external_customer_id: obj.customer ? String(obj.customer) : undefined,
        external_subscription_id: obj.subscription ? String(obj.subscription) : undefined,
        period_end: obj.lines?.data?.[0]?.period?.end
          ? new Date(obj.lines.data[0].period.end * 1000).toISOString()
          : null,
      };
    } else if (type === "invoice.payment_failed") {
      evt = { status: "failed", invoice_id: meta.invoice_id, external_invoice_id: String(obj.id ?? "") };
    } else if (type === "customer.subscription.deleted") {
      evt = { status: "cancelled", company_id: meta.company_id, external_subscription_id: String(obj.id ?? "") };
    } else {
      return json({ ok: true, ignored: type });
    }
  } else {
    const status = String(body.status ?? "").toLowerCase();
    if (!["paid", "failed", "cancelled"].includes(status)) return json({ ok: true, ignored: status });
    evt = {
      status: status as Normalized["status"],
      invoice_id: body.invoice_id,
      company_id: body.company_id,
      plan_id: body.plan_id,
      billing_cycle: body.billing_cycle,
      external_invoice_id: body.external_invoice_id,
      external_subscription_id: body.external_subscription_id,
      external_customer_id: body.external_customer_id,
    };
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Resolve a fatura de origem (fonte da verdade para empresa/plano/valor).
  let invoice: Record<string, any> | null = null;
  if (evt.invoice_id) {
    const { data } = await admin
      .from("subscription_invoices")
      .select("*")
      .eq("id", evt.invoice_id)
      .maybeSingle();
    invoice = data;
  }
  if (!invoice && evt.external_invoice_id) {
    const { data } = await admin
      .from("subscription_invoices")
      .select("*")
      .eq("external_invoice_id", evt.external_invoice_id)
      .maybeSingle();
    invoice = data;
  }

  if (evt.status === "cancelled") {
    const companyId = invoice?.company_id ?? evt.company_id;
    if (!companyId) return json({ ok: true, ignored: "no company" });
    await admin
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("company_id", companyId);
    return json({ ok: true, cancelled: true });
  }

  if (!invoice) {
    console.warn("[billing-webhook] invoice not found for event");
    return json({ ok: true, ignored: "invoice not found" });
  }

  if (evt.status === "failed") {
    await admin.from("subscription_invoices").update({ status: "failed" }).eq("id", invoice.id);
    return json({ ok: true, failed: true });
  }

  // Idempotência: fatura já paga não reprocessa.
  if (invoice.status === "paid") return json({ ok: true, duplicate: true });

  const now = new Date();
  const periodEnd = evt.period_end
    ? new Date(evt.period_end)
    : (() => {
        const d = new Date(now);
        invoice.billing_cycle === "annual"
          ? d.setFullYear(d.getFullYear() + 1)
          : d.setMonth(d.getMonth() + 1);
        return d;
      })();

  const { error: subErr } = await admin.from("subscriptions").upsert(
    {
      company_id: invoice.company_id,
      plan_id: invoice.plan_id,
      status: "active",
      billing_cycle: invoice.billing_cycle,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancelled_at: null,
      cancel_at_period_end: false,
      last_payment_at: now.toISOString(),
      external_gateway: provider,
      external_subscription_id: evt.external_subscription_id ?? null,
      external_customer_id: evt.external_customer_id ?? null,
    },
    { onConflict: "company_id" },
  );
  if (subErr) {
    console.error("[billing-webhook] subscription upsert failed", subErr.message);
    return json({ error: "Falha ao ativar assinatura" }, 500);
  }

  await admin
    .from("subscription_invoices")
    .update({
      status: "paid",
      paid_at: now.toISOString(),
      provider,
      external_invoice_id: evt.external_invoice_id ?? invoice.external_invoice_id,
      external_customer_id: evt.external_customer_id ?? invoice.external_customer_id,
    })
    .eq("id", invoice.id);

  return json({ ok: true, activated: true });
});
