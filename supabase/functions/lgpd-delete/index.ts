// LGPD Art. 18 V — Direito à eliminação dos dados pessoais
// Anonimiza profile (preserva FK em pedidos/NFs já emitidas por exigência fiscal) e
// remove sessão. Dados fiscais retidos pelo prazo legal (5 anos) conforme art. 16 II.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, jsonResponse, safeError } from "../_shared/tenant.ts";
import { requireAuth } from "../_shared/require-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return jsonResponse({ error: auth.message }, auth.status);
    if (!auth.userId) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    if (body.confirm !== "DELETE") {
      return jsonResponse(
        { error: "Confirmação obrigatória: envie { confirm: 'DELETE' }." },
        400,
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const userId = auth.userId;
    const now = new Date().toISOString();
    const anonHash = crypto.randomUUID().replace(/-/g, "").slice(0, 12);

    // Anonimiza profile (preserva linhagem em pedidos/NFs por obrigação fiscal)
    await admin
      .from("profiles")
      .update({
        full_name: `[Excluído ${anonHash}]`,
        email: `deleted-${anonHash}@anonymized.local`,
        phone: null,
        avatar_url: null,
        deleted_at: now,
        anonymized_at: now,
      })
      .eq("id", userId);

    // Registra a solicitação
    await admin.from("lgpd_data_requests").insert({
      user_id: userId,
      company_id: auth.companyId,
      request_type: "delete",
      status: "completed",
      completed_at: now,
      payload: {
        note: "Dados fiscais preservados pelo prazo legal de 5 anos (CTN art. 174 / LGPD art. 16 II).",
      },
    });

    // Revoga sessões ativas
    await admin.auth.admin.signOut(userId, "global").catch(() => null);

    return jsonResponse({
      ok: true,
      message: "Dados pessoais anonimizados. Documentos fiscais preservados pelo prazo legal.",
      completed_at: now,
    });
  } catch (err) {
    return safeError(err, "lgpd-delete");
  }
});
