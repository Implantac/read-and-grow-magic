// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const limit: number = Math.min(Number(body.limit ?? 25), 100);

    const { data: pending, error } = await supabase
      .from("storefront_notifications")
      .select("id, order_id, storefront_id, event_type, channel, recipient, subject, body, attempts")
      .eq("status", "pending")
      .lt("attempts", 5)
      .order("created_at", { ascending: true })
      .limit(limit);

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
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
