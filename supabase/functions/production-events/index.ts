import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, ...params } = await req.json();

    switch (action) {
      case "process_queue": {
        // Process unprocessed events
        const { data: events } = await supabase
          .from("production_events")
          .select("*")
          .eq("processed", false)
          .order("created_at", { ascending: true })
          .limit(50);

        const results = [];

        for (const event of events || []) {
          let result: any = { action: "none" };

          // Decision logic based on event type
          if (event.event_type === "op_created") {
            // Check capacity and suggest scheduling
            const { count } = await supabase
              .from("production_orders")
              .select("*", { count: "exact", head: true })
              .in("status", ["in_progress", "released", "planned"]);

            if ((count || 0) > 20) {
              result = { action: "alert", message: "Alta carga de produção: " + count + " OPs ativas", severity: "warning" };
              await supabase.from("industrial_alerts").insert({
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
            // Track long pauses
            result = { action: "monitor", reason: "pause_tracking" };
          }

          if (event.event_type === "op_completed") {
            // Calculate efficiency metrics
            const payload = event.payload || {};
            result = { action: "analytics", produced: payload.produced };
          }

          if (event.event_type === "step_completed") {
            // Check for quality issues (high reject rate)
            const payload = event.payload || {};
            const produced = payload.produced || 0;
            const rejected = payload.rejected || 0;
            if (produced > 0 && rejected > 0) {
              const rejectRate = (rejected / (produced + rejected)) * 100;
              if (rejectRate > 10) {
                result = { action: "quality_alert", reject_rate: rejectRate };
                await supabase.from("industrial_alerts").insert({
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

          // Mark as processed
          await supabase
            .from("production_events")
            .update({ processed: true, processed_at: new Date().toISOString(), processing_result: result })
            .eq("id", event.id);

          results.push({ event_id: event.id, event_type: event.event_type, result });
        }

        return new Response(JSON.stringify({ processed: results.length, results }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "iot_ingest": {
        // Receive IoT sensor data
        const { device_id, device_type, machine_id, readings } = params;

        if (!device_id || !readings || !Array.isArray(readings)) {
          return new Response(JSON.stringify({ error: "device_id and readings[] required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const telemetryRows = readings.map((r: any) => ({
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

        // Check thresholds and generate events
        for (const r of readings) {
          if (r.metric === "temperature" && r.value > 80) {
            await supabase.from("production_events").insert({
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

        return new Response(JSON.stringify({ ingested: telemetryRows.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_analytics": {
        // Production analytics summary
        const { period } = params;
        const since = period === "week" ? "7 days" : period === "month" ? "30 days" : "1 day";
        const sinceDate = new Date(Date.now() - (period === "week" ? 7 : period === "month" ? 30 : 1) * 86400000).toISOString();

        const { data: events } = await supabase
          .from("production_events")
          .select("event_type, severity, created_at")
          .gte("created_at", sinceDate);

        const summary: Record<string, number> = {};
        (events || []).forEach((e: any) => {
          summary[e.event_type] = (summary[e.event_type] || 0) + 1;
        });

        const { count: completedOPs } = await supabase
          .from("production_orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed")
          .gte("completed_date", sinceDate);

        return new Response(JSON.stringify({ period, event_summary: summary, completed_ops: completedOPs || 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
