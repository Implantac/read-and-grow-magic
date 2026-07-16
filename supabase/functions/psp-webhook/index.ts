// Webhook receptor de PSPs (Mercado Pago, Efí, Asaas, Stripe, Pagar.me...)
// Atualiza status de storefront_orders e grava histórico em storefront_payment_events.
//
// Autenticação:
//   Header  X-Webhook-Secret: <PSP_WEBHOOK_SECRET>   (obrigatório)
//   Header  X-Provider: mercadopago|asaas|efi|stripe|pagarme|generic  (opcional, default: generic)
//
// Body normalizado (formato genérico aceito):
//   {
//     "order_number": "PED260716-1234",   // OU
//     "order_id": "<uuid>",               // OU
//     "external_id": "<id no PSP>",
//     "status": "paid" | "failed" | "refunded" | "expired" | "processing" | "pending",
//     "amount": 199.90,
//     "event_type": "payment.approved"
//   }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-provider, x-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type OrderStatus =
  | "created"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";
type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "refunded"
  | "expired";

interface Normalized {
  order_number?: string;
  order_id?: string;
  external_id?: string;
  status: PaymentStatus;
  amount?: number;
  event_type: string;
}

// Timing-safe compare (evita ataques de timing na verificação do segredo)
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

// Mapeia payload de PSPs conhecidos para o formato normalizado
function normalizePayload(provider: string, body: Record<string, unknown>): Normalized | null {
  const p = provider.toLowerCase();

  // Mercado Pago: { action, data: { id }, type: "payment" }
  if (p === "mercadopago") {
    const data = body.data as { id?: string } | undefined;
    const action = String(body.action ?? body.type ?? "");
    const statusRaw = String(
      (body.status as string) ??
        ((body.data as Record<string, unknown> | undefined)?.status as string) ??
        "",
    ).toLowerCase();
    return {
      external_id: data?.id ? String(data.id) : undefined,
      order_number: String(body.external_reference ?? "") || undefined,
      status: mapMPStatus(statusRaw || action),
      event_type: action || "payment.update",
      amount: Number(body.transaction_amount ?? 0) || undefined,
    };
  }

  // Asaas: { event, payment: { id, status, value, externalReference } }
  if (p === "asaas") {
    const payment = (body.payment ?? {}) as Record<string, unknown>;
    return {
      external_id: payment.id ? String(payment.id) : undefined,
      order_number: payment.externalReference
        ? String(payment.externalReference)
        : undefined,
      status: mapAsaasStatus(String(payment.status ?? "")),
      event_type: String(body.event ?? "payment.update"),
      amount: Number(payment.value ?? 0) || undefined,
    };
  }

  // Efí (Gerencianet): { pix: [{ txid, endToEndId, valor }] } OU { evento, txid, status }
  if (p === "efi") {
    const pixArr = Array.isArray(body.pix)
      ? (body.pix as Array<Record<string, unknown>>)
      : null;
    const pix = pixArr?.[0];
    if (pix) {
      return {
        external_id: String(pix.txid ?? pix.endToEndId ?? ""),
        order_number: String(pix.txid ?? "") || undefined,
        status: "paid",
        event_type: "pix.received",
        amount: Number(pix.valor ?? 0) || undefined,
      };
    }
    return {
      external_id: String(body.txid ?? ""),
      status: mapEfiStatus(String(body.status ?? "")),
      event_type: String(body.evento ?? "pix.update"),
    };
  }

  // Stripe: { type, data: { object: { id, status, amount_total, metadata: { order_id } } } }
  if (p === "stripe") {
    const obj = ((body.data as Record<string, unknown> | undefined)
      ?.object ?? {}) as Record<string, unknown>;
    const metadata = (obj.metadata ?? {}) as Record<string, string>;
    return {
      external_id: obj.id ? String(obj.id) : undefined,
      order_id: metadata.order_id,
      order_number: metadata.order_number,
      status: mapStripeStatus(String(obj.status ?? ""), String(body.type ?? "")),
      event_type: String(body.type ?? "payment_intent.update"),
      amount: Number(obj.amount_total ?? obj.amount ?? 0) / 100 || undefined,
    };
  }

  // Formato genérico já normalizado
  const status = String(body.status ?? "").toLowerCase();
  const allowed: PaymentStatus[] = [
    "pending",
    "processing",
    "paid",
    "failed",
    "refunded",
    "expired",
  ];
  if (!allowed.includes(status as PaymentStatus)) return null;
  return {
    order_number: body.order_number ? String(body.order_number) : undefined,
    order_id: body.order_id ? String(body.order_id) : undefined,
    external_id: body.external_id ? String(body.external_id) : undefined,
    status: status as PaymentStatus,
    amount: Number(body.amount ?? 0) || undefined,
    event_type: String(body.event_type ?? "payment.update"),
  };
}

function mapMPStatus(v: string): PaymentStatus {
  if (v.includes("approved") || v.includes("paid")) return "paid";
  if (v.includes("rejected") || v.includes("cancelled")) return "failed";
  if (v.includes("refunded") || v.includes("charged_back")) return "refunded";
  if (v.includes("expired")) return "expired";
  if (v.includes("in_process") || v.includes("in_mediation")) return "processing";
  return "pending";
}
function mapAsaasStatus(v: string): PaymentStatus {
  const s = v.toUpperCase();
  if (s.includes("CONFIRMED") || s.includes("RECEIVED")) return "paid";
  if (s.includes("REFUND")) return "refunded";
  if (s.includes("OVERDUE") || s.includes("EXPIRED")) return "expired";
  if (s.includes("PENDING")) return "pending";
  if (s.includes("FAIL")) return "failed";
  return "processing";
}
function mapEfiStatus(v: string): PaymentStatus {
  const s = v.toUpperCase();
  if (s === "CONCLUIDA" || s === "CONCLUIDO") return "paid";
  if (s === "REMOVIDA_PELO_USUARIO_RECEBEDOR") return "expired";
  if (s === "ATIVA") return "pending";
  return "processing";
}
function mapStripeStatus(status: string, type: string): PaymentStatus {
  if (type.includes("succeeded") || status === "succeeded" || status === "paid")
    return "paid";
  if (type.includes("refunded") || status === "refunded") return "refunded";
  if (type.includes("failed") || status === "failed") return "failed";
  if (type.includes("expired") || status === "expired") return "expired";
  if (status === "processing") return "processing";
  return "pending";
}

function orderStatusFromPayment(p: PaymentStatus): OrderStatus | null {
  if (p === "paid") return "confirmed";
  if (p === "failed" || p === "expired" || p === "refunded") return "cancelled";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 1) Validar segredo compartilhado
  const expected = Deno.env.get("PSP_WEBHOOK_SECRET") ?? "";
  const received = req.headers.get("x-webhook-secret") ?? "";
  const signatureValid =
    expected.length > 0 && safeEqual(expected, received);
  if (!signatureValid) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const provider = (req.headers.get("x-provider") ?? "generic").toLowerCase();

  // 2) Parse do body
  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const normalized = normalizePayload(provider, raw);
  if (!normalized) {
    return new Response(
      JSON.stringify({ error: "Could not normalize payload", provider }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  // 3) Localizar pedido: order_id → order_number → payment_intent_id (external_id)
  let order: {
    id: string;
    payment_status: PaymentStatus;
    order_status: OrderStatus;
    total: number;
    order_number: string;
  } | null = null;

  const selectCols =
    "id, payment_status, order_status, total, order_number, payment_intent_id";

  if (normalized.order_id) {
    const { data } = await supabase
      .from("storefront_orders")
      .select(selectCols)
      .eq("id", normalized.order_id)
      .maybeSingle();
    order = data as typeof order;
  }
  if (!order && normalized.order_number) {
    const { data } = await supabase
      .from("storefront_orders")
      .select(selectCols)
      .eq("order_number", normalized.order_number)
      .maybeSingle();
    order = data as typeof order;
  }
  if (!order && normalized.external_id) {
    const { data } = await supabase
      .from("storefront_orders")
      .select(selectCols)
      .eq("payment_intent_id", normalized.external_id)
      .maybeSingle();
    order = data as typeof order;
  }

  if (!order) {
    // Ainda registramos o evento como órfão (order_id null) para diagnóstico
    await supabase.from("storefront_payment_events").insert({
      provider,
      event_type: normalized.event_type,
      external_id: normalized.external_id ?? null,
      status_after: normalized.status,
      amount: normalized.amount ?? null,
      raw_payload: raw,
      signature_valid: signatureValid,
    });
    return new Response(
      JSON.stringify({
        received: true,
        matched: false,
        message: "Order not found — event logged for diagnostics",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 4) Atualizar pedido (idempotente: só grava se o status mudar de fato)
  const nextPayment = normalized.status;
  const nextOrderStatus = orderStatusFromPayment(nextPayment);

  const patch: Record<string, unknown> = {};
  if (order.payment_status !== nextPayment) patch.payment_status = nextPayment;
  if (nextPayment === "paid") patch.paid_at = new Date().toISOString();
  if (nextOrderStatus && order.order_status !== nextOrderStatus) {
    patch.order_status = nextOrderStatus;
  }
  if (normalized.external_id) patch.payment_intent_id = normalized.external_id;

  if (Object.keys(patch).length > 0) {
    const { error: updErr } = await supabase
      .from("storefront_orders")
      .update(patch)
      .eq("id", order.id);
    if (updErr) {
      console.error("[psp-webhook] update failed", updErr);
      return new Response(
        JSON.stringify({ error: "Update failed", details: updErr.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  }

  // 5) Registrar evento no checklist de pagamento
  await supabase.from("storefront_payment_events").insert({
    order_id: order.id,
    provider,
    event_type: normalized.event_type,
    external_id: normalized.external_id ?? null,
    status_before: order.payment_status,
    status_after: nextPayment,
    amount: normalized.amount ?? order.total,
    raw_payload: raw,
    signature_valid: signatureValid,
  });

  return new Response(
    JSON.stringify({
      received: true,
      matched: true,
      order_id: order.id,
      order_number: order.order_number,
      previous_status: order.payment_status,
      new_status: nextPayment,
      changed: Object.keys(patch).length > 0,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
