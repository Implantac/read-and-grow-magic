// Fase 9 — Snapshot semanal de forecast por empresa.
// Executado via cron: itera companies ativas e chama record_forecast_snapshot
// para o mês corrente, produzindo a série temporal usada pelo painel
// ForecastSnapshotHistory e pelo Cérebro Nativo para detectar desvios.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const periodKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    const { data: companies, error: cErr } = await admin
      .from("companies")
      .select("id")
      .eq("is_active", true);
    if (cErr) throw cErr;

    const results: Array<{ company_id: string; ok: boolean; error?: string; snapshot_id?: string }> = [];
    for (const c of companies ?? []) {
      const { data, error } = await admin.rpc("record_forecast_snapshot", {
        _company_id: c.id,
        _period_key: periodKey,
        _snapshot_type: "auto_forecast",
      });
      if (error) {
        console.error("[forecast-snapshot-cron]", c.id, error.message);
        results.push({ company_id: c.id, ok: false, error: error.message });
      } else {
        results.push({ company_id: c.id, ok: true, snapshot_id: data as string });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        period_key: periodKey,
        processed: results.length,
        succeeded: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[forecast-snapshot-cron] fatal", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
