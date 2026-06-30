// LGPD Art. 18 — Direito à portabilidade/acesso dos dados pessoais
// Gera JSON com todos os dados do titular (profile, pedidos, consentimentos, logs).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, jsonResponse, safeError } from "../_shared/tenant.ts";
import { requireAuth } from "../_shared/require-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return jsonResponse({ error: auth.message }, auth.status);
    if (!auth.userId) return jsonResponse({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const userId = auth.userId;
    const collect = async (table: string, col = "user_id") => {
      const { data } = await admin.from(table).select("*").eq(col, userId);
      return data ?? [];
    };

    const [profile, consents, requests, auditLogs] = await Promise.all([
      admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
      collect("lgpd_consents"),
      collect("lgpd_data_requests"),
      collect("audit_logs").catch(() => []),
    ]);

    // Register the request itself for the trail
    await admin.from("lgpd_data_requests").insert({
      user_id: userId,
      company_id: auth.companyId,
      request_type: "export",
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    const exportBundle = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile: profile.data ?? null,
      consents,
      data_requests: requests,
      audit_logs: auditLogs,
      notice:
        "Este arquivo contém todos os seus dados pessoais armazenados pela plataforma, conforme LGPD Art. 18.",
    };

    return new Response(JSON.stringify(exportBundle, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="lgpd-export-${userId}.json"`,
      },
    });
  } catch (err) {
    return safeError(err, "lgpd-export");
  }
});
