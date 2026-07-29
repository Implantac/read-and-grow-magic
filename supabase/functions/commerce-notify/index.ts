// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { requireAuth } from "../_shared/require-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req, { roles: ["admin", "manager"], allowCron: true });
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!auth.viaCron && !auth.companyId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const limit: number = Math.min(Number(body.limit ?? 25), 100);

    let pendingQuery = supabase
      .from("storefront_notifications")
      .select("id, order_id, storefront_id, event_type, channel, recipient, subject, body, attempts")
      .eq("status", "pending")
      .lt("attempts", 5)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (auth.companyId) pendingQuery = pendingQuery.eq("company_id", auth.companyId);
    const { data: pending, error } = await pendingQuery;

    if (error) throw error;

    const results: any[] = [];
    for (const n of pending ?? []) {
      // Skip if no recipient
      if (!n.recipient) {
        await supabase.from("storefront_notifications")
          .update({ status: "skipped", last_error: "no recipient", updated_at: new Date().toISOString() })
          .eq("id", n.id);
        results.push({ id: n.id, status: "skipped" });
        continue;
      }

      // Dispatch: for now we log; integration point for Resend/WhatsApp/etc.
      // If RESEND_API_KEY is present, attempt real send.
      const resendKey = Deno.env.get("RESEND_API_KEY");
      let sendOk = true;
      let sendError: string | null = null;

      if (resendKey && n.channel === "email") {
        try {
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: Deno.env.get("COMMERCE_NOTIFY_FROM") ?? "no-reply@usecommerce.app",
              to: [n.recipient],
              subject: n.subject ?? "Atualização do seu pedido",
              text: n.body ?? "Seu pedido teve uma atualização.",
            }),
          });
          if (!r.ok) {
            sendOk = false;
            sendError = `resend_${r.status}`;
          }
        } catch (e: any) {
          sendOk = false;
          sendError = String(e?.message ?? e);
        }
      }

      const newStatus = sendOk ? "sent" : "failed";
      await supabase.from("storefront_notifications").update({
        status: newStatus,
        attempts: (n.attempts ?? 0) + 1,
        last_error: sendError,
        sent_at: sendOk ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq("id", n.id);

      results.push({ id: n.id, status: newStatus, error: sendError });
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[commerce-notify]", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
