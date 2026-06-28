import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireAuth } from "../_shared/require-auth.ts";
import { corsHeaders, jsonResponse, jsonError, safeError } from "../_shared/tenant.ts";
import { instrument, contextFromAuth } from "../_shared/observability.ts";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuth(req, { roles: ["admin", "manager", "operator"] });
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const companyId = auth.companyId;
    if (!companyId) return jsonError("Forbidden", 403);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const parsed = await req.json().catch(() => ({}));
    const { action, ...params } = parsed as any;
    if (!["process_queue","iot_ingest","get_analytics"].includes(action)) {
      return jsonError("Ação inválida", 400);
    }

    switch (action) {
      case "process_queue": {
        const { data: events } = await supabase
          .from("production_events")
          .select("*")
          .eq("company_id", companyId)
          .eq("processed", false)
          .order("created_at", { ascending: true })
          .limit(50);

        const results = [];

        for (const event of events || []) {
          let result: any = { action: "none" };

          if (event.event_type === "op_created") {
            const { count } = await supabase
              .from("production_orders")
              .select("*", { count: "exact", head: true })
              .eq("company_id", companyId)
              .in("status", ["in_progress", "released", "planned"]);

            if ((count || 0) > 20) {
              result = { action: "alert", message: "Alta carga de produção: " + count + " OPs ativas", severity: "warning" };
              await supabase.from("industrial_alerts").insert({
                company_id: companyId,
                alert_type: "capacity",
                severity: "medium",
                title: "Alta carga de produção",
                description: `${count} OPs ativas simultâneas. Considere redistribuir carga.`,
                entity_type: "system",
                entity_id: event.entity_id,
                entity_name: event.entity_name,
                status: "active",
              });
            }
          }

          if (event.event_type === "step_paused") {
            result = { action: "monitor", reason: "pause_tracking" };
          }

          if (event.event_type === "op_completed") {
            const payload = event.payload || {};
            result = { action: "analytics", produced: payload.produced };
          }

          if (event.event_type === "step_completed") {
            const payload = event.payload || {};
            const produced = payload.produced || 0;
            const rejected = payload.rejected || 0;
            if (produced > 0 && rejected > 0) {
              const rejectRate = (rejected / (produced + rejected)) * 100;
              if (rejectRate > 10) {
                result = { action: "quality_alert", reject_rate: rejectRate };
                await supabase.from("industrial_alerts").insert({
                  company_id: companyId,
                  alert_type: "quality",
                  severity: rejectRate > 20 ? "critical" : "high",
                  title: `Refugo alto: ${rejectRate.toFixed(1)}%`,
                  description: `Operação ${payload.operation} com ${rejected} peças rejeitadas de ${produced + rejected}`,
                  entity_type: "time_entry",
                  entity_id: event.entity_id,
                  entity_name: event.entity_name,
                  status: "active",
                });
              }
            }
          }

          await supabase
            .from("production_events")
            .update({ processed: true, processed_at: new Date().toISOString(), processing_result: result })
            .eq("id", event.id)
            .eq("company_id", companyId);

          results.push({ event_id: event.id, event_type: event.event_type, result });
        }

        return jsonResponse({ processed: results.length, results });
      }

      case "iot_ingest": {
        const { device_id, device_type, machine_id, readings } = params;

        if (!device_id || !readings || !Array.isArray(readings)) {
          return jsonError("device_id and readings[] required", 400);
        }

        const telemetryRows = readings.map((r: any) => ({
          company_id: companyId,
          device_id,
          device_type: device_type || "sensor",
          machine_id: machine_id || null,
          metric_name: r.metric,
          metric_value: r.value,
          unit: r.unit || null,
          metadata: r.metadata || {},
        }));

        const { error } = await supabase.from("iot_telemetry").insert(telemetryRows);
        if (error) throw error;

        for (const r of readings) {
          if (r.metric === "temperature" && r.value > 80) {
            await supabase.from("production_events").insert({
              company_id: companyId,
              event_type: "iot_threshold_exceeded",
              source: "iot",
              entity_type: "device",
              entity_id: device_id,
              machine_id: machine_id || null,
              severity: r.value > 100 ? "critical" : "warning",
              payload: { metric: r.metric, value: r.value, threshold: 80 },
            });
          }
          if (r.metric === "vibration" && r.value > 50) {
            await supabase.from("production_events").insert({
              company_id: companyId,
              event_type: "iot_anomaly",
              source: "iot",
              entity_type: "device",
              entity_id: device_id,
              machine_id: machine_id || null,
              severity: "warning",
              payload: { metric: r.metric, value: r.value, threshold: 50 },
            });
          }
        }

        return jsonResponse({ ingested: telemetryRows.length });
      }

      case "get_analytics": {
        const { period } = params;
        const sinceDate = new Date(
          Date.now() - (period === "week" ? 7 : period === "month" ? 30 : 1) * 86400000,
        ).toISOString();

        const { data: events } = await supabase
          .from("production_events")
          .select("event_type, severity, created_at")
          .eq("company_id", companyId)
          .gte("created_at", sinceDate);

        const summary: Record<string, number> = {};
        (events || []).forEach((e: any) => {
          summary[e.event_type] = (summary[e.event_type] || 0) + 1;
        });

        const { count: completedOPs } = await supabase
          .from("production_orders")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("status", "completed")
          .gte("completed_date", sinceDate);

        return jsonResponse({ period, event_summary: summary, completed_ops: completedOPs || 0 });
      }

      default:
        return jsonError("Unknown action", 400);
    }
  } catch (err) {
    return safeError(err, "production-events");
  }
};

Deno.serve(instrument(handler, { source: "production-events", getContext: contextFromAuth }));
