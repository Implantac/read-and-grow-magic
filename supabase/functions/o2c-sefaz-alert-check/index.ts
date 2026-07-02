// Scheduled: computa taxa de falha SEFAZ nos últimos 7 dias por empresa e cria
// commercial_alerts (severidade high) quando ultrapassa 10%.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: events, error } = await supabase
    .from("cross_module_events")
    .select("company_id, event_type, created_at")
    .in("event_type", ["o2c.sefaz.ok", "o2c.sefaz.failed"])
    .gte("created_at", since)
    .limit(50_000);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const perCompany = new Map<string, { total: number; failed: number }>();
  for (const e of (events ?? []) as any[]) {
    if (!e.company_id) continue;
    const bucket = perCompany.get(e.company_id) ?? { total: 0, failed: 0 };
    bucket.total += 1;
    if (e.event_type === "o2c.sefaz.failed") bucket.failed += 1;
    perCompany.set(e.company_id, bucket);
  }

  const created: string[] = [];
  const THRESHOLD = 0.1;
  const MIN_SAMPLE = 10;

  for (const [companyId, { total, failed }] of perCompany) {
    if (total < MIN_SAMPLE) continue;
    const rate = failed / total;
    if (rate < THRESHOLD) continue;

    // dedupe: já existe alerta aberto do tipo?
    const { data: existing } = await supabase
      .from("commercial_alerts")
      .select("id")
      .eq("company_id", companyId)
      .eq("alert_type", "o2c_sefaz_failure_rate")
      .is("resolved_at", null)
      .limit(1);
    if (existing && existing.length > 0) continue;

    const { data: alert } = await supabase
      .from("commercial_alerts")
      .insert({
        company_id: companyId,
        alert_type: "o2c_sefaz_failure_rate",
        severity: rate >= 0.25 ? "critical" : "high",
        title: `Taxa de falha SEFAZ acima do limite: ${(rate * 100).toFixed(1)}%`,
        description: `${failed} de ${total} transmissões falharam nos últimos 7 dias. Verifique certificado digital, ambiente SEFAZ e conectividade.`,
        status: "open",
      })
      .select("id")
      .maybeSingle();
    if (alert?.id) created.push(alert.id);
  }

  return new Response(
    JSON.stringify({ companies_evaluated: perCompany.size, alerts_created: created.length }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
