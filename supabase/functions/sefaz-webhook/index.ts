// Webhook público para retorno assíncrono do proxy mTLS (ou de um gateway
// futuro tipo Focus NFe / NFe.io). Autenticação HMAC-SHA256 sobre o corpo bruto
// usando `SEFAZ_WEBHOOK_SECRET`. Header: `X-Sefaz-Signature`.
//
// Payload esperado (v1):
// {
//   type: 'authorization' | 'event',
//   chave: string,
//   protocol?: string,
//   cStat: string,
//   xMotivo?: string,
//   xml_response?: string
// }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { verifyHmacSignature } from "../_shared/hmac.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit({ key: `sefaz-webhook:${ip}`, limit: 120, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

  const secret = Deno.env.get("SEFAZ_WEBHOOK_SECRET");
  if (!secret) {
    console.error("[sefaz-webhook] SEFAZ_WEBHOOK_SECRET not set");
    return new Response(JSON.stringify({ error: "misconfigured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const signature = req.headers.get("x-sefaz-signature");
  const rawBody = await req.text();
  const valid = await verifyHmacSignature(secret, rawBody, signature);
  if (!valid) {
    console.warn("[sefaz-webhook] invalid signature");
    return new Response(JSON.stringify({ error: "invalid_signature" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: any;
  try { payload = JSON.parse(rawBody); }
  catch { return new Response(JSON.stringify({ error: "invalid_json" }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  }); }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    if (payload.type === "authorization") {
      const authorized = payload.cStat === "100";
      await admin.from("nfe").update({
        status: authorized ? "authorized" : "rejected",
        protocol: payload.protocol ?? null,
        authorization_date: authorized ? new Date().toISOString() : null,
        xml_authorized: authorized ? payload.xml_response ?? null : null,
        error_details: authorized ? null : { cStat: payload.cStat, xMotivo: payload.xMotivo },
      }).eq("access_key", payload.chave);
    } else if (payload.type === "event") {
      const accepted = ["135", "136", "155"].includes(payload.cStat);
      await admin.from("nfe_events").update({
        status: accepted ? "accepted" : "rejected",
        protocol: payload.protocol ?? null,
        status_code: payload.cStat,
        status_reason: payload.xMotivo,
        xml_response: payload.xml_response,
        processed_at: new Date().toISOString(),
      }).eq("protocol", payload.protocol);
    } else {
      return new Response(JSON.stringify({ error: "unknown_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[sefaz-webhook]", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
